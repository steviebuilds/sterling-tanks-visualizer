#include <unity.h>

#include "septic/core/ControllerApp.h"
#include "septic/simulator/SimulationHarness.h"

namespace
{

	using namespace septic::core;
	using septic::sim::SimulationHarness;

	class FakeClock final : public IClock
	{
	public:
		std::uint32_t millis() const override
		{
			return now_ms;
		}

		void advance(const std::uint32_t delta_ms)
		{
			now_ms += delta_ms;
		}

		std::uint32_t now_ms = 0;
	};

	class CapturingTelemetrySink final : public ITelemetrySink
	{
	public:
		void publishHeartbeat(const ControllerState &) override
		{
			publish_count += 1;
		}

		int publish_count = 0;
	};

	FakeClock g_clock;
	CapturingTelemetrySink g_telemetry;

	ControllerConfig testConfig()
	{
		auto config = defaultControllerConfig();
		config.start_in_safe_hold = true;
		config.float_debounce_ms = 1000;
		config.pump_stations[indexOf(PumpStationId::DisposalToField)].dose_interval_ms = 30UL * 60UL * 1000UL;
		config.pump_stations[indexOf(PumpStationId::DisposalToField)].dose_duration_ms = 5UL * 60UL * 1000UL;
		return config;
	}

	InputSnapshot healthySnapshot()
	{
		InputSnapshot snapshot{};
		for (auto &station : snapshot.pump_stations)
		{
			station.flow_proven = {true, true};
			station.hoa = {EquipmentMode::Auto, EquipmentMode::Auto};
		}
		snapshot.blowers.air_proven.fill(true);
		snapshot.blowers.hoa.fill(EquipmentMode::Auto);
		return snapshot;
	}

	ControllerApp runningApp(const ControllerConfig &config)
	{
		ControllerApp app(config, g_clock, g_telemetry);
		app.completeStartupChecks();
		return app;
	}

	void settle(ControllerApp &app, InputSnapshot &snapshot, const std::uint32_t elapsed_ms)
	{
		g_clock.advance(elapsed_ms);
		snapshot.sampled_at_ms = g_clock.millis();
		app.tick(snapshot);
	}

	void test_starts_in_safe_hold_until_startup_checks_complete()
	{
		auto config = testConfig();
		ControllerApp app(config, g_clock, g_telemetry);
		auto snapshot = healthySnapshot();

		const auto &state = app.tick(snapshot);

		TEST_ASSERT_EQUAL(static_cast<int>(ControllerMode::SafeHold), static_cast<int>(state.mode));
		TEST_ASSERT_FALSE(state.outputs.audible_alarm_enabled);
		TEST_ASSERT_FALSE(state.outputs.visual_alarm_enabled);
	}

	void test_moves_into_automatic_after_startup_checks()
	{
		auto config = testConfig();
		auto app = runningApp(config);
		auto snapshot = healthySnapshot();

		const auto &state = app.tick(snapshot);

		TEST_ASSERT_EQUAL(static_cast<int>(ControllerMode::Automatic), static_cast<int>(state.mode));
		TEST_ASSERT_EQUAL_UINT32(1, state.cycle_count);
	}

	void test_high_level_fault_latches_after_debounce()
	{
		auto config = testConfig();
		auto app = runningApp(config);
		auto snapshot = healthySnapshot();

		snapshot.tanks[indexOf(TankId::Equalization)].high_closed = true;
		app.tick(snapshot);

		TEST_ASSERT_EQUAL(static_cast<int>(ControllerMode::Automatic), static_cast<int>(app.currentState().mode));

		settle(app, snapshot, 1000);

		const auto &state = app.currentState();
		TEST_ASSERT_EQUAL(static_cast<int>(ControllerMode::Faulted), static_cast<int>(state.mode));
		TEST_ASSERT_TRUE(state.faults.high_water[indexOf(TankId::Equalization)]);
		TEST_ASSERT_TRUE(state.outputs.visual_alarm_enabled);
		TEST_ASSERT_TRUE(state.outputs.audible_alarm_enabled);
	}

	void test_high_level_fault_requires_clear_float_and_manual_reset()
	{
		auto config = testConfig();
		auto app = runningApp(config);
		auto snapshot = healthySnapshot();
		snapshot.tanks[indexOf(TankId::Equalization)].high_closed = true;

		app.tick(snapshot);
		settle(app, snapshot, 1000);

		snapshot.manual_reset_pressed = true;
		app.tick(snapshot);
		TEST_ASSERT_TRUE(app.currentState().faults.high_water[indexOf(TankId::Equalization)]);

		snapshot.manual_reset_pressed = false;
		snapshot.tanks[indexOf(TankId::Equalization)].high_closed = false;
		settle(app, snapshot, 1000);
		settle(app, snapshot, 1000);
		snapshot.manual_reset_pressed = true;
		app.tick(snapshot);

		TEST_ASSERT_FALSE(app.currentState().faults.high_water[indexOf(TankId::Equalization)]);
		TEST_ASSERT_EQUAL(static_cast<int>(ControllerMode::Automatic), static_cast<int>(app.currentState().mode));
	}

	void test_high_level_stop_behavior_holds_affected_station_off()
	{
		auto config = testConfig();
		config.high_water_behavior = HighWaterBehavior::StopAndLatch;
		auto app = runningApp(config);
		auto snapshot = healthySnapshot();
		const auto tank = indexOf(TankId::Equalization);
		const auto station = indexOf(PumpStationId::EqualizationToAtu);
		snapshot.tanks[tank].high_closed = true;

		app.tick(snapshot);
		settle(app, snapshot, 1000);

		TEST_ASSERT_TRUE(app.currentState().faults.high_water[tank]);
		TEST_ASSERT_FALSE(app.currentState().outputs.pump_stations[station].enabled[0]);
		TEST_ASSERT_FALSE(app.currentState().outputs.pump_stations[station].enabled[1]);
	}

	void test_high_level_pumpdown_behavior_runs_both_available_pumps()
	{
		auto config = testConfig();
		config.high_water_behavior = HighWaterBehavior::PumpDownAndAlarm;
		auto app = runningApp(config);
		auto snapshot = healthySnapshot();
		const auto tank = indexOf(TankId::Equalization);
		const auto station = indexOf(PumpStationId::EqualizationToAtu);
		snapshot.tanks[tank].high_closed = true;

		app.tick(snapshot);
		settle(app, snapshot, 1000);

		TEST_ASSERT_TRUE(app.currentState().faults.high_water[tank]);
		TEST_ASSERT_TRUE(app.currentState().outputs.visual_alarm_enabled);
		TEST_ASSERT_TRUE(app.currentState().outputs.pump_stations[station].enabled[0]);
		TEST_ASSERT_TRUE(app.currentState().outputs.pump_stations[station].enabled[1]);
	}

	void test_equalization_station_runs_lead_pump_on_call_float()
	{
		auto config = testConfig();
		auto app = runningApp(config);
		auto snapshot = healthySnapshot();
		snapshot.tanks[indexOf(TankId::Equalization)].call_closed = true;

		app.tick(snapshot);
		settle(app, snapshot, 1000);

		const auto &command = app.currentState().outputs.pump_stations[indexOf(PumpStationId::EqualizationToAtu)];
		TEST_ASSERT_TRUE(command.enabled[0]);
		TEST_ASSERT_FALSE(command.enabled[1]);
	}

	void test_equalization_station_alternates_lead_pump_between_calls()
	{
		auto config = testConfig();
		auto app = runningApp(config);
		auto snapshot = healthySnapshot();
		const auto station = indexOf(PumpStationId::EqualizationToAtu);
		const auto tank = indexOf(TankId::Equalization);

		snapshot.tanks[tank].call_closed = true;
		app.tick(snapshot);
		settle(app, snapshot, 1000);
		TEST_ASSERT_TRUE(app.currentState().outputs.pump_stations[station].enabled[0]);

		snapshot.tanks[tank].call_closed = false;
		settle(app, snapshot, 1000);
		settle(app, snapshot, 1000);
		TEST_ASSERT_FALSE(app.currentState().outputs.pump_stations[station].enabled[0]);

		snapshot.tanks[tank].call_closed = true;
		settle(app, snapshot, 1000);
		settle(app, snapshot, 1000);
		TEST_ASSERT_FALSE(app.currentState().outputs.pump_stations[station].enabled[0]);
		TEST_ASSERT_TRUE(app.currentState().outputs.pump_stations[station].enabled[1]);
	}

	void test_lag_float_runs_both_available_pumps()
	{
		auto config = testConfig();
		auto app = runningApp(config);
		auto snapshot = healthySnapshot();
		const auto station = indexOf(PumpStationId::EqualizationToAtu);
		snapshot.tanks[indexOf(TankId::Equalization)].lag_closed = true;

		app.tick(snapshot);
		settle(app, snapshot, 1000);

		TEST_ASSERT_TRUE(app.currentState().outputs.pump_stations[station].enabled[0]);
		TEST_ASSERT_TRUE(app.currentState().outputs.pump_stations[station].enabled[1]);
	}

	void test_low_float_inhibits_station_without_latching_alarm()
	{
		auto config = testConfig();
		auto app = runningApp(config);
		auto snapshot = healthySnapshot();
		const auto tank = indexOf(TankId::Equalization);
		const auto station = indexOf(PumpStationId::EqualizationToAtu);
		snapshot.tanks[tank].low_closed = true;
		snapshot.tanks[tank].call_closed = true;

		app.tick(snapshot);
		settle(app, snapshot, 1000);

		TEST_ASSERT_FALSE(app.currentState().outputs.pump_stations[station].enabled[0]);
		TEST_ASSERT_FALSE(app.currentState().outputs.pump_stations[station].enabled[1]);
		TEST_ASSERT_EQUAL(static_cast<int>(ControllerMode::Automatic), static_cast<int>(app.currentState().mode));
	}

	void test_pump_without_flow_proof_latches_fault_after_timeout()
	{
		auto config = testConfig();
		auto app = runningApp(config);
		auto snapshot = healthySnapshot();
		const auto tank = indexOf(TankId::Equalization);
		const auto station = indexOf(PumpStationId::EqualizationToAtu);
		snapshot.tanks[tank].call_closed = true;
		snapshot.pump_stations[station].flow_proven[0] = false;

		app.tick(snapshot);
		settle(app, snapshot, 1000);
		settle(app, snapshot, config.pump_stations[station].flow_proof_timeout_ms);

		const auto &state = app.currentState();
		TEST_ASSERT_TRUE(state.faults.pump_flow_timeout[station][0]);
		TEST_ASSERT_FALSE(state.outputs.pump_stations[station].enabled[0]);
		TEST_ASSERT_TRUE(state.outputs.visual_alarm_enabled);
	}

	void test_manual_reset_allows_pump_fault_retry()
	{
		auto config = testConfig();
		auto app = runningApp(config);
		auto snapshot = healthySnapshot();
		const auto tank = indexOf(TankId::Equalization);
		const auto station = indexOf(PumpStationId::EqualizationToAtu);
		snapshot.tanks[tank].call_closed = true;
		snapshot.pump_stations[station].flow_proven[0] = false;

		app.tick(snapshot);
		settle(app, snapshot, 1000);
		settle(app, snapshot, config.pump_stations[station].flow_proof_timeout_ms);
		TEST_ASSERT_TRUE(app.currentState().faults.pump_flow_timeout[station][0]);

		snapshot.manual_reset_pressed = true;
		app.tick(snapshot);

		TEST_ASSERT_FALSE(app.currentState().faults.pump_flow_timeout[station][0]);
		TEST_ASSERT_TRUE(app.currentState().outputs.pump_stations[station].enabled[0]);
	}

	void test_disposal_station_starts_timed_dose_and_opens_current_zone()
	{
		auto config = testConfig();
		auto app = runningApp(config);
		auto snapshot = healthySnapshot();
		const auto station = indexOf(PumpStationId::DisposalToField);

		app.tick(snapshot);

		const auto &state = app.currentState();
		TEST_ASSERT_TRUE(state.outputs.pump_stations[station].enabled[0]);
		TEST_ASSERT_TRUE(state.outputs.valves[0]);
		TEST_ASSERT_FALSE(state.outputs.valves[1]);
	}

	void test_disposal_station_rotates_zone_on_next_timed_dose()
	{
		auto config = testConfig();
		auto app = runningApp(config);
		auto snapshot = healthySnapshot();
		const auto station = indexOf(PumpStationId::DisposalToField);

		app.tick(snapshot);
		TEST_ASSERT_TRUE(app.currentState().outputs.valves[0]);

		settle(app, snapshot, config.pump_stations[station].dose_duration_ms);
		TEST_ASSERT_FALSE(app.currentState().outputs.valves[0]);

		settle(app, snapshot, config.pump_stations[station].dose_interval_ms);
		TEST_ASSERT_TRUE(app.currentState().outputs.valves[1]);
	}

	void test_blowers_run_in_auto_and_latch_on_missing_air_proof()
	{
		auto config = testConfig();
		auto app = runningApp(config);
		auto snapshot = healthySnapshot();
		snapshot.blowers.air_proven[3] = false;

		app.tick(snapshot);
		TEST_ASSERT_TRUE(app.currentState().outputs.blowers[3]);

		settle(app, snapshot, config.blower_proof_timeout_ms);

		TEST_ASSERT_TRUE(app.currentState().faults.blower_air_timeout[3]);
		TEST_ASSERT_FALSE(app.currentState().outputs.blowers[3]);
	}

	void test_alarm_silence_only_suppresses_audible_alarm()
	{
		auto config = testConfig();
		auto app = runningApp(config);
		auto snapshot = healthySnapshot();
		snapshot.tanks[indexOf(TankId::Equalization)].high_closed = true;

		app.tick(snapshot);
		settle(app, snapshot, 1000);

		snapshot.alarm_silence_pressed = true;
		app.tick(snapshot);

		TEST_ASSERT_TRUE(app.currentState().outputs.visual_alarm_enabled);
		TEST_ASSERT_FALSE(app.currentState().outputs.audible_alarm_enabled);
	}

	void test_config_normalization_recovers_from_unsafe_values()
	{
		auto config = defaultControllerConfig();
		constexpr auto disposal_station = indexOf(PumpStationId::DisposalToField);
		config.scan_interval_ms = 0;
		config.blower_proof_timeout_ms = 0;
		config.disposal_field.active_zone_count = 0;
		config.pump_stations[disposal_station].dose_interval_ms = 1000;
		config.pump_stations[disposal_station].dose_duration_ms = 2000;
		config.pump_stations[disposal_station].flow_proof_timeout_ms = 0;

		const auto normalized = normalizedControllerConfig(config);

		TEST_ASSERT_EQUAL_UINT32(100, normalized.scan_interval_ms);
		TEST_ASSERT_EQUAL_UINT32(10UL * 1000UL, normalized.blower_proof_timeout_ms);
		TEST_ASSERT_EQUAL_UINT32(1, normalized.disposal_field.active_zone_count);
		TEST_ASSERT_EQUAL_UINT32(1000, normalized.pump_stations[disposal_station].dose_duration_ms);
		TEST_ASSERT_EQUAL_UINT32(15UL * 1000UL, normalized.pump_stations[disposal_station].flow_proof_timeout_ms);
	}

	void test_simulation_harness_uses_real_controller_with_safe_default_inputs()
	{
		SimulationHarness harness(testConfig());
		harness.completeStartupChecks();

		harness.tick();

		const auto &state = harness.state();
		TEST_ASSERT_EQUAL(static_cast<int>(ControllerMode::Automatic), static_cast<int>(state.mode));
		TEST_ASSERT_TRUE(state.outputs.blowers[0]);
		TEST_ASSERT_TRUE(state.outputs.pump_stations[indexOf(PumpStationId::DisposalToField)].enabled[0]);
	}

} // namespace

void setUp()
{
	g_clock.now_ms = 0;
	g_telemetry.publish_count = 0;
}

void tearDown() {}

int main(int argc, char **argv)
{
	(void)argc;
	(void)argv;
	UNITY_BEGIN();
	RUN_TEST(test_starts_in_safe_hold_until_startup_checks_complete);
	RUN_TEST(test_moves_into_automatic_after_startup_checks);
	RUN_TEST(test_high_level_fault_latches_after_debounce);
	RUN_TEST(test_high_level_fault_requires_clear_float_and_manual_reset);
	RUN_TEST(test_high_level_stop_behavior_holds_affected_station_off);
	RUN_TEST(test_high_level_pumpdown_behavior_runs_both_available_pumps);
	RUN_TEST(test_equalization_station_runs_lead_pump_on_call_float);
	RUN_TEST(test_equalization_station_alternates_lead_pump_between_calls);
	RUN_TEST(test_lag_float_runs_both_available_pumps);
	RUN_TEST(test_low_float_inhibits_station_without_latching_alarm);
	RUN_TEST(test_pump_without_flow_proof_latches_fault_after_timeout);
	RUN_TEST(test_manual_reset_allows_pump_fault_retry);
	RUN_TEST(test_disposal_station_starts_timed_dose_and_opens_current_zone);
	RUN_TEST(test_disposal_station_rotates_zone_on_next_timed_dose);
	RUN_TEST(test_blowers_run_in_auto_and_latch_on_missing_air_proof);
	RUN_TEST(test_alarm_silence_only_suppresses_audible_alarm);
	RUN_TEST(test_config_normalization_recovers_from_unsafe_values);
	RUN_TEST(test_simulation_harness_uses_real_controller_with_safe_default_inputs);
	return UNITY_END();
}
