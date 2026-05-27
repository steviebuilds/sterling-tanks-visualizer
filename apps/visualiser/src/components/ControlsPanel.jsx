import { Toggle } from './Toggle';
import { clamp, levelName, SCENARIOS, SIMULATOR_CONFIG, TANKS } from '../simulator/simulatorModel';

export function ControlsPanel({
	alarmSilenced,
	blowerFault,
	highRule,
	onEvent,
	onReset,
	onSelectedLevelChange,
	pumpProofFault,
	rebootHold,
	selectedLevel,
	selectedTank,
	setAlarmSilenced,
	setBlowerFault,
	setHighRule,
	setPumpProofFault,
	setRebootHold,
	setSelectedTank,
}) {
	const updateSelectedLevel = (nextLevel, message) => {
		onSelectedLevelChange(nextLevel, message);
	};

	return (
		<aside className="control-panel" aria-label="Simulation controls">
			<div className="panel-section">
				<p className="panel-label">Control tank</p>
				<div className="segmented">
					{Object.entries(TANKS).map(([id, tank]) => (
						<button
							className={selectedTank === id ? 'active' : ''}
							key={id}
							onClick={() => {
								setSelectedTank(id);
								onEvent(`${tank.short} selected`);
							}}
							type="button"
						>
							{tank.short}
						</button>
					))}
				</div>
			</div>

			<div className="panel-section">
				<p className="panel-label">Tank level</p>
				<div className="button-grid">
					{SCENARIOS.map((scenario) => (
						<button
							className={levelName(selectedLevel) === scenario.label ? 'active' : ''}
							key={scenario.id}
							onClick={() => updateSelectedLevel(scenario.level, `${scenario.label} selected`)}
							type="button"
						>
							{scenario.label}
						</button>
					))}
				</div>
				<div className="stepper">
					<button
						onClick={() =>
							updateSelectedLevel(
								clamp(
									selectedLevel - 10,
									SIMULATOR_CONFIG.tank.minPercent,
									SIMULATOR_CONFIG.tank.maxPercent,
								),
								'level lowered',
							)
						}
						type="button"
					>
						Drain
					</button>
					<button
						onClick={() =>
							updateSelectedLevel(
								clamp(
									selectedLevel + 10,
									SIMULATOR_CONFIG.tank.minPercent,
									SIMULATOR_CONFIG.tank.maxPercent,
								),
								'level raised',
							)
						}
						type="button"
					>
						Fill
					</button>
				</div>
			</div>

			<div className="panel-section">
				<p className="panel-label">High rule</p>
				<div className="segmented">
					<button
						className={highRule === 'pumpdown' ? 'active' : ''}
						onClick={() => {
							setHighRule('pumpdown');
							onEvent('HIGH rule: pump-down');
						}}
						type="button"
					>
						Pump down
					</button>
					<button
						className={highRule === 'stop' ? 'active' : ''}
						onClick={() => {
							setHighRule('stop');
							onEvent('HIGH rule: stop pumps');
						}}
						type="button"
					>
						Stop pumps
					</button>
				</div>
				<p className="quiet-copy">
					{highRule === 'pumpdown'
						? 'HIGH keeps alarming and runs pumps.'
						: 'HIGH alarms and holds pumps off.'}
				</p>
			</div>

			<div className="panel-section">
				<p className="panel-label">Faults</p>
				<div className="switch-stack">
					<Toggle
						checked={pumpProofFault}
						label="No pump proof"
						onChange={() => {
							setPumpProofFault((value) => !value);
							onEvent(
								pumpProofFault
									? 'Pump proof restored'
									: `${TANKS[selectedTank].short}: pump proof fault`,
							);
						}}
					/>
					<Toggle
						checked={blowerFault}
						label="No blower proof"
						onChange={() => {
							setBlowerFault((value) => !value);
							onEvent(blowerFault ? 'Blower proof restored' : 'Blower fault');
						}}
					/>
					<Toggle
						checked={rebootHold}
						label="Power reboot"
						onChange={() => {
							setRebootHold((value) => !value);
							onEvent(rebootHold ? 'AUTO resumed' : 'Outputs held off');
						}}
					/>
					<Toggle
						checked={alarmSilenced}
						label="Silence audible"
						onChange={() => {
							setAlarmSilenced((value) => !value);
							onEvent(alarmSilenced ? 'Audible alarm enabled' : 'Audible alarm silenced');
						}}
					/>
				</div>
			</div>

			<button className="reset-button" onClick={onReset} type="button">
				Reset
			</button>
		</aside>
	);
}
