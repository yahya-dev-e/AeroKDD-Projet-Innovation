import cytoscape, { type Core, type ElementDefinition } from 'cytoscape'
import { Maximize2, ZoomIn, ZoomOut } from 'lucide-react'
import { useEffect, useRef } from 'react'
import {
  AKDD_NODE_H,
  AKDD_NODE_W,
  type GlobalGraphResult,
} from '../../engines/graphBuilder'
import { Button } from '../ui'

export interface GlobalNetworkCanvasProps {
  graph: GlobalGraphResult
  selectedNodeId: string | null
  onSelectNode: (kddId: string | null) => void
}

export function GlobalNetworkCanvas({
  graph,
  selectedNodeId,
  onSelectNode,
}: GlobalNetworkCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const cyRef = useRef<Core | null>(null)
  const onSelectRef = useRef(onSelectNode)
  onSelectRef.current = onSelectNode

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const elements: ElementDefinition[] = []

    // Cluster header labels
    for (const cluster of graph.clusters) {
      elements.push({
        group: 'nodes',
        data: {
          id: `CLUSTER_${cluster.subsystemCode}`,
          label: `${cluster.subsystemCode} | ${cluster.count} elem.`,
          isClusterLabel: true,
        },
        position: { x: cluster.labelX, y: cluster.labelY },
        selectable: false,
        grabbable: false,
      })
    }

    // KDD nodes
    for (const node of graph.nodes) {
      elements.push({
        group: 'nodes',
        data: {
          id: node.id,
          label: node.id,
          fillHex: node.colors.fillHex,
          textHex: node.colors.textHex,
          borderHex: node.colors.borderHex,
          borderWidth: node.colors.borderWidth * 1.4,
          isClusterLabel: false,
        },
        position: { x: node.x, y: node.y },
      })
    }

    // Edges
    for (const edge of graph.edges) {
      elements.push({
        group: 'edges',
        data: {
          id: `E_${edge.id}_${edge.sourceId}_${edge.targetId}`,
          source: edge.sourceId,
          target: edge.targetId,
          colorHex: edge.colorHex,
          lineWidth: edge.lineWidth * 1.3,
          lineStyle: edge.isDashed ? 'dashed' : 'solid',
        },
      })
    }

    const cy = cytoscape({
      container,
      elements,
      layout: { name: 'preset', fit: true, padding: 40 },
      wheelSensitivity: 0.25,
      minZoom: 0.08,
      maxZoom: 3.0,
      style: [
        {
          selector: 'node[!isClusterLabel]',
          style: {
            shape: 'round-rectangle',
            width: AKDD_NODE_W + 8,
            height: AKDD_NODE_H + 2,
            label: 'data(label)',
            'font-size': 8,
            'font-weight': 700,
            'font-family': 'JetBrains Mono, monospace',
            'text-valign': 'center',
            'text-halign': 'center',
            'background-color': 'data(fillHex)',
            color: 'data(textHex)',
            'border-color': 'data(borderHex)',
            'border-width': 'data(borderWidth)',
          },
        },
        {
          selector: 'node[?isClusterLabel]',
          style: {
            shape: 'round-rectangle',
            width: 148,
            height: 24,
            label: 'data(label)',
            'font-size': 11,
            'font-weight': 700,
            'font-family': 'Inter, Segoe UI, sans-serif',
            'text-valign': 'center',
            'text-halign': 'center',
            'background-color': '#ffffff',
            'background-opacity': 0.9,
            color: '#17375d',
            'border-color': '#cbd5e1',
            'border-width': 1,
            events: 'no',
          },
        },
        {
          selector: 'edge',
          style: {
            width: 'data(lineWidth)',
            'line-color': 'data(colorHex)',
            'line-style': 'solid',
            'target-arrow-color': 'data(colorHex)',
            'target-arrow-shape': 'triangle',
            'arrow-scale': 0.75,
            'curve-style': 'bezier',
            opacity: 0.72,
          },
        },
        {
          selector: 'edge[lineStyle = "dashed"]',
          style: {
            'line-style': 'dashed',
          },
        },
        {
          selector: '.dimmed',
          style: {
            opacity: 0.14,
          },
        },
        {
          selector: '.highlighted-node',
          style: {
            'border-width': 3,
            'border-color': '#0f172a',
            'z-index': 999,
            opacity: 1,
          },
        },
        {
          selector: '.highlighted-edge',
          style: {
            width: 2.5,
            opacity: 1,
            'z-index': 998,
          },
        },
      ],
    })

    cy.on('tap', 'node[!isClusterLabel]', (evt) => {
      const id = evt.target.id()
      onSelectRef.current(id)
    })

    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        onSelectRef.current(null)
      }
    })

    cyRef.current = cy
    return () => {
      cy.destroy()
      cyRef.current = null
    }
  }, [graph])

  // Apply selection neighborhood highlight
  useEffect(() => {
    const cy = cyRef.current
    if (!cy) return

    cy.elements().removeClass('dimmed highlighted-node highlighted-edge')
    if (!selectedNodeId) return

    const target = cy.getElementById(selectedNodeId)
    if (target.empty()) return

    const neighborhood = target.closedNeighborhood()
    cy.elements().not(neighborhood).not('node[?isClusterLabel]').addClass('dimmed')
    target.addClass('highlighted-node')
    neighborhood.edges().addClass('highlighted-edge')
  }, [selectedNodeId, graph])

  const handleZoom = (factor: number) => {
    const cy = cyRef.current
    if (!cy) return
    cy.zoom({
      level: cy.zoom() * factor,
      renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 },
    })
  }

  const handleFit = () => {
    cyRef.current?.fit(undefined, 40)
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-[var(--akdd-radius-lg)] border border-[var(--akdd-border-subtle)] bg-[var(--akdd-bg-surface)]">
      {/* Canvas Toolbar */}
      <div className="flex items-center justify-between gap-2 border-b border-[var(--akdd-border-subtle)] bg-[var(--akdd-bg-canvas)] px-3.5 py-2">
        <span className="text-xs text-[var(--akdd-text-secondary)]">
          Molette pour zoomer · Glisser pour déplacer · Cliquer un nœud pour inspecter son voisinage
        </span>
        <div className="flex items-center gap-1.5">
          <Button variant="secondary" size="sm" onClick={() => handleZoom(1.25)} aria-label="Zoomer">
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleZoom(0.8)}
            aria-label="Dézoomer"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<Maximize2 className="h-3.5 w-3.5" />}
            onClick={handleFit}
          >
            Ajuster
          </Button>
        </div>
      </div>

      {/* Cytoscape Viewport */}
      <div ref={containerRef} className="flex-1 min-h-[540px] w-full bg-[#fbfdff]" />
    </div>
  )
}
