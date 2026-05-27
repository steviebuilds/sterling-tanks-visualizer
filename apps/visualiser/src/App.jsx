import { useState } from 'react';
import './App.css';
import { FlowChart } from './components/FlowChart';
import { SimulatorView } from './components/SimulatorView';

function App() {
	const [activeTab, setActiveTab] = useState('simulator');

	return (
		<main className="sim-shell">
			<header className="sim-header">
				<div>
					<p className="eyebrow">Hidden Arbor controller</p>
					<h1>System logic simulator</h1>
				</div>
				<nav className="view-tabs" aria-label="View">
					<button
						className={activeTab === 'simulator' ? 'active' : ''}
						onClick={() => setActiveTab('simulator')}
						type="button"
					>
						Simulator
					</button>
					<button
						className={activeTab === 'flow' ? 'active' : ''}
						onClick={() => setActiveTab('flow')}
						type="button"
					>
						Flow chart
					</button>
				</nav>
			</header>

			{activeTab === 'flow' ? <FlowChart /> : <SimulatorView />}
		</main>
	);
}

export default App;
