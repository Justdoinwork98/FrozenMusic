const { Mesh } = require('./nodes/modifier.js');
const { ModifierPipeline, Track } = require('./modifier_pipeline.js');
const { MidiDataManager } = require('./midi_data_manager.js');
const { NodeNetwork } = require('./nodes/node_network.js');
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

	sendNetworkToFrontend() {
		if (!this.windowReference) {
			throw new Error('No window reference set for Pipeline');
		}
		this.windowReference.webContents.send('nodeNetworkUpdate', this.networks);
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

	createNodeInActiveNetwork(nodeType) {
		const network = this.getActiveNetwork();
		const node = network.createNode(nodeType);
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

		let totalMesh = new Mesh();

		// Run the node network to produce the final mesh
		this.networks.forEach((network, i) => {
			// Loop through each MIDI note
			for (const midiNote of this.midiDataManager.getMidiData().track[i].notes) {
				const mesh = network.runNetwork(midiNote);
				totalMesh.add(mesh);
			}
		});

		return totalMesh;
	}

	runPipelineAndUpdatePreview() {
		const outputMesh = this.runPipeline();
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

		// Save data to file
		fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
		this.openedProjectPath = filePath;
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

		this.networks = networkData.map(networkData => NodeNetwork.fromJSON(networkData));
		console.log('Loaded networks:', this.networks);

		// Send the updated node networks to the frontend
		this.windowReference.webContents.send('nodeNetworkUpdate', this.networks);

		this.openedProjectPath = filePath;

		// If there is camera data, send it to the frontend
		if (data.camera) {
			this.windowReference.webContents.send('cameraStateUpdate', data.camera);
		}

		this.runPipelineAndUpdatePreview();

		this.save(filePath);
	}
}

module.exports = {
	Pipeline
};