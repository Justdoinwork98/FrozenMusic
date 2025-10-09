// main.js
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const MidiParser = require('midi-parser-js');

function createWindow() {
	const win = new BrowserWindow({
		width: 1200,
		height: 800,
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			contextIsolation: true,
			nodeIntegration: false,
		},
	});

	// Load the React app (in dev mode or from build)
	if (process.env.NODE_ENV === 'development') {
		win.loadURL('http://localhost:5173'); // Vite dev server
	} else {
		win.loadFile(path.join(__dirname, 'frontend/dist/index.html'));
	}
}

app.whenReady().then(() => {
	createWindow();
	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle("openFileDialog", async (event, options) => {

	const dialogOptions = {
		properties: ["openFile"],
	};
	if (options && Array.isArray(options.filters)) {
		dialogOptions.filters = options.filters;
	}
	if (options && typeof options.title === "string") {
		dialogOptions.title = options.title;
	}

	console.log("Opening file dialog...");
	const { canceled, filePaths } = await dialog.showOpenDialog(dialogOptions);

	if (!canceled && filePaths.length > 0) {
		fs.readFile(filePaths[0], 'base64', (err, data) => {
			if (err) {
				console.error('Error reading MIDI file:', err);
				return;
			}

			// Parse the base64 string into a JavaScript object
			const midiData = MidiParser.parse(data);

			// Log the parsed MIDI data
			console.debug(midiData);

			let numberOfTracks = midiData.track.length;
			console.log(`Number of tracks: ${numberOfTracks}`);
			let tracks = midiData.track;
			tracks.forEach((track, index) => {
				console.log(`Track ${index + 1}:`);

				let absoluteTime = 0; // running total in ticks

				track.event.forEach(event => {
					absoluteTime += event.deltaTime; // accumulate time

					if (event.type === 8 || (event.type === 9 && event.data[1] === 0)) {
						console.log(`  [${absoluteTime}] Note Off - Note: ${event.data[0]}, Velocity: ${event.data[1]}`);
					} else if (event.type === 9) {
						console.log(`  [${absoluteTime}] Note On  - Note: ${event.data[0]}, Velocity: ${event.data[1]}`);
					} else if (event.type === 11) {
						console.log(`  [${absoluteTime}] Control Change - Controller: ${event.data[0]}, Value: ${event.data[1]}`);
					} else if (event.type === 12) {
						console.log(`  [${absoluteTime}] Program Change - Program: ${event.data[0]}`);
					} else if (event.type === 14) {
						const value = ((event.data[1] << 7) | event.data[0]) - 8192;
						console.log(`  [${absoluteTime}] Pitch Bend - Value: ${value}`);
					}
				});
			});

		});
	}

	return canceled ? null : filePaths[0];
});
