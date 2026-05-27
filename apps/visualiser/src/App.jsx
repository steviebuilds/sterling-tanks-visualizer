import { useMemo, useState } from 'react';
import './App.css';

const LEVELS = {
	low: 14,
	normal: 42,
	call: 60,
	lag: 78,
	high: 93,
};

const SCENARIOS = [
	{ id: 'normal', label: 'Normal', level: LEVELS.normal },
	{ id: 'call', label: 'Pump call', level: LEVELS.call },
	{ id: 'lag', label: 'Lag', level: LEVELS.lag },
	{ id: 'high', label: 'High', level: LEVELS.high },
	{ id: 'low', label: 'Low', level: LEVELS.low },
];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const getFloats = (level) => ({
	low: level <= 22,
	call: level >= 48,
	lag: level >= 74,
	high: level >= 88,
});

const buildOutput = ({ level, highRule, pumpProofFault, blowerFault, rebootHold }) => {
	const floats = getFloats(level);
	const alarm = floats.high || pumpProofFault || blowerFault;
	const pumpAllowed = !rebootHold && !floats.low && !pumpProofFault;
	const pumpOne =
		pumpAllowed &&
		((floats.high && highRule === 'pumpdown') || (!floats.high && floats.call));
	const pumpTwo =
		pumpAllowed &&
		((floats.high && highRule === 'pumpdown' && floats.lag) ||
			(!floats.high && floats.lag));

	return {
		floats,
		mode: rebootHold ? 'Safe hold' : alarm ? 'Alarm active' : 'Automatic',
		alarm,
		pumpOne,
		pumpTwo,
		blower: !rebootHold && !blowerFault,
		valve: !rebootHold && (pumpOne || pumpTwo) && !pumpProofFault,
		flow: !rebootHold && (pumpOne || pumpTwo) && !pumpProofFault,
	};
};

const levelName = (level) => {
	if (level >= 88) return 'High';
	if (level >= 74) return 'Lag';
	if (level >= 48) return 'Pump call';
	if (level <= 22) return 'Low';
	return 'Normal';
};

function App() {
	const [level, setLevel] = useState(LEVELS.normal);
	const [highRule, setHighRule] = useState('pumpdown');
	const [pumpProofFault, setPumpProofFault] = useState(false);
	const [blowerFault, setBlowerFault] = useState(false);
	const [rebootHold, setRebootHold] = useState(false);
	const [alarmSilenced, setAlarmSilenced] = useState(false);
	const [events, setEvents] = useState([
		'Simulator ready',
		'Controller in automatic mode',
	]);

	const output = useMemo(
		() =>
			buildOutput({
				level,
				highRule,
				pumpProofFault,
				blowerFault,
				rebootHold,
			}),
		[level, highRule, pumpProofFault, blowerFault, rebootHold],
	);

	const addEvent = (message) => {
		setEvents((current) => [message, ...current].slice(0, 7));
	};

	const setScenario = (scenario) => {
		setLevel(scenario.level);
		addEvent(`${scenario.label} level selected`);
	};

	const reset = () => {
		setLevel(LEVELS.normal);
		setPumpProofFault(false);
		setBlowerFault(false);
		setRebootHold(false);
		setAlarmSilenced(false);
		addEvent('Manual reset acknowledged');
	};

	const ruleCopy =
		highRule === 'pumpdown'
			? 'HIGH overrides schedule and pumps down while alarming.'
			: 'HIGH stops pumps and waits for manual reset.';

	return (
		<main className="sim-shell">
			<header className="sim-header">
				<div>
					<p className="eyebrow">Hidden Arbor controller</p>
					<h1>Interactive logic simulator</h1>
				</div>
				<div className={`mode-pill ${output.alarm ? 'alarm' : ''}`}>
					<span />
					{output.mode}
				</div>
			</header>

			<section className="sim-grid">
				<aside className="control-panel" aria-label="Simulation controls">
					<div className="panel-section">
						<p className="panel-label">Tank level</p>
						<div className="button-grid">
							{SCENARIOS.map((scenario) => (
								<button
									className={levelName(level) === scenario.label ? 'active' : ''}
									key={scenario.id}
									onClick={() => setScenario(scenario)}
									type="button"
								>
									{scenario.label}
								</button>
							))}
						</div>
						<div className="stepper">
							<button
								onClick={() => {
									setLevel((current) => clamp(current - 10, 6, 96));
									addEvent('Tank level lowered');
								}}
								type="button"
							>
								Drain
							</button>
							<button
								onClick={() => {
									setLevel((current) => clamp(current + 10, 6, 96));
									addEvent('Tank level raised');
								}}
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
									addEvent('HIGH rule set to pump-down');
								}}
								type="button"
							>
								Pump down
							</button>
							<button
								className={highRule === 'stop' ? 'active' : ''}
								onClick={() => {
									setHighRule('stop');
									addEvent('HIGH rule set to stop pumps');
								}}
								type="button"
							>
								Stop pumps
							</button>
						</div>
						<p className="quiet-copy">{ruleCopy}</p>
					</div>

					<div className="panel-section">
						<p className="panel-label">Faults</p>
						<div className="switch-stack">
							<Toggle
								checked={pumpProofFault}
								label="No pump proof"
								onChange={() => {
									setPumpProofFault((value) => !value);
									addEvent(
										pumpProofFault
											? 'Pump proof restored'
											: 'Pump proof fault triggered',
									);
								}}
							/>
							<Toggle
								checked={blowerFault}
								label="No blower proof"
								onChange={() => {
									setBlowerFault((value) => !value);
									addEvent(
										blowerFault
											? 'Blower proof restored'
											: 'Blower proof fault triggered',
									);
								}}
							/>
							<Toggle
								checked={rebootHold}
								label="Power reboot"
								onChange={() => {
									setRebootHold((value) => !value);
									addEvent(rebootHold ? 'AUTO resumed' : 'Outputs held off');
								}}
							/>
							<Toggle
								checked={alarmSilenced}
								label="Silence audible"
								onChange={() => {
									setAlarmSilenced((value) => !value);
									addEvent(
										alarmSilenced
											? 'Audible alarm enabled'
											: 'Audible alarm silenced',
									);
								}}
							/>
						</div>
					</div>

					<button className="reset-button" onClick={reset} type="button">
						Reset
					</button>
				</aside>

				<section className="plant-view" aria-label="Animated process view">
					<ProcessDiagram output={output} />
					<TankDisplay level={level} output={output} />
				</section>

				<aside className="status-panel" aria-label="Controller status">
					<div className="panel-section">
						<p className="panel-label">Outputs</p>
						<div className="status-grid">
							<Status label="Pump 1" active={output.pumpOne} />
							<Status label="Pump 2" active={output.pumpTwo} />
							<Status label="Valve" active={output.valve} />
							<Status label="Blower" active={output.blower} />
							<Status
								label="Audible"
								active={output.alarm && !alarmSilenced}
								warn={output.alarm}
							/>
							<Status label="Visual" active={output.alarm} warn={output.alarm} />
						</div>
					</div>

					<div className="panel-section">
						<p className="panel-label">Floats</p>
						<div className="float-list">
							<Status label="Low" active={output.floats.low} warn={output.floats.low} />
							<Status label="Call" active={output.floats.call} />
							<Status label="Lag" active={output.floats.lag} />
							<Status
								label="High"
								active={output.floats.high}
								warn={output.floats.high}
							/>
						</div>
					</div>

					<div className="panel-section event-section">
						<p className="panel-label">Event log</p>
						<ol className="event-log">
							{events.map((event, index) => (
								<li key={`${event}-${index}`}>{event}</li>
							))}
						</ol>
					</div>
				</aside>
			</section>
		</main>
	);
}

function Toggle({ checked, label, onChange }) {
	return (
		<button
			aria-pressed={checked}
			className={`toggle ${checked ? 'on' : ''}`}
			onClick={onChange}
			type="button"
		>
			<span className="toggle-track">
				<span />
			</span>
			{label}
		</button>
	);
}

function Status({ active, label, warn = false }) {
	return (
		<div className={`status ${active ? 'active' : ''} ${warn ? 'warn' : ''}`}>
			<span />
			{label}
		</div>
	);
}

function TankDisplay({ level, output }) {
	const waterHeight = 210 * (level / 100);
	const waterY = 246 - waterHeight;

	return (
		<div className={`tank-stage ${output.alarm ? 'alarm' : ''}`}>
			<div className="tank-readout">
				<span>{levelName(level)}</span>
				<strong>{Math.round(level)}%</strong>
			</div>
			<svg
				className="tank-svg"
				role="img"
				viewBox="0 0 320 310"
				aria-label="Effluent pump tank level"
			>
				<defs>
					<clipPath id="tank-clip">
						<path d="M75 42h170c20 0 36 16 36 36v170c0 18-15 33-33 33H72c-18 0-33-15-33-33V78c0-20 16-36 36-36Z" />
					</clipPath>
					<linearGradient id="water" x1="0" x2="0" y1="0" y2="1">
						<stop offset="0%" stopColor="#71d3cb" />
						<stop offset="100%" stopColor="#16766f" />
					</linearGradient>
				</defs>
				<path
					className="tank-glass"
					d="M75 42h170c20 0 36 16 36 36v170c0 18-15 33-33 33H72c-18 0-33-15-33-33V78c0-20 16-36 36-36Z"
				/>
				<g clipPath="url(#tank-clip)">
					<rect
						className="water-fill"
						height={waterHeight}
						width="320"
						x="0"
						y={waterY}
					/>
					<path
						className={output.flow ? 'wave moving' : 'wave'}
						d={`M0 ${waterY + 8} C 45 ${waterY - 7}, 85 ${waterY + 23}, 130 ${
							waterY + 8
						} S 220 ${waterY - 7}, 320 ${waterY + 8} V310 H0Z`}
					/>
				</g>
				<path
					className="tank-outline"
					d="M75 42h170c20 0 36 16 36 36v170c0 18-15 33-33 33H72c-18 0-33-15-33-33V78c0-20 16-36 36-36Z"
				/>
				<FloatMark active={output.floats.high} label="HIGH" y="74" />
				<FloatMark active={output.floats.lag} label="LAG" y="112" />
				<FloatMark active={output.floats.call} label="CALL" y="174" />
				<FloatMark active={output.floats.low} label="LOW" y="232" />
			</svg>
		</div>
	);
}

function FloatMark({ active, label, y }) {
	return (
		<g className={`float-mark ${active ? 'active' : ''}`}>
			<line x1="33" x2="286" y1={y} y2={y} />
			<circle cx="286" cy={y} r="7" />
			<text x="18" y={Number(y) + 4}>
				{label}
			</text>
		</g>
	);
}

function ProcessDiagram({ output }) {
	return (
		<div className="process-strip">
			<MiniStage label="ATU" active={output.blower} />
			<div className={`pipe ${output.flow ? 'flowing' : ''}`} />
			<MiniStage label="Pump tank" active />
			<div className={`pipe ${output.flow ? 'flowing' : ''}`} />
			<MiniStage label="Valve field" active={output.valve} />
		</div>
	);
}

function MiniStage({ active, label }) {
	return (
		<div className={`mini-stage ${active ? 'active' : ''}`}>
			<span />
			{label}
		</div>
	);
}

export default App;
