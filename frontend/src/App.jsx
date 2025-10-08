import { useState, useEffect } from 'react'
import './App.css'
import ModelPreview from './ModelPreview.jsx'
import Timeline from './timeline.jsx'
import Sidebar from './Sidebar.jsx'

function App() {

	return (
	<>
	<div className="app-grid">
		<ModelPreview />
		<Sidebar />
		<Timeline />
	</div>
	</>
	)
}

export default App
