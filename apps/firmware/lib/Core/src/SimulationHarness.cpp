#include "septic/core/SimulationHarness.h"

namespace septic::core
{
	namespace
	{
		bool validStationPump(const std::size_t station_index, const std::size_t pump_index)
		{
			return station_index < kPumpStationCount && pump_index < kPumpsPerStation;
		}
	} // namespace

	std::uint32_t SimulationClock::millis() const
	{
		return now_ms_;
	}

	void SimulationClock::advanceBy(const std::uint32_t elapsed_ms)
	{
		now_ms_ += elapsed_ms;
	}

	void SimulationClock::reset()
	{
		now_ms_ = 0;
	}

	SimulationHarness::SimulationHarness(ControllerConfig config)
		: config_(normalizedControllerConfig(config)),
		  app_(config_, clock_, telemetry_)
	{
		setAllEquipmentModes(EquipmentMode::Auto);
		setAllPumpFlowProofs(true);
		setAllBlowerAirProofs(true);
	}

	void SimulationHarness::completeStartupChecks()
	{
		app_.completeStartupChecks();
	}

	const ControllerState &SimulationHarness::tick(const std::uint32_t elapsed_ms)
	{
		clock_.advanceBy(elapsed_ms);
		inputs_.sampled_at_ms = clock_.millis();
		return app_.tick(inputs_);
	}

	const ControllerState &SimulationHarness::state() const
	{
		return app_.currentState();
	}

	InputSnapshot &SimulationHarness::inputs()
	{
		return inputs_;
	}

	const InputSnapshot &SimulationHarness::inputs() const
	{
		return inputs_;
	}

	void SimulationHarness::setTankFloats(const std::size_t tank_index, const FloatInputs floats)
	{
		if (tank_index >= kTankCount)
		{
			return;
		}

		inputs_.tanks[tank_index] = floats;
	}

	void SimulationHarness::setPumpFlowProof(const std::size_t station_index,
											 const std::size_t pump_index,
											 const bool proven)
	{
		if (!validStationPump(station_index, pump_index))
		{
			return;
		}

		inputs_.pump_stations[station_index].flow_proven[pump_index] = proven;
	}

	void SimulationHarness::setPumpMode(const std::size_t station_index,
										const std::size_t pump_index,
										const EquipmentMode mode)
	{
		if (!validStationPump(station_index, pump_index))
		{
			return;
		}

		inputs_.pump_stations[station_index].hoa[pump_index] = mode;
	}

	void SimulationHarness::setBlowerAirProof(const std::size_t blower_index, const bool proven)
	{
		if (blower_index >= kBlowerCount)
		{
			return;
		}

		inputs_.blowers.air_proven[blower_index] = proven;
	}

	void SimulationHarness::setBlowerMode(const std::size_t blower_index, const EquipmentMode mode)
	{
		if (blower_index >= kBlowerCount)
		{
			return;
		}

		inputs_.blowers.hoa[blower_index] = mode;
	}

	void SimulationHarness::setAlarmSilencePressed(const bool pressed)
	{
		inputs_.alarm_silence_pressed = pressed;
	}

	void SimulationHarness::setManualResetPressed(const bool pressed)
	{
		inputs_.manual_reset_pressed = pressed;
	}

	void SimulationHarness::setAllPumpFlowProofs(const bool proven)
	{
		for (auto &station : inputs_.pump_stations)
		{
			station.flow_proven.fill(proven);
		}
	}

	void SimulationHarness::setAllBlowerAirProofs(const bool proven)
	{
		inputs_.blowers.air_proven.fill(proven);
	}

	void SimulationHarness::setAllEquipmentModes(const EquipmentMode mode)
	{
		for (auto &station : inputs_.pump_stations)
		{
			station.hoa.fill(mode);
		}
		inputs_.blowers.hoa.fill(mode);
	}

} // namespace septic::core
