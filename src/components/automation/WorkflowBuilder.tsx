import React, { useCallback, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
  type OnConnect,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import TriggerNode from './nodes/TriggerNode';
import ConditionNode from './nodes/ConditionNode';
import ActionNode from './nodes/ActionNode';
import DelayNode from './nodes/DelayNode';
import ScriptNode from './nodes/ScriptNode';
import NoteNode from './nodes/NoteNode';
import SwitchNode from './nodes/SwitchNode';
import LoopNode from './nodes/LoopNode';
import { NodeToolbar } from './NodeToolbar';
import { NodeConfigPanel } from './panels/NodeConfigPanel';

import type {
  WorkflowNode as WfNode,
  WorkflowEdge as WfEdge,
  WorkflowNodeType,
  WorkflowNodeConfig,
  TriggerType,
} from '../../types';

/* ------------------------------------------------------------------ */
/*  Node type registry                                                 */
/* ------------------------------------------------------------------ */

const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  condition: ConditionNode,
  action: ActionNode,
  delay: DelayNode,
  script: ScriptNode,
  note: NoteNode,
  switch: SwitchNode,
  loop: LoopNode,
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

let idCounter = 0;
function nextId(prefix: string) {
  return `${prefix}_${Date.now()}_${++idCounter}`;
}

function wfNodesToFlowNodes(wfNodes: WfNode[]): Node[] {
  return wfNodes.map((n) => ({
    id: n.id,
    type: n.type,
    position: n.position,
    data: { label: n.label, config: n.config, metadata: n.metadata },
  }));
}

function wfEdgesToFlowEdges(wfEdges: WfEdge[]): Edge[] {
  return wfEdges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle ?? undefined,
    label: e.label ?? undefined,
    animated: true,
    style: { strokeWidth: 2 },
  }));
}

function flowNodesToWfNodes(flowNodes: Node[]): WfNode[] {
  return flowNodes.map((n) => ({
    id: n.id,
    type: (n.type ?? 'action') as WorkflowNodeType,
    label: (n.data as any)?.label ?? '',
    position: n.position,
    config: (n.data as any)?.config ?? {},
    metadata: (n.data as any)?.metadata ?? {},
  }));
}

function flowEdgesToWfEdges(flowEdges: Edge[]): WfEdge[] {
  return flowEdges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: (e.sourceHandle as string) ?? null,
    label: (e.label as string) ?? null,
  }));
}

const DEFAULT_LABELS: Record<WorkflowNodeType, string> = {
  trigger: 'Tetikleyici',
  condition: 'Koşul',
  action: 'Yeni Aksiyon',
  delay: 'Bekleme',
  script: 'Script',
  note: 'Not',
  switch: 'Switch',
  loop: 'Döngü',
};

/* ------------------------------------------------------------------ */
/*  WorkflowBuilder – Inner (needs ReactFlowProvider)                  */
/* ------------------------------------------------------------------ */

interface WorkflowBuilderInnerProps {
  initialNodes: WfNode[];
  initialEdges: WfEdge[];
  triggerType: TriggerType;
  onTriggerTypeChange: (type: TriggerType) => void;
  onChange: (nodes: WfNode[], edges: WfEdge[]) => void;
  readOnly?: boolean;
}

const WorkflowBuilderInner: React.FC<WorkflowBuilderInnerProps> = ({
  initialNodes,
  initialEdges,
  triggerType,
  onTriggerTypeChange,
  onChange,
  readOnly = false,
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, updateNodeInternals } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState(wfNodesToFlowNodes(initialNodes));
  const [edges, setEdges, onEdgesChange] = useEdgesState(wfEdgesToFlowEdges(initialEdges));
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const hasTrigger = nodes.some((n) => n.type === 'trigger');

  // Propagate changes to parent
  const propagateChange = useCallback(
    (newNodes: Node[], newEdges: Edge[]) => {
      onChange(flowNodesToWfNodes(newNodes), flowEdgesToWfEdges(newEdges));
    },
    [onChange],
  );

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => {
        const newEdges = addEdge(
          {
            ...connection,
            id: nextId('edge'),
            animated: true,
            style: { strokeWidth: 2 },
          },
          eds,
        );
        propagateChange(nodes, newEdges);
        return newEdges;
      });
    },
    [setEdges, nodes, propagateChange],
  );

  // Add node via click or drag
  const handleAddNode = useCallback(
    (type: WorkflowNodeType, position?: { x: number; y: number }) => {
      if (type === 'trigger' && hasTrigger) return;

      const pos = position ?? { x: 250, y: nodes.length * 120 + 50 };
      const newNode: Node = {
        id: nextId(type),
        type,
        position: pos,
        data: { label: DEFAULT_LABELS[type], config: {} },
      };

      setNodes((nds) => {
        const updated = [...nds, newNode];
        propagateChange(updated, edges);
        return updated;
      });
    },
    [hasTrigger, nodes.length, setNodes, edges, propagateChange],
  );

  // Drop handler for drag-from-toolbar
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('application/reactflow') as WorkflowNodeType;
      if (!type) return;

      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      handleAddNode(type, position);
    },
    [screenToFlowPosition, handleAddNode],
  );

  // Node click → open config panel
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  // Config panel handlers
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  const handleLabelChange = useCallback(
    (label: string) => {
      setNodes((nds) => {
        const updated = nds.map((n) =>
          n.id === selectedNodeId ? { ...n, data: { ...n.data, label } } : n,
        );
        propagateChange(updated, edges);
        return updated;
      });
    },
    [selectedNodeId, setNodes, edges, propagateChange],
  );

  const handleConfigChange = useCallback(
    (config: WorkflowNodeConfig) => {
      setNodes((nds) => {
        const updated = nds.map((n) =>
          n.id === selectedNodeId ? { ...n, data: { ...n.data, config } } : n,
        );
        propagateChange(updated, edges);
        return updated;
      });
      // Re-register dynamic handles (e.g. switch cases) in React Flow's internal store
      if (selectedNodeId) {
        updateNodeInternals(selectedNodeId);
      }
    },
    [selectedNodeId, setNodes, edges, propagateChange, updateNodeInternals],
  );

  const handleDeleteNode = useCallback(() => {
    if (!selectedNodeId) return;
    setNodes((nds) => {
      const updated = nds.filter((n) => n.id !== selectedNodeId);
      const updatedEdges = edges.filter(
        (e) => e.source !== selectedNodeId && e.target !== selectedNodeId,
      );
      setEdges(updatedEdges);
      propagateChange(updated, updatedEdges);
      return updated;
    });
    setSelectedNodeId(null);
  }, [selectedNodeId, setNodes, setEdges, edges, propagateChange]);

  // Sync node changes
  const handleNodesChange = useCallback(
    (changes: any) => {
      onNodesChange(changes);
      // Debounced propagation via setTimeout to avoid excessive calls
      setTimeout(() => {
        setNodes((nds) => {
          propagateChange(nds, edges);
          return nds;
        });
      }, 0);
    },
    [onNodesChange, setNodes, edges, propagateChange],
  );

  const handleEdgesChange = useCallback(
    (changes: any) => {
      onEdgesChange(changes);
      setTimeout(() => {
        setEdges((eds) => {
          propagateChange(nodes, eds);
          return eds;
        });
      }, 0);
    },
    [onEdgesChange, setEdges, nodes, propagateChange],
  );

  return (
    <div ref={reactFlowWrapper} className="h-[600px] border border-border rounded-lg relative bg-muted/20">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        fitView
        deleteKeyCode={readOnly ? null : 'Delete'}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={!readOnly}
        snapToGrid
        snapGrid={[15, 15]}
      >
        <Background gap={15} size={1} />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(n) => {
            switch (n.type) {
              case 'trigger': return '#f59e0b';
              case 'condition': return '#a855f7';
              case 'action': return '#3b82f6';
              case 'delay': return '#6b7280';
              case 'script': return '#10b981';
              case 'note': return '#eab308';
              case 'switch': return '#06b6d4';
              case 'loop': return '#f43f5e';
              default: return '#6b7280';
            }
          }}
          maskColor="rgba(0,0,0,0.1)"
          className="!bg-card !border-border"
        />
        {!readOnly && (
          <Panel position="top-left">
            <NodeToolbar onAddNode={handleAddNode} hasTrigger={hasTrigger} />
          </Panel>
        )}
      </ReactFlow>

      {/* Config panel slide-over */}
      {selectedNode && !readOnly && (
        <NodeConfigPanel
          nodeId={selectedNode.id}
          nodeType={selectedNode.type as WorkflowNodeType}
          label={(selectedNode.data as any)?.label ?? ''}
          config={(selectedNode.data as any)?.config ?? {}}
          triggerType={triggerType}
          onLabelChange={handleLabelChange}
          onConfigChange={handleConfigChange}
          onTriggerTypeChange={onTriggerTypeChange}
          onDelete={handleDeleteNode}
          onClose={() => setSelectedNodeId(null)}
        />
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  WorkflowBuilder – Public (with ReactFlowProvider)                  */
/* ------------------------------------------------------------------ */

export interface WorkflowBuilderProps {
  initialNodes: WfNode[];
  initialEdges: WfEdge[];
  triggerType: TriggerType;
  onTriggerTypeChange: (type: TriggerType) => void;
  onChange: (nodes: WfNode[], edges: WfEdge[]) => void;
  readOnly?: boolean;
}

export const WorkflowBuilder: React.FC<WorkflowBuilderProps> = (props) => {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderInner {...props} />
    </ReactFlowProvider>
  );
};
