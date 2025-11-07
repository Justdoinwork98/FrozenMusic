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

function getNodeClassColor(nodeClass) {
	switch (nodeClass) {
		case 'modifier':
			return '#ffcc00';
		case 'math':
			return '#00ccff';
		case 'geometry':
			return '#ff00cc';
		case 'output':
			return '#00ffcc';
		case 'midi':
			return '#cc00ff';
		default:
			return '#ffffff';
	}
}

const ModifierNode = ({ data, id, selected }) => {
	// Extract metadata
	const inputs = data.inputs || [];
	const outputs = data.outputs || [];
	const label = data.label || "Modifier";

	const numInputs = inputs.length;
	const numOutputs = outputs.length;
	const numHandles = numInputs + numOutputs;
	const nodeHeight = 35 + numHandles * 30;

	const nodeColor = getNodeClassColor(data.nodeClass);

	return (
		<div
			className={`node modifier-node ${selected ? "selected" : ""}`}
			style={selected ? {
				height: nodeHeight,
				border: `2px solid ${nodeColor}`,
				boxShadow: `0 0 10px ${nodeColor}40`,
			} : { height: nodeHeight }}
		>
			<strong className="node-label" style={{ backgroundColor: getNodeClassColor(data.nodeClass), boxShadow: `0 2px 5px ${nodeColor}30` }}>
				{label}
			</strong>
			<div className="node-content">

				{/* --- Outputs (Right side) --- */}
				{outputs.map((output, i) => (
					<div
						key={getHandleId(true, i)}
						style={{
							position: "absolute",
							top: 30 + i * 30,
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
								top: 30 + (i + numOutputs) * 30,
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
								style={{ background: (!input.isConnected && input.isInputRequired) ? "#9c0909ff": "#fc9", left: -12 }}
							/>
							<span style={{ marginLeft: 6, fontSize: 12, opacity: 0.8 }}>{input.name}</span>

							{/* Show input field only if not connected */}
							{!input.isConnected && !input.isInputRequired && (
								<input
									type="text"
									placeholder="value"
									className ="input-constant-field"
									defaultValue={input.defaultValue}
									onChange={(e) => {
										// Send the updated constant value to the backend
										const options = {
											nodeId: parseInt(id),
											inputIndex: i,
											value: parseFloat(e.target.value) || 0,
										};
										window.electronAPI.updateNodeInputDefault(options);
									}}
								/>
							)}
						</div>
					);
				})}
			</div>
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
	const [selectedNode, setSelectedNode] = useState(null);

	const [possibleNodes, setPossibleNodes] = useState({});

	const [nodes, setNodes, onNodesChange] = useNodesState([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState([]);

	const [menuPos, setMenuPos] = useState(null);

	const [activeNetworkIndex, setActiveNetworkIndex] = useState(0);
	const [numberOfTracks, setNumberOfTracks] = useState(0);

	// Handle an update to the number of tracks
	useEffect(() => {
		window.electronAPI.onNumberOfTracksUpdate((numTracks) => {
			console.log("Number of tracks updated:", numTracks);
			setNumberOfTracks(numTracks);
		});

		// Request the initial number of tracks
		window.electronAPI.requestNumberOfTracks();
	}, []);

	const selectNetwork = (networkIndex) => {
		setActiveNetworkIndex(networkIndex);
		window.electronAPI.setActiveNetwork(networkIndex);
	}

	// Handle a node being moved
	const onNodeDragStop = useCallback((event, node) => {
		window.electronAPI.moveNode(parseInt(node.id), node.position.x, node.position.y);
	}, []);

	const handleNetworkContextMenu = (e) => {
		e.preventDefault();
		setMenuPos({ x: e.clientX, y: e.clientY });
	};

	useEffect(() => {
		const handleKeyDown = (event) => {
			if (event.key === 'Delete' && selectedNode) {
				deleteNode(selectedNode.id);
				setSelectedNode(null);
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [selectedNode]);

	const handleSelect = (nodeType) => {
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
							isInputRequired: input.defaultValue == null, // If there's no default value, input is required
							defaultValue: input.defaultValue,
						})),
						outputs: node.outputs.map((output) => output.name),
						nodeClass: node.nodeClass,
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
			setPossibleNodes(possibleNodes);
		});
	}, []);

	// Load the initial network from backend on mount
	useEffect(() => {
		window.electronAPI.requestNodeNetwork();
		window.electronAPI.requestPossibleNodes();
	}, []);

	const onPaneClick = useCallback(() => {
		setMenu(null);
		setSelectedNode(null);
	}, [setMenu]);

	const deleteNode = (id) => {
		setMenu(null);
		window.electronAPI.deleteNode(parseInt(id));
	};

	// Handle edge changes
	const onConnect = useCallback(
		(params) => {
			const options = {
				fromNodeId: parseInt(params.source),
				outputIndex: parseInt(params.sourceHandle.split('-')[1]),
				toNodeId: parseInt(params.target),
				inputIndex: parseInt(params.targetHandle.split('-')[1]),
			}
			window.electronAPI.addConnection(options);
		},
		[setEdges]
	);

	const onEdgesDelete = useCallback((deletedEdges) => {
		deletedEdges.forEach((edge) => {
			console.log('Disconnected:', edge);
			const options = {
				fromNodeId: parseInt(edge.source),
				outputIndex: parseInt(edge.sourceHandle.split('-')[1]),
				toNodeId: parseInt(edge.target),
				inputIndex: parseInt(edge.targetHandle.split('-')[1]),
			}
			window.electronAPI.removeConnection(options);
		});
	}, []);


	return (
	<div className="networkview" onContextMenu={handleNetworkContextMenu}>

		{/* Network selector buttons */}
		<div className="network-selector" style={{
			position: "absolute",
			top: 30,
			left: 10,
			display: "flex",
			gap: "6px",
			zIndex: 10
		}}>
		{Array.from({ length: numberOfTracks }).map((_, i) => (
			<button
				key={i}
				onClick={() => selectNetwork(i)}
				className={"network-select-button" + (activeNetworkIndex === i ? " active" : "")}
				title={`Select MIDI track ${i+1}`}
			>
			{i+1}
			</button>
		))}
		</div>

		{nodes.length === 0 ? (
		// Show buttons if no nodes are loaded
		<div className="no-network-container">
			<h2 className="intro-text">Welcome to the frozen music editor!</h2>
			<h5 className="intro-text">Get started by loading a project or starting a project from a MIDI file</h5>
			<p onClick={() => window.electronAPI.openProject()} className="open-project-button">
			Load Project...
			</p>
			<p onClick={() => window.electronAPI.openMidiFile()} className="open-project-button">
			Load MIDI File...
			</p>
		</div>
		) : (
		<>
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
			onNodeClick={(event, node) => setSelectedNode(node)}
			onPaneClick={onPaneClick}
			ref={ref}
			nodes={nodes}
			edges={edges}
			nodeTypes={nodeTypes}
			onNodesChange={onNodesChange}
			onEdgesChange={onEdgesChange}
			onConnect={onConnect}
			onEdgesDelete={onEdgesDelete}
			fitView
			>
			<Controls />
			<Background variant="dots" gap={32} size={1} color="#ffffff36" />
			</ReactFlow>
		</>
		)}
	</div>
	);
}