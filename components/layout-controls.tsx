import { Button } from "./ui/button";

interface LayoutControlsProps {
	onLayoutChange: (layout: 'default' | 'minimal-crossings' | 'compact' | 'wide') => void;
	currentLayout: string;
}

export function LayoutControls({ onLayoutChange, currentLayout }: LayoutControlsProps) {
	const layouts = [
		{
			id: 'default' as const,
			name: 'Balanced',
			description: 'Optimal spacing with cluster separation',
		},
		{
			id: 'minimal-crossings' as const,
			name: 'Minimal Crossings',
			description: 'Reduces edge intersections',
		},
		{
			id: 'compact' as const,
			name: 'Compact',
			description: 'Tight spacing for overview',
		},
		{
			id: 'wide' as const,
			name: 'Wide',
			description: 'Extra horizontal space',
		},
	];

	return (
		<div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg p-4 max-w-xs">
			<h3 className="text-sm font-semibold mb-3 text-gray-700">
				Layout Algorithm
			</h3>
			<div className="space-y-2">
				{layouts.map((layout) => (
					<button
						key={layout.id}
						onClick={() => onLayoutChange(layout.id)}
						className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
							currentLayout === layout.id
								? 'bg-blue-100 border-2 border-blue-500 text-blue-900'
								: 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'
						}`}
					>
						<div className="font-medium text-sm">{layout.name}</div>
						<div className="text-xs text-gray-600 mt-0.5">
							{layout.description}
						</div>
					</button>
				))}
			</div>
			<div className="mt-4 pt-3 border-t border-gray-200">
				<p className="text-xs text-gray-500">
					Switch layouts to find the best visualization for your needs.
					Each algorithm optimizes for different aspects.
				</p>
			</div>
		</div>
	);
}
