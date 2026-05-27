#pragma once

namespace septic::hal::site
{

	// Fill these from the final terminal/pin map. Leave unknown points as -1.
	// Inputs default to inactive/healthy while unmapped; outputs do nothing while unmapped.

	constexpr const char *SITE_ID = "hidden-arbor";
	constexpr const char *SITE_NAME = "Hidden Arbor RV Park OSSF";
	constexpr const char *TELEMETRY_ENDPOINT_URL = "https://deaqo2r537.execute-api.us-east-1.amazonaws.com/telemetry";
	constexpr const char *TELEMETRY_BEARER_TOKEN = "QN-Al6DnGScGZHIeIUPnNnBWdG3uwKZE1TjFXwr59cg";

	constexpr int PIN_DI_EQ_LOW = -1;
	constexpr int PIN_DI_EQ_CALL = -1;
	constexpr int PIN_DI_EQ_LAG = -1;
	constexpr int PIN_DI_EQ_HIGH = -1;

	constexpr int PIN_DI_DISP_LOW = -1;
	constexpr int PIN_DI_DISP_CALL = -1;
	constexpr int PIN_DI_DISP_LAG = -1;
	constexpr int PIN_DI_DISP_HIGH = -1;

	constexpr int PIN_DI_EQ_PUMP_01_FLOW = -1;
	constexpr int PIN_DI_EQ_PUMP_02_FLOW = -1;
	constexpr int PIN_DI_EQ_PUMP_01_HOA_AUTO = -1;
	constexpr int PIN_DI_EQ_PUMP_02_HOA_AUTO = -1;
	constexpr int PIN_DI_EQ_PUMP_01_HOA_HAND = -1;
	constexpr int PIN_DI_EQ_PUMP_02_HOA_HAND = -1;
	constexpr int PIN_DO_EQ_PUMP_01 = -1;
	constexpr int PIN_DO_EQ_PUMP_02 = -1;

	constexpr int PIN_DI_DISP_PUMP_01_FLOW = -1;
	constexpr int PIN_DI_DISP_PUMP_02_FLOW = -1;
	constexpr int PIN_DI_DISP_PUMP_01_HOA_AUTO = -1;
	constexpr int PIN_DI_DISP_PUMP_02_HOA_AUTO = -1;
	constexpr int PIN_DI_DISP_PUMP_01_HOA_HAND = -1;
	constexpr int PIN_DI_DISP_PUMP_02_HOA_HAND = -1;
	constexpr int PIN_DO_DISP_PUMP_01 = -1;
	constexpr int PIN_DO_DISP_PUMP_02 = -1;

	constexpr int PIN_DI_AIR_01 = -1;
	constexpr int PIN_DI_AIR_02 = -1;
	constexpr int PIN_DI_AIR_03 = -1;
	constexpr int PIN_DI_AIR_04 = -1;
	constexpr int PIN_DI_AIR_05 = -1;
	constexpr int PIN_DI_AIR_06 = -1;
	constexpr int PIN_DI_AIR_07 = -1;
	constexpr int PIN_DI_AIR_08 = -1;

	constexpr int PIN_DI_BLOWER_01_HOA_AUTO = -1;
	constexpr int PIN_DI_BLOWER_02_HOA_AUTO = -1;
	constexpr int PIN_DI_BLOWER_03_HOA_AUTO = -1;
	constexpr int PIN_DI_BLOWER_04_HOA_AUTO = -1;
	constexpr int PIN_DI_BLOWER_05_HOA_AUTO = -1;
	constexpr int PIN_DI_BLOWER_06_HOA_AUTO = -1;
	constexpr int PIN_DI_BLOWER_07_HOA_AUTO = -1;
	constexpr int PIN_DI_BLOWER_08_HOA_AUTO = -1;

	constexpr int PIN_DI_BLOWER_01_HOA_HAND = -1;
	constexpr int PIN_DI_BLOWER_02_HOA_HAND = -1;
	constexpr int PIN_DI_BLOWER_03_HOA_HAND = -1;
	constexpr int PIN_DI_BLOWER_04_HOA_HAND = -1;
	constexpr int PIN_DI_BLOWER_05_HOA_HAND = -1;
	constexpr int PIN_DI_BLOWER_06_HOA_HAND = -1;
	constexpr int PIN_DI_BLOWER_07_HOA_HAND = -1;
	constexpr int PIN_DI_BLOWER_08_HOA_HAND = -1;

	constexpr int PIN_DO_AIR_01 = -1;
	constexpr int PIN_DO_AIR_02 = -1;
	constexpr int PIN_DO_AIR_03 = -1;
	constexpr int PIN_DO_AIR_04 = -1;
	constexpr int PIN_DO_AIR_05 = -1;
	constexpr int PIN_DO_AIR_06 = -1;
	constexpr int PIN_DO_AIR_07 = -1;
	constexpr int PIN_DO_AIR_08 = -1;

	constexpr int PIN_DO_VAL_01 = -1;
	constexpr int PIN_DO_VAL_02 = -1;
	constexpr int PIN_DO_VAL_03 = -1;
	constexpr int PIN_DO_VAL_04 = -1;
	constexpr int PIN_DO_VAL_05 = -1;
	constexpr int PIN_DO_VAL_06 = -1;
	constexpr int PIN_DO_VAL_07 = -1;
	constexpr int PIN_DO_VAL_08 = -1;
	constexpr int PIN_DO_VAL_09 = -1;
	constexpr int PIN_DO_VAL_10 = -1;
	constexpr int PIN_DO_VAL_11 = -1;
	constexpr int PIN_DO_VAL_12 = -1;

	constexpr int PIN_DI_ALARM_SILENCE = -1;
	constexpr int PIN_DI_MANUAL_RESET = -1;
	constexpr int PIN_DO_ALARM_AUD = -1;
	constexpr int PIN_DO_ALARM_VIS = -1;

} // namespace septic::hal::site
