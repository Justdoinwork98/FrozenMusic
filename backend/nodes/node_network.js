const { Node, InputPoint, OutputPoint } = require('./node.js');
const { CombineMeshNode, PreviousNoteMeshNode, CubeNode, SphereNode } = require('./mesh_nodes.js');
const { OutputNode, MidiInputNode } = require('./default_nodes.js');
const { TranslateModifier, ScaleModifier, RotateModifier } = require('./modifier_nodes.js');
const { AddNode, SubtractNode, MultiplyNode, DivideNode, MapNode, ClampNode, RandomNode, SineNode, CosineNode,
	FloorNode, MinNode, MaxNode, PowerNode, CeilNode, AbsoluteNode, ModuloNode
 } = require('./math_nodes.js');
const { NumberComparisonNode, SwitchNode, } = require('./logic_nodes.js');

const NODE_MENU = {
	"Geometry": ["Cube", "Sphere", "Combine meshes", "Previous Note Mesh"],
	"Modifiers": ["Translate", "Scale", "Rotate"],
	"Inputs": ["Constant", "MIDI data"],
	"Math": ["Add", "Subtract", "Multiply", "Divide", "Map", "Clamp", "Random", "Sine", "Cosine",
		"Floor", "Ceil", "Absolute", "Modulo", "Min", "Max", "Power"
	],
	"Logic": ["Number Comparison", "Switch"],
};

const NODE_TYPES = {
	"Cube": CubeNode,
	"Sphere": SphereNode,
	"Combine meshes": CombineMeshNode,
	"Previous Note Mesh": PreviousNoteMeshNode,
	//
	"Output": OutputNode,
	"Translate": TranslateModifier,
	"Scale": ScaleModifier,
	"Rotate": RotateModifier,
	// maths
	"Add": AddNode,
	"Subtract": SubtractNode,
	"Multiply": MultiplyNode,
	"Divide": DivideNode,
	"Map": MapNode,
	"Clamp": ClampNode,
	"Random": RandomNode,
	"Sine": SineNode,
	"Cosine": CosineNode,
	"Floor": FloorNode,
	"Min": MinNode,
	"Max": MaxNode,
	"Power": PowerNode,
	"Ceil": CeilNode,
	"Absolute": AbsoluteNode,
	"Modulo": ModuloNode,
	// inputs
	"MIDI data": MidiInputNode,
	// logic
	"Number Comparison": NumberComparisonNode,
	"Switch": SwitchNode,
};

class NodeNetwork {
	constructor() {
		this.nodes = new Map(); // id -> Node
		this.isConnected = false;
	}

	makeDefaultNetwork() {
		this.nodes.clear();

		// Default network: a simple cube to output
		const cubeNode = new CubeNode();
		const outputNode = new OutputNode();
		cubeNode.setPosition(-200, 0);
		outputNode.setPosition(200, 0);
		this.outputNodeId = outputNode.id;
		this.addNode(cubeNode);
		this.addNode(outputNode);
		this.addConnection(cubeNode.id, 0, outputNode.id, 0);
	}

	verifyOrAddOutputNode() {
		// Ensure there is an output node
		let hasOutputNode = false;
		this.nodes.forEach(node => {
			if (node instanceof OutputNode) {
				hasOutputNode = true;
				this.outputNodeId = node.id;
			}
		});
		if (!hasOutputNode) {
			const newOutputNode = new OutputNode();
			this.addNode(newOutputNode);
			this.outputNodeId = newOutputNode.id;
		}
	}

	getNodeList() {
		return Array.from(this.nodes.values());
	}

	runNetwork(data) {
		// Evaluate the output node
		try {
			const outputNode = this.nodes.get(this.outputNodeId);
			const output = outputNode.getOutput(this, data, 0);
			for (const v of output.vertices) {
				if (isNaN(v.x) || isNaN(v.y) || isNaN(v.z)) {
					console.log("Invalid vertex data detected:", v);
					//throw new Error('Output mesh contains invalid vertex data (NaN)');
				}
			}
			this.isConnected = true;
			return output;
		} catch (e) {
			//console.log("Error during network run:", e);
			this.isConnected = false;
			return null;
		}
	}

	addNode(node) {
		console.log("Adding node to network with id " + node.id);
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

		// Disconnect previous connections to the input since it can only have one
		if (toNode.inputs[inputIndex].connection) {
			const prevConnection = toNode.inputs[inputIndex].connection;
			this.nodes.get(prevConnection.nodeId).disconnectOutput(prevConnection.outputIndex, toNodeId, inputIndex);
			toNode.disconnectInput(inputIndex);
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
			const node = Node.fromJSON(nodeData, NODE_TYPES);
			network.addNode(node);
		});
		return network;
	}
}

module.exports = {
	NodeNetwork,
	NODE_MENU,
};