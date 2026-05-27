export function Toggle({ checked, label, onChange }) {
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
