const { Node, InputPoint, OutputPoint } = require('./node.js');
const { Mesh } = require('../mesh.js');

class MeshNode {
	constructor(name) {
		const inputs = [];
		const outputs = [
			new OutputPoint("Mesh Output", "Mesh"),
		];
		super(name, inputs, outputs);
	}
}

class CubeNode extends MeshNode {
	constructor() {
		super("Cube");
	}

	// Get the inputs and return the output Mesh
	getOutput(network, midiData, outputIndex) {
		if (outputIndex !== 0) {
			throw new Error('Invalid output index for CubeNode: ' + outputIndex);
		}

		// Create a simple cube mesh
		const mesh = Mesh.cube();
		return mesh;
	}
}

class SphereNode extends MeshNode {
	constructor() {
		super("Sphere");
	}

	// Get the inputs and return the output Mesh
	getOutput(network, midiData, outputIndex) {
		if (outputIndex !== 0) {
			throw new Error('Invalid output index for SphereNode: ' + outputIndex);
		}
		// Create a simple sphere mesh
		const mesh = Mesh.sphere();
		return mesh;
	}
}

module.exports = {
	CubeNode,
	SphereNode,
};