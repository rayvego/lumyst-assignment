'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { ReactFlowService } from '../core/react-flow.service';
import { convertDataToGraphNodesAndEdges } from '../core/data/data-converter';
import { LayoutConfigService, type LayoutPreset } from '../core/layout-config.service';
import type { LayoutAnalysis, LayoutMetrics } from '../core/graph-layout-manager.service';
import { Button } from './ui/button';

const layoutService = new ReactFlowService();

interface LayoutControlPanelProps {
  onLayoutChange: (preset: LayoutPreset) => void;
  currentPreset: LayoutPreset;
  layoutInfo?: {
    analysis: LayoutAnalysis;
    metrics: LayoutMetrics;
    suggestions: string[];
    boundingBox: { width: number; height: number };
  };
  isAnalyzing: boolean;
}

function LayoutControlPanel({
  onLayoutChange,
  currentPreset,
  layoutInfo,
  isAnalyzing
}: LayoutControlPanelProps) {
  const layoutPresets: { key: LayoutPreset; label: string; description: string }[] = [
    { key: 'compact', label: 'Compact', description: 'Dense layout for small graphs' },
    { key: 'spacious', label: 'Spacious', description: 'Spread out layout with lots of space' },
    { key: 'hierarchical', label: 'Hierarchical', description: 'Balanced hierarchy-based layout' },
    { key: 'clustered', label: 'Clustered', description: 'Groups related components together' },
    { key: 'radial', label: 'Radial', description: 'Radial arrangement around central nodes' }
  ];

  return (
    <div className="bg-white p-4 border-r border-gray-200 w-80 overflow-y-auto">
      <div className="space-y-6">
        {/* Layout Presets */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Layout Presets</h3>
          <div className="space-y-2">
            {layoutPresets.map(preset => (
              <div key={preset.key} className="space-y-1">
                <Button
                  variant={currentPreset === preset.key ? "default" : "outline"}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => onLayoutChange(preset.key)}
                  disabled={isAnalyzing}
                >
                  {preset.label}
                </Button>
                <p className="text-xs text-gray-600 px-2">{preset.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Graph Analysis */}
        {layoutInfo && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Graph Analysis</h3>
            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded">
                <h4 className="font-medium text-sm mb-2">Structure</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Nodes:</span>
                    <span className="font-mono">{layoutInfo.analysis.nodeCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Edges:</span>
                    <span className="font-mono">{layoutInfo.analysis.edgeCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Levels:</span>
                    <span className="font-mono">{layoutInfo.analysis.maxLevels}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Clusters:</span>
                    <span className="font-mono">{layoutInfo.analysis.clusterCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Complexity:</span>
                    <span className={`font-mono text-xs px-1 rounded ${
                      layoutInfo.analysis.complexity === 'very-high' ? 'bg-red-100 text-red-800' :
                      layoutInfo.analysis.complexity === 'high' ? 'bg-orange-100 text-orange-800' :
                      layoutInfo.analysis.complexity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {layoutInfo.analysis.complexity}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded">
                <h4 className="font-medium text-sm mb-2">Quality Metrics</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Edge Crossings:</span>
                    <span className="font-mono">{layoutInfo.metrics.edgeCrossings}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Node Overlaps:</span>
                    <span className="font-mono">{layoutInfo.metrics.nodeOverlaps}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Edge Length:</span>
                    <span className="font-mono">{Math.round(layoutInfo.metrics.avgEdgeLength)}px</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Layout Density:</span>
                    <span className="font-mono">{layoutInfo.metrics.layoutDensity.toFixed(6)}</span>
                  </div>
                </div>
              </div>

              {layoutInfo.suggestions.length > 0 && (
                <div className="bg-blue-50 p-3 rounded">
                  <h4 className="font-medium text-sm mb-2">Suggestions</h4>
                  <ul className="space-y-1">
                    {layoutInfo.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-xs text-blue-700">
                        • {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Performance Info */}
        {layoutInfo && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Layout Info</h3>
            <div className="bg-gray-50 p-3 rounded text-xs space-y-1">
              <div className="flex justify-between">
                <span>Canvas Width:</span>
                <span className="font-mono">{Math.round(layoutInfo.boundingBox.width)}px</span>
              </div>
              <div className="flex justify-between">
                <span>Canvas Height:</span>
                <span className="font-mono">{Math.round(layoutInfo.boundingBox.height)}px</span>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-200">
                <span className="text-gray-600">
                  Recommended: <strong>{layoutInfo.analysis.recommendedPreset}</strong>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function HierarchicalGraphDemo() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [currentPreset, setCurrentPreset] = useState<LayoutPreset>('hierarchical');
  const [layoutInfo, setLayoutInfo] = useState<any>(undefined);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Load and convert data
  const graphData = useMemo(() => {
    return convertDataToGraphNodesAndEdges();
  }, []);

  // Apply layout when preset changes
  const applyLayout = useCallback(async (preset: LayoutPreset) => {
    setIsAnalyzing(true);
    
    try {
      // Add a small delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const result = layoutService.convertDataToReactFlowDataTypes(
        graphData.graphNodes,
        graphData.c1Output,
        graphData.c2Subcategories,
        [...graphData.graphEdges, ...graphData.c2Relationships.map(rel => ({
          id: rel.id,
          source: rel.fromC2,
          target: rel.toC2,
          label: rel.label
        })), ...graphData.crossC1C2Relationships.map(rel => ({
          id: rel.id,
          source: rel.fromC2,
          target: rel.toC2,
          label: rel.label
        }))],
        true,
        preset
      );

      setNodes(result.nodes);
      setEdges(result.edges);
      setLayoutInfo(result.layoutInfo);
    } catch (error) {
      console.error('Error applying layout:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [graphData]);

  // Handle layout preset change
  const handleLayoutChange = useCallback((preset: LayoutPreset) => {
    setCurrentPreset(preset);
    applyLayout(preset);
  }, [applyLayout]);

  // Initialize with default layout
  useEffect(() => {
    applyLayout(currentPreset);
  }, []);

  return (
    <div className="w-full h-screen flex">
      <LayoutControlPanel
        onLayoutChange={handleLayoutChange}
        currentPreset={currentPreset}
        layoutInfo={layoutInfo}
        isAnalyzing={isAnalyzing}
      />
      
      <div className="flex-1 relative">
        {isAnalyzing && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-lg shadow-lg flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-700">Analyzing and arranging graph...</span>
            </div>
          </div>
        )}
        
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          attributionPosition="bottom-left"
        >
          <Controls />
          <MiniMap />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
}