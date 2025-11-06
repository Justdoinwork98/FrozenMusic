import { useState, useEffect } from 'react';
import './Timeline.css'

function Timeline() {
	let [midiData, setMidiData] = useState(null);

	// Initially load midi data from backend
	useEffect(() => {
		(async () => {
			const initialMidiData = await window.electronAPI.getMidiData();
			setMidiData(initialMidiData);
		})();
	}, []);

	// Subscribe to MIDI data updates from backend
	useEffect(() => {
		window.electronAPI.onMidiDataUpdate(setMidiData);
	});

	return (
		<>
			<div className="timeline">
				{console.log("Rendering midiData:", midiData)}
			{ midiData && midiData.track.map((track) => {
				let minNote = 127;
				let maxNote = 0;
				track.notes.forEach((note) => {
					if (note.note < minNote) {
						minNote = note.note;
					}
					if (note.note > maxNote) {
						maxNote = note.note;
					}
				});
				return ( <div className="track" key={track.name}>
					<h4>{track.name}</h4>
					{/* Render track data here */}
					<div className="notes">
						{
							track.notes.map((note, index) => {
								let noteHeight = (note.note - minNote) * 10;
								return (<div className="note" key={index} style={{
									transform: `translate(${note.startTime / 10}px, ${noteHeight}px)`,
									width: `${note.duration / 10}px`,
								}}> </div>);
							})
						}
					</div>
				</div>
				)
			})}
			</div>
		</>
	)
}

export default Timeline
