import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
	const [filePath, setFilePath] = useState(null);

	const openFile = async () => {
		const path = await window.electronAPI.openFileDialog({
			title: "Select a file",
			filters: [
				{ name: 'Midi Files', extensions: ['mid'] },
			]
		});
		setFilePath(path);
	};

	return (
	<>
	<button onClick={openFile}>Open File</button>
	{filePath && <p>Selected file: {filePath}</p>}
	</>
	)
}

export default App
