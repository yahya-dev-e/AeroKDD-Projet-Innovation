import {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useMemo } from 'react'
import type { CentralityLevel, TopDownAnalysisResult } from '../../engines/topDownEngine'

interface TreeNodeData extends Record<string, unknown> {
  tier: 'objective' | 'subsystem' | 'lever'
  title: string
  subtitle: string
  leverId?: string
  isDirect?: boolean
  badgeLevel?: CentralityLevel
}

function TopDownTreeNode({ data }: NodeProps<Node<TreeNodeData>>) {
  let classes =
    'bg-[var(--akdd-bg-surface)] text-[var(--akdd-text-primary)] border-[var(--akdd-border-default)]'

  if (data.tier === 'objective') {
    classes =
      'bg-[var(--akdd-ink)] text-[var(--akdd-text-inverse)] border-[var(--akdd-ink)] shadow-none'
  } else if (data.tier === 'subsystem') {
    classes =
      'bg-[var(--akdd-slate-100)] text-[var(--akdd-navy-900)] border-[var(--akdd-navy-700)]'
  } else if (data.tier === 'lever') {
    if (!data.isDirect) {
      classes =
        'bg-[var(--akdd-slate-50)] text-[var(--akdd-slate-700)] border-[var(--akdd-slate-400)]'
    } else if (data.badgeLevel === 'CARREFOUR') {
      classes =
        'bg-[var(--akdd-badge-carrefour-bg)] text-[var(--akdd-badge-carrefour-text)] border-[var(--akdd-badge-carrefour-border)]'
    } else if (data.badgeLevel === 'FORT') {
      classes =
        'bg-[var(--akdd-badge-fort-bg)] text-[var(--akdd-badge-fort-text)] border-[var(--akdd-badge-fort-border)]'
    } else {
      classes =
        'bg-[var(--akdd-badge-cible-bg)] text-[var(--akdd-badge-cible-text)] border-[var(--akdd-badge-cible-border)]'
    }
  }

  const width = data.tier === 'objective' ? 190 : data.tier === 'subsystem' ? 175 : 300

  return (
    <div
      className={`flex flex-col gap-0.5 rounded-[var(--akdd-radius-md)] border px-3 py-2 text-left shadow-none ${classes}`}
      style={{ width }}
    >
      {data.tier !== 'objective' && (
        <Handle type="target" position={Position.Left} className="!bg-[var(--akdd-navy-700)]" />
      )}
      <div className="text-xs font-medium leading-tight truncate">{data.title}</div>
      <div className="text-[11px] opacity-85 truncate">{data.subtitle}</div>
      {data.tier !== 'lever' && (
        <Handle type="source" position={Position.Right} className="!bg-[var(--akdd-navy-700)]" />
      )}
    </div>
  )
}

const NODE_TYPES = { tdNode: TopDownTreeNode }

export interface TopDownTreeFlowProps {
  analysis: TopDownAnalysisResult
  onSelectLever?: (kddId: string) => void
}

export function TopDownTreeFlow({ analysis, onSelectLever }: TopDownTreeFlowProps) {
  const { nodes, edges } = useMemo(() => {
    const levers = analysis.visuLevers
    const subsystems = analysis.subsystemSummary
    if (levers.length === 0) return { nodes: [], edges: [] }

    const pitchLev = 64
    const totalH = Math.max((levers.length - 1) * pitchLev, (subsystems.length - 1) * 72, 120)

    const builtNodes: Node<TreeNodeData>[] = [
      {
        id: 'OBJ',
        type: 'tdNode',
        position: { x: 16, y: totalH / 2 - 20 },
        data: {
          tier: 'objective',
          title: 'OBJECTIF CIBLE',
          subtitle: analysis.theme,
        },
      },
    ]

    const builtEdges: Edge[] = []
    const sysStep = subsystems.length > 1 ? totalH / (subsystems.length - 1) : 0

    subsystems.forEach((sys, i) => {
      const sysId = `SYS-${sys.subsystem}`
      const y = subsystems.length === 1 ? totalH / 2 - 16 : i * sysStep
      builtNodes.push({
        id: sysId,
        type: 'tdNode',
        position: { x: 265, y },
        data: {
          tier: 'subsystem',
          title: sys.subsystem,
          subtitle: `Niv1: ${sys.directCount} | Niv2: ${sys.indirectCount}`,
        },
      })
      builtEdges.push({
        id: `E-OBJ-${sys.subsystem}`,
        source: 'OBJ',
        target: sysId,
        style: { stroke: '#09090b', strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#09090b' },
      })
    })

    levers.forEach((lev, i) => {
      const levNodeId = `LEV-${i}-${lev.leverId}`
      const prefix = lev.isDirect ? '[N1]' : '[N2]'
      builtNodes.push({
        id: levNodeId,
        type: 'tdNode',
        position: { x: 515, y: i * pitchLev },
        data: {
          tier: 'lever',
          title: `${prefix} ${lev.leverId} — ${lev.leverName}`,
          subtitle: lev.badge.label,
          leverId: lev.leverId,
          isDirect: lev.isDirect,
          badgeLevel: lev.badge.level,
        },
      })

      const isCarrefourDirect = lev.isDirect && lev.badge.level === 'CARREFOUR'
      const stroke = lev.isDirect ? (isCarrefourDirect ? '#881337' : '#3f3f46') : '#a1a1aa'
      builtEdges.push({
        id: `E-${lev.subsystem}-${levNodeId}`,
        source: `SYS-${lev.subsystem}`,
        target: levNodeId,
        style: {
          stroke,
          strokeWidth: isCarrefourDirect ? 2.25 : 1.35,
          strokeDasharray: lev.isDirect ? undefined : '5 4',
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: stroke },
      })
    })

    return { nodes: builtNodes, edges: builtEdges }
  }, [analysis])

  return (
    <div className="h-[540px] w-full">
      <ReactFlow
        key={`${analysis.theme}-${analysis.rows.length}`}
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        fitView
        fitViewOptions={{ padding: 0.14 }}
        minZoom={0.25}
        maxZoom={1.6}
        onNodeClick={(_, node) => {
          const d = node.data as TreeNodeData
          if (d.tier === 'lever' && d.leverId && onSelectLever) {
            onSelectLever(d.leverId)
          }
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={18} size={1} color="#e4e4e7" />
        <Controls />
      </ReactFlow>
    </div>
  )
}
