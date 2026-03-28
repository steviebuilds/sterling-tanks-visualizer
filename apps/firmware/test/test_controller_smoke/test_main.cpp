#include <unity.h>

#include "septic/core/ControllerApp.h"

namespace
{

	class FakeClock final : public septic::core::IClock
	{
	public:
		std::uint32_t millis() const override
		{
			return now_ms;
		}

		std::uint32_t now_ms = 0;
	};

	class CapturingTelemetrySink final : public septic::core::ITelemetrySink
	{
	public:
		void publishHeartbeat(const septic::core::ControllerState &) override
		{
			publish_count += 1;
		}

		int publish_count = 0;
	};

	FakeClock g_clock;
	CapturingTelemetrySink g_telemetry;
	septic::core::ControllerConfig g_config;

	[[maybe_unused]] void setUp() {}
	[[maybe_unused]] void tearDown() {}

	void test_starts_in_safe_hold_until_startup_checks_complete()
	{
		septic::core::ControllerApp app(g_config, g_clock, g_telemetry);
		const septic::core::InputSnapshot snapshot{};

		const auto &state = app.tick(snapshot);

		TEST_ASSERT_EQUAL(static_cast<int>(septic::core::ControllerMode::SafeHold), static_cast<int>(state.mode));
		TEST_ASSERT_FALSE(state.outputs.alarm_enabled);
	}

	void test_moves_into_automatic_after_startup_checks()
	{
		septic::core::ControllerApp app(g_config, g_clock, g_telemetry);
		app.completeStartupChecks();

		septic::core::InputSnapshot snapshot{};
		snapshot.sampled_at_ms = 100;

		const auto &state = app.tick(snapshot);

		TEST_ASSERT_EQUAL(static_cast<int>(septic::core::ControllerMode::Automatic), static_cast<int>(state.mode));
		TEST_ASSERT_EQUAL_UINT32(1, state.cycle_count);
	}

	void test_high_level_fault_raises_alarm()
	{
		septic::core::ControllerApp app(g_config, g_clock, g_telemetry);
		app.completeStartupChecks();

		septic::core::InputSnapshot snapshot{};
		snapshot.high_level_active = true;

		const auto &state = app.tick(snapshot);

		TEST_ASSERT_EQUAL(static_cast<int>(septic::core::ControllerMode::Faulted), static_cast<int>(state.mode));
		TEST_ASSERT_TRUE(state.faults.high_level);
		TEST_ASSERT_TRUE(state.outputs.alarm_enabled);
	}

} // namespace

int main(int argc, char **argv)
{
	(void)argc;
	(void)argv;
	UNITY_BEGIN();
	RUN_TEST(test_starts_in_safe_hold_until_startup_checks_complete);
	RUN_TEST(test_moves_into_automatic_after_startup_checks);
	RUN_TEST(test_high_level_fault_raises_alarm);
	return UNITY_END();
}
