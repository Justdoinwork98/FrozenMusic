// main.js
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');


const { Mesh } = require('./modifier.js');
const { ModifierPipeline, Track } = require('./modifier_pipeline.js');
const { MidiDataManager } = require('./midi_data_manager.js');

const midiDataManager = new MidiDataManager();
midiDataManager.readMidiFile("C:/Git/FrozenMusic/midi.mid");

const modifierPipeline = new ModifierPipeline();

modifierPipeline.addTrack("Track 1");
modifierPipeline.addModifierToTrack("Track 1", "Translate");
modifierPipeline.setParameter("Track 1", 1, "x", "startTime");
modifierPipeline.setParameterFactor("Track 1", 1, "x", 0.002);
modifierPipeline.setParameter("Track 1", 1, "y", "noteNumber");
modifierPipeline.setParameterFactor("Track 1", 1, "y", 0.01);

let win;

function createWindow() {
	//process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

	win = new BrowserWindow({
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
		// Wait until Vite server is ready
		win.loadURL('http://localhost:5173');
		win.webContents.openDevTools(); // optional
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

ipcMain.handle("getAllPossibleModifiers", async (event, trackName) => {
	return Object.keys(modifierPipeline.availableModifiers);
});

ipcMain.handle("addModifier", async (event, options) => {
	const { trackName, modifierName } = options;

	console.log(`Adding modifier "${modifierName}" to track "${trackName}"`);

	if (!modifierPipeline.availableModifiers[modifierName]) {
		throw new Error(`Modifier type "${modifierName}" is not available`);
	}

	modifierPipeline.addModifierToTrack(trackName, modifierName);

	return modifierPipeline.tracks;
});

ipcMain.handle("modifierParameterChange", async (event, options) => {
	// Handle the parameter change logic here
	const { trackName, modifierId, parameterName, newValue } = options;
	console.log(`Changing parameter "${parameterName}" of modifier id ${modifierId} in track "${trackName}" to value:`, newValue);
	modifierPipeline.setParameter(trackName, modifierId, parameterName, newValue);
			
	let inputMesh = Mesh.cube();
	const outputModel = modifierPipeline.runModifierPipeline(inputMesh);
	// call onPreviewUpdate
    win.webContents.send('previewUpdate', outputModel);
	console.log("Parameter change handled.");

	return true;
});
ipcMain.handle("modifierParameterFactorChange", async (event, options) => {
	// Handle the parameter factor change logic here
	const { trackName, modifierId, parameterName, factor } = options;
	console.log(`Changing factor "${parameterName}" of modifier id ${modifierId} in track "${trackName}" to value:`, factor);
	modifierPipeline.setParameterFactor(trackName, modifierId, parameterName, factor);

	let inputMesh = Mesh.cube();
	const outputModel = modifierPipeline.runModifierPipeline(inputMesh);
	// call onPreviewUpdate
    win.webContents.send('previewUpdate', outputModel);
	console.log("Parameter change handled.");

	return true;
});

ipcMain.handle("bindParameterToMidiData", async (event, options) => {
	// Example options: { trackName: 'Track 1', modifierIndex: 0, parameterName: 'x', midiDataName: 'velocity' }
	const { trackName, modifierIndex, parameterName, midiDataName } = options;
	modifierPipeline.bindParameterToMidiData(trackName, modifierIndex, parameterName, midiDataName);
});

ipcMain.handle("getPreviewModel", async (event, options) => {
	let inputMesh = Mesh.cube();
	const outputModel = modifierPipeline.runModifierPipeline(inputMesh);
	return outputModel;
});

ipcMain.handle("getTracks", async (event, options) => {
	console.log("Getting tracks...");
	console.log(modifierPipeline.tracks);
	return modifierPipeline.tracks;
});

ipcMain.handle("getMidiData", async (event, options) => {
	console.log("Getting MIDI data...");
	return midiDataManager.getMidiData();
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
		midiDataManager.readMidiFile(filePaths[0]);
	}

	return canceled ? null : filePaths[0];
});
