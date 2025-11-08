const { Node, InputPoint, OutputPoint, NODE_INPUT_OUTPUT_TYPES } = require('./node.js');

class NumberComparisonNode extends Node {
	constructor(operator) {
		const inputs = [
			new InputPoint("Value 1", NODE_INPUT_OUTPUT_TYPES.number, 0),
			new InputPoint("Value 2", NODE_INPUT_OUTPUT_TYPES.number, 0),];
		const outputs = [
			new OutputPoint("Greater than", NODE_INPUT_OUTPUT_TYPES.boolean),
			new OutputPoint("Greater than or equal", NODE_INPUT_OUTPUT_TYPES.boolean),
			new OutputPoint("Equal", NODE_INPUT_OUTPUT_TYPES.boolean),
			new OutputPoint("Less than or equal", NODE_INPUT_OUTPUT_TYPES.boolean),
			new OutputPoint("Less than", NODE_INPUT_OUTPUT_TYPES.boolean),
		];
		super("Number Comparison", inputs, outputs);
		this.nodeClass = 'logic';
	}

	getOutput(network, data, outputIndex) {
		const val1 = this.getInput(network, 0, data);
		const val2 = this.getInput(network, 1, data);

		switch (outputIndex) {
			case 0: // Greater than
				return val1 > val2;
			case 1: // Greater than or equal
				return val1 >= val2;
			case 2: // Equal
				return val1 === val2;
			case 3: // Less than or equal
				return val1 <= val2;
			case 4: // Less than
				return val1 < val2;
		}

		throw new Error('Invalid output index for NumberComparisonNode: ' + outputIndex);
	}
}

class SwitchNode extends Node {
	constructor() {
		const inputs = [
			new InputPoint("Condition", NODE_INPUT_OUTPUT_TYPES.boolean, 0),
			new InputPoint("True Output", NODE_INPUT_OUTPUT_TYPES.any, 1),
			new InputPoint("False Output", NODE_INPUT_OUTPUT_TYPES.any, 2),
		];
		const outputs = [
			new OutputPoint("Output", NODE_INPUT_OUTPUT_TYPES.any),
		];
		super("Switch", inputs, outputs);
		this.nodeClass = 'logic';
	}

	getOutput(network, data, outputIndex) {
		const condition = this.getInput(network, 0, data);
		
		if (condition) {
			return this.getInput(network, 1, data);
		} else {
			return this.getInput(network, 2, data);
		}
	}
}

module.exports = {
	NumberComparisonNode,
	SwitchNode,
};