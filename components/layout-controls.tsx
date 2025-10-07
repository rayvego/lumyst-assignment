"use client";

import { useState } from 'react';
import { LayoutPresets, LayoutConfigGenerator } from '../core/layout-config.service';
import type { LayoutConfig } from '../core/hierarchical-layout.service';

interface LayoutControlsProps {
  onConfigChange: (config: LayoutConfig) => void;
  currentConfig: LayoutConfig;
  graphStats: {
    totalNodes: number;
    totalEdges: number;
    categories: number;
  };
}

export function LayoutControls({ onConfigChange, currentConfig, graphStats }: LayoutControlsProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>('balanced');
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customConfig, setCustomConfig] = useState<LayoutConfig>(currentConfig);

  const presets = {
    compact: LayoutPresets.compact,
    balanced: LayoutPresets.balanced,
    spacious: LayoutPresets.spacious,
    ultraWide: LayoutPresets.ultraWide,
    vertical: LayoutPresets.vertical
  };

  const handlePresetChange = (presetName: string) => {
    setSelectedPreset(presetName);
    const preset = presets[presetName as keyof typeof presets];
    if (preset) {
      onConfigChange(preset);
      setCustomConfig(preset);
    }
  };

  const handleAutoOptimize = () => {
    const optimized = LayoutConfigGenerator.generateForGraph({
      ...graphStats,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight
    });
    setSelectedPreset('auto');
    onConfigChange(optimized);
    setCustomConfig(optimized);
  };

  const handleCustomChange = (field: keyof LayoutConfig, value: any) => {
    const newConfig = { ...customConfig };
    if (field === 'minimumNodeSize') {
      newConfig.minimumNodeSize = { ...newConfig.minimumNodeSize, ...value };
    } else {
      newConfig[field] = value;
    }
    setCustomConfig(newConfig);
    onConfigChange(newConfig);
    setSelectedPreset('custom');
  };

  return (
    <div style={{
      position: 'absolute',
      top: '70px',
      left: '20px',
      background: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      padding: '16px',
      zIndex: 1000,
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      minWidth: '280px',
      maxHeight: '70vh',
      overflowY: 'auto'
    }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 'bold' }}>
        Layout Controls
      </h3>

      {/* Preset Selection */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ fontSize: '12px', fontWeight: '500', marginBottom: '4px', display: 'block' }}>
          Layout Presets
        </label>
        <select
          value={selectedPreset}
          onChange={(e) => handlePresetChange(e.target.value)}
          style={{
            width: '100%',
            padding: '6px 8px',
            fontSize: '12px',
            border: '1px solid #d1d5db',
            borderRadius: '4px'
          }}
        >
          <option value="compact">Compact</option>
          <option value="balanced">Balanced (Default)</option>
          <option value="spacious">Spacious</option>
          <option value="ultraWide">Ultra Wide</option>
          <option value="vertical">Vertical</option>
          <option value="auto">Auto-Optimized</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      {/* Auto-optimize Button */}
      <button
        onClick={handleAutoOptimize}
        style={{
          width: '100%',
          padding: '8px 12px',
          fontSize: '12px',
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '16px'
        }}
      >
        Auto-Optimize for Current Viewport
      </button>

      {/* Custom Controls Toggle */}
      <button
        onClick={() => setIsCustomizing(!isCustomizing)}
        style={{
          width: '100%',
          padding: '6px 12px',
          fontSize: '11px',
          background: 'transparent',
          color: '#6b7280',
          border: '1px solid #d1d5db',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: isCustomizing ? '12px' : '0'
        }}
      >
        {isCustomizing ? 'Hide' : 'Show'} Custom Settings
      </button>

      {/* Custom Configuration */}
      {isCustomizing && (
        <div style={{ fontSize: '12px' }}>
          <div style={{ marginBottom: '8px' }}>
            <label style={{ fontWeight: '500', marginBottom: '2px', display: 'block' }}>
              Node Spacing: {customConfig.nodeSpacing}px
            </label>
            <input
              type="range"
              min="80"
              max="400"
              value={customConfig.nodeSpacing}
              onChange={(e) => handleCustomChange('nodeSpacing', Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '8px' }}>
            <label style={{ fontWeight: '500', marginBottom: '2px', display: 'block' }}>
              Rank Spacing: {customConfig.rankSpacing}px
            </label>
            <input
              type="range"
              min="60"
              max="300"
              value={customConfig.rankSpacing}
              onChange={(e) => handleCustomChange('rankSpacing', Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '8px' }}>
            <label style={{ fontWeight: '500', marginBottom: '2px', display: 'block' }}>
              Cluster Padding: {customConfig.clusterPadding}px
            </label>
            <input
              type="range"
              min="40"
              max="200"
              value={customConfig.clusterPadding}
              onChange={(e) => handleCustomChange('clusterPadding', Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '8px' }}>
            <label style={{ fontWeight: '500', marginBottom: '2px', display: 'block' }}>
              Max Nodes Per Rank: {customConfig.maximumNodesPerRank}
            </label>
            <input
              type="range"
              min="3"
              max="15"
              value={customConfig.maximumNodesPerRank}
              onChange={(e) => handleCustomChange('maximumNodesPerRank', Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '8px' }}>
            <label style={{ fontWeight: '500', marginBottom: '2px', display: 'block' }}>
              Node Width: {customConfig.minimumNodeSize.width}px
            </label>
            <input
              type="range"
              min="100"
              max="300"
              value={customConfig.minimumNodeSize.width}
              onChange={(e) => handleCustomChange('minimumNodeSize', { width: Number(e.target.value) })}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '8px' }}>
            <label style={{ fontWeight: '500', marginBottom: '2px', display: 'block' }}>
              Node Height: {customConfig.minimumNodeSize.height}px
            </label>
            <input
              type="range"
              min="35"
              max="100"
              value={customConfig.minimumNodeSize.height}
              onChange={(e) => handleCustomChange('minimumNodeSize', { height: Number(e.target.value) })}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      )}

      {/* Current Configuration Info */}
      <div style={{ 
        fontSize: '10px', 
        color: '#6b7280', 
        marginTop: '12px',
        padding: '8px',
        background: '#f9fafb',
        borderRadius: '4px'
      }}>
        <div><strong>Current Config:</strong></div>
        <div>Spacing: {currentConfig.nodeSpacing}×{currentConfig.rankSpacing}px</div>
        <div>Node Size: {currentConfig.minimumNodeSize.width}×{currentConfig.minimumNodeSize.height}px</div>
        <div>Max/Rank: {currentConfig.maximumNodesPerRank}</div>
      </div>
    </div>
  );
}
