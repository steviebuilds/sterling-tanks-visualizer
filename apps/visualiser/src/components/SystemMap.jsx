import { FLOAT_MARKERS, SIMULATOR_CONFIG } from '../simulator/simulatorModel';

export function SystemMap({ blowerFault, levels, onSelectTank, outputs, rebootHold, selectedTank }) {
	const atuToEffluentActive = outputs.blower && !rebootHold;
	const effluentDoseActive = outputs.valve;

	return (
		<section className="plant-view" aria-label="Animated process view">
			<div className="system-map">
				<PassiveStage className="stage-pretreatment" title="Pretreatment" kicker="Inlet" detail="Gravity flow" />
				<FlowPipe className="pipe-top-a" active />
				<TankStage
					className="stage-eq"
					id="eq"
					level={levels.eq}
					onSelect={() => onSelectTank('eq')}
					output={outputs.eq}
					selected={selectedTank === 'eq'}
					title="EQ / dosing"
					subtitle="Demand pump to ATU"
				/>
				<FlowPipe className="pipe-top-b" active={outputs.eq.flow} />
				<AtuStage className="stage-atu" active={outputs.blower} fault={blowerFault} />
				<TurnPipe active={atuToEffluentActive} />
				<TankStage
					className="stage-effluent"
					id="effluent"
					level={levels.effluent}
					onSelect={() => onSelectTank('effluent')}
					output={outputs.effluent}
					selected={selectedTank === 'effluent'}
					title="Effluent pump"
					subtitle="Timed dose to field"
				/>
				<FlowPipe className="pipe-bottom-a" active={effluentDoseActive} />
				<ChlorinatorStage className="stage-chlorinator" active={effluentDoseActive} />
				<FlowPipe className="pipe-bottom-b" active={effluentDoseActive} />
				<DisposalStage className="stage-disposal" active={effluentDoseActive} />
			</div>
		</section>
	);
}

function FlowPipe({ active, className }) {
	return (
		<div className={`flow-pipe ${className} ${active ? 'active' : ''}`} aria-hidden="true">
			<span />
		</div>
	);
}

function TurnPipe({ active }) {
	return (
		<svg className={`turn-pipe ${active ? 'active' : ''}`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
			<path d="M 84 0 V 50 H 16 V 100" />
		</svg>
	);
}

function TankStage({ className, id, level, onSelect, output, selected, subtitle, title }) {
	return (
		<button
			aria-pressed={selected}
			className={`system-stage tank-card ${className} ${selected ? 'selected' : ''}`}
			data-fault={output.alarm ? 'true' : 'false'}
			onClick={onSelect}
			type="button"
		>
			<div className="stage-copy">
				<div>
					<p className="stage-kicker">{id === 'eq' ? 'Tank 1' : 'Tank 2'}</p>
					<h2>{title}</h2>
					<p>{subtitle}</p>
				</div>
				<strong className="float-state">{getFloatStateLabel(output.floats)}</strong>
			</div>
			<TankSvg id={id} level={level} output={output} />
			<div className="pump-row">
				<Pump active={output.pumpOne} label="P1" />
				<Pump active={output.pumpTwo} label="P2" />
			</div>
		</button>
	);
}

function getFloatStateLabel(floats) {
	if (floats.high) return 'HIGH';
	if (floats.lag) return 'LAG';
	if (floats.call) return 'CALL';
	if (floats.low) return 'LOW';
	return 'NORMAL';
}

function TankSvg({ id, level, output }) {
	const waterHeight = SIMULATOR_CONFIG.tank.svgWaterTravel * (level / 100);
	const waterY = SIMULATOR_CONFIG.tank.svgWaterBottomY - waterHeight;
	const clipId = `tank-clip-${id}`;

	return (
		<svg className="tank-svg" viewBox="0 0 260 238" aria-hidden="true">
			<defs>
				<clipPath id={clipId}>
					<path d="M57 24h146c18 0 32 14 32 32v128c0 17-14 30-31 30H56c-17 0-31-13-31-30V56c0-18 14-32 32-32Z" />
				</clipPath>
				<linearGradient id={`water-${id}`} x1="0" x2="0" y1="0" y2="1">
					<stop offset="0%" stopColor="#75d8cf" />
					<stop offset="100%" stopColor="#16766f" />
				</linearGradient>
			</defs>
			<path
				className="tank-glass"
				d="M57 24h146c18 0 32 14 32 32v128c0 17-14 30-31 30H56c-17 0-31-13-31-30V56c0-18 14-32 32-32Z"
			/>
			<g clipPath={`url(#${clipId})`}>
				<rect className="water-fill" fill={`url(#water-${id})`} height={waterHeight} width="260" x="0" y={waterY} />
				<path
					className={output.flow ? 'wave moving' : 'wave'}
					d={`M0 ${waterY + 8} C 36 ${waterY - 6}, 72 ${waterY + 20}, 112 ${
						waterY + 8
					} S 188 ${waterY - 6}, 260 ${waterY + 8} V238 H0Z`}
				/>
			</g>
			<path
				className="tank-outline"
				d="M57 24h146c18 0 32 14 32 32v128c0 17-14 30-31 30H56c-17 0-31-13-31-30V56c0-18 14-32 32-32Z"
			/>
			{FLOAT_MARKERS.map((marker) => (
				<FloatMark
					active={output.floats[marker.id]}
					key={marker.id}
					label={marker.label}
					y={marker.y}
				/>
			))}
		</svg>
	);
}

function FloatMark({ active, label, y }) {
	return (
		<g className={`float-mark ${active ? 'active' : ''}`}>
			<line x1="25" x2="235" y1={y} y2={y} />
			<circle cx="235" cy={y} r="6" />
			<text x="12" y={Number(y) + 4}>
				{label}
			</text>
		</g>
	);
}

function Pump({ active, label }) {
	return <div className={`pump ${active ? 'active' : ''}`}>{label}</div>;
}

function PassiveStage({ className, detail, kicker, title }) {
	return (
		<article className={`system-stage passive-card ${className}`}>
			<div className="stage-copy">
				<div>
					<p className="stage-kicker">{kicker}</p>
					<h2>{title}</h2>
					<p>{detail}</p>
				</div>
			</div>
			<PretreatmentGraphic />
		</article>
	);
}

function PretreatmentGraphic() {
	return (
		<svg className="process-graphic pretreatment-graphic" viewBox="0 0 260 150" aria-hidden="true">
			<path className="process-pipe muted" d="M5 58H44" />
			<path className="process-pipe muted" d="M216 58H255" />
			<rect className="process-vessel" x="44" y="28" width="172" height="94" rx="28" />
			<path className="process-liquid muted-liquid" d="M61 70H199V105H61Z" />
			<path className="process-layer scum" d="M66 62C92 55 110 68 132 62S171 55 195 63" />
			<path className="process-layer sludge" d="M70 106H190" />
			<path className="process-baffle" d="M91 41V96" />
			<path className="process-baffle" d="M169 41V96" />
			<circle className="process-node" cx="44" cy="58" r="5" />
			<circle className="process-node" cx="216" cy="58" r="5" />
		</svg>
	);
}

function AtuStage({ active, className, fault }) {
	return (
		<article className={`system-stage atu-card ${className} ${active ? 'active' : ''} ${fault ? 'fault' : ''}`}>
			<div className="stage-copy">
				<div>
					<p className="stage-kicker">Treatment</p>
					<h2>ATU</h2>
					<p>Blowers run in AUTO</p>
				</div>
			</div>
			<div className="blower-stack">
				{Array.from({ length: 6 }, (_, index) => (
					<span key={index} />
				))}
			</div>
		</article>
	);
}

function ChlorinatorStage({ active, className }) {
	return (
		<article className={`system-stage chlorinator-card ${className} ${active ? 'active' : ''}`}>
			<div className="stage-copy">
				<div>
					<p className="stage-kicker">Treatment</p>
					<h2>Chlorinator</h2>
					<p>Inline before field</p>
				</div>
			</div>
			<ChlorinatorGraphic active={active} />
		</article>
	);
}

function ChlorinatorGraphic({ active }) {
	return (
		<svg className={`process-graphic chlorinator-graphic ${active ? 'active' : ''}`} viewBox="0 0 260 150" aria-hidden="true">
			<path className="process-pipe" d="M4 76H77" />
			<path className="process-pipe" d="M183 76H256" />
			<rect className="process-vessel chlorinator-body" x="76" y="37" width="108" height="78" rx="25" />
			<path className="chlorinator-water" d="M88 76H172" />
			{[0, 1, 2].map((index) => (
				<circle className="chlorine-tablet" cx={110 + index * 20} cy="74" key={index} r="9" />
			))}
			<path className="process-layer chlorinator-cap" d="M99 37V24H162V37" />
		</svg>
	);
}

function DisposalStage({ active, className }) {
	return (
		<article className={`system-stage disposal-card ${className} ${active ? 'active' : ''}`}>
			<div className="stage-copy">
				<div>
					<p className="stage-kicker">Field</p>
					<h2>Disposal</h2>
					<p>One zone per dose</p>
				</div>
			</div>
			<DisposalGraphic active={active} />
		</article>
	);
}

function DisposalGraphic({ active }) {
	return (
		<svg className={`process-graphic disposal-graphic ${active ? 'active' : ''}`} viewBox="0 0 260 150" aria-hidden="true">
			<path className="process-pipe" d="M6 74H55" />
			<path className="field-manifold" d="M58 44V116" />
			{[0, 1, 2, 3].map((index) => {
				const y = 46 + index * 22;
				return (
					<g key={y}>
						<path className="field-lateral" d={`M58 ${y}H232`} />
						<path className="field-perf" d={`M86 ${y + 7}H206`} />
					</g>
				);
			})}
			<circle className="process-node" cx="58" cy="74" r="6" />
		</svg>
	);
}
