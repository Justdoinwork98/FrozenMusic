const { Node, InputPoint, OutputPoint, NODE_INPUT_OUTPUT_TYPES } = require('./node.js');

class AddNode extends Node {
	constructor() {
		const inputs = [new InputPoint("Value 1", NODE_INPUT_OUTPUT_TYPES.number, 0), new InputPoint("Value 2", NODE_INPUT_OUTPUT_TYPES.number, 0)];
		const outputs = [new OutputPoint("Result", NODE_INPUT_OUTPUT_TYPES.number)];
		super("Add", inputs, outputs);
		this.nodeClass = 'math';
	}

	getOutput(network, midiData, outputIndex) {
		const val1 = this.getInput(network, 0, midiData);
		const val2 = this.getInput(network, 1, midiData);
		return val1 + val2;
	}
}

class SubtractNode extends Node {
	constructor() {
		const inputs = [new InputPoint("Value 1", NODE_INPUT_OUTPUT_TYPES.number, 0), new InputPoint("Value 2", NODE_INPUT_OUTPUT_TYPES.number, 0)];
		const outputs = [new OutputPoint("Result", NODE_INPUT_OUTPUT_TYPES.number)];
		super("Subtract", inputs, outputs);
		this.nodeClass = 'math';
	}

	getOutput(network, midiData, outputIndex) {
		const val1 = this.getInput(network, 0, midiData);
		const val2 = this.getInput(network, 1, midiData);
		return val1 - val2;
	}
}

class MultiplyNode extends Node {
	constructor() {
		const inputs = [new InputPoint("Value 1", NODE_INPUT_OUTPUT_TYPES.number, 1), new InputPoint("Value 2", NODE_INPUT_OUTPUT_TYPES.number, 1)];
		const outputs = [new OutputPoint("Result", NODE_INPUT_OUTPUT_TYPES.number)];
		super("Multiply", inputs, outputs);
		this.nodeClass = 'math';
	}

	getOutput(network, midiData, outputIndex) {
		const val1 = this.getInput(network, 0, midiData);
		const val2 = this.getInput(network, 1, midiData);
		return val1 * val2;
	}
}

class DivideNode extends Node {
	constructor() {
		const inputs = [new InputPoint("Value 1", NODE_INPUT_OUTPUT_TYPES.number, 1), new InputPoint("Value 2", NODE_INPUT_OUTPUT_TYPES.number, 1)];
		const outputs = [new OutputPoint("Result", NODE_INPUT_OUTPUT_TYPES.number)];
		super("Divide", inputs, outputs);
		this.nodeClass = 'math';
	}

	getOutput(network, midiData, outputIndex) {
		const val1 = this.getInput(network, 0, midiData);
		const val2 = this.getInput(network, 1, midiData);
		return val1 / val2;
	}
}

module.exports = {
	AddNode,
	SubtractNode,
	MultiplyNode,
	DivideNode
};