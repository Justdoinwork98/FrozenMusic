// main.js
const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const fs = require('fs');
const path = require('path');
const { Pipeline } = require('./pipeline.js');

const pipeline = new Pipeline();

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
			//autoHideMenuBar: true,
			// Remove the default window around our app: TODO doesnt work
			//frame: false,
		},
	});

	pipeline.windowReference = win;

	Menu.setApplicationMenu(null);

	// Load the React app (in dev mode or from build)
	if (process.env.NODE_ENV === 'development') {
		// Wait until Vite server is ready
		win.loadURL('http://localhost:5173');
		win.webContents.openDevTools(); // optional
	} else {
		win.loadFile(path.join(__dirname, '../frontend/dist/index.html'));
	}

}

app.whenReady().then(() => {
	createWindow();
	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
	//pipeline.load("project1.json");
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});

ipcMain.on("requestPossibleNodes", async (event) => {
	pipeline.sendPossibleNodesToFrontend();
	return true;
});

ipcMain.on("requestPreviewModel", async (event) => {
	pipeline.runPipelineAndUpdatePreview();
	return true;
});

ipcMain.on("saveProject", async (event, options) => {
	const saveData = options;

	// If no project is opened yet, prompt for "Save As"
	if (pipeline.openedProjectPath == null) {
		const { canceled, filePath } = await dialog.showSaveDialog({
			filters: [{ name: "JSON Files", extensions: ["json"] }],
		});
		if (canceled || !filePath) {
			return;
		}
		pipeline.openedProjectPath = filePath;
	}

	pipeline.save(pipeline.openedProjectPath, saveData);
});

ipcMain.on("saveProjectAs", async (event, options) => {
	const saveData = options;

	const { canceled, filePath } = await dialog.showSaveDialog({
		filters: [{ name: "JSON Files", extensions: ["json"] }],
	});

	if (!canceled && filePath) {
		pipeline.save(filePath, saveData);
	}

	const projectName = path.basename(filePath);

	return canceled ? null : projectName;
});

ipcMain.on("openProject", async (event, options) => {
	const { canceled, filePaths } = await dialog.showOpenDialog({
		properties: ["openFile"],
		filters: [{ name: "JSON Files", extensions: ["json"] }],
	});

	if (!canceled && filePaths.length > 0) {
		pipeline.load(filePaths[0]);
	}

	const projectName = path.basename(filePaths[0]);

	return canceled ? null : projectName;
});

// Node network actions
ipcMain.on("createNode", async (event, options) => {
	const { x, y, nodeType } = options;
	pipeline.createNodeInActiveNetwork(nodeType, x, y);
	pipeline.runPipelineAndUpdatePreview();
	return true;
});

ipcMain.on("deleteNode", async (event, nodeId) => {
	pipeline.deleteNodeFromActiveNetwork(nodeId);
	pipeline.runPipelineAndUpdatePreview();
	return true;
});

ipcMain.on("moveNode", async (event, options) => {
	const { nodeId, x, y } = options;
	pipeline.moveNodeInActiveNetwork(nodeId, x, y);
	return true;
});

ipcMain.on("addConnection", async (event, options) => {
	const { fromNodeId, outputIndex, toNodeId, inputIndex } = options;

	const network = pipeline.getActiveNetwork();
	network.addConnection(fromNodeId, outputIndex, toNodeId, inputIndex);

	pipeline.sendNetworkToFrontend();
	pipeline.runPipelineAndUpdatePreview();

	return true;
});

ipcMain.on("removeConnection", async (event, options) => {
	const { fromNodeId, outputIndex, toNodeId, inputIndex } = options;

	const network = pipeline.getActiveNetwork();
	network.removeConnection(fromNodeId, outputIndex, toNodeId, inputIndex);

	pipeline.sendNetworkToFrontend();
	pipeline.runPipelineAndUpdatePreview();

	return true;
});

ipcMain.on("setActiveNetwork", async (event, networkId) => {
	pipeline.activateNetwork(networkId);
	return true;
});

ipcMain.on("requestNodeNetwork", async (event) => {
	pipeline.sendNetworkToFrontend();
	return true;
});

ipcMain.on("requestProjectName", async (event) => {
	pipeline.sendProjectNameToFrontend();
	return true;
});

ipcMain.on("updateNodeInputDefault", async (event, options) => {
	const { nodeId, inputIndex, value } = options;

	pipeline.updateNodeInputDefaultInActiveNetwork(nodeId, inputIndex, value);

	return true;
});

ipcMain.handle("openMidiFile", async (event, options) => {

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
		pipeline.openMidiFile(filePaths[0]);
	}

	return canceled ? null : filePaths[0];
});
