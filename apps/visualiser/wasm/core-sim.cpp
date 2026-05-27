#include <cstdint>

#include <emscripten/emscripten.h>

#include "septic/core/ControllerConfig.h"
#include "septic/simulator/SimulationHarness.h"

namespace
{
	using namespace septic::core;
	using septic::sim::SimulationHarness;

	ControllerConfig simConfig(const std::uint32_t float_debounce_ms = 0,
							   const std::uint32_t pump_proof_timeout_ms = 15UL * 1000UL,
							   const std::uint32_t blower_proof_timeout_ms = 10UL * 1000UL,
							   const std::size_t active_zone_count = kValveCount,
							   const std::uint32_t high_water_behavior = 0)
	{
		auto config = defaultControllerConfig();
		config.float_debounce_ms = float_debounce_ms;
		config.telemetry_enabled = false;
		config.blower_proof_timeout_ms = blower_proof_timeout_ms;
		config.disposal_field.active_zone_count = active_zone_count;
		config.high_water_behavior = high_water_behavior == 1 ? HighWaterBehavior::PumpDownAndAlarm : HighWaterBehavior::StopAndLatch;
		for (auto &station : config.pump_stations)
		{
			station.flow_proof_timeout_ms = pump_proof_timeout_ms;
		}
		return config;
	}

	struct CoreSim
	{
		SimulationHarness harness;

		CoreSim(ControllerConfig initial_config, const bool startup_complete)
			: harness(initial_config)
		{
			if (startup_complete)
			{
				harness.completeStartupChecks();
			}
		}
	};

	CoreSim *cast(const std::uintptr_t handle)
	{
		return reinterpret_cast<CoreSim *>(handle);
	}
}

extern "C"
{
	EMSCRIPTEN_KEEPALIVE
	std::uintptr_t core_create()
	{
		return reinterpret_cast<std::uintptr_t>(new CoreSim(simConfig(), true));
	}

	EMSCRIPTEN_KEEPALIVE
	std::uintptr_t core_create_with_config(const std::uint32_t float_debounce_ms,
										   const std::uint32_t pump_proof_timeout_ms,
										   const std::uint32_t blower_proof_timeout_ms,
										   const std::uint32_t active_zone_count,
										   const std::uint32_t high_water_behavior)
	{
		return reinterpret_cast<std::uintptr_t>(
			new CoreSim(simConfig(float_debounce_ms,
								  pump_proof_timeout_ms,
								  blower_proof_timeout_ms,
								  active_zone_count,
								  high_water_behavior),
						true));
	}

	EMSCRIPTEN_KEEPALIVE
	std::uintptr_t core_create_configured(const std::uint32_t float_debounce_ms,
										  const std::uint32_t pump_proof_timeout_ms,
										  const std::uint32_t blower_proof_timeout_ms,
										  const std::uint32_t active_zone_count,
										  const std::uint32_t high_water_behavior,
										  const std::uint32_t startup_complete)
	{
		return reinterpret_cast<std::uintptr_t>(
			new CoreSim(simConfig(float_debounce_ms,
								  pump_proof_timeout_ms,
								  blower_proof_timeout_ms,
								  active_zone_count,
								  high_water_behavior),
						startup_complete != 0));
	}

	EMSCRIPTEN_KEEPALIVE
	void core_destroy(const std::uintptr_t handle)
	{
		delete cast(handle);
	}

	EMSCRIPTEN_KEEPALIVE
	void core_complete_startup(const std::uintptr_t handle)
	{
		cast(handle)->harness.completeStartupChecks();
	}

	EMSCRIPTEN_KEEPALIVE
	void core_set_tank(const std::uintptr_t handle,
					   const int tank_index,
					   const int low_closed,
					   const int call_closed,
					   const int lag_closed,
					   const int high_closed)
	{
		auto *sim = cast(handle);
		if (tank_index < 0 || tank_index >= static_cast<int>(kTankCount))
		{
			return;
		}
		sim->harness.setTankFloats(static_cast<std::size_t>(tank_index),
								   FloatInputs{
									   low_closed != 0,
									   call_closed != 0,
									   lag_closed != 0,
									   high_closed != 0,
								   });
	}

	EMSCRIPTEN_KEEPALIVE
	void core_set_pump_proof(const std::uintptr_t handle,
							 const int station_index,
							 const int pump_index,
							 const int proven)
	{
		auto *sim = cast(handle);
		if (station_index < 0 || station_index >= static_cast<int>(kPumpStationCount) ||
			pump_index < 0 || pump_index >= static_cast<int>(kPumpsPerStation))
		{
			return;
		}
		sim->harness.setPumpFlowProof(static_cast<std::size_t>(station_index),
									  static_cast<std::size_t>(pump_index),
									  proven != 0);
	}

	EMSCRIPTEN_KEEPALIVE
	void core_set_blower_proof(const std::uintptr_t handle, const int blower_index, const int proven)
	{
		auto *sim = cast(handle);
		if (blower_index < 0 || blower_index >= static_cast<int>(kBlowerCount))
		{
			return;
		}
		sim->harness.setBlowerAirProof(static_cast<std::size_t>(blower_index), proven != 0);
	}

	EMSCRIPTEN_KEEPALIVE
	void core_set_alarm_silence(const std::uintptr_t handle, const int pressed)
	{
		cast(handle)->harness.setAlarmSilencePressed(pressed != 0);
	}

	EMSCRIPTEN_KEEPALIVE
	void core_set_manual_reset(const std::uintptr_t handle, const int pressed)
	{
		cast(handle)->harness.setManualResetPressed(pressed != 0);
	}

	EMSCRIPTEN_KEEPALIVE
	void core_tick(const std::uintptr_t handle, const std::uint32_t elapsed_ms)
	{
		cast(handle)->harness.tick(elapsed_ms);
	}

	EMSCRIPTEN_KEEPALIVE
	int core_get_mode(const std::uintptr_t handle)
	{
		return static_cast<int>(cast(handle)->harness.state().mode);
	}

	EMSCRIPTEN_KEEPALIVE
	int core_get_pump(const std::uintptr_t handle, const int station_index, const int pump_index)
	{
		if (station_index < 0 || station_index >= static_cast<int>(kPumpStationCount) ||
			pump_index < 0 || pump_index >= static_cast<int>(kPumpsPerStation))
		{
			return 0;
		}
		return cast(handle)->harness.state()
			.outputs.pump_stations[static_cast<std::size_t>(station_index)]
			.enabled[static_cast<std::size_t>(pump_index)];
	}

	EMSCRIPTEN_KEEPALIVE
	int core_get_blower(const std::uintptr_t handle, const int blower_index)
	{
		if (blower_index < 0 || blower_index >= static_cast<int>(kBlowerCount))
		{
			return 0;
		}
		return cast(handle)->harness.state().outputs.blowers[static_cast<std::size_t>(blower_index)];
	}

	EMSCRIPTEN_KEEPALIVE
	int core_get_valve(const std::uintptr_t handle, const int valve_index)
	{
		if (valve_index < 0 || valve_index >= static_cast<int>(kValveCount))
		{
			return 0;
		}
		return cast(handle)->harness.state().outputs.valves[static_cast<std::size_t>(valve_index)];
	}

	EMSCRIPTEN_KEEPALIVE
	int core_get_audible_alarm(const std::uintptr_t handle)
	{
		return cast(handle)->harness.state().outputs.audible_alarm_enabled;
	}

	EMSCRIPTEN_KEEPALIVE
	int core_get_visual_alarm(const std::uintptr_t handle)
	{
		return cast(handle)->harness.state().outputs.visual_alarm_enabled;
	}

	EMSCRIPTEN_KEEPALIVE
	int core_get_high_fault(const std::uintptr_t handle, const int tank_index)
	{
		if (tank_index < 0 || tank_index >= static_cast<int>(kTankCount))
		{
			return 0;
		}
		return cast(handle)->harness.state().faults.high_water[static_cast<std::size_t>(tank_index)];
	}

	EMSCRIPTEN_KEEPALIVE
	int core_get_pump_fault(const std::uintptr_t handle, const int station_index, const int pump_index)
	{
		if (station_index < 0 || station_index >= static_cast<int>(kPumpStationCount) ||
			pump_index < 0 || pump_index >= static_cast<int>(kPumpsPerStation))
		{
			return 0;
		}
		return cast(handle)->harness.state()
			.faults.pump_flow_timeout[static_cast<std::size_t>(station_index)]
			[static_cast<std::size_t>(pump_index)];
	}

	EMSCRIPTEN_KEEPALIVE
	int core_get_blower_fault(const std::uintptr_t handle, const int blower_index)
	{
		if (blower_index < 0 || blower_index >= static_cast<int>(kBlowerCount))
		{
			return 0;
		}
		return cast(handle)->harness.state().faults.blower_air_timeout[static_cast<std::size_t>(blower_index)];
	}

	EMSCRIPTEN_KEEPALIVE
	int core_get_cycle_count(const std::uintptr_t handle)
	{
		return static_cast<int>(cast(handle)->harness.state().cycle_count);
	}
}
