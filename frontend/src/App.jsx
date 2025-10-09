import { useState, useEffect } from 'react'
import './App.css';
import ModelPreview from './ModelPreview.jsx';
import Timeline from './Timeline.jsx';
import Sidebar from './Sidebar.jsx';

function App() {
	return (
		<div className="app-grid">
			<Sidebar className="sidebar" />
			<ModelPreview className="preview" />
			<Timeline className="timeline" />
		</div>
	);
}

export default App;