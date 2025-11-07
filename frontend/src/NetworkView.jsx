import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
	MiniMap,
	Controls,
	Background,
	useNodesState,
	useEdgesState,
	addEdge,
	Handle,
	Position,
	useReactFlow,
	ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './NetworkView.css'
import debug from 'debug';
import { NetworkContextMenu } from './NetworkContextMenu.jsx';

function getHandleId(isOutput, index) {
	return (isOutput ? 'out-' : 'in-') + index;
}

const ModifierNode = ({ data, id }) => {
	// Extract metadata
	const inputs = data.inputs || [];
	const outputs = data.outputs || [];
	const label = data.label || "Modifier";

	const numInputs = inputs.length;
	const numOutputs = outputs.length;
	const numHandles = numInputs + numOutputs;
	const nodeHeight = 25 + numHandles * 30;

	return (
		<div
			className="node modifier-node"
			style={{
				height: nodeHeight,
			}}
		>
			<strong className="node-label" style={{ display: "block", marginBottom: 6 }}>
				{label}
			</strong>

			{/* --- Outputs (Right side) --- */}
			{outputs.map((output, i) => (
				<div
					key={getHandleId(true, i)}
					style={{
						position: "absolute",
						top: 40 + i * 30,
						right: 8,
						display: "flex",
						alignItems: "center",
						justifyContent: "flex-end",
						width: "100%",
					}}
				>
					<span style={{ marginRight: 6, fontSize: 12, opacity: 0.8 }}>{output}</span>
					<Handle
						type="source"
						position={Position.Right}
						id={`out-${i}`}
						style={{ background: "#9cf", right: -12 }}
					/>
				</div>
			))}

			{/* --- Inputs (Left side) --- */}
			{inputs.map((input, i) => {
				return (
					<div
						key={`in-${i}`}
						style={{
							position: "absolute",
							top: 40 + (i + numOutputs) * 30,
							left: 8,
							display: "flex",
							alignItems: "center",
							width: "100%",
						}}
					>
						<Handle
							type="target"
							position={Position.Left}
							id={getHandleId(false, i)}
							style={{ background: "#fc9", left: -12 }}
						/>
						<span style={{ marginLeft: 6, fontSize: 12, opacity: 0.8 }}>{input.name}</span>

						{/* Show input field only if not connected */}
						{!input.isConnected && !input.isInputRequired && (
							<input
								type="text"
								placeholder="value"
								className ="input-constant-field"
							/>
						)}
					</div>
				);
			})}
		</div>
	);
};

const nodeTypes = {
	modifierNode: ModifierNode,
};

export default function NetworkView() {
	const ref = React.useRef(null);
	const { project } = useReactFlow(); // Project client coordinates to node pane coordinates

	const [menu, setMenu] = useState(null);

	const [possibleNodes, setPossibleNodes] = useState({});

	// Initial example nodes and edges
	const initialNodes = [
		{ id: '1', type: "modifierNode", position: { x: 250, y: 5 }, data: { label: 'Cube Mesh' }, inputs: [{ name: 'Input 1', isConnected: true}], outputs: ['Mesh'] },
		{ id: '2', type: "modifierNode", position: { x: 400, y: 100 }, data: { label: 'Modifier Node', inputs: [{ name: 'Input 1', isConnected: true}, { name: 'Input 2', isConnected: false}, { name: 'Input 3', isConnected: true}, { name: 'Input 4', isConnected: false}, { name: 'Input 5', isConnected: false}], outputs: ['Output 1', 'Output 2', 'Output 3', 'Output 4'] } },
	];

	const initialEdges = [{ id: 'e1-2', source: '1', target: '2', sourceHandle: getHandleId(true, 0), targetHandle: getHandleId(false, 0) }];

	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

	const onConnect = useCallback(
		(params) => setEdges((eds) => addEdge(params, eds)),
		[setEdges]
	);
	const [menuPos, setMenuPos] = useState(null);

	// Handle a node being moved
	const onNodeDragStop = useCallback((event, node) => {
		window.electronAPI.moveNode(parseInt(node.id), node.position.x, node.position.y);
	}, []);

	const handleNetworkContextMenu = (e) => {
		e.preventDefault();
		setMenuPos({ x: e.clientX, y: e.clientY });
	};

	const handleSelect = (nodeType) => {
		console.log("Create node:", nodeType);
		setMenuPos(null);
    	const position = project({ x: menuPos.x, y: menuPos.y });
		const options = {
			x: position.x,
			y: position.y,
			nodeType: nodeType,
		};
		window.electronAPI.createNode(options);
	};

	// Subcribe to backend updates of node system
	useEffect(() => {
		window.electronAPI.onNodeNetworkUpdate((nodeList) => {
			// Update nodes and edges based on data from backend

			let updatedNodes = [];
			let updatedEdges = [];
			
			for (const node of nodeList) {
				let newNode = {
					id: node.id.toString(),
					type: "modifierNode",
					position: node.position,
					data: {
						label: node.name,
						inputs: node.inputs.map((input, index) => ({
							name: input.name,
							isConnected: input.connection != null,
							isInputRequired: input.defaultValue == null // If there's no default value, input is required
						})),
						outputs: node.outputs.map((output) => output.name),
					}
				};
				updatedNodes.push(newNode);
			}

			// Now we need to create edges based on connections
			for (const node of nodeList) {
				node.outputs.forEach((output, outputIndex) => {
					output.connections.forEach((conn) => {
						const edgeId = `e${node.id}-${conn.nodeId}-out${outputIndex}-in${conn.inputIndex}`;
						updatedEdges.push({
							id: edgeId,
							source: node.id.toString(),
							target: conn.nodeId.toString(),
							sourceHandle: getHandleId(true, outputIndex),
							targetHandle: getHandleId(false, conn.inputIndex),
						});
					});
				});
			}

			setNodes(updatedNodes);
			setEdges(updatedEdges);
		});
	}, []);

	// Subscribe to possible nodes update from backend
	useEffect(() => {
		window.electronAPI.onPossibleNodesUpdate((possibleNodes) => {
			console.log("Received possible nodes update:", possibleNodes);
			setPossibleNodes(possibleNodes);
		});
	}, []);

	// Load the initial network from backend on mount
	useEffect(() => {
		window.electronAPI.requestNodeNetwork();
		window.electronAPI.requestPossibleNodes();
	}, []);

	const onPaneClick = useCallback(() => setMenu(null), [setMenu]);

	const deleteNode = (id) => {
		setMenu(null);
		window.electronAPI.deleteNode(parseInt(id));
	};



	return (
		<div className="networkview" onContextMenu={handleNetworkContextMenu}>
			{ /* Render the context menu if menuPos is set */ }
			{menuPos && (
				<NetworkContextMenu
					x={menuPos.x}
					y={menuPos.y}
					onClose={() => setMenuPos(null)}
					onSelect={handleSelect}
					possibleNodes={possibleNodes}
				/>
			)}
			
			<ReactFlow
				onNodeDragStop={onNodeDragStop}
				onPaneClick={onPaneClick}
				ref={ref}
				nodes={nodes}
				edges={edges}
				nodeTypes={nodeTypes}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				fitView
			>
				<Controls />
				<Background 
					variant="dots"
					gap={32}
					size={1}
					color="#ffffff36"
				/>
			</ReactFlow>
		</div>
	);
}