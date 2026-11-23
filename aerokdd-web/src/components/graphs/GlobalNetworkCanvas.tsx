import cytoscape, { type Core, type ElementDefinition } from 'cytoscape'
import { Maximize2, ZoomIn, ZoomOut } from 'lucide-react'
import { useEffect, useRef } from 'react'
import {
  AKDD_NODE_H,
  AKDD_NODE_W,
  type GlobalGraphResult,
} from '../../engines/graphBuilder'
import { Badge } from '../ui'

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
            'font-family': 'Archivo, Inter, sans-serif',
            'text-valign': 'center',
            'text-halign': 'center',
            'background-color': '#ffffff',
            'background-opacity': 0.96,
            color: '#09090b',
            'border-color': '#e4e4e7',
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
            'border-color': '#09090b',
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
    <div className="relative flex h-full min-h-[540px] w-full flex-1 overflow-hidden bg-[#FAFAFA]">
      {/* Full-Bleed Dot-Matrix Cytoscape Viewport */}
      <div
        ref={containerRef}
        className="h-full w-full flex-1"
        style={{
          backgroundColor: '#FAFAFA',
          backgroundImage: 'radial-gradient(#D4D4D8 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      />

      {/* Bottom-Left Floating Legend Card */}
      <div className="pointer-events-auto absolute bottom-4 left-4 z-10 flex max-w-[calc(100%-10rem)] flex-col gap-2 rounded-[var(--akdd-radius-sm)] border border-[#E4E4E7] bg-[#FFFFFF] px-3.5 py-2.5 shadow-none">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#71717A]">
            Nœuds
          </span>
          <Badge className="bg-[var(--akdd-status-kdd-bg)] text-[var(--akdd-status-kdd-text)] border-[var(--akdd-status-kdd-border)]">
            KDD
          </Badge>
          <Badge className="bg-[var(--akdd-status-s-bg)] text-[var(--akdd-status-s-text)] border-[var(--akdd-status-s-border)]">
            S
          </Badge>
          <Badge className="bg-[var(--akdd-status-d-bg)] text-[var(--akdd-status-d-text)] border-[var(--akdd-status-d-border)]">
            D
          </Badge>
          <Badge className="bg-[var(--akdd-status-prestation-bg)] text-[var(--akdd-status-prestation-text)] border-[var(--akdd-status-prestation-border)]">
            Prestation
          </Badge>
          <Badge className="bg-[var(--akdd-status-input-bg)] text-[var(--akdd-status-input-text)] border-[var(--akdd-status-input-border)]">
            Input
          </Badge>
          <Badge className="bg-[var(--akdd-status-contrainte-bg)] text-[var(--akdd-status-contrainte-text)] border-[var(--akdd-status-contrainte-border)]">
            Contrainte
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-[#E4E4E7] pt-1.5 font-mono text-[10px] text-[#52525B]">
          <span className="font-semibold uppercase tracking-[0.08em] text-[#71717A]">Liens</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-[2px] w-3.5 bg-[var(--akdd-edge-topdown)]" /> Top-Down
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-[2px] w-3.5 bg-[var(--akdd-edge-coupling)]" /> Couplage
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-[2px] w-3.5 bg-[var(--akdd-edge-context)]" /> Contexte
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0 w-3.5 border-t border-dashed border-[var(--akdd-val-rejected)]" />{' '}
            Rejeté
          </span>
        </div>
      </div>

      {/* Bottom-Right Floating Zoom/Fit Pill */}
      <div className="pointer-events-auto absolute bottom-4 right-4 z-10 inline-flex items-center divide-x divide-[#E4E4E7] overflow-hidden rounded-full border border-[#E4E4E7] bg-[#FFFFFF] shadow-none">
        <button
          type="button"
          onClick={() => handleZoom(1.25)}
          aria-label="Zoomer"
          className="flex h-8 w-8 items-center justify-center text-[#09090B] transition-colors hover:bg-[#FAFAFA] cursor-pointer"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => handleZoom(0.8)}
          aria-label="Dézoomer"
          className="flex h-8 w-8 items-center justify-center text-[#09090B] transition-colors hover:bg-[#FAFAFA] cursor-pointer"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={handleFit}
          className="inline-flex h-8 items-center gap-1.5 px-3 font-mono text-[10.5px] font-medium uppercase tracking-[0.06em] text-[#09090B] transition-colors hover:bg-[#FAFAFA] cursor-pointer"
        >
          <Maximize2 className="h-3 w-3" />
          <span>Fit</span>
        </button>
      </div>
    </div>
  )
}
