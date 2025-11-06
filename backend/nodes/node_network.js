const { Node, InputPoint, OutputPoint } = require('./node.js');
const { CubeNode, SphereNode } = require('./mesh_nodes.js');
const { OutputNode } = require('./default_nodes.js');

class NodeNetwork {
	constructor() {
		this.nodes = new Map(); // id -> Node

		// Default network: a simple cube to output
		const cubeNode = new CubeNode();
		const outputNode = new OutputNode();
		this.addNode(cubeNode);
		this.addNode(outputNode);
		this.addConnection(cubeNode.id, 0, outputNode.id, 0);
	}

	addNode(node) {
		this.nodes.set(node.id, node);
	}

	removeNode(nodeId) {
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