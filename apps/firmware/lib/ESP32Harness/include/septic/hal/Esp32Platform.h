#pragma once

#include <cstdint>

#include "septic/core/Ports.h"

namespace septic::hal
{

	class Esp32Clock final : public septic::core::IClock
	{
	public:
		std::uint32_t millis() const override;
	};

	class SerialTelemetrySink final : public septic::core::ITelemetrySink
	{
	public:
		void publishHeartbeat(const septic::core::ControllerState &state) override;
	};

} // namespace septic::hal
