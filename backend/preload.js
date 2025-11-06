const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
	onTrackUpdate: (callback) => ipcRenderer.on('trackUpdate', (_, data) => callback(data)),
	onPreviewUpdate: (callback) => ipcRenderer.on('previewUpdate', (_, data) => callback(data)),
	onMidiDataUpdate: (callback) => ipcRenderer.on('midiDataUpdate', (_, data) => callback(data)),
	onCameraStateUpdate: (callback) => ipcRenderer.on('cameraStateUpdate', (_, data) => callback(data)),
	onNodeNetworkUpdate: (callback) => ipcRenderer.on('nodeNetworkUpdate', (_, data) => callback(data)),

	openFileDialog: (options) => ipcRenderer.invoke("openFileDialog", options),
	getPreviewModel: () => ipcRenderer.invoke("getPreviewModel"),
	saveProject: (options) => ipcRenderer.invoke("saveProject", options),
	openProject: () => ipcRenderer.invoke("openProject"),
	saveProjectAs: (options) => ipcRenderer.invoke("saveProjectAs", options),
	getNodeNetwork: () => ipcRenderer.invoke("getNodeNetwork"),

	// Node network actions
	setActiveNetwork: (networkId) => ipcRenderer.invoke("setActiveNetwork", networkId),
	createNode: (nodeType) => ipcRenderer.invoke("createNode", nodeType),
	deleteNode: (nodeId) => ipcRenderer.invoke("deleteNode", nodeId),
	addConnection: (fromNodeId, outputIndex, toNodeId, inputIndex) => ipcRenderer.invoke("addConnection", { fromNodeId, outputIndex, toNodeId, inputIndex }),
	removeConnection: (fromNodeId, outputIndex, toNodeId, inputIndex) => ipcRenderer.invoke("removeConnection", { fromNodeId, outputIndex, toNodeId, inputIndex }),
});
