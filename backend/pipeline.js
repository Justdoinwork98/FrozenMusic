const { Mesh } = require('./nodes/modifier.js');
const { ModifierPipeline, Track } = require('./modifier_pipeline.js');
const { MidiDataManager } = require('./midi_data_manager.js');
const { NodeNetwork } = require('./nodes/node_network.js');

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
		let totalMesh = new Mesh();

		// Run the node network to produce the final mesh
		for (const [i, network] of this.networks) {

			// Loop through each MIDI note
			for (const midiNote of this.midiDataManager.getMidiData()[i].notes) {
				const mesh = network.runNetwork(midiNote);
				totalMesh.add(mesh);
			}
		}

		return totalMesh;
	}

	save(filePath, saveData) {
		const networkData = this.networks.map(network => { network.toJSON() });

		const data = {
			networks: networkData,
			...saveData,
		};

		// Save data to file
		fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
		openedProjectPath = filePath;
	}

	load(filePath) {
		if (!fs.existsSync(filePath)) {
			throw new Error('File does not exist: ' + filePath);
		}

		const data = JSON.parse(fs.readFileSync(filePath));
		const networkData = data.networks || [];

		this.networks = networkData.map(networkData => NodeNetwork.fromJSON(networkData));

		// Send the updated node networks to the frontend
		win.webContents.send('nodeNetworkUpdate', networks);

		openedProjectPath = filePath;

		// If there is camera data, send it to the frontend
		if (data.camera) {
			win.webContents.send('cameraStateUpdate', data.camera);
		}

		runPipelineAndUpdatePreview();
	}
}

module.exports = {
	Pipeline
};