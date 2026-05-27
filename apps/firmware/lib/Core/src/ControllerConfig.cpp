#include "septic/core/ControllerConfig.h"

#include <algorithm>

namespace septic::core
{
	namespace
	{
		constexpr std::uint32_t kDefaultScanIntervalMs = 100;
		constexpr std::uint32_t kDefaultPumpFlowProofTimeoutMs = 15UL * 1000UL;
		constexpr std::uint32_t kDefaultBlowerProofTimeoutMs = 10UL * 1000UL;
		constexpr std::uint32_t kDefaultDoseIntervalMs = 30UL * 60UL * 1000UL;
		constexpr std::uint32_t kDefaultDoseDurationMs = 5UL * 60UL * 1000UL;

		TankId fallbackTankForStation(const std::size_t station_index)
		{
			return station_index == indexOf(PumpStationId::DisposalToField) ? TankId::Disposal : TankId::Equalization;
		}

		bool validTankId(const TankId tank)
		{
			return static_cast<std::size_t>(tank) < kTankCount;
		}

		bool validHighWaterBehavior(const HighWaterBehavior behavior)
		{
			return behavior == HighWaterBehavior::StopAndLatch || behavior == HighWaterBehavior::PumpDownAndAlarm;
		}
	} // namespace

	ControllerConfig defaultControllerConfig()
	{
		ControllerConfig config{};
		config.pump_stations[indexOf(PumpStationId::EqualizationToAtu)].tank = TankId::Equalization;
		config.pump_stations[indexOf(PumpStationId::EqualizationToAtu)].timed_dosing = false;

		config.pump_stations[indexOf(PumpStationId::DisposalToField)].tank = TankId::Disposal;
		config.pump_stations[indexOf(PumpStationId::DisposalToField)].timed_dosing = true;

		return normalizedControllerConfig(config);
	}

	ControllerConfig normalizedControllerConfig(ControllerConfig config)
	{
		if (config.scan_interval_ms == 0)
		{
			config.scan_interval_ms = kDefaultScanIntervalMs;
		}

		if (config.blower_proof_timeout_ms == 0)
		{
			config.blower_proof_timeout_ms = kDefaultBlowerProofTimeoutMs;
		}

		if (!validHighWaterBehavior(config.high_water_behavior))
		{
			config.high_water_behavior = HighWaterBehavior::StopAndLatch;
		}

		for (std::size_t station_index = 0; station_index < kPumpStationCount; ++station_index)
		{
			auto &station = config.pump_stations[station_index];
			if (!validTankId(station.tank))
			{
				station.tank = fallbackTankForStation(station_index);
			}

			if (station.flow_proof_timeout_ms == 0)
			{
				station.flow_proof_timeout_ms = kDefaultPumpFlowProofTimeoutMs;
			}

			if (station.dose_interval_ms == 0)
			{
				station.dose_interval_ms = kDefaultDoseIntervalMs;
			}

			if (station.dose_duration_ms == 0)
			{
				station.dose_duration_ms = kDefaultDoseDurationMs;
			}

			station.dose_duration_ms = std::min(station.dose_duration_ms, station.dose_interval_ms);
		}

		config.disposal_field.active_zone_count = std::max<std::size_t>(
			1,
			std::min<std::size_t>(config.disposal_field.active_zone_count, kValveCount));

		return config;
	}

} // namespace septic::core
