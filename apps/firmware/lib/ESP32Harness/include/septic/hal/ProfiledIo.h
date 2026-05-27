#pragma once

#include <cstdint>

#include "septic/core/ControllerTypes.h"
#include "septic/hal/SiteProfile.h"

namespace septic::hal
{

	class ProfiledIo
	{
	public:
		explicit ProfiledIo(const SiteProfile &profile);

		void begin() const;
		septic::core::InputSnapshot readInputs(std::uint32_t now_ms) const;
		void applyOutputs(const septic::core::OutputCommand &outputs) const;

	private:
		const SiteProfile &profile_;
	};

} // namespace septic::hal
