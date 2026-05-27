import { Status } from './Status';

export function StatusPanel({
	coreState,
	events,
	outputs,
	selectedOutput,
}) {
	const statusCopy = coreState.ready ? 'Core logic active' : 'Fallback logic active';

	return (
		<aside className="status-panel" aria-label="Controller status">
			<div className={`core-banner ${coreState.ready ? 'ready' : 'missing'}`}>
				<span />
				<div>
					<strong>{statusCopy}</strong>
					{coreState.error ? <p>{coreState.error}</p> : <p>Outputs are calculated from the firmware Core.</p>}
				</div>
			</div>

			<div className="panel-section">
				<p className="panel-label">Outputs</p>
				<div className="status-grid">
					<Status label="EQ pump 1" active={outputs.eq.pumpOne} />
					<Status label="EQ pump 2" active={outputs.eq.pumpTwo} />
					<Status label="Eff pump 1" active={outputs.effluent.pumpOne} />
					<Status label="Eff pump 2" active={outputs.effluent.pumpTwo} />
					<Status label="Blower" active={outputs.blower} />
					<Status label="Valve" active={outputs.valve} />
					<Status label="Audible" active={outputs.audibleAlarm} warn={outputs.alarm} />
					<Status label="Visual" active={outputs.visualAlarm} warn={outputs.alarm} />
				</div>
			</div>

			<div className="panel-section">
				<p className="panel-label">Selected floats</p>
				<div className="float-list">
					<Status label="Low" active={selectedOutput.floats.low} warn={selectedOutput.floats.low} />
					<Status label="Call" active={selectedOutput.floats.call} />
					<Status label="Lag" active={selectedOutput.floats.lag} />
					<Status label="High" active={selectedOutput.floats.high} warn={selectedOutput.floats.high} />
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
	);
}
