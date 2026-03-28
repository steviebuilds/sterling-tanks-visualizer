#include "septic/core/ControllerApp.h"
#include "septic/hal/Esp32Platform.h"

#if defined(ARDUINO)
#include <Arduino.h>

namespace
{

	septic::core::ControllerConfig kConfig{};
	septic::hal::Esp32Clock g_clock;
	septic::hal::SerialTelemetrySink g_telemetry;
	septic::core::ControllerApp g_app(kConfig, g_clock, g_telemetry);

	septic::core::InputSnapshot readPlaceholderInputs(const std::uint32_t now_ms)
	{
		septic::core::InputSnapshot snapshot{};
		snapshot.sampled_at_ms = now_ms;
		return snapshot;
	}

} // namespace

void setup()
{
	Serial.begin(115200);
	g_app.completeStartupChecks();
}

void loop()
{
	const auto now_ms = g_clock.millis();
	const auto snapshot = readPlaceholderInputs(now_ms);
	g_app.tick(snapshot);
	delay(kConfig.scan_interval_ms);
}

#else

int main()
{
	return 0;
}

#endif
