const { Node, InputPoint, OutputPoint, NODE_INPUT_OUTPUT_TYPES } = require('./node.js');
const { Mesh } = require('../mesh.js');

class PreviousNoteMeshNode extends Node {
	constructor() {
		const inputs = [
			new InputPoint("Else", NODE_INPUT_OUTPUT_TYPES.mesh, null),
		];
		const outputs = [
			new OutputPoint("Previous Mesh", NODE_INPUT_OUTPUT_TYPES.mesh),
		];
		super("Previous Note Mesh", inputs, outputs);
		this.nodeClass = 'geometry';
	}

	getOutput(network, data, outputIndex) {
		if (outputIndex !== 0) {
			throw new Error('Invalid output index for PreviousNoteMeshNode: ' + outputIndex);
		}

		const previousNote = data.previousMesh;

		if (previousNote == null) {
			// If there is no previous note, return the "Else" input
			return this.getInput(network, 0, data);
		}

		return previousNote;
	}
}

class CustomMeshNode extends Node {
	constructor() {
		const inputs = [
			new InputPoint("Path", NODE_INPUT_OUTPUT_TYPES.meshPath)
		];
		const outputs = [
			new OutputPoint("Custom Mesh", NODE_INPUT_OUTPUT_TYPES.mesh),
		];
		super("Custom Mesh", inputs, outputs);
		this.nodeClass = 'geometry';
	}

	getOutput(network, data, outputIndex) {
		if (outputIndex !== 0) {
			throw new Error('Invalid output index for CustomMeshNode: ' + outputIndex);
		}
		const meshPath = this.getInput(network, 0, data);
		const mesh = Mesh.loadFromPath(meshPath);
		return mesh;
	}
}

class CombineMeshNode extends Node {
	constructor() {
		const inputs = [
			new InputPoint("Mesh 1", "Mesh", 0),
			new InputPoint("Mesh 2", "Mesh", 1),
		];
		const outputs = [
			new OutputPoint("Combined Mesh", "Mesh"),
		];
		super("Combine Mesh", inputs, outputs);
		this.nodeClass = 'geometry';
	}

	getOutput(network, data, outputIndex) {
		if (outputIndex !== 0) {
			throw new Error('Invalid output index for CombineMeshNode: ' + outputIndex);
		}

		const mesh1 = this.getInput(network, 0, data);
		const mesh2 = this.getInput(network, 1, data);
		return Mesh.combine(mesh1, mesh2);
	}
}

class MeshNode extends Node {
	constructor(name) {
		const inputs = [
			new InputPoint("Subdivision level", "Number", 0),
		];
		const outputs = [
			new OutputPoint("Mesh Output", "Mesh"),
		];
		super(name, inputs, outputs);
		this.nodeClass = 'geometry';
	}
}

class CubeNode extends MeshNode {
	constructor() {
		super("Cube");
	}

	// Get the inputs and return the output Mesh
	getOutput(network, data, outputIndex) {
		if (outputIndex !== 0) {
			throw new Error('Invalid output index for CubeNode: ' + outputIndex);
		}

		const subdivisionLevel = this.getInput(network, 0, data);

		// Create a simple cube mesh
		const mesh = Mesh.cube(1, subdivisionLevel);
		return mesh;
	}
}

class SphereNode extends MeshNode {
	constructor() {
		super("Sphere");
	}

	// Get the inputs and return the output Mesh
	getOutput(network, data, outputIndex) {
		if (outputIndex !== 0) {
			throw new Error('Invalid output index for SphereNode: ' + outputIndex);
		}

		const subdivisionLevel = this.getInput(network, 0, data);

		// Create a simple sphere mesh
		const mesh = Mesh.sphere(1, subdivisionLevel);
		return mesh;
	}
}

class PlaneNode extends MeshNode {
	constructor() {
		super("Plane");
	}

	// Get the inputs and return the output Mesh
	getOutput(network, data, outputIndex) {
		if (outputIndex !== 0) {
			throw new Error('Invalid output index for PlaneNode: ' + outputIndex);
		}

		const subdivisionLevel = this.getInput(network, 0, data);

		// Create a simple plane mesh
		const mesh = Mesh.plane(1, 1, subdivisionLevel);
		return mesh;
	}
}

class CylinderNode extends MeshNode {
	constructor() {
		super("Cylinder");
	}

	// Get the inputs and return the output Mesh
	getOutput(network, data, outputIndex) {
		if (outputIndex !== 0) {
			throw new Error('Invalid output index for CylinderNode: ' + outputIndex);
		}

		const subdivisionLevel = this.getInput(network, 0, data);

		// Create a simple cylinder mesh
		const mesh = Mesh.cylinder(1, 1, subdivisionLevel);
		return mesh;
	}
}

module.exports = {
	CubeNode,
	SphereNode,
	CombineMeshNode,
	PreviousNoteMeshNode,
	PlaneNode,
	CylinderNode,
	CustomMeshNode
};