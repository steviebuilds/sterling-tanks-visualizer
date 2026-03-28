#pragma once

#include <cstdint>

namespace septic::core
{

	struct ControllerConfig
	{
		std::uint32_t scan_interval_ms = 1000;
		bool start_in_safe_hold = true;
		bool telemetry_enabled = true;
	};

} // namespace septic::core
