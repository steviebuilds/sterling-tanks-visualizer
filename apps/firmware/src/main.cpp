#include "septic/core/ControllerApp.h"
#include "septic/hal/Esp32Platform.h"
#include "septic/hal/ProfiledIo.h"
#include "septic/hal/SiteProfile.h"

#if defined(ARDUINO)
#include <Arduino.h>

namespace
{

	const septic::hal::SiteProfile &kProfile = septic::hal::hiddenArborProfile();
	const septic::core::ControllerConfig &kConfig = kProfile.controller;
	septic::hal::Esp32Clock g_clock;
	septic::hal::ProfiledIo g_io(kProfile);
	septic::hal::SerialTelemetrySink g_telemetry;
	septic::core::ControllerApp g_app(kConfig, g_clock, g_telemetry);

} // namespace

void setup()
{
	Serial.begin(115200);
	g_io.begin();
	g_app.completeStartupChecks();
}

void loop()
{
	const auto now_ms = g_clock.millis();
	const auto snapshot = g_io.readInputs(now_ms);
	const auto &state = g_app.tick(snapshot);
	g_io.applyOutputs(state.outputs);
	delay(kConfig.scan_interval_ms);
}

#else

int main()
{
	return 0;
}

#endif
