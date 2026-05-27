import { Toggle } from './Toggle';
import { clamp, levelName, SCENARIOS, SIMULATOR_CONFIG, TANKS } from '../simulator/simulatorModel';

const HELP = {
	controlTank: 'Choose which pump tank the level and pump-proof controls apply to.',
	tankLevel: 'These buttons move the selected tank across the float states we believe exist: LOW, CALL, LAG, and HIGH.',
	highRule: 'This is the main Sterling question: should HIGH pump the tank down while alarming, or stop/latch the pumps off?',
	faults: 'Fault switches simulate failed proof signals and restart behavior so Sterling can see alarm and recovery logic.',
	pumpProof: 'Simulates a pump being commanded on but no flow/proof signal coming back before timeout.',
	blowerProof: 'Simulates the ATU blower being commanded on but no air/proof signal coming back before timeout.',
	reboot: 'Simulates a controller reboot where outputs are held off until startup checks complete.',
	silence: 'Silences only the audible alarm; visual alarm and fault state remain active.',
};

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
				<PanelLabel help={HELP.controlTank}>Control tank</PanelLabel>
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
				<PanelLabel help={HELP.tankLevel}>Tank level</PanelLabel>
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
				<PanelLabel help={HELP.highRule}>High rule</PanelLabel>
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
				<PanelLabel help={HELP.faults}>Faults</PanelLabel>
				<div className="switch-stack">
					<ControlWithTip help={HELP.pumpProof}>
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
					</ControlWithTip>
					<ControlWithTip help={HELP.blowerProof}>
						<Toggle
							checked={blowerFault}
							label="No blower proof"
							onChange={() => {
								setBlowerFault((value) => !value);
								onEvent(blowerFault ? 'Blower proof restored' : 'Blower fault');
							}}
						/>
					</ControlWithTip>
					<ControlWithTip help={HELP.reboot}>
						<Toggle
							checked={rebootHold}
							label="Power reboot"
							onChange={() => {
								setRebootHold((value) => !value);
								onEvent(rebootHold ? 'AUTO resumed' : 'Outputs held off');
							}}
						/>
					</ControlWithTip>
					<ControlWithTip help={HELP.silence}>
						<Toggle
							checked={alarmSilenced}
							label="Silence audible"
							onChange={() => {
								setAlarmSilenced((value) => !value);
								onEvent(alarmSilenced ? 'Audible alarm enabled' : 'Audible alarm silenced');
							}}
						/>
					</ControlWithTip>
				</div>
			</div>

			<button className="reset-button" onClick={onReset} type="button">
				Reset
			</button>
		</aside>
	);
}

function PanelLabel({ children, help }) {
	return (
		<div className="label-row">
			<p className="panel-label">{children}</p>
			<InfoTip text={help} />
		</div>
	);
}

function ControlWithTip({ children, help }) {
	return (
		<div className="control-with-tip">
			{children}
			<InfoTip text={help} />
		</div>
	);
}

function InfoTip({ text }) {
	return (
		<span aria-label={text} className="info-tip" data-tooltip={text} role="img" tabIndex={0}>
			i
		</span>
	);
}
