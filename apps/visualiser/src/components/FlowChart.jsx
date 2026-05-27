import {
	CLARIFYING_QUESTIONS,
	getIoLabel,
	PINOUT_GROUPS,
	RULES,
	STAGES,
} from '../data/flowData';

export function FlowChart() {
	return (
		<section className="legacy-flow" aria-label="Flow chart">
			<StageSection />
			<LogicSection />
			<PinoutSection />
			<QuestionsSection />
		</section>
	);
}

function StageSection() {
	return (
		<section className="legacy-section">
			<div className="legacy-section-head">
				<span className="legacy-eyebrow">Control logic by stage</span>
			</div>
			<div className="legacy-stage-grid">
				{STAGES.map((stage, index) => (
					<div className="legacy-stage-sequence-item" key={stage.id}>
						<StageCard stage={stage} />
						{index < STAGES.length - 1 ? (
							<div className="legacy-stage-sequence-arrow" aria-hidden="true">
								<div className="legacy-stage-sequence-line" />
								<span>{stage.transfer}</span>
								<div className="legacy-stage-sequence-glyph">↓</div>
							</div>
						) : null}
					</div>
				))}
			</div>
		</section>
	);
}

function StageCard({ stage }) {
	return (
		<article className="legacy-stage-card">
			<div className="legacy-stage-card-head">
				<div className="legacy-stage-card-title-row">
					<h3>{stage.title}</h3>
					{stage.countChip ? <span className="count-chip">{stage.countChip}</span> : null}
				</div>
				<p>{stage.summary}</p>
			</div>

			<div className="legacy-stage-card-body">
				<StageDiagram kind={stage.kind} />
				<div className="legacy-stage-card-copy">
					<IoBlock title="Inputs" items={stage.inputs} />
					<IoBlock title="Outputs" items={stage.outputs} />
					{stage.pressures?.length ? <IoBlock title="Pressures" items={stage.pressures} /> : null}
					<div className="legacy-copy-block">
						<span className="legacy-label">How it works</span>
						<ul className="legacy-bullet-list">
							{stage.bullets.map((bullet) => (
								<li key={bullet}>{bullet}</li>
							))}
						</ul>
					</div>
				</div>
			</div>
		</article>
	);
}

function IoBlock({ items, title }) {
	return (
		<div className="legacy-copy-block">
			<span className="legacy-label">{title}</span>
			<TagList items={items} />
		</div>
	);
}

function TagList({ items }) {
	if (!items?.length) return <span className="muted-copy">None shown in current pin list.</span>;
	return (
		<div className="tag-list">
			{items.map((item) => (
				<CodeTag code={item} key={item} />
			))}
		</div>
	);
}

function CodeTag({ code }) {
	return (
		<span className="code-tag">
			{code}
			<span className="code-tag-detail">({getIoLabel(code)})</span>
		</span>
	);
}

function LogicSection() {
	return (
		<section className="legacy-section">
			<div className="legacy-section-head">
				<span className="legacy-eyebrow">Simple if / then logic</span>
			</div>
			<div className="legacy-logic-table">
				<div className="legacy-logic-row legacy-logic-head">
					<div>Stage</div>
					<div>If this happens</div>
					<div>Then do this</div>
				</div>
				{RULES.map((rule) => (
					<div className="legacy-logic-row" key={`${rule.stage}-${rule.when}`}>
						<div>{rule.stage}</div>
						<div>{rule.when}</div>
						<div>{rule.then}</div>
					</div>
				))}
			</div>
		</section>
	);
}

function QuestionsSection() {
	return (
		<section className="legacy-section">
			<div className="legacy-section-head">
				<span className="legacy-eyebrow">Clarifying questions</span>
			</div>
			<div className="legacy-question-stack">
				{CLARIFYING_QUESTIONS.map((question) => (
					<article className="legacy-question-card" key={question.id}>
						<div className="legacy-question-head">
							<span className="legacy-question-number">{question.id}</span>
							<div className="legacy-question-copy">
								<p>{question.prompt}</p>
								{question.note ? <span className="legacy-question-note">{question.note}</span> : null}
							</div>
						</div>
					</article>
				))}
			</div>
		</section>
	);
}

function PinoutSection() {
	return (
		<section className="legacy-section">
			<div className="legacy-section-head">
				<span className="legacy-eyebrow">Pinout table</span>
			</div>
			<div className="legacy-pinout-stack">
				{PINOUT_GROUPS.map((group) => (
					<PinoutTable group={group} key={group.type} />
				))}
			</div>
		</section>
	);
}

function PinoutTable({ group }) {
	return (
		<div className="legacy-pinout-block">
			<div className="legacy-pinout-group-head">
				<span className="legacy-eyebrow">{group.type}</span>
			</div>
			<div className="legacy-pinout-scroll">
				<table className="legacy-pinout-table">
					<thead>
						<tr>
							<th>ID</th>
							<th>Description</th>
							<th>Slot</th>
							<th>Channel</th>
							<th>Board</th>
							<th>Address</th>
						</tr>
					</thead>
					<tbody>
						{group.rows.map(([id, description, slot, channel, board, address], index) => (
							<tr key={`${group.type}-${id}-${slot}-${channel}-${index}`}>
								<td>
									<span className="legacy-pinout-id">{id}</span>
								</td>
								<td>{description}</td>
								<td>{slot}</td>
								<td>{channel}</td>
								<td>{board}</td>
								<td>{address}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

function StageDiagram({ kind }) {
	if (kind === 'atu') return <AtuDiagram />;
	if (kind === 'chlorinator') return <ChlorinatorDiagram />;
	if (kind === 'disposal') return <DisposalDiagram />;
	return <TankDiagram active={kind === 'pump-tank-1' || kind === 'pump-tank-2'} />;
}

function TankDiagram({ active }) {
	return (
		<svg className="diagram-svg" viewBox="0 0 220 150" role="img" aria-label="tank diagram">
			<rect className="tank-shape" x="24" y="18" width="82" height="112" rx="28" />
			<rect className="tank-liquid" x="38" y="82" width="54" height="34" rx="15" />
			<line className="diagram-line" x1="106" x2="148" y1="50" y2="50" />
			<line className="diagram-line" x1="106" x2="148" y1="92" y2="92" />
			<circle className="diagram-node" cx="106" cy="50" r="5" />
			<circle className={active ? 'diagram-node active' : 'diagram-node'} cx="106" cy="92" r="5" />
			<text className="diagram-label" x="158" y="55">Inlet</text>
			<text className="diagram-label" x="158" y="97">{active ? 'Pump' : 'Outlet'}</text>
		</svg>
	);
}

function AtuDiagram() {
	return (
		<svg className="diagram-svg" viewBox="0 0 220 150" role="img" aria-label="ATU diagram">
			<rect className="atu-box" x="24" y="34" width="96" height="76" rx="20" />
			<circle className="blower-ring" cx="60" cy="72" r="17" />
			<circle className="blower-ring" cx="88" cy="72" r="17" />
			<line className="diagram-line" x1="120" x2="158" y1="62" y2="62" />
			<line className="diagram-line" x1="120" x2="158" y1="84" y2="84" />
			<text className="diagram-label" x="166" y="66">Blowers</text>
			<text className="diagram-label muted" x="166" y="88">Proof</text>
		</svg>
	);
}

function ChlorinatorDiagram() {
	return (
		<svg className="diagram-svg" viewBox="0 0 220 150" role="img" aria-label="chlorinator diagram">
			<line className="diagram-line thick" x1="24" x2="70" y1="75" y2="75" />
			<rect className="chlorinator-box" x="70" y="54" width="86" height="42" rx="20" />
			<line className="diagram-line thick" x1="156" x2="198" y1="75" y2="75" />
			<text className="diagram-label" x="78" y="80">Cl</text>
		</svg>
	);
}

function DisposalDiagram() {
	return (
		<svg className="diagram-svg" viewBox="0 0 220 150" role="img" aria-label="disposal field diagram">
			<line className="diagram-line thick" x1="24" x2="80" y1="75" y2="75" />
			{[0, 1, 2, 3].map((index) => (
				<line
					className="field-line"
					key={index}
					x1="82"
					x2="190"
					y1={48 + index * 18}
					y2={48 + index * 18}
				/>
			))}
		</svg>
	);
}
