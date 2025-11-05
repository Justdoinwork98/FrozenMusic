const fs = require('fs');
const MidiParser = require('midi-parser-js');

class MidiDataManager {
	constructor() {
		this.midiData = null;
	}

	setMidiData(midiData) {
		this.midiData = midiData;
	}

	getMidiData() {
		return this.midiData;
	}

	hasMidiData() {
		return this.midiData !== null;
	}

	readMidiFile(filePath) {
		fs.readFile(filePath, 'base64', (err, data) => {
			if (err) {
				console.error('Error reading MIDI file:', err);
				return;
			}

			// Parse the base64 string into a JavaScript object
			const midiData = MidiParser.parse(data);

			let parsedData = {
				track: [],
			};

			// Process each track in the MIDI data
			midiData.track.forEach((track, trackIndex) => {
				let processedTrack = {
					name: `Track ${trackIndex + 1}`,
					notes: [],
				};
				let absoluteTime = 0; // running total in ticks
				const activeNotes = new Map(); // note -> { startTime, velocity }

				track.event.forEach((event) => {
					absoluteTime += event.deltaTime;
					// NOTE OFF
					if (event.type === 8 || (event.type === 9 && event.data[1] === 0)) {
						const note = event.data[0];

						// Find the corresponding NOTE ON event
						if (activeNotes.has(note)) {
							const { startTime, velocity } = activeNotes.get(note);
							const duration = absoluteTime - startTime;
							processedTrack.notes.push({
								note,
								startTime,
								duration,
								velocity
							});
							activeNotes.delete(note);
						}
					}
					// NOTE ON
					else if (event.type === 9) {
						const note = event.data[0];
						const velocity = event.data[1];
						activeNotes.set(note, { startTime: absoluteTime, velocity });
					}
				});
				parsedData.track.push(processedTrack);
			});

			this.setMidiData(parsedData);

			// Log the parsed MIDI data
			console.debug(parsedData);
		});
	}
}

module.exports = { MidiDataManager };