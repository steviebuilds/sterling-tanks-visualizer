#pragma once

#include "septic/core/ControllerApp.h"
#include "septic/core/ControllerConfig.h"
#include "septic/core/ControllerTypes.h"
#include "septic/core/Ports.h"

namespace septic::core
{

	class SimulationClock final : public IClock
	{
	public:
		std::uint32_t millis() const override;
		void advanceBy(std::uint32_t elapsed_ms);
		void reset();

	private:
		std::uint32_t now_ms_ = 0;
	};

	class SimulationHarness final
	{
	public:
		explicit SimulationHarness(ControllerConfig config = defaultControllerConfig());

		void completeStartupChecks();
		const ControllerState &tick(std::uint32_t elapsed_ms = 0);
		const ControllerState &state() const;

		InputSnapshot &inputs();
		const InputSnapshot &inputs() const;

		void setTankFloats(std::size_t tank_index, FloatInputs floats);
		void setPumpFlowProof(std::size_t station_index, std::size_t pump_index, bool proven);
		void setPumpMode(std::size_t station_index, std::size_t pump_index, EquipmentMode mode);
		void setBlowerAirProof(std::size_t blower_index, bool proven);
		void setBlowerMode(std::size_t blower_index, EquipmentMode mode);
		void setAlarmSilencePressed(bool pressed);
		void setManualResetPressed(bool pressed);

		void setAllPumpFlowProofs(bool proven);
		void setAllBlowerAirProofs(bool proven);
		void setAllEquipmentModes(EquipmentMode mode);

	private:
		ControllerConfig config_;
		SimulationClock clock_;
		NullTelemetrySink telemetry_;
		ControllerApp app_;
		InputSnapshot inputs_{};
	};

} // namespace septic::core
