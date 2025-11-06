import { useState, useEffect } from 'react'
import './App.css';
import ModelPreview from './ModelPreview.jsx';
import Timeline from './Timeline.jsx';
import NetworkView from './NetworkView.jsx';
import Sidebar from './Sidebar.jsx';
import Toolbar from "./Toolbar";

function App() {
	return (
		<div className="app-grid">
			<title>Frozen Music</title>
			<Toolbar />
			<Sidebar className="sidebar" />
			<ModelPreview className="preview" />
            <NetworkView className="networkview" />

		</div>
	);
}

export default App;