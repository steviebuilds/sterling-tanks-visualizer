#include "septic/hal/SiteProfile.h"

#include "septic/hal/SiteConstants.h"

namespace septic::hal
{
	namespace
	{

		DigitalInputPoint input(const char *name, const int pin)
		{
			DigitalInputPoint point{};
			point.name = name;
			point.pin = pin;
			point.active_state = ActiveState::Low;
			point.pull = InputPull::Up;
			return point;
		}

		DigitalOutputPoint output(const char *name, const int pin)
		{
			DigitalOutputPoint point{};
			point.name = name;
			point.pin = pin;
			point.active_state = ActiveState::High;
			return point;
		}

		void setFloatMap(FloatPointMap &target,
						 const char *low,
						 const int low_pin,
						 const char *call,
						 const int call_pin,
						 const char *lag,
						 const int lag_pin,
						 const char *high,
						 const int high_pin)
		{
			target.low = input(low, low_pin);
			target.call = input(call, call_pin);
			target.lag = input(lag, lag_pin);
			target.high = input(high, high_pin);
		}

		void setPumpStationMap(PumpStationPointMap &target,
							   const char *flow_1,
							   const int flow_1_pin,
							   const char *flow_2,
							   const int flow_2_pin,
							   const char *auto_1,
							   const int auto_1_pin,
							   const char *auto_2,
							   const int auto_2_pin,
							   const char *hand_1,
							   const int hand_1_pin,
							   const char *hand_2,
							   const int hand_2_pin,
							   const char *relay_1,
							   const int relay_1_pin,
							   const char *relay_2,
							   const int relay_2_pin)
		{
			target.flow_proof[0] = input(flow_1, flow_1_pin);
			target.flow_proof[1] = input(flow_2, flow_2_pin);
			target.hoa_auto[0] = input(auto_1, auto_1_pin);
			target.hoa_auto[1] = input(auto_2, auto_2_pin);
			target.hoa_hand[0] = input(hand_1, hand_1_pin);
			target.hoa_hand[1] = input(hand_2, hand_2_pin);
			target.pump_relay[0] = output(relay_1, relay_1_pin);
			target.pump_relay[1] = output(relay_2, relay_2_pin);
		}

		SiteProfile buildHiddenArborProfile()
		{
			SiteProfile profile{};
			profile.site_name = site::SITE_NAME;
			profile.telemetry.site_id = site::SITE_ID;
			profile.telemetry.endpoint_url = site::TELEMETRY_ENDPOINT_URL;
			profile.telemetry.bearer_token = site::TELEMETRY_BEARER_TOKEN;

			setFloatMap(profile.tanks[septic::core::indexOf(septic::core::TankId::Equalization)],
						"DI-EQ-LOW",
						site::PIN_DI_EQ_LOW,
						"DI-EQ-CALL",
						site::PIN_DI_EQ_CALL,
						"DI-EQ-LAG",
						site::PIN_DI_EQ_LAG,
						"DI-EQ-HIGH",
						site::PIN_DI_EQ_HIGH);
			setFloatMap(profile.tanks[septic::core::indexOf(septic::core::TankId::Disposal)],
						"DI-DISP-LOW",
						site::PIN_DI_DISP_LOW,
						"DI-DISP-CALL",
						site::PIN_DI_DISP_CALL,
						"DI-DISP-LAG",
						site::PIN_DI_DISP_LAG,
						"DI-DISP-HIGH",
						site::PIN_DI_DISP_HIGH);

			setPumpStationMap(profile.pump_stations[septic::core::indexOf(septic::core::PumpStationId::EqualizationToAtu)],
							  "DI-EQ-PUMP-01-FLOW",
							  site::PIN_DI_EQ_PUMP_01_FLOW,
							  "DI-EQ-PUMP-02-FLOW",
							  site::PIN_DI_EQ_PUMP_02_FLOW,
							  "DI-EQ-PUMP-01-HOA-AUTO",
							  site::PIN_DI_EQ_PUMP_01_HOA_AUTO,
							  "DI-EQ-PUMP-02-HOA-AUTO",
							  site::PIN_DI_EQ_PUMP_02_HOA_AUTO,
							  "DI-EQ-PUMP-01-HOA-HAND",
							  site::PIN_DI_EQ_PUMP_01_HOA_HAND,
							  "DI-EQ-PUMP-02-HOA-HAND",
							  site::PIN_DI_EQ_PUMP_02_HOA_HAND,
							  "DO-EQ-PUMP-01",
							  site::PIN_DO_EQ_PUMP_01,
							  "DO-EQ-PUMP-02",
							  site::PIN_DO_EQ_PUMP_02);
			setPumpStationMap(profile.pump_stations[septic::core::indexOf(septic::core::PumpStationId::DisposalToField)],
							  "DI-DISP-PUMP-01-FLOW",
							  site::PIN_DI_DISP_PUMP_01_FLOW,
							  "DI-DISP-PUMP-02-FLOW",
							  site::PIN_DI_DISP_PUMP_02_FLOW,
							  "DI-DISP-PUMP-01-HOA-AUTO",
							  site::PIN_DI_DISP_PUMP_01_HOA_AUTO,
							  "DI-DISP-PUMP-02-HOA-AUTO",
							  site::PIN_DI_DISP_PUMP_02_HOA_AUTO,
							  "DI-DISP-PUMP-01-HOA-HAND",
							  site::PIN_DI_DISP_PUMP_01_HOA_HAND,
							  "DI-DISP-PUMP-02-HOA-HAND",
							  site::PIN_DI_DISP_PUMP_02_HOA_HAND,
							  "DO-DISP-PUMP-01",
							  site::PIN_DO_DISP_PUMP_01,
							  "DO-DISP-PUMP-02",
							  site::PIN_DO_DISP_PUMP_02);

			const int blower_air_pins[] = {
				site::PIN_DI_AIR_01,
				site::PIN_DI_AIR_02,
				site::PIN_DI_AIR_03,
				site::PIN_DI_AIR_04,
				site::PIN_DI_AIR_05,
				site::PIN_DI_AIR_06,
				site::PIN_DI_AIR_07,
				site::PIN_DI_AIR_08,
			};
			const int blower_auto_pins[] = {
				site::PIN_DI_BLOWER_01_HOA_AUTO,
				site::PIN_DI_BLOWER_02_HOA_AUTO,
				site::PIN_DI_BLOWER_03_HOA_AUTO,
				site::PIN_DI_BLOWER_04_HOA_AUTO,
				site::PIN_DI_BLOWER_05_HOA_AUTO,
				site::PIN_DI_BLOWER_06_HOA_AUTO,
				site::PIN_DI_BLOWER_07_HOA_AUTO,
				site::PIN_DI_BLOWER_08_HOA_AUTO,
			};
			const int blower_hand_pins[] = {
				site::PIN_DI_BLOWER_01_HOA_HAND,
				site::PIN_DI_BLOWER_02_HOA_HAND,
				site::PIN_DI_BLOWER_03_HOA_HAND,
				site::PIN_DI_BLOWER_04_HOA_HAND,
				site::PIN_DI_BLOWER_05_HOA_HAND,
				site::PIN_DI_BLOWER_06_HOA_HAND,
				site::PIN_DI_BLOWER_07_HOA_HAND,
				site::PIN_DI_BLOWER_08_HOA_HAND,
			};
			const int blower_relay_pins[] = {
				site::PIN_DO_AIR_01,
				site::PIN_DO_AIR_02,
				site::PIN_DO_AIR_03,
				site::PIN_DO_AIR_04,
				site::PIN_DO_AIR_05,
				site::PIN_DO_AIR_06,
				site::PIN_DO_AIR_07,
				site::PIN_DO_AIR_08,
			};
			const int valve_relay_pins[] = {
				site::PIN_DO_VAL_01,
				site::PIN_DO_VAL_02,
				site::PIN_DO_VAL_03,
				site::PIN_DO_VAL_04,
				site::PIN_DO_VAL_05,
				site::PIN_DO_VAL_06,
				site::PIN_DO_VAL_07,
				site::PIN_DO_VAL_08,
				site::PIN_DO_VAL_09,
				site::PIN_DO_VAL_10,
				site::PIN_DO_VAL_11,
				site::PIN_DO_VAL_12,
			};

			for (std::size_t i = 0; i < septic::core::kBlowerCount; ++i)
			{
				profile.blower_air_proof[i] = input("DI-AIR-XX", blower_air_pins[i]);
				profile.blower_hoa_auto[i] = input("DI-BLOWER-XX-HOA-AUTO", blower_auto_pins[i]);
				profile.blower_hoa_hand[i] = input("DI-BLOWER-XX-HOA-HAND", blower_hand_pins[i]);
				profile.blower_relay[i] = output("DO-AIR-XX", blower_relay_pins[i]);
			}

			for (std::size_t i = 0; i < septic::core::kValveCount; ++i)
			{
				profile.valve_relay[i] = output("DO-VAL-XX", valve_relay_pins[i]);
			}

			profile.alarm_silence = input("DI-ALARM-SILENCE", site::PIN_DI_ALARM_SILENCE);
			profile.manual_reset = input("DI-MANUAL-RESET", site::PIN_DI_MANUAL_RESET);
			profile.audible_alarm = output("DO-ALARM-AUD", site::PIN_DO_ALARM_AUD);
			profile.visual_alarm = output("DO-ALARM-VIS", site::PIN_DO_ALARM_VIS);

			return profile;
		}

	} // namespace

	const SiteProfile &hiddenArborProfile()
	{
		static const SiteProfile profile = buildHiddenArborProfile();
		return profile;
	}

} // namespace septic::hal
