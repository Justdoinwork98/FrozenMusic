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

const ModifierNode = ({ data }) => {
    const numInputs = data.numInputs || 1;
    const numOutputs = data.numOutputs || 1;

    return (
        <div className="modifier-node">
            <strong>{data.label}</strong>
            {Array.from({ length: numInputs }).map((_, i) => (
                <Handle
                    key={`in-${i}`}
                    type="target"
                    position={Position.Left}
                    id={`in-${i}`}
                    style={{ top: 30 + i * 20 }}
                />
            ))}

            {Array.from({ length: numOutputs }).map((_, i) => (
                <Handle
                    key={`out-${i}`}
                    type="source"
                    position={Position.Right}
                    id={`out-${i}`}
                    style={{ top: 30 + i * 20 }}
                />
            ))}

            <Handle
                type="source"
                position={Position.Right}
                id="meshOut"
                style={{ bottom: 0, background: "#7cf" }}
            />
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
        { id: '2', type: "modifierNode", position: { x: 400, y: 100 }, data: { label: 'Modifier Node', numInputs: 1, numOutputs: 2 } },
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
                <Background variant="lines" gap={16} size={1} />
            </ReactFlow>
            {menu && (
                <div className="context-menu">
                    <div className ="context-menu-item" onClick={() => deleteNode(menu.id)}>Delete Node</div>
                </div>
            )}
        </div>
    );
}