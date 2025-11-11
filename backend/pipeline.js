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

	sendNumberOfTracksToFrontend() {
		if (!this.windowReference) {
			throw new Error('No window reference set for Pipeline');
		}

		const numTracks = this.midiDataManager.hasMidiData() ?
			this.midiDataManager.getMidiData().track.length :
			0;

		console.log("Sending number of tracks to frontend:", numTracks);
		console.log(this.midiDataManager.getMidiData());

		this.windowReference.webContents.send('numberOfTracksUpdate', numTracks);
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
			node.inputs[inputIndex].setDefaultValue(value);

			// Don't send the network since this change does not affect structure
			//this.sendNetworkToFrontend();
			this.runPipelineAndUpdatePreview();
		}
	}

	moveNodeInActiveNetwork(nodeId, x, y) {
		const network = this.getActiveNetwork();
		const node = network.nodes.get(nodeId);
		if (node) {
			node.setPosition(x, y);
			//this.sendNetworkToFrontend();
		}
	}

	activateNetwork(index) {
		if (index < 0 || index >= this.networks.length) {
			throw new Error('Invalid network index: ' + index);
		}

		this.activeNetworkIndex = index;
		this.sendNetworkToFrontend();
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
		this.sendNetworkToFrontend();
	}

	runPipeline() {
		if (this.midiDataManager.getMidiData() == null) {
			return null;
		}

		let meshes = [];

		// Run the node network to produce the final mesh
		this.networks.forEach((network, i) => {
			let totalMesh = new Mesh();
			let previousNoteMesh = null;
			// Loop through each MIDI note
			for (const midiNote of this.midiDataManager.getMidiData().track[i].notes) {
				const data = {
					midiData: midiNote,
					previousMesh: previousNoteMesh
				};
				const mesh = network.runNetwork(data);
				if (mesh == null) {
					// Empty mesh
					previousNoteMesh = new Mesh();
					//console.log("Network " + i + " did not produce a mesh for MIDI note ", midiNote);
					continue;
				}

				previousNoteMesh = mesh.clone();

				totalMesh.add(mesh);
			}
			meshes.push(totalMesh);
		});

		this.savedMeshes = meshes;

		return meshes;
	}

	runPipelineAndUpdatePreview() {
		const outputMeshes = this.runPipeline();
		if (outputMeshes == null) {
			// Something was not connected properly
			console.log("Pipeline did not produce a valid output mesh.");
			return;
		}

		console.log("Sending preview model via transferable buffers.");

		// Prepare a new array of lightweight objects for transfer
		const transferableMeshes = outputMeshes.map(mesh => {
			const vertices = new Float32Array(mesh.vertices.length * 3);
			const indices = new Uint32Array(mesh.tris.length * 3);

			// Fill vertices
			mesh.vertices.forEach((v, i) => {
				vertices[i * 3] = v.x;
				vertices[i * 3 + 1] = v.y;
				vertices[i * 3 + 2] = v.z;
			});

			// Fill triangle indices
			mesh.tris.forEach((t, i) => {
				indices[i * 3] = t.v1;
				indices[i * 3 + 1] = t.v2;
				indices[i * 3 + 2] = t.v3;
			});

			return { vertices, indices };
		});

		// Flatten the buffers into a single transfer list
		const buffersToTransfer = transferableMeshes.flatMap(m => [m.vertices.buffer, m.indices.buffer]);

		// Send via IPC using transfer list
		this.windowReference.webContents.send('previewMeshBuffers', transferableMeshes, buffersToTransfer);


		console.log("Updating preview model in frontend.");
		//this.windowReference.webContents.send('previewModelUpdate', outputMeshes);
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
			this.midiDataManager.readMidiFile(data.midiFile, () => {
				// Read the networks from the file
				this.networks = networkData.map(networkData => NodeNetwork.fromJSON(networkData));
				// Ensure that each network has an output node
				this.networks.forEach(network => network.verifyOrAddOutputNode());

				// Add or remove networks to match number of tracks
				const numTracks = this.midiDataManager.getMidiData().track.length;
				while (this.networks.length < numTracks) {
					const newNetwork = new NodeNetwork();
					newNetwork.makeDefaultNetwork();
					this.networks.push(newNetwork);
				}

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
				this.sendNumberOfTracksToFrontend();;
			});
		}
	}

	openMidiFile(filePath) {
		this.midiDataManager.readMidiFile(filePath, () => {
			// Create the networks for the tracks
			this.networks = this.midiDataManager.getMidiData().track.map(track => new NodeNetwork());
			this.networks.forEach(network => network.makeDefaultNetwork());

			this.runPipelineAndUpdatePreview();
			this.sendNetworkToFrontend();
			this.sendNumberOfTracksToFrontend();
		});
	}

	exportMeshAsObj(filePath) {
		if (!this.savedMeshes) {
			throw new Error('No mesh to export. Run the pipeline first.');
		}

		let objData = '';

		console.log(this.savedMeshes);

		this.savedMeshes.forEach((mesh, meshIndex) => {
			objData += `o Mesh${meshIndex}\n`;

			// Write vertices
			mesh.vertices.forEach(v => {
				objData += `v ${v.x} ${v.y} ${v.z}\n`;
			});

			// Write faces (assuming mesh.faces contains vertex indices arrays [v0,v1,v2])
			mesh.tris.forEach(t => {
				objData += `f ${t.v1+1} ${t.v2+1} ${t.v3+1}\n`; // OBJ uses 1-based indexing
			});
		});

		fs.writeFileSync(filePath, objData, 'utf8');
		console.log(`Saved OBJ to ${filePath}`);
	}

	exportMeshAsStl(filePath) {
		if (!this.savedMeshes) {
			throw new Error('No mesh to export. Run the pipeline first.');
		}

		let stlData = 'solid mesh\n';

		this.savedMeshes.forEach((mesh, meshIndex) => {
			mesh.tris.forEach(t => {
				const v0 = mesh.vertices[t.v1];
				const v1 = mesh.vertices[t.v2];
				const v2 = mesh.vertices[t.v3];

				if (!v0 || !v1 || !v2) {
					//console.warn(`Skipping invalid triangle:`, t, " for mesh with num vertices ", mesh.vertices.length);
					return;
				}

				// Compute normal (cross product)
				const ux = v1.x - v0.x, uy = v1.y - v0.y, uz = v1.z - v0.z;
				const vx = v2.x - v0.x, vy = v2.y - v0.y, vz = v2.z - v0.z;
				const nx = uy*vz - uz*vy;
				const ny = uz*vx - ux*vz;
				const nz = ux*vy - uy*vx;

				stlData += `facet normal ${nx} ${ny} ${nz}\n`;
				stlData += `  outer loop\n`;
				stlData += `    vertex ${v0.x} ${v0.y} ${v0.z}\n`;
				stlData += `    vertex ${v1.x} ${v1.y} ${v1.z}\n`;
				stlData += `    vertex ${v2.x} ${v2.y} ${v2.z}\n`;
				stlData += `  endloop\n`;
				stlData += `endfacet\n`;
			});
		});

		stlData += 'endsolid mesh\n';

		fs.writeFileSync(filePath, stlData, 'utf8');
		console.log(`Saved STL to ${filePath}`);
	}
}

module.exports = {
	Pipeline
};