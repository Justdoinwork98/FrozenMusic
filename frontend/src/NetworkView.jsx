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
} from 'reactflow';
import 'reactflow/dist/style.css';
import './NetworkView.css'


// Custom Nodes

const MeshNode = ({ data }) => {
	return (
		<div className="mesh-node">
			<strong>Mesh</strong>
			<Handle type="source" position={Position.Right} id="meshOut" />
		</div>
	);
};

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
					key={`out-${i}`}
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
							id={`in-${i}`}
							style={{ background: "#fc9", left: -12 }}
						/>
						<span style={{ marginLeft: 6, fontSize: 12, opacity: 0.8 }}>{input.name}</span>

						{/* Show input field only if not connected */}
						{!input.isConnected && (
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
	meshNode: MeshNode,
	modifierNode: ModifierNode,
};

export default function NetworkView() {
	const ref = React.useRef(null);
	const [menu, setMenu] = useState(null);

	// Initial example nodes and edges
	const initialNodes = [
		{ id: '1', type: "meshNode", position: { x: 250, y: 5 }, data: { label: 'Cube Mesh' } },
		{ id: '2', type: "modifierNode", position: { x: 400, y: 100 }, data: { label: 'Modifier Node', inputs: [{ name: 'Input 1', isConnected: true}, { name: 'Input 2', isConnected: false}, { name: 'Input 3', isConnected: true}, { name: 'Input 4', isConnected: false}, { name: 'Input 5', isConnected: false}], outputs: ['Output 1', 'Output 2', 'Output 3', 'Output 4'] } },
	];

	const initialEdges = [{ id: 'e1-2', source: '1', target: '2', sourceHandle: 'meshOut' }];

	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

	const onConnect = useCallback(
		(params) => setEdges((eds) => addEdge(params, eds)),
		[setEdges]
	);

	// ======== Context Menu  ========
	// taken https://reactflow.dev/examples/interaction/context-menu
	const onNodeContextMenu = useCallback(
		(event, node) => {
			// Prevent native context menu from showing
			event.preventDefault();

			// Calculate position of the context menu. We want to make sure it
			// doesn't get positioned off-screen.
			const pane = ref.current.getBoundingClientRect();
			setMenu({
				id: node.id,
				top: event.clientY < pane.height - 200 && event.clientY,
				left: event.clientX < pane.width - 200 && event.clientX,
				right: event.clientX >= pane.width - 200 && pane.width - event.clientX,
				bottom:
					event.clientY >= pane.height - 200 && pane.height - event.clientY,
			});
		},
		[setMenu],
	);

	const onPaneClick = useCallback(() => setMenu(null), [setMenu]);

	const deleteNode = (id) => {
		setNodes((nds) => nds.filter((n) => n.id !== id));
		setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
		setMenu(null);
	};

	// ======== End Context Menu  ========



	return (
		<div className="networkview" >
			<button onClick={() => {
				setNodes((nds) => [
					...nds,
					{ id: (nds.length + 1).toString(), type: "modifierNode", position: { x: 200, y: Math.random() * 200 }, data: { label: 'New Modifier', numInputs: 1, numOutputs: 1 } },
				]);
			}}>Add Modifier Node</button>
			<ReactFlow
				onNodeContextMenu={onNodeContextMenu}
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
			{menu && (
				<div className="context-menu">
					<div className ="context-menu-item" onClick={() => deleteNode(menu.id)}>Delete Node</div>
				</div>
			)}
		</div>
	);
}