const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
	onModifierUpdate: (callback) => ipcRenderer.on('modifierUpdate', (_, data) => callback(data)),
	onPreviewUpdate: (callback) => ipcRenderer.on('previewUpdate', (_, data) => callback(data)),

	openFileDialog: (options) => ipcRenderer.invoke("openFileDialog", options),
	getPreviewModel: () => ipcRenderer.invoke("getPreviewModel"),

});
