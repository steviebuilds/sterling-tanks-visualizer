#pragma once

#include "septic/core/ControllerTypes.h"

namespace septic::core
{

	class IClock
	{
	public:
		virtual ~IClock() = default;
		virtual std::uint32_t millis() const = 0;
	};

	class ITelemetrySink
	{
	public:
		virtual ~ITelemetrySink() = default;
		virtual void publishHeartbeat(const ControllerState &state) = 0;
	};

	class NullTelemetrySink final : public ITelemetrySink
	{
	public:
		void publishHeartbeat(const ControllerState &) override {}
	};

} // namespace septic::core
