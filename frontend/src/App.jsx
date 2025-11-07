import { useState, useEffect } from 'react'
import './App.css';
import ModelPreview from './ModelPreview.jsx';
import Timeline from './Timeline.jsx';
import NetworkView from './NetworkView.jsx';
import Toolbar from "./Toolbar";
import { ReactFlowProvider } from "reactflow";

function App() {
	return (
		<div className="app-grid">
			<title>Frozen Music</title>
			<Toolbar />
			<ModelPreview className="preview" />
			<ReactFlowProvider>
            <NetworkView className="networkview" />
			</ReactFlowProvider>
		</div>
	);
}

export default App;