#pragma once

#include <array>
#include <cstddef>
#include <cstdint>

#include "septic/core/ControllerConfig.h"
#include "septic/core/ControllerTypes.h"

namespace septic::hal
{

	enum class ActiveState
	{
		Low,
		High,
	};

	enum class InputPull
	{
		None,
		Up,
		Down,
	};

	struct DigitalInputPoint
	{
		const char *name = "";
		int pin = -1;
		ActiveState active_state = ActiveState::Low;
		InputPull pull = InputPull::Up;
	};

	struct DigitalOutputPoint
	{
		const char *name = "";
		int pin = -1;
		ActiveState active_state = ActiveState::High;
	};

	struct FloatPointMap
	{
		DigitalInputPoint low{};
		DigitalInputPoint call{};
		DigitalInputPoint lag{};
		DigitalInputPoint high{};
	};

	struct PumpStationPointMap
	{
		std::array<DigitalInputPoint, septic::core::kPumpsPerStation> flow_proof{};
		std::array<DigitalInputPoint, septic::core::kPumpsPerStation> hoa_auto{};
		std::array<DigitalInputPoint, septic::core::kPumpsPerStation> hoa_hand{};
		std::array<DigitalOutputPoint, septic::core::kPumpsPerStation> pump_relay{};
	};

	struct TelemetryProfile
	{
		const char *endpoint_url = "";
		const char *bearer_token = "";
		const char *site_id = "hidden-arbor";
		std::uint32_t live_state_interval_ms = 30UL * 1000UL;
	};

	struct SiteProfile
	{
		const char *site_name = "Hidden Arbor RV Park OSSF";
		septic::core::ControllerConfig controller = septic::core::defaultControllerConfig();
		std::array<FloatPointMap, septic::core::kTankCount> tanks{};
		std::array<PumpStationPointMap, septic::core::kPumpStationCount> pump_stations{};
		std::array<DigitalInputPoint, septic::core::kBlowerCount> blower_air_proof{};
		std::array<DigitalInputPoint, septic::core::kBlowerCount> blower_hoa_auto{};
		std::array<DigitalInputPoint, septic::core::kBlowerCount> blower_hoa_hand{};
		std::array<DigitalOutputPoint, septic::core::kBlowerCount> blower_relay{};
		std::array<DigitalOutputPoint, septic::core::kValveCount> valve_relay{};
		DigitalInputPoint alarm_silence{};
		DigitalInputPoint manual_reset{};
		DigitalOutputPoint audible_alarm{};
		DigitalOutputPoint visual_alarm{};
		TelemetryProfile telemetry{};
	};

	const SiteProfile &hiddenArborProfile();

} // namespace septic::hal
