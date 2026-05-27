#pragma once

#include <array>
#include <cstddef>
#include <cstdint>

#include "septic/core/ControllerTypes.h"

namespace septic::core
{

	struct PumpStationConfig
	{
		TankId tank = TankId::Equalization;
		bool timed_dosing = false;
		std::uint32_t dose_interval_ms = 30UL * 60UL * 1000UL;
		std::uint32_t dose_duration_ms = 5UL * 60UL * 1000UL;
		std::uint32_t flow_proof_timeout_ms = 15UL * 1000UL;
	};

	struct DisposalFieldConfig
	{
		std::size_t active_zone_count = kValveCount;
	};

	enum class HighWaterBehavior
	{
		StopAndLatch,
		PumpDownAndAlarm,
	};

	struct ControllerConfig
	{
		std::uint32_t scan_interval_ms = 100;
		std::uint32_t float_debounce_ms = 1000;
		std::uint32_t blower_proof_timeout_ms = 10UL * 1000UL;
		HighWaterBehavior high_water_behavior = HighWaterBehavior::StopAndLatch;
		bool start_in_safe_hold = true;
		bool telemetry_enabled = true;
		std::array<PumpStationConfig, kPumpStationCount> pump_stations{};
		DisposalFieldConfig disposal_field{};
	};

	ControllerConfig defaultControllerConfig();
	ControllerConfig normalizedControllerConfig(ControllerConfig config);

} // namespace septic::core
