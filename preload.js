const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
	openFileDialog: (options) => ipcRenderer.invoke("openFileDialog", options),
});
