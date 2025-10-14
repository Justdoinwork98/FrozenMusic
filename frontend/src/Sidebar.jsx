import { useState, useEffect } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import Track from "./Track";
import "./Sidebar.css";

function Sidebar() {
	const [filePath, setFilePath] = useState(null);

	const [tracks, setTracks] = useState(null);

	const openFile = async () => {
		const path = await window.electronAPI.openFileDialog({
			title: "Select a MIDI file",
			filters: [{ name: "MIDI Files", extensions: ["mid", "midi"] }],
		});
		setFilePath(path);
	};

	// Subscribe to backend updates
	useEffect(() => {
		window.electronAPI.onTrackUpdate(setTracks);
	}, []);

	// Initially load tracks from backend
	useEffect(() => {
		(async () => {
			const initialTracks = await window.electronAPI.getTracks();
			setTracks(initialTracks);
			console.log("Initial tracks loaded:", initialTracks);
		})();
	}, []);

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

			<h3>Tracks</h3>
			{tracks && Array.from(tracks.values()).map((track) => (
			<Track key={track.name} track={track} onUpdateTrack={setTracks} />
			))}

		</div>
	);
}

export default Sidebar;
