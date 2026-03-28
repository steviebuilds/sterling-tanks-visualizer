#pragma once

#include <cstdint>

namespace septic::core
{

	enum class ControllerMode
	{
		Booting,
		SafeHold,
		Automatic,
		Faulted,
	};

	struct InputSnapshot
	{
		std::uint32_t sampled_at_ms = 0;
		bool high_level_active = false;
		bool low_level_active = false;
		bool flow_proven = false;
		bool airflow_proven = false;
		bool telemetry_path_healthy = true;
	};

	struct OutputCommand
	{
		bool dosing_pump_enabled = false;
		bool effluent_pump_enabled = false;
		bool blower_enabled = false;
		bool alarm_enabled = false;
	};

	struct FaultState
	{
		bool high_level = false;
		bool flow_timeout = false;
		bool airflow_timeout = false;
		bool missing_required_input = false;
	};

	struct ControllerState
	{
		ControllerMode mode = ControllerMode::Booting;
		std::uint32_t last_tick_ms = 0;
		std::uint32_t cycle_count = 0;
		FaultState faults{};
		OutputCommand outputs{};
	};

} // namespace septic::core
