// main.js
const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const fs = require('fs');
const path = require('path');


const { Mesh } = require('./nodes/modifier.js');
const { ModifierPipeline, Track } = require('./modifier_pipeline.js');
const { MidiDataManager } = require('./midi_data_manager.js');

const midiDataManager = new MidiDataManager();
midiDataManager.readMidiFile("C:/Git/FrozenMusic/midi.mid");

const modifierPipeline = new ModifierPipeline();

let openedProjectPath = null;

let win;

function save(filePath, saveData) {
	const pipelineData = modifierPipeline.toJSON();

	console.log("saveData", saveData);

	const data = {
		pipeline: pipelineData,
		...saveData,
	};
	// Save data to file
	fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
	openedProjectPath = filePath;
}

function load(filePath) {
	if (fs.existsSync(filePath)) {
		const data = JSON.parse(fs.readFileSync(filePath));
		modifierPipeline.fromJSON(data.pipeline);

		// Update the frontend with loaded tracks
		win.webContents.send('trackUpdate', modifierPipeline.tracks);
		openedProjectPath = filePath;

		// If there is camera data, send it to the frontend
		if (data.camera) {
			win.webContents.send('cameraStateUpdate', data.camera);
		}

		runPipelineAndUpdatePreview();
	}
}

function runPipeline() {
	let inputMesh = Mesh.cube();
	const outputModel = modifierPipeline.runModifierPipeline(inputMesh);
	return outputModel;
}

function runPipelineAndUpdatePreview() {
	let outputModel = runPipeline();
	// call onPreviewUpdate
    win.webContents.send('previewUpdate', outputModel);
}

function createWindow() {
	//process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

	win = new BrowserWindow({
		width: 1200,
		height: 800,
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			contextIsolation: true,
			nodeIntegration: false,
			autoHideMenuBar: true,
			// Remove the default window around our app: TODO doesnt work
			//frame: false,
		},
	});

	Menu.setApplicationMenu(null);

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
	//save();
	load();
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle("getAllPossibleModifiers", async (event, trackName) => {
	return Object.keys(modifierPipeline.availableModifiers);
});

ipcMain.handle("addModifier", async (event, options) => {
	const { trackName, modifierName } = options;

	if (!modifierPipeline.availableModifiers[modifierName]) {
		throw new Error(`Modifier type "${modifierName}" is not available`);
	}

	modifierPipeline.addModifierToTrack(trackName, modifierName);

	runPipelineAndUpdatePreview();

	return modifierPipeline.tracks;
});

ipcMain.handle("modifierParameterChange", async (event, options) => {
	// Handle the parameter change logic here
	const { trackName, modifierId, parameterName, newValue } = options;
	modifierPipeline.setParameter(trackName, modifierId, parameterName, newValue);
	
	runPipelineAndUpdatePreview();

	return true;
});
ipcMain.handle("modifierParameterFactorChange", async (event, options) => {
	// Handle the parameter factor change logic here
	const { trackName, modifierId, parameterName, factor } = options;
	modifierPipeline.setParameterFactor(trackName, modifierId, parameterName, factor);

	runPipelineAndUpdatePreview();

	return true;
});

ipcMain.handle("bindParameterToMidiData", async (event, options) => {
	// Example options: { trackName: 'Track 1', modifierIndex: 0, parameterName: 'x', midiDataName: 'velocity' }
	const { trackName, modifierIndex, parameterName, midiDataName } = options;
	modifierPipeline.bindParameterToMidiData(trackName, modifierIndex, parameterName, midiDataName);
});

ipcMain.handle("getPreviewModel", async (event, options) => {
	let outputModel = runPipeline();
	return outputModel;
});

ipcMain.handle("getTracks", async (event, options) => {
	return modifierPipeline.tracks;
});

ipcMain.handle("getMidiData", async (event, options) => {
	return midiDataManager.getMidiData();
});

ipcMain.handle("reorderModifier", async (event, options) => {
	const { trackName, previousIndex, newIndex } = options;
	modifierPipeline.reorderModifier(trackName, previousIndex, newIndex);
	runPipelineAndUpdatePreview();
	return modifierPipeline.tracks;
});

ipcMain.handle("saveProject", async (event, options) => {
	const saveData = options;

	// If no project is opened yet, prompt for "Save As"
	if (!openedProjectPath) {
		const { canceled, filePath } = await dialog.showSaveDialog({
			filters: [{ name: "JSON Files", extensions: ["json"] }],
		});
		if (canceled || !filePath) {
			return;
		}
		openedProjectPath = filePath;
	}

	save(openedProjectPath, saveData);
});

ipcMain.handle("saveProjectAs", async (event, options) => {
	const saveData = options;

	const { canceled, filePath } = await dialog.showSaveDialog({
		filters: [{ name: "JSON Files", extensions: ["json"] }],
	});

	if (!canceled && filePath) {
		save(filePath, saveData);
	}

	const projectName = path.basename(filePath);

	return canceled ? null : projectName;
});

ipcMain.handle("openProject", async (event, options) => {
	const { canceled, filePaths } = await dialog.showOpenDialog({
		properties: ["openFile"],
		filters: [{ name: "JSON Files", extensions: ["json"] }],
	});

	if (!canceled && filePaths.length > 0) {
		load(filePaths[0]);
	}

	const projectName = path.basename(filePaths[0]);

	return canceled ? null : projectName;
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

	const { canceled, filePaths } = await dialog.showOpenDialog(dialogOptions);

	if (!canceled && filePaths.length > 0) {
		midiDataManager.readMidiFile(filePaths[0]);
	}

	return canceled ? null : filePaths[0];
});
