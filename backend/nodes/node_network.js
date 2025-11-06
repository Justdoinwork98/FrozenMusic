const { Node, InputPoint, OutputPoint } = require('./node.js');
const { CubeNode, SphereNode } = require('./mesh_nodes.js');
const { OutputNode } = require('./default_nodes.js');

const NODE_TYPES = {
	"Cube": CubeNode,
	"Sphere": SphereNode,
	"Output": OutputNode,
};

class NodeNetwork {
	constructor() {
		this.nodes = new Map(); // id -> Node

		// Default network: a simple cube to output
		const cubeNode = new CubeNode();
		const outputNode = new OutputNode();
		this.outputNodeId = outputNode.id;
		this.addNode(cubeNode);
		this.addNode(outputNode);
		this.addConnection(cubeNode.id, 0, outputNode.id, 0);
	}

	getAllPossibleNodeTypes() {
		return Object.keys(NODE_TYPES);
	}

	runNetwork(midiData) {
		// Evaluate the output node
		const outputNode = this.nodes.get(this.outputNodeId);
		return outputNode.getOutput(this, midiData, 0);
	}

	addNode(node) {
		this.nodes.set(node.id, node);
	}

	createNode(nodeType) {
		const NodeClass = NODE_TYPES[nodeType];
		if (!NodeClass) {
			throw new Error('Unknown node type: ' + nodeType);
		}
		const node = new NodeClass();
		this.addNode(node);
		return node;
	}

	removeNode(nodeId) {
		// Check that it isn't the output node
		if (nodeId === this.outputNodeId) {
			throw new Error('Cannot delete the output node');
		}

		this.nodes.delete(nodeId);

		// Remove connections to this node
		this.nodes.forEach(node => {
			node.onNodeDeleted(nodeId);
		});
	}

	addConnection(fromNodeId, outputIndex, toNodeId, inputIndex) {
		const fromNode = this.nodes.get(fromNodeId);
		const toNode = this.nodes.get(toNodeId);

		if (!fromNode || !toNode) {
			throw new Error('Invalid node IDs for connection: ' + fromNodeId + ' to ' + toNodeId);
		}

		// Check that the output and input types match
		const fromOutputType = fromNode.outputs[outputIndex].type;
		const toInputType = toNode.inputs[inputIndex].type;

		if (fromOutputType !== toInputType) {
			throw new Error(`Type mismatch: cannot connect ${fromOutputType} to ${toInputType}`);
		}

		fromNode.connectOutput(outputIndex, toNodeId, inputIndex);
		toNode.connectInput(inputIndex, fromNodeId, outputIndex);
	}

	removeConnection(fromNodeId, outputIndex, toNodeId, inputIndex) {
		const fromNode = this.nodes.get(fromNodeId);
		const toNode = this.nodes.get(toNodeId);

		if (!fromNode || !toNode) {
			throw new Error('Invalid node IDs for disconnection: ' + fromNodeId + ' to ' + toNodeId);
		}

		fromNode.disconnectOutput(outputIndex, toNodeId, inputIndex);
		toNode.disconnectInput(inputIndex, fromNodeId, outputIndex);
	}

	toJSON() {
		const data = {
			nodes: Array.from(this.nodes.values()).map(node => node.toJSON()),
		};
		return data;
	}

	static fromJSON(data) {
		const network = new NodeNetwork();
		data.nodes.forEach(nodeData => {
			const node = Node.fromJSON(nodeData);
			network.addNode(node);
		});
		return network;
	}
}

module.exports = {
	NodeNetwork,
};