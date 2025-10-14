const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
	onTrackUpdate: (callback) => ipcRenderer.on('trackUpdate', (_, data) => callback(data)),
	onPreviewUpdate: (callback) => ipcRenderer.on('previewUpdate', (_, data) => callback(data)),

	openFileDialog: (options) => ipcRenderer.invoke("openFileDialog", options),
	getPreviewModel: () => ipcRenderer.invoke("getPreviewModel"),
	getAllPossibleModifiers: (trackName) => ipcRenderer.invoke("getAllPossibleModifiers", trackName),
	addModifier: (options) => ipcRenderer.invoke("addModifier", options),
	bindParameterToMidiData: (options) => ipcRenderer.invoke("bindParameterToMidiData", options),
	getTracks: () => ipcRenderer.invoke("getTracks"),
	modifierParameterChange: (options) => ipcRenderer.invoke("modifierParameterChange", options),
	modifierParameterFactorChange: (options) => ipcRenderer.invoke("modifierParameterFactorChange", options),
});
