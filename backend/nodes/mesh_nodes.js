const { Node, InputPoint, OutputPoint } = require('./node.js');
const { Mesh } = require('../mesh.js');

class MeshNode extends Node {
	constructor(name) {
		const inputs = [
			new InputPoint("Subdivision level", "Number", 0),
		];
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

		const subdivisionLevel = this.getInput(network, 0, midiData);

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
	getOutput(network, midiData, outputIndex) {
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
};