const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
	onTrackUpdate: (callback) => ipcRenderer.on('trackUpdate', (_, data) => callback(data)),
	onPreviewUpdate: (callback) => ipcRenderer.on('previewModelUpdate', (_, data) => callback(data)),
	onMidiDataUpdate: (callback) => ipcRenderer.on('midiDataUpdate', (_, data) => callback(data)),
	onCameraStateUpdate: (callback) => ipcRenderer.on('cameraStateUpdate', (_, data) => callback(data)),
	onNodeNetworkUpdate: (callback) => ipcRenderer.on('nodeNetworkUpdate', (_, data) => callback(data)),
	onPossibleNodesUpdate: (callback) => ipcRenderer.on('possibleNodesUpdate', (_, data) => callback(data)),
	onProjectNameUpdate: (callback) => ipcRenderer.on('projectNameUpdate', (_, data) => callback(data)),
	onNumberOfTracksUpdate: (callback) => ipcRenderer.on('numberOfTracksUpdate', (_, data) => callback(data)),
	onPreviewUpdate: (callback) => ipcRenderer.on('previewMeshBuffers', (_, data) => callback(data)),

	openMidiFile: () => ipcRenderer.send("openMidiFile"),
	requestPreviewModel: () => ipcRenderer.send("requestPreviewModel"),
	saveProject: (options) => ipcRenderer.send("saveProject", options),
	openProject: () => ipcRenderer.send("openProject"),
	saveProjectAs: (options) => ipcRenderer.send("saveProjectAs", options),
	requestNodeNetwork: () => ipcRenderer.send("requestNodeNetwork"),
	requestPossibleNodes: () => ipcRenderer.send("requestPossibleNodes"),
	requestProjectName: () => ipcRenderer.send("requestProjectName"),
	requestNumberOfTracks: () => ipcRenderer.send("requestNumberOfTracks"),

	// Node network actions
	setActiveNetwork: (networkId) => ipcRenderer.send("setActiveNetwork", networkId),
	createNode: (options) => ipcRenderer.send("createNode", options),
	moveNode: (nodeId, x, y) => ipcRenderer.send("moveNode", { nodeId, x, y }),
	deleteNode: (nodeId) => ipcRenderer.send("deleteNode", nodeId),
	addConnection: (options) => ipcRenderer.send("addConnection", options),
	removeConnection: (options) => ipcRenderer.send("removeConnection", options),
	updateNodeInputDefault: (options) => ipcRenderer.send("updateNodeInputDefault", options),

	saveMeshAsObj: () => ipcRenderer.send("saveMeshAsObj"),
	saveMeshAsStl: () => ipcRenderer.send("saveMeshAsStl"),
});
