import { useState, useEffect, use, useRef } from 'react'
import './App.css';
import ModelPreview from './ModelPreview.jsx';
import Timeline from './Timeline.jsx';
import NetworkView from './NetworkView.jsx';
import Toolbar from "./Toolbar";
import { ReactFlowProvider } from "reactflow";

function App() {
	const [dividerY, setDividerY] = useState(50); // takes 50% from top as done before via grid-template-rows
	const isDragging = useRef(false);

	const handleMouseDown = () => {
		isDragging.current = true;
	};

	const handleMouseUp = () => {
		isDragging.current = false;
	};

	const handleMouseMove = (e) => {
		if (!isDragging.current) return;
		const newDividerY = (e.clientY / window.innerHeight) * 100;
		setDividerY(Math.min(90, Math.max(10, newDividerY))); // ensures divider cannot cover a full view and stays within 10%-90%
	};

	window.addEventListener('mousemove', handleMouseMove);
	window.addEventListener('mouseup', handleMouseUp);

	return (
		<div className="app-grid" onMouseUp={handleMouseUp}>
			<title>Frozen Music</title>
			<Toolbar />
			<div className="main-content">
				<div style={{ flexBasis: `${dividerY}%`, flexGrow: 0, flexShrink: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
					<ReactFlowProvider>
						<NetworkView className="networkview" />
					</ReactFlowProvider>
				</div>
				<div className="divider" onMouseDown={handleMouseDown}></div>
				<div style={{ flexBasis: `${100 - dividerY}%`, flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
					<ModelPreview className="preview" />
				</div>
			</div>
		</div>
	);
}

export default App;