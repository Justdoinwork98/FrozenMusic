const { Mesh } = require('./nodes/modifier_nodes.js');
const { ModifierPipeline, Track } = require('./modifier_pipeline.js');
const { MidiDataManager } = require('./midi_data_manager.js');
const { NodeNetwork, NODE_MENU } = require('./nodes/node_network.js');
const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const fs = require('fs');

class Pipeline {
	constructor() {
		this.midiDataManager = new MidiDataManager();
		this.networks = []
		this.openedProjectPath = null;
		this.activeNetworkIndex = 0;
		this.windowReference = null;
	}

	sendProjectNameToFrontend() {
		if (!this.windowReference) {
			throw new Error('No window reference set for Pipeline');
		}
		const projectName = this.openedProjectPath ?
			this.openedProjectPath.split(/[\\/]/).pop() :
			"Untitled Project";
		this.windowReference.webContents.send('projectNameUpdate', projectName);
	}

	sendPossibleNodesToFrontend() {
		if (!this.windowReference) {
			throw new Error('No window reference set for Pipeline');
		}
		this.windowReference.webContents.send('possibleNodesUpdate', NODE_MENU);
	}

	sendNetworkToFrontend() {
		if (!this.windowReference) {
			throw new Error('No window reference set for Pipeline');
		}
		if (!this.getActiveNetwork()) {
			return
		}
		console.log("Sending node network update to frontend.");
		this.windowReference.webContents.send('nodeNetworkUpdate', this.getActiveNetwork().getNodeList());
	}

	updateNodeInputDefaultInActiveNetwork(nodeId, inputIndex, value) {
		const network = this.getActiveNetwork();
		const node = network.nodes.get(nodeId);
		if (node && inputIndex >= 0 && inputIndex < node.inputs.length) {
			node.inputs[inputIndex].defaultValue = value;
			this.sendNetworkToFrontend();
			this.runPipelineAndUpdatePreview();
		}
	}

	moveNodeInActiveNetwork(nodeId, x, y) {
		const network = this.getActiveNetwork();
		const node = network.nodes.get(nodeId);
		if (node) {
			node.setPosition(x, y);
			this.sendNetworkToFrontend();
		}
	}

	activateNetwork(index) {
		if (index < 0 || index >= this.networks.length) {
			throw new Error('Invalid network index: ' + index);
		}

		this.activeNetworkIndex = index;
	}

	getActiveNetwork() {
		return this.networks[this.activeNetworkIndex];
	}

	createNodeInActiveNetwork(nodeType, x, y) {
		const network = this.getActiveNetwork();
		const node = network.createNode(nodeType);
		node.setPosition(x, y);
		this.sendNetworkToFrontend();
		return node;
	}

	deleteNodeFromActiveNetwork(nodeId) {
		const network = this.getActiveNetwork();
		network.removeNode(nodeId);
	}

	runPipeline() {
		if (this.midiDataManager.getMidiData() == null) {
			return null;
		}

		let meshes = [];

		// Run the node network to produce the final mesh
		this.networks.forEach((network, i) => {
			let totalMesh = new Mesh();
			// Loop through each MIDI note
			for (const midiNote of this.midiDataManager.getMidiData().track[1].notes) {
				const mesh = network.runNetwork(midiNote);
				if (mesh == null) {
					//console.log("Network " + i + " did not produce a mesh for MIDI note ", midiNote);
					continue;
				}

				totalMesh.add(mesh);
			}
			meshes.push(totalMesh);
		});

		return meshes;
	}

	runPipelineAndUpdatePreview() {
		const outputMesh = this.runPipeline();
		if (outputMesh == null) {
			// Something was not connected properly
			return;
		}
		console.log("Updating preview model in frontend.");
		this.windowReference.webContents.send('previewModelUpdate', outputMesh);
	}

	save(filePath, saveData) {
		const networkData = this.networks.map(network => network.toJSON());

		console.log(this.midiDataManager.loadedMidiFile);

		const data = {
			midiFile: this.midiDataManager.getCurrentMidiFilePath(),
			networks: networkData,
			...saveData,
		};

		// If the file path is different, update the project name in the frontend
		if (filePath != this.openedProjectPath) {
			this.openedProjectPath = filePath;
			this.sendProjectNameToFrontend();
		}

		// Save data to file
		fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
	}

	load(filePath) {
		if (!fs.existsSync(filePath)) {
			throw new Error('File does not exist: ' + filePath);
		}

		const data = JSON.parse(fs.readFileSync(filePath));
		const networkData = data.networks || [];

		// Load MIDI file if present
		if (data.midiFile) {
			this.midiDataManager.readMidiFile(data.midiFile);
		}

		// Read the networks from the file
		this.networks = networkData.map(networkData => NodeNetwork.fromJSON(networkData));
		// Ensure that each network has an output node
		this.networks.forEach(network => network.verifyOrAddOutputNode());

		// Set opened project path
		this.openedProjectPath = filePath;

		// If there is camera data, send it to the frontend
		if (data.camera) {
			this.windowReference.webContents.send('cameraStateUpdate', data.camera);
		}

		// Send the new data to the frontend
		this.runPipelineAndUpdatePreview();
		this.sendNetworkToFrontend();
		this.sendProjectNameToFrontend();
	}
}

module.exports = {
	Pipeline
};