import { useEffect, useState } from "react";
import './Sidebar.css'

function Sidebar() {
	const [filePath, setFilePath] = useState(null);

	const openFile = async () => {
		const path = await window.electronAPI.openFileDialog({
			title: "Select a MIDI file",
			filters: [
				{ name: 'MIDI Files', extensions: ['mid', 'midi'] },
			],
		});
		setFilePath(path);
	};

	useEffect(() => {
		if (filePath) {
			console.log(`Loaded MIDI file: ${filePath}`);
		}
	}, [filePath]);

	return (
		<div className="sidebar">
			<h2>Sidebar</h2>
			<button onClick={openFile} className="upload-btn">
				🎵 Upload MIDI File
			</button>

			{filePath && (
				<div className="file-info">
					<p><strong>Loaded file:</strong></p>
					<p className="file-path">{filePath}</p>
				</div>
			)}
		</div>
	);
}

export default Sidebar;