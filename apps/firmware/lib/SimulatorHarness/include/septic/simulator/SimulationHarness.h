#pragma once

#include "septic/core/ControllerApp.h"
#include "septic/core/ControllerConfig.h"
#include "septic/core/ControllerTypes.h"
#include "septic/core/Ports.h"

namespace septic::sim
{

	class SimulationClock final : public core::IClock
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
		explicit SimulationHarness(core::ControllerConfig config = core::defaultControllerConfig());

		void completeStartupChecks();
		const core::ControllerState &tick(std::uint32_t elapsed_ms = 0);
		const core::ControllerState &state() const;

		core::InputSnapshot &inputs();
		const core::InputSnapshot &inputs() const;

		void setTankFloats(std::size_t tank_index, core::FloatInputs floats);
		void setPumpFlowProof(std::size_t station_index, std::size_t pump_index, bool proven);
		void setPumpMode(std::size_t station_index, std::size_t pump_index, core::EquipmentMode mode);
		void setBlowerAirProof(std::size_t blower_index, bool proven);
		void setBlowerMode(std::size_t blower_index, core::EquipmentMode mode);
		void setAlarmSilencePressed(bool pressed);
		void setManualResetPressed(bool pressed);

		void setAllPumpFlowProofs(bool proven);
		void setAllBlowerAirProofs(bool proven);
		void setAllEquipmentModes(core::EquipmentMode mode);

	private:
		core::ControllerConfig config_;
		SimulationClock clock_;
		core::NullTelemetrySink telemetry_;
		core::ControllerApp app_;
		core::InputSnapshot inputs_{};
	};

} // namespace septic::sim
