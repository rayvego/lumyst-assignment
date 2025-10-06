import React, { useState } from 'react';

interface LegendItem {
  color: string;
  borderColor: string;
  label: string;
  description: string;
}

const NodeLegend: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

  const legendItems: LegendItem[] = [
    {
      color: '#dbeafe',
      borderColor: '#3b82f6',
      label: 'Graph Nodes',
      description: 'Regular graph nodes'
    },
    {
      color: '#fef2f2',
      borderColor: '#dc2626',
      label: 'C1 Categories',
      description: 'Category nodes'
    },
    {
      color: '#f0fdf4',
      borderColor: '#16a34a',
      label: 'C2 Subcategories',
      description: 'Subcategory nodes'
    }
  ];

  return (
    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-800">Legend</h3>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          aria-label={isOpen ? "Close legend" : "Open legend"}
        >
          <svg
            className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="p-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">Node Types</h4>
          <div className="space-y-2">
            {legendItems.map((item, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div
                  className="w-4 h-4 rounded border-2 flex-shrink-0"
                  style={{
                    backgroundColor: item.color,
                    borderColor: item.borderColor,
                  }}
                />
                <div className="text-xs">
                  <div className="font-medium text-gray-700">{item.label}</div>
                  <div className="text-gray-500">{item.description}</div>
                </div>
              </div>
            ))}
          </div>
          
          {/* For Edges */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Edge Types</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-0.5" style={{ borderTop: '1px dashed #9ca3af' }} />
                <span className="text-xs text-gray-600">Contains</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-0.5 bg-green-600" />
                <span className="text-xs text-gray-600">C2 Relationships</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-0.5 bg-orange-600" />
                <span className="text-xs text-gray-600">Cross C1-C2</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-0.5 bg-gray-600" />
                <span className="text-xs text-gray-600">Other</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NodeLegend;