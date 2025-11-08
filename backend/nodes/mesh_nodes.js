const { Node, InputPoint, OutputPoint } = require('./node.js');
const { Mesh } = require('../mesh.js');

class PreviousNoteMeshNode extends Node {
	constructor() {
		const inputs = [];
		const outputs = [
			new OutputPoint("Previous Mesh", "Mesh"),
		];
		super("Previous Note Mesh", inputs, outputs);
		this.nodeClass = 'geometry';
	}

	getOutput(network, data, outputIndex) {
		if (outputIndex !== 0) {
			throw new Error('Invalid output index for PreviousNoteMeshNode: ' + outputIndex);
		}

		const previousNote = data.previousMesh;
		return previousNote;
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
		// Create a simple sphere mesh
		const mesh = Mesh.sphere(1, subdivisionLevel);
		return mesh;
	}
}

module.exports = {
	CubeNode,
	SphereNode,
	CombineMeshNode,
	PreviousNoteMeshNode
};