const { Node, InputPoint, OutputPoint, NODE_INPUT_OUTPUT_TYPES } = require('./node.js');

class AddNode extends Node {
	constructor() {
		const inputs = [new InputPoint("Value 1", NODE_INPUT_OUTPUT_TYPES.number, 0), new InputPoint("Value 2", NODE_INPUT_OUTPUT_TYPES.number, 0)];
		const outputs = [new OutputPoint("Result", NODE_INPUT_OUTPUT_TYPES.number)];
		super("Add", inputs, outputs);
		this.nodeClass = 'math';
	}

	getOutput(network, data, outputIndex) {
		const val1 = this.getInput(network, 0, data);
		const val2 = this.getInput(network, 1, data);
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

	getOutput(network, data, outputIndex) {
		const val1 = this.getInput(network, 0, data);
		const val2 = this.getInput(network, 1, data);
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

	getOutput(network, data, outputIndex) {
		const val1 = this.getInput(network, 0, data);
		const val2 = this.getInput(network, 1, data);
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

	getOutput(network, data, outputIndex) {
		const val1 = this.getInput(network, 0, data);
		const val2 = this.getInput(network, 1, data);
		return val1 / val2;
	}
}

class MapNode extends Node {
	constructor() {
		const inputs = [new InputPoint("Value", NODE_INPUT_OUTPUT_TYPES.number, 0), new InputPoint("In Min", NODE_INPUT_OUTPUT_TYPES.number, 0), new InputPoint("In Max", NODE_INPUT_OUTPUT_TYPES.number, 1), new InputPoint("Out Min", NODE_INPUT_OUTPUT_TYPES.number, 0), new InputPoint("Out Max", NODE_INPUT_OUTPUT_TYPES.number, 1)];
		const outputs = [new OutputPoint("Result", NODE_INPUT_OUTPUT_TYPES.number)];
		super("Map", inputs, outputs);
		this.nodeClass = 'math';
	}

	getOutput(network, data, outputIndex) {
		const val = this.getInput(network, 0, data);
		const inMin = this.getInput(network, 1, data);
		const inMax = this.getInput(network, 2, data);
		const outMin = this.getInput(network, 3, data);
		const outMax = this.getInput(network, 4, data);
		const normalizedValue = (val - inMin) / (inMax - inMin);
		const val2 = outMin + (normalizedValue * (outMax - outMin));
		return val2;
	}
}

class ClampNode extends Node {
	constructor() {
		const inputs = [new InputPoint("Value", NODE_INPUT_OUTPUT_TYPES.number, 0), new InputPoint("Min", NODE_INPUT_OUTPUT_TYPES.number, 0), new InputPoint("Max", NODE_INPUT_OUTPUT_TYPES.number, 1)];
		const outputs = [new OutputPoint("Result", NODE_INPUT_OUTPUT_TYPES.number)];
		super("Clamp", inputs, outputs);
		this.nodeClass = 'math';
	}

	getOutput(network, data, outputIndex) {
		const val = this.getInput(network, 0, data);
		const min = this.getInput(network, 1, data);
		const max = this.getInput(network, 2, data);
		return Math.min(Math.max(val, min), max);
	}
}

class RandomNode extends Node {
	constructor() {
		const inputs = [new InputPoint("Min", NODE_INPUT_OUTPUT_TYPES.number, 0), new InputPoint("Max", NODE_INPUT_OUTPUT_TYPES.number, 1)];
		const outputs = [new OutputPoint("Result", NODE_INPUT_OUTPUT_TYPES.number)];
		super("Random", inputs, outputs);
		this.nodeClass = 'math';
	}

	getOutput(network, data, outputIndex) {
		const min = this.getInput(network, 0, data);
		const max = this.getInput(network, 1, data);
		return Math.random() * (max - min) + min;
	}
}

class SineNode extends Node {
	constructor() {
		const inputs = [new InputPoint("Angle", NODE_INPUT_OUTPUT_TYPES.number, 0)];
		const outputs = [new OutputPoint("Result", NODE_INPUT_OUTPUT_TYPES.number)];
		super("Sine", inputs, outputs);
		this.nodeClass = 'math';
	}

	getOutput(network, data, outputIndex) {
		const angle = this.getInput(network, 0, data);
		return Math.sin(angle * Math.PI / 180);
	}
}

class CosineNode extends Node {
	constructor() {
		const inputs = [new InputPoint("Angle", NODE_INPUT_OUTPUT_TYPES.number, 0)];
		const outputs = [new OutputPoint("Result", NODE_INPUT_OUTPUT_TYPES.number)];
		super("Cosine", inputs, outputs);
		this.nodeClass = 'math';
	}

	getOutput(network, data, outputIndex) {
		const angle = this.getInput(network, 0, data);
		return Math.cos(angle * Math.PI / 180);
	}
}

class MinNode extends Node {
	constructor() {
		const inputs = [new InputPoint("Value 1", NODE_INPUT_OUTPUT_TYPES.number, 0), new InputPoint("Value 2", NODE_INPUT_OUTPUT_TYPES.number, 0)];
		const outputs = [new OutputPoint("Result", NODE_INPUT_OUTPUT_TYPES.number)];
		super("Min", inputs, outputs);
		this.nodeClass = 'math';
	}

	getOutput(network, data, outputIndex) {
		const val1 = this.getInput(network, 0, data);
		const val2 = this.getInput(network, 1, data);
		return Math.min(val1, val2);
	}
}

class MaxNode extends Node {
	constructor() {
		const inputs = [new InputPoint("Value 1", NODE_INPUT_OUTPUT_TYPES.number, 0), new InputPoint("Value 2", NODE_INPUT_OUTPUT_TYPES.number, 0)];
		const outputs = [new OutputPoint("Result", NODE_INPUT_OUTPUT_TYPES.number)];
		super("Max", inputs, outputs);
		this.nodeClass = 'math';
	}

	getOutput(network, data, outputIndex) {
		const val1 = this.getInput(network, 0, data);
		const val2 = this.getInput(network, 1, data);
		return Math.max(val1, val2);
	}
}

class PowerNode extends Node {
	constructor() {
		const inputs = [new InputPoint("Base", NODE_INPUT_OUTPUT_TYPES.number, 0), new InputPoint("Exponent", NODE_INPUT_OUTPUT_TYPES.number, 0)];
		const outputs = [new OutputPoint("Result", NODE_INPUT_OUTPUT_TYPES.number)];
		super("Power", inputs, outputs);
		this.nodeClass = 'math';
	}

	getOutput(network, data, outputIndex) {
		const base = this.getInput(network, 0, data);
		const exponent = this.getInput(network, 1, data);
		return Math.pow(base, exponent);
	}
}

class FloorNode extends Node {
	constructor() {
		const inputs = [new InputPoint("Value", NODE_INPUT_OUTPUT_TYPES.number, 0)];
		const outputs = [new OutputPoint("Result", NODE_INPUT_OUTPUT_TYPES.number)];
		super("Floor", inputs, outputs);
		this.nodeClass = 'math';
	}

	getOutput(network, data, outputIndex) {
		const value = this.getInput(network, 0, data);
		return Math.floor(value);
	}
}

class CeilNode extends Node {
	constructor() {
		const inputs = [new InputPoint("Value", NODE_INPUT_OUTPUT_TYPES.number, 0)];
		const outputs = [new OutputPoint("Result", NODE_INPUT_OUTPUT_TYPES.number)];
		super("Ceil", inputs, outputs);
		this.nodeClass = 'math';
	}

	getOutput(network, data, outputIndex) {
		const value = this.getInput(network, 0, data);
		return Math.ceil(value);
	}
}

class AbsoluteNode extends Node {
	constructor() {
		const inputs = [new InputPoint("Value", NODE_INPUT_OUTPUT_TYPES.number, 0)];
		const outputs = [new OutputPoint("Result", NODE_INPUT_OUTPUT_TYPES.number)];
		super("Absolute", inputs, outputs);
		this.nodeClass = 'math';
	}

	getOutput(network, data, outputIndex) {
		const value = this.getInput(network, 0, data);
		return Math.abs(value);
	}
}

class ModuloNode extends Node {
	constructor() {
		const inputs = [new InputPoint("Dividend", NODE_INPUT_OUTPUT_TYPES.number, 0), new InputPoint("Divisor", NODE_INPUT_OUTPUT_TYPES.number, 1)];
		const outputs = [new OutputPoint("Result", NODE_INPUT_OUTPUT_TYPES.number)];
		super("Modulo", inputs, outputs);
		this.nodeClass = 'math';
	}

	getOutput(network, data, outputIndex) {
		const dividend = this.getInput(network, 0, data);
		const divisor = this.getInput(network, 1, data);
		return dividend % divisor;
	}
}

module.exports = {
	AddNode,
	SubtractNode,
	MultiplyNode,
	DivideNode,
	MapNode,
	ClampNode,
	RandomNode,
	SineNode,
	CosineNode,
	MinNode,
	MaxNode,
	PowerNode,
	FloorNode,
	CeilNode,
	AbsoluteNode,
	ModuloNode
};