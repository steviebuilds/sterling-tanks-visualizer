#include "septic/hal/Esp32Platform.h"

#if defined(ARDUINO)
#include <Arduino.h>
#else
#include <chrono>
#endif

namespace septic::hal
{

	std::uint32_t Esp32Clock::millis() const
	{
#if defined(ARDUINO)
		return ::millis();
#else
		using namespace std::chrono;
		const auto now = steady_clock::now().time_since_epoch();
		return static_cast<std::uint32_t>(duration_cast<milliseconds>(now).count());
#endif
	}

	void SerialTelemetrySink::publishHeartbeat(const septic::core::ControllerState &state)
	{
#if defined(ARDUINO)
		Serial.print("mode=");
		Serial.print(static_cast<int>(state.mode));
		Serial.print(" cycle=");
		Serial.print(state.cycle_count);
		Serial.print(" high_level_fault=");
		Serial.println(state.faults.high_water[0] || state.faults.high_water[1] ? 1 : 0);
#else
		(void)state;
#endif
	}

} // namespace septic::hal
