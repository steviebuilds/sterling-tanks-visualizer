export function Status({ active, label, warn = false }) {
	return (
		<div className={`status ${active ? 'active' : ''} ${warn ? 'warn' : ''}`}>
			<span />
			{label}
		</div>
	);
}
