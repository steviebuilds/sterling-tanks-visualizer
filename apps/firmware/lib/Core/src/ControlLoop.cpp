#include "septic/core/ControlLoop.h"

#include <algorithm>

namespace septic::core
{
	namespace
	{

		bool anyFaultActive(const FaultState &faults)
		{
			for (const auto active : faults.high_water)
			{
				if (active)
				{
					return true;
				}
			}

			for (const auto &station : faults.pump_flow_timeout)
			{
				for (const auto active : station)
				{
					if (active)
					{
						return true;
					}
				}
			}

			for (const auto active : faults.blower_air_timeout)
			{
				if (active)
				{
					return true;
				}
			}

			return faults.missing_required_input;
		}

		bool allTankFaultsClear(const InputSnapshot &inputs, const std::size_t tank_index)
		{
			return !inputs.tanks[tank_index].high_closed;
		}

		DebouncedBool debounce(const DebouncedBool &previous,
							   const bool raw_value,
							   const std::uint32_t now_ms,
							   const std::uint32_t debounce_ms)
		{
			DebouncedBool next = previous;
			if (!next.initialized)
			{
				next.initialized = true;
				next.stable = false;
				next.candidate = raw_value;
				next.candidate_since_ms = now_ms;
				if (!raw_value || debounce_ms == 0)
				{
					next.stable = raw_value;
				}
				return next;
			}

			if (raw_value == next.stable)
			{
				next.candidate = raw_value;
				next.candidate_since_ms = now_ms;
				return next;
			}

			if (raw_value != next.candidate)
			{
				next.candidate = raw_value;
				next.candidate_since_ms = now_ms;
				if (debounce_ms == 0)
				{
					next.stable = raw_value;
				}
				return next;
			}

			if (now_ms - next.candidate_since_ms >= debounce_ms)
			{
				next.stable = raw_value;
				next.candidate_since_ms = now_ms;
			}

			return next;
		}

		FloatInputs stableFloats(const TankRuntime &tank)
		{
			FloatInputs inputs{};
			inputs.low_closed = tank.floats.low_closed.stable;
			inputs.call_closed = tank.floats.call_closed.stable;
			inputs.lag_closed = tank.floats.lag_closed.stable;
			inputs.high_closed = tank.floats.high_closed.stable;
			return inputs;
		}

		bool stationHasCommandedPump(const OutputCommand &outputs, const std::size_t station_index)
		{
			for (const auto enabled : outputs.pump_stations[station_index].enabled)
			{
				if (enabled)
				{
					return true;
				}
			}
			return false;
		}

		std::size_t boundedActiveZoneCount(const DisposalFieldConfig &config)
		{
			return std::max<std::size_t>(1, std::min<std::size_t>(config.active_zone_count, kValveCount));
		}

		void clearFaultsRequestedByOperator(ControllerState &state, const InputSnapshot &inputs)
		{
			if (!inputs.manual_reset_pressed)
			{
				return;
			}

			// Reset is accepted only after the thing that caused the latch has returned healthy.
			for (std::size_t tank_index = 0; tank_index < kTankCount; ++tank_index)
			{
				if (allTankFaultsClear(inputs, tank_index))
				{
					state.faults.high_water[tank_index] = false;
				}
			}

			for (std::size_t station_index = 0; station_index < kPumpStationCount; ++station_index)
			{
				for (std::size_t pump_index = 0; pump_index < kPumpsPerStation; ++pump_index)
				{
					state.faults.pump_flow_timeout[station_index][pump_index] = false;
				}
			}

			for (std::size_t blower_index = 0; blower_index < kBlowerCount; ++blower_index)
			{
				state.faults.blower_air_timeout[blower_index] = false;
			}
		}

		void updatePumpRuntime(PumpRuntime &runtime, const bool command, const std::uint32_t previous_tick_ms, const std::uint32_t now_ms)
		{
			if (command && !runtime.last_commanded)
			{
				runtime.command_started_at_ms = now_ms;
				runtime.cycle_count += 1;
			}

			if (runtime.last_commanded && now_ms >= previous_tick_ms)
			{
				runtime.run_time_ms += now_ms - previous_tick_ms;
			}

			runtime.last_commanded = command;
		}

		void updateBlowerRuntime(BlowerRuntime &runtime, const bool command, const std::uint32_t previous_tick_ms, const std::uint32_t now_ms)
		{
			if (command && !runtime.last_commanded)
			{
				runtime.command_started_at_ms = now_ms;
			}

			if (runtime.last_commanded && now_ms >= previous_tick_ms)
			{
				runtime.run_time_ms += now_ms - previous_tick_ms;
			}

			runtime.last_commanded = command;
		}

		bool pumpCanRun(const ControllerState &state,
						const InputSnapshot &inputs,
						const std::size_t station_index,
						const std::size_t pump_index,
						const bool tank_blocked)
		{
			return !tank_blocked &&
				   inputs.pump_stations[station_index].hoa[pump_index] != EquipmentMode::Off &&
				   !state.faults.pump_flow_timeout[station_index][pump_index];
		}

		void commandSinglePump(ControllerState &state,
							   const InputSnapshot &inputs,
							   const std::size_t station_index,
							   const std::size_t preferred_pump,
							   const bool tank_blocked)
		{
			const auto other_pump = preferred_pump == 0 ? 1 : 0;
			if (pumpCanRun(state, inputs, station_index, preferred_pump, tank_blocked))
			{
				state.outputs.pump_stations[station_index].enabled[preferred_pump] = true;
				return;
			}

			if (pumpCanRun(state, inputs, station_index, other_pump, tank_blocked))
			{
				state.outputs.pump_stations[station_index].enabled[other_pump] = true;
			}
		}

		void commandBothAvailablePumps(ControllerState &state,
									   const InputSnapshot &inputs,
									   const std::size_t station_index,
									   const bool tank_blocked)
		{
			for (std::size_t pump_index = 0; pump_index < kPumpsPerStation; ++pump_index)
			{
				if (pumpCanRun(state, inputs, station_index, pump_index, tank_blocked))
				{
					state.outputs.pump_stations[station_index].enabled[pump_index] = true;
				}
			}
		}

		void proveCommandedPumps(ControllerState &state,
								 const InputSnapshot &inputs,
								 const ControllerConfig &config,
								 const std::uint32_t now_ms)
		{
			for (std::size_t station_index = 0; station_index < kPumpStationCount; ++station_index)
			{
				for (std::size_t pump_index = 0; pump_index < kPumpsPerStation; ++pump_index)
				{
					const auto commanded = state.outputs.pump_stations[station_index].enabled[pump_index];
					const auto &runtime = state.pump_stations[station_index].pumps[pump_index];
					if (!commanded || inputs.pump_stations[station_index].flow_proven[pump_index])
					{
						continue;
					}

					const auto timeout_ms = config.pump_stations[station_index].flow_proof_timeout_ms;
					const auto proof_started_at_ms = runtime.last_commanded ? runtime.command_started_at_ms : now_ms;
					if (now_ms - proof_started_at_ms >= timeout_ms)
					{
						state.outputs.pump_stations[station_index].enabled[pump_index] = false;
						state.faults.pump_flow_timeout[station_index][pump_index] = true;
					}
				}
			}
		}

		void commandBlowers(ControllerState &state,
							const InputSnapshot &inputs,
							const ControllerConfig &config,
							const std::uint32_t now_ms)
		{
			for (std::size_t blower_index = 0; blower_index < kBlowerCount; ++blower_index)
			{
				const auto mode = inputs.blowers.hoa[blower_index];
				const auto can_run = mode != EquipmentMode::Off && !state.faults.blower_air_timeout[blower_index];
				state.outputs.blowers[blower_index] = can_run;

				if (!can_run || inputs.blowers.air_proven[blower_index])
				{
					continue;
				}

				const auto &runtime = state.blowers[blower_index];
				const auto proof_started_at_ms = runtime.last_commanded ? runtime.command_started_at_ms : now_ms;
				if (now_ms - proof_started_at_ms >= config.blower_proof_timeout_ms)
				{
					state.outputs.blowers[blower_index] = false;
					state.faults.blower_air_timeout[blower_index] = true;
				}
			}
		}

		void updateTankDebounce(ControllerState &state,
								const InputSnapshot &inputs,
								const ControllerConfig &config,
								const std::uint32_t now_ms)
		{
			for (std::size_t tank_index = 0; tank_index < kTankCount; ++tank_index)
			{
				auto &runtime = state.tanks[tank_index].floats;
				const auto &raw = inputs.tanks[tank_index];
				runtime.low_closed = debounce(runtime.low_closed, raw.low_closed, now_ms, config.float_debounce_ms);
				runtime.call_closed = debounce(runtime.call_closed, raw.call_closed, now_ms, config.float_debounce_ms);
				runtime.lag_closed = debounce(runtime.lag_closed, raw.lag_closed, now_ms, config.float_debounce_ms);
				runtime.high_closed = debounce(runtime.high_closed, raw.high_closed, now_ms, config.float_debounce_ms);
			}
		}

		void latchTankFaults(ControllerState &state)
		{
			for (std::size_t tank_index = 0; tank_index < kTankCount; ++tank_index)
			{
				if (state.tanks[tank_index].floats.high_closed.stable)
				{
					state.faults.high_water[tank_index] = true;
				}
			}
		}

		void runPumpStation(ControllerState &state,
							const InputSnapshot &inputs,
							const ControllerConfig &config,
							const std::size_t station_index,
							const std::uint32_t now_ms)
		{
			auto &runtime = state.pump_stations[station_index];
			const auto &station_config = config.pump_stations[station_index];
			const auto tank_index = indexOf(station_config.tank);
			const auto floats = stableFloats(state.tanks[tank_index]);
			const auto high_pumpdown = state.faults.high_water[tank_index] &&
									   config.high_water_behavior == HighWaterBehavior::PumpDownAndAlarm;
			const auto high_stopped = state.faults.high_water[tank_index] && !high_pumpdown;
			const auto tank_blocked = floats.low_closed || high_stopped;

			const auto hand_request = inputs.pump_stations[station_index].hoa[0] == EquipmentMode::Hand ||
									  inputs.pump_stations[station_index].hoa[1] == EquipmentMode::Hand;
			const auto lag_request = floats.lag_closed || high_pumpdown;
			const auto demand_request = floats.call_closed || lag_request || hand_request;
			const auto preferred_pump = runtime.last_lead_index == 0 ? 1 : 0;

			if (station_config.timed_dosing)
			{
				if (tank_blocked)
				{
					runtime.timed_dose_active = false;
				}
				else if (!runtime.timed_dose_active && (now_ms >= runtime.next_timed_dose_due_ms || demand_request))
				{
					runtime.timed_dose_active = true;
					runtime.timed_dose_started_at_ms = now_ms;
					runtime.active_zone_index = runtime.next_zone_index;
					runtime.next_zone_index = (runtime.next_zone_index + 1) % boundedActiveZoneCount(config.disposal_field);
					runtime.last_lead_index = preferred_pump;
					runtime.next_timed_dose_due_ms = now_ms + station_config.dose_interval_ms;
				}
				else if (runtime.timed_dose_active && now_ms - runtime.timed_dose_started_at_ms >= station_config.dose_duration_ms)
				{
					runtime.timed_dose_active = false;
				}

				if (runtime.timed_dose_active)
				{
					if (lag_request)
					{
						commandBothAvailablePumps(state, inputs, station_index, tank_blocked);
					}
					else
					{
						commandSinglePump(state, inputs, station_index, runtime.last_lead_index, tank_blocked);
					}
				}
			}
			else
			{
				if (!tank_blocked && demand_request && !runtime.demand_active)
				{
					runtime.last_lead_index = preferred_pump;
				}

				runtime.demand_active = !tank_blocked && demand_request;
				if (runtime.demand_active)
				{
					if (lag_request)
					{
						commandBothAvailablePumps(state, inputs, station_index, tank_blocked);
					}
					else
					{
						commandSinglePump(state, inputs, station_index, runtime.last_lead_index, tank_blocked);
					}
				}
			}
		}

		void commandDisposalValves(ControllerState &state)
		{
			const auto disposal_station_index = indexOf(PumpStationId::DisposalToField);
			if (!stationHasCommandedPump(state.outputs, disposal_station_index))
			{
				return;
			}

			const auto zone_index = state.pump_stations[disposal_station_index].active_zone_index;
			if (zone_index < state.outputs.valves.size())
			{
				state.outputs.valves[zone_index] = true;
			}
		}

		void updateRuntimes(ControllerState &state, const std::uint32_t previous_tick_ms, const std::uint32_t now_ms)
		{
			for (std::size_t station_index = 0; station_index < kPumpStationCount; ++station_index)
			{
				for (std::size_t pump_index = 0; pump_index < kPumpsPerStation; ++pump_index)
				{
					updatePumpRuntime(state.pump_stations[station_index].pumps[pump_index],
									  state.outputs.pump_stations[station_index].enabled[pump_index],
									  previous_tick_ms,
									  now_ms);
				}
			}

			for (std::size_t blower_index = 0; blower_index < kBlowerCount; ++blower_index)
			{
				updateBlowerRuntime(state.blowers[blower_index], state.outputs.blowers[blower_index], previous_tick_ms, now_ms);
			}
		}

	} // namespace

	ControlLoop::ControlLoop(ControllerConfig config)
		: config_(normalizedControllerConfig(config)) {}

	ControllerState ControlLoop::evaluate(const InputSnapshot &inputs,
										  const ControllerState &previous_state,
										  const std::uint32_t now_ms) const
	{
		ControllerState next = previous_state;
		next.last_tick_ms = now_ms;
		next.cycle_count = previous_state.cycle_count + 1;
		next.outputs = {};
		next.faults.missing_required_input = false;

		updateTankDebounce(next, inputs, config_, now_ms);
		clearFaultsRequestedByOperator(next, inputs);
		latchTankFaults(next);

		for (std::size_t station_index = 0; station_index < kPumpStationCount; ++station_index)
		{
			runPumpStation(next, inputs, config_, station_index, now_ms);
		}

		proveCommandedPumps(next, inputs, config_, now_ms);
		commandDisposalValves(next);
		commandBlowers(next, inputs, config_, now_ms);
		updateRuntimes(next, previous_state.last_tick_ms, now_ms);

		const auto fault_active = anyFaultActive(next.faults);
		next.outputs.visual_alarm_enabled = fault_active;
		next.outputs.audible_alarm_enabled = fault_active && !inputs.alarm_silence_pressed;
		next.mode = fault_active ? ControllerMode::Faulted : ControllerMode::Automatic;

		return next;
	}

} // namespace septic::core
