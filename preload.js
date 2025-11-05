const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
	onTrackUpdate: (callback) => ipcRenderer.on('trackUpdate', (_, data) => callback(data)),
	onPreviewUpdate: (callback) => ipcRenderer.on('previewUpdate', (_, data) => callback(data)),
	onMidiDataUpdate: (callback) => ipcRenderer.on('midiDataUpdate', (_, data) => callback(data)),

	openFileDialog: (options) => ipcRenderer.invoke("openFileDialog", options),
	getPreviewModel: () => ipcRenderer.invoke("getPreviewModel"),
	getAllPossibleModifiers: (trackName) => ipcRenderer.invoke("getAllPossibleModifiers", trackName),
	addModifier: (options) => ipcRenderer.invoke("addModifier", options),
	bindParameterToMidiData: (options) => ipcRenderer.invoke("bindParameterToMidiData", options),
	getTracks: () => ipcRenderer.invoke("getTracks"),
	modifierParameterChange: (options) => ipcRenderer.invoke("modifierParameterChange", options),
	modifierParameterFactorChange: (options) => ipcRenderer.invoke("modifierParameterFactorChange", options),
	getMidiData: () => ipcRenderer.invoke("getMidiData"),
	reorderModifier: (options) => ipcRenderer.invoke("reorderModifier", options),
	saveProject: () => ipcRenderer.invoke("saveProject"),
	openProject: () => ipcRenderer.invoke("openProject"),
	saveProjectAs: () => ipcRenderer.invoke("saveProjectAs"),
});
