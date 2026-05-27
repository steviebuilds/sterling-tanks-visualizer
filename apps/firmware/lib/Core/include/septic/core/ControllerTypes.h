#pragma once

#include <array>
#include <cstddef>
#include <cstdint>

namespace septic::core
{

	constexpr std::size_t kTankCount = 2;
	constexpr std::size_t kPumpStationCount = 2;
	constexpr std::size_t kPumpsPerStation = 2;
	constexpr std::size_t kBlowerCount = 8;
	constexpr std::size_t kValveCount = 12;

	enum class ControllerMode
	{
		Booting,
		SafeHold,
		Automatic,
		Faulted,
	};

	enum class TankId : std::size_t
	{
		Equalization = 0,
		Disposal = 1,
	};

	enum class PumpStationId : std::size_t
	{
		EqualizationToAtu = 0,
		DisposalToField = 1,
	};

	enum class EquipmentMode
	{
		Auto,
		Off,
		Hand,
	};

	struct FloatInputs
	{
		bool low_closed = false;
		// Sterling named LOW/LAG/HIGH, but also described a separate pump-call float.
		// Keep it explicit here until the terminal map proves whether it is a fourth input or a renamed point.
		bool call_closed = false;
		bool lag_closed = false;
		bool high_closed = false;
	};

	struct PumpStationInputs
	{
		std::array<bool, kPumpsPerStation> flow_proven{};
		std::array<EquipmentMode, kPumpsPerStation> hoa{};
	};

	struct BlowerInputs
	{
		std::array<bool, kBlowerCount> air_proven{};
		std::array<EquipmentMode, kBlowerCount> hoa{};
	};

	struct InputSnapshot
	{
		std::uint32_t sampled_at_ms = 0;
		std::array<FloatInputs, kTankCount> tanks{};
		std::array<PumpStationInputs, kPumpStationCount> pump_stations{};
		BlowerInputs blowers{};
		bool alarm_silence_pressed = false;
		bool manual_reset_pressed = false;
		bool telemetry_path_healthy = true;
	};

	struct PumpCommand
	{
		std::array<bool, kPumpsPerStation> enabled{};
	};

	struct OutputCommand
	{
		std::array<PumpCommand, kPumpStationCount> pump_stations{};
		std::array<bool, kBlowerCount> blowers{};
		std::array<bool, kValveCount> valves{};
		bool audible_alarm_enabled = false;
		bool visual_alarm_enabled = false;
	};

	struct DebouncedBool
	{
		bool stable = false;
		bool candidate = false;
		bool initialized = false;
		std::uint32_t candidate_since_ms = 0;
	};

	struct DebouncedFloatInputs
	{
		DebouncedBool low_closed{};
		DebouncedBool call_closed{};
		DebouncedBool lag_closed{};
		DebouncedBool high_closed{};
	};

	struct TankRuntime
	{
		DebouncedFloatInputs floats{};
	};

	struct PumpRuntime
	{
		bool last_commanded = false;
		std::uint32_t command_started_at_ms = 0;
		std::uint32_t run_time_ms = 0;
		std::uint32_t cycle_count = 0;
	};

	struct PumpStationRuntime
	{
		std::array<PumpRuntime, kPumpsPerStation> pumps{};
		std::size_t last_lead_index = 1;
		bool demand_active = false;
		bool timed_dose_active = false;
		std::uint32_t timed_dose_started_at_ms = 0;
		std::uint32_t next_timed_dose_due_ms = 0;
		std::size_t active_zone_index = 0;
		std::size_t next_zone_index = 0;
	};

	struct BlowerRuntime
	{
		bool last_commanded = false;
		std::uint32_t command_started_at_ms = 0;
		std::uint32_t run_time_ms = 0;
	};

	struct FaultState
	{
		std::array<bool, kTankCount> high_water{};
		std::array<std::array<bool, kPumpsPerStation>, kPumpStationCount> pump_flow_timeout{};
		std::array<bool, kBlowerCount> blower_air_timeout{};
		bool missing_required_input = false;
	};

	struct ControllerState
	{
		ControllerMode mode = ControllerMode::Booting;
		std::uint32_t last_tick_ms = 0;
		std::uint32_t cycle_count = 0;
		std::array<TankRuntime, kTankCount> tanks{};
		std::array<PumpStationRuntime, kPumpStationCount> pump_stations{};
		std::array<BlowerRuntime, kBlowerCount> blowers{};
		FaultState faults{};
		OutputCommand outputs{};
	};

	constexpr std::size_t indexOf(const TankId id)
	{
		return static_cast<std::size_t>(id);
	}

	constexpr std::size_t indexOf(const PumpStationId id)
	{
		return static_cast<std::size_t>(id);
	}

} // namespace septic::core
