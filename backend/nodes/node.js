class InputPoint {
	constructor(name, type, defaultValue) {
		this.name = name;
		this.type = type;
		this.defaultValue = defaultValue;
		// What this input is connected to (either null or a nodeId, outputIndex)
		this.connection = null;
	}

	connect(nodeId, outputIndex) {
		this.connection = { nodeId, outputIndex };
	}

	disconnect() {
		this.connection = null;
	}

	toJSON() {
		const data = {
			name: this.name,
			type: this.type,
			connection: this.connection,
		};
		return data;
	}

	static fromJSON(data) {
		const inputPoint = new InputPoint(data.name, data.type);
		inputPoint.connection = data.connection;
		return inputPoint;
	}
}

class OutputPoint {
	constructor(name, type) {
		this.name = name;
		this.type = type;
		this.connections = []; // list of { nodeId, inputIndex }
	}

	connect(nodeId, inputIndex) {
		this.connections.push({ nodeId, inputIndex });
	}

	disconnect(nodeId, inputIndex) {
		this.connections = this.connections.filter(
			conn => !(conn.nodeId === nodeId && conn.inputIndex === inputIndex)
		);
	}

	toJSON() {
		const data = {
			name: this.name,
			type: this.type,
			connections: this.connections,
		};
		return data;
	}

	static fromJSON(data) {
		const outputPoint = new OutputPoint(data.name, data.type);
		outputPoint.connections = data.connections;
		return outputPoint;
	}
}

class Node {
	constructor(name, inputs = [], outputs = []) {
		this.name = name;
		this.inputs = inputs;
		this.outputs = outputs;
		this.id = Node.nextId++;
	}

	// Find the value of an input by evaluating the connected node
	getInput(inputIndex, midiData) {
		if (inputIndex < 0 || inputIndex >= this.inputs.length) {
			throw new Error('Invalid input index: ' + inputIndex);
		}

		const inputConnection = this.inputs[inputIndex].connection;
		const inputNode = network.nodes.get(inputConnection.nodeId);
		const inputValue = inputNode.getOutput(network, midiData, inputConnection.outputIndex);

		return inputValue;
	}

	// Evaluate the node and return the output data for the given output index
	getOutput(network, midiData, outputIndex) {
		if (outputIndex < 0 || outputIndex >= this.outputs.length) {
			throw new Error('Invalid output index: ' + outputIndex);
		}

		// We want to evaluate the node here and return the output data
		throw new Error('getOutput() must be implemented by subclass');
	}

	onNodeDeleted(nodeId) {
		// Disconnect inputs connected to the deleted node
		this.inputs.forEach(input => {
			if (input.connection && input.connection.nodeId === nodeId) {
				input.disconnect();
			}
		});

		// Only keep output connections that are not to the deleted node
		this.outputs.forEach(output => {
			output.connections = output.connections.filter(
				conn => conn.nodeId !== nodeId
			);
		});
	}

	connectInput(inputIndex, fromNodeId, fromOutputIndex) {
		if (inputIndex < 0 || inputIndex >= this.inputs.length) {
			throw new Error('Invalid input index: ' + inputIndex);
		}

		this.inputs[inputIndex].connect(fromNodeId, fromOutputIndex);
	}

	connectOutput(outputIndex, toNodeId, toInputIndex) {
		if (outputIndex < 0 || outputIndex >= this.outputs.length) {
			throw new Error('Invalid output index: ' + outputIndex);
		}

		this.outputs[outputIndex].connect(toNodeId, toInputIndex);
	}

	disconnectOutput(outputIndex, toNodeId, toInputIndex) {
		if (outputIndex < 0 || outputIndex >= this.outputs.length) {
			throw new Error('Invalid output index: ' + outputIndex);
		}

		this.outputs[outputIndex].disconnect(toNodeId, toInputIndex);
	}

	disconnectInput(inputIndex, fromNodeId, fromOutputIndex) {
		if (inputIndex < 0 || inputIndex >= this.inputs.length) {
			throw new Error('Invalid input index: ' + inputIndex);
		}

		this.inputs[inputIndex].disconnect();
	}

	toJSON() {
		return {
			id: this.id,
			name: this.name,
			inputs: this.inputs.map(input => input.toJSON()),
			outputs: this.outputs.map(output => output.toJSON()),
		};
	}

	static fromJSON(data) {
		const inputs = data.inputs.map(inputData => InputPoint.fromJSON(inputData));
		const outputs = data.outputs.map(outputData => OutputPoint.fromJSON(outputData));
		const node = new Node(data.name, inputs, outputs);
		node.id = data.id;

		// Make sure that the nextId is always ahead
		if (node.id >= Node.nextId) {
			Node.nextId = node.id + 1;
		}

		return node;
	}
}

Node.nextId = 1;

module.exports = {
	Node,
	InputPoint,
	OutputPoint
};