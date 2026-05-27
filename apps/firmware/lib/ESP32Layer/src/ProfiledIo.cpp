#include "septic/hal/ProfiledIo.h"

#if defined(ARDUINO)
#include <Arduino.h>
#endif

namespace septic::hal
{
	namespace
	{

		bool pointIsMapped(const DigitalInputPoint &point)
		{
			return point.pin >= 0;
		}

		bool pointIsMapped(const DigitalOutputPoint &point)
		{
			return point.pin >= 0;
		}

		bool activeFromRaw(const bool raw_high, const ActiveState active_state)
		{
			return active_state == ActiveState::High ? raw_high : !raw_high;
		}

		septic::core::EquipmentMode equipmentModeFromHoa(const bool hand_active, const bool auto_active)
		{
			if (hand_active)
			{
				return septic::core::EquipmentMode::Hand;
			}

			if (auto_active)
			{
				return septic::core::EquipmentMode::Auto;
			}

			return septic::core::EquipmentMode::Off;
		}

#if defined(ARDUINO)
		void configureInput(const DigitalInputPoint &point)
		{
			if (!pointIsMapped(point))
			{
				return;
			}

			if (point.pull == InputPull::Up)
			{
				pinMode(point.pin, INPUT_PULLUP);
			}
			else if (point.pull == InputPull::Down)
			{
				pinMode(point.pin, INPUT_PULLDOWN);
			}
			else
			{
				pinMode(point.pin, INPUT);
			}
		}

		void configureOutput(const DigitalOutputPoint &point)
		{
			if (!pointIsMapped(point))
			{
				return;
			}

			pinMode(point.pin, OUTPUT);
			const auto inactive_level = point.active_state == ActiveState::High ? LOW : HIGH;
			digitalWrite(point.pin, inactive_level);
		}

		bool readPoint(const DigitalInputPoint &point, const bool fallback_active)
		{
			if (!pointIsMapped(point))
			{
				return fallback_active;
			}

			return activeFromRaw(digitalRead(point.pin) == HIGH, point.active_state);
		}

		void writePoint(const DigitalOutputPoint &point, const bool active)
		{
			if (!pointIsMapped(point))
			{
				return;
			}

			const auto active_high = point.active_state == ActiveState::High;
			digitalWrite(point.pin, active == active_high ? HIGH : LOW);
		}
#else
		void configureInput(const DigitalInputPoint &) {}
		void configureOutput(const DigitalOutputPoint &) {}
		bool readPoint(const DigitalInputPoint &, const bool fallback_active)
		{
			return fallback_active;
		}
		void writePoint(const DigitalOutputPoint &, const bool) {}
#endif

	} // namespace

	ProfiledIo::ProfiledIo(const SiteProfile &profile)
		: profile_(profile) {}

	void ProfiledIo::begin() const
	{
		for (const auto &tank : profile_.tanks)
		{
			configureInput(tank.low);
			configureInput(tank.call);
			configureInput(tank.lag);
			configureInput(tank.high);
		}

		for (const auto &station : profile_.pump_stations)
		{
			for (const auto &point : station.flow_proof)
			{
				configureInput(point);
			}
			for (const auto &point : station.hoa_auto)
			{
				configureInput(point);
			}
			for (const auto &point : station.hoa_hand)
			{
				configureInput(point);
			}
			for (const auto &point : station.pump_relay)
			{
				configureOutput(point);
			}
		}

		for (const auto &point : profile_.blower_air_proof)
		{
			configureInput(point);
		}
		for (const auto &point : profile_.blower_hoa_auto)
		{
			configureInput(point);
		}
		for (const auto &point : profile_.blower_hoa_hand)
		{
			configureInput(point);
		}
		for (const auto &point : profile_.blower_relay)
		{
			configureOutput(point);
		}
		for (const auto &point : profile_.valve_relay)
		{
			configureOutput(point);
		}

		configureInput(profile_.alarm_silence);
		configureInput(profile_.manual_reset);
		configureOutput(profile_.audible_alarm);
		configureOutput(profile_.visual_alarm);
	}

	septic::core::InputSnapshot ProfiledIo::readInputs(const std::uint32_t now_ms) const
	{
		septic::core::InputSnapshot snapshot{};
		snapshot.sampled_at_ms = now_ms;

		for (std::size_t tank_index = 0; tank_index < septic::core::kTankCount; ++tank_index)
		{
			const auto &tank = profile_.tanks[tank_index];
			snapshot.tanks[tank_index].low_closed = readPoint(tank.low, false);
			snapshot.tanks[tank_index].call_closed = readPoint(tank.call, false);
			snapshot.tanks[tank_index].lag_closed = readPoint(tank.lag, false);
			snapshot.tanks[tank_index].high_closed = readPoint(tank.high, false);
		}

		for (std::size_t station_index = 0; station_index < septic::core::kPumpStationCount; ++station_index)
		{
			const auto &station = profile_.pump_stations[station_index];
			for (std::size_t pump_index = 0; pump_index < septic::core::kPumpsPerStation; ++pump_index)
			{
				snapshot.pump_stations[station_index].flow_proven[pump_index] = readPoint(station.flow_proof[pump_index], true);
				const auto hand = readPoint(station.hoa_hand[pump_index], false);
				const auto automatic = readPoint(station.hoa_auto[pump_index], true);
				snapshot.pump_stations[station_index].hoa[pump_index] = equipmentModeFromHoa(hand, automatic);
			}
		}

		for (std::size_t blower_index = 0; blower_index < septic::core::kBlowerCount; ++blower_index)
		{
			snapshot.blowers.air_proven[blower_index] = readPoint(profile_.blower_air_proof[blower_index], true);
			const auto hand = readPoint(profile_.blower_hoa_hand[blower_index], false);
			const auto automatic = readPoint(profile_.blower_hoa_auto[blower_index], true);
			snapshot.blowers.hoa[blower_index] = equipmentModeFromHoa(hand, automatic);
		}

		snapshot.alarm_silence_pressed = readPoint(profile_.alarm_silence, false);
		snapshot.manual_reset_pressed = readPoint(profile_.manual_reset, false);
		return snapshot;
	}

	void ProfiledIo::applyOutputs(const septic::core::OutputCommand &outputs) const
	{
		for (std::size_t station_index = 0; station_index < septic::core::kPumpStationCount; ++station_index)
		{
			const auto &station = profile_.pump_stations[station_index];
			for (std::size_t pump_index = 0; pump_index < septic::core::kPumpsPerStation; ++pump_index)
			{
				writePoint(station.pump_relay[pump_index], outputs.pump_stations[station_index].enabled[pump_index]);
			}
		}

		for (std::size_t blower_index = 0; blower_index < septic::core::kBlowerCount; ++blower_index)
		{
			writePoint(profile_.blower_relay[blower_index], outputs.blowers[blower_index]);
		}

		for (std::size_t valve_index = 0; valve_index < septic::core::kValveCount; ++valve_index)
		{
			writePoint(profile_.valve_relay[valve_index], outputs.valves[valve_index]);
		}

		writePoint(profile_.audible_alarm, outputs.audible_alarm_enabled);
		writePoint(profile_.visual_alarm, outputs.visual_alarm_enabled);
	}

} // namespace septic::hal
