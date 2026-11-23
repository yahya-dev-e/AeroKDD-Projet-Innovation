import {
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useMemo } from 'react'
import type { KddEgoGraphResult } from '../../engines/graphBuilder'

interface EgoNodeData extends Record<string, unknown> {
  kddId: string
  name: string
  subtitle: string
  variant: 'in' | 'center' | 'out'
}

function EgoKddNode({ data }: NodeProps<Node<EgoNodeData>>) {
  const palette =
    data.variant === 'center'
      ? 'bg-[var(--akdd-navy-800)] text-[var(--akdd-text-inverse)] border-[var(--akdd-navy-950)] shadow-[var(--akdd-shadow-md)]'
      : data.variant === 'in'
        ? 'bg-[var(--akdd-dir-in-bg)] text-[var(--akdd-dir-in-text)] border-[var(--akdd-dir-in-border)]'
        : 'bg-[var(--akdd-dir-out-bg)] text-[var(--akdd-dir-out-text)] border-[var(--akdd-dir-out-border)]'

  return (
    <div
      className={`flex flex-col gap-0.5 rounded-[var(--akdd-radius-md)] border-2 px-3 py-2 text-left transition-shadow hover:shadow-[var(--akdd-shadow-md)] ${palette}`}
      style={{ width: data.variant === 'center' ? 280 : 270 }}
    >
      {data.variant !== 'in' && (
        <Handle type="target" position={Position.Left} className="!bg-[var(--akdd-navy-600)]" />
      )}
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-bold">{data.kddId}</span>
        <span className="text-[10px] opacity-80 truncate">{data.subtitle}</span>
      </div>
      <div className="text-xs font-semibold leading-snug line-clamp-2">{data.name}</div>
      {data.variant !== 'out' && (
        <Handle type="source" position={Position.Right} className="!bg-[var(--akdd-navy-600)]" />
      )}
    </div>
  )
}

const NODE_TYPES = { egoNode: EgoKddNode }

export interface EgoSchemaFlowProps {
  ego: KddEgoGraphResult
  onSelectKdd?: (kddId: string) => void
  className?: string
}

export function EgoSchemaFlow({ ego, onSelectKdd, className = '' }: EgoSchemaFlowProps) {
  const { nodes, edges } = useMemo(() => {
    if (!ego.selectedKdd) return { nodes: [], edges: [] }

    const pitch = 84
    const inCount = ego.incoming.length
    const outCount = ego.outgoing.length
    const maxN = Math.max(1, inCount, outCount)
    const totalH = (maxN - 1) * pitch
    const centerY = totalH / 2

    const xLeft = 20
    const xCenter = 400
    const xRight = 790

    const builtNodes: Node<EgoNodeData>[] = [
      {
        id: 'CENTER',
        type: 'egoNode',
        position: { x: xCenter, y: centerY },
        data: {
          kddId: ego.selectedKdd.id,
          name: ego.selectedKdd.name,
          subtitle: `${inCount} entr. · ${outCount} sort.`,
          variant: 'center',
        },
      },
    ]

    const builtEdges: Edge[] = []

    const inOffset = ((maxN - inCount) * pitch) / 2
    ego.incoming.forEach((item, idx) => {
      const nodeId = `IN-${idx}-${item.relation.sourceId}`
      builtNodes.push({
        id: nodeId,
        type: 'egoNode',
        position: { x: xLeft, y: inOffset + idx * pitch },
        data: {
          kddId: item.relation.sourceId,
          name: item.relation.sourceName,
          subtitle: `${item.relation.id} · ${item.roleLabel}`,
          variant: 'in',
        },
      })
      builtEdges.push({
        id: `E-IN-${idx}-${item.relation.id}`,
        source: nodeId,
        target: 'CENTER',
        style: { stroke: '#0070c0', strokeWidth: 1.75 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#0070c0' },
      })
    })

    const outOffset = ((maxN - outCount) * pitch) / 2
    ego.outgoing.forEach((item, idx) => {
      const nodeId = `OUT-${idx}-${item.relation.targetId}`
      builtNodes.push({
        id: nodeId,
        type: 'egoNode',
        position: { x: xRight, y: outOffset + idx * pitch },
        data: {
          kddId: item.relation.targetId,
          name: item.relation.targetName,
          subtitle: `${item.relation.id} · ${item.roleLabel}`,
          variant: 'out',
        },
      })
      builtEdges.push({
        id: `E-OUT-${idx}-${item.relation.id}`,
        source: 'CENTER',
        target: nodeId,
        style: { stroke: '#c00000', strokeWidth: 1.75 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#c00000' },
      })
    })

    return { nodes: builtNodes, edges: builtEdges }
  }, [ego])

  return (
    <div className={`h-full w-full ${className}`}>
      <ReactFlow
        key={ego.selectedKdd?.id ?? 'empty'}
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        fitView
        fitViewOptions={{ padding: 0.16 }}
        minZoom={0.2}
        maxZoom={1.8}
        onNodeClick={(_, node) => {
          const data = node.data as EgoNodeData
          if (data.variant !== 'center' && onSelectKdd) {
            onSelectKdd(data.kddId)
          }
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={18} size={1} color="#e2e8f0" />
        <Controls />
        <MiniMap
          pannable
          zoomable
          nodeColor={(n) => {
            const v = (n.data as EgoNodeData)?.variant
            if (v === 'center') return '#183b5e'
            if (v === 'in') return '#0070c0'
            return '#c00000'
          }}
        />
      </ReactFlow>
    </div>
  )
}
