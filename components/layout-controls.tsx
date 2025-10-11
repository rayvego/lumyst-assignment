"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import type { LayoutAlgorithm, LayoutDirection } from "../core/react-flow.service";

interface LayoutControlsProps {
  currentAlgorithm: LayoutAlgorithm;
  currentDirection: LayoutDirection;
  onAlgorithmChange: (algorithm: LayoutAlgorithm) => void;
  onDirectionChange: (direction: LayoutDirection) => void;
  onApplyLayout: () => void;
  isApplying: boolean;
}

const algorithmLabels: Record<LayoutAlgorithm, string> = {
  'hierarchical': 'Hierarchical',
  'force-directed': 'Force-Directed',
  'circular': 'Circular',
  'tree': 'Tree'
};

const directionLabels: Record<LayoutDirection, string> = {
  'TB': 'Top-Bottom',
  'BT': 'Bottom-Top',
  'LR': 'Left-Right',
  'RL': 'Right-Left'
};

export function LayoutControls({
  currentAlgorithm,
  currentDirection,
  onAlgorithmChange,
  onDirectionChange,
  onApplyLayout,
  isApplying
}: LayoutControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-4 min-w-[280px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Layout Controls</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-6 w-6 p-0"
        >
          {isExpanded ? '−' : '+'}
        </Button>
      </div>

      <div className={`space-y-3 ${isExpanded ? 'block' : 'hidden'}`}>
        {/* Algorithm Selection */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Algorithm
          </label>
          <select
            value={currentAlgorithm}
            onChange={(e) => onAlgorithmChange(e.target.value as LayoutAlgorithm)}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {Object.entries(algorithmLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Direction Selection (only for hierarchical and tree) */}
        {(currentAlgorithm === 'hierarchical' || currentAlgorithm === 'tree') && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Direction
            </label>
            <select
              value={currentDirection}
              onChange={(e) => onDirectionChange(e.target.value as LayoutDirection)}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {Object.entries(directionLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Apply Button */}
        <Button
          onClick={onApplyLayout}
          disabled={isApplying}
          className="w-full text-xs py-1"
          size="sm"
        >
          {isApplying ? 'Applying...' : 'Apply Layout'}
        </Button>

        {/* Algorithm Description */}
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          {getAlgorithmDescription(currentAlgorithm)}
        </div>
      </div>
    </div>
  );
}

function getAlgorithmDescription(algorithm: LayoutAlgorithm): string {
  switch (algorithm) {
    case 'hierarchical':
      return 'Best for hierarchical structures with clear parent-child relationships. Reduces edge crossings and maintains logical flow.';
    case 'force-directed':
      return 'Uses physics simulation to position nodes. Good for exploring relationships and finding natural clusters.';
    case 'circular':
      return 'Arranges nodes in a circle. Useful for showing equal relationships or when space is limited.';
    case 'tree':
      return 'Strict tree layout with single root. Ideal for hierarchical data with clear tree structure.';
    default:
      return 'Select an algorithm to see its description.';
  }
}
