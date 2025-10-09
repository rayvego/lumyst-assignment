/**
 * ELK Layout Service - Backend Template
 * 
 * Use this when client-side layout becomes too slow (>3s for graphs)
 * 
 * Setup:
 * 1. npm install express body-parser elkjs cors
 * 2. Copy this file to backend/layout-service.js
 * 3. Run: node backend/layout-service.js
 * 4. Update NEXT_PUBLIC_LAYOUT_API in .env.local
 */

// Uncomment when ready to use:
/*
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import ELK from "elkjs";

const app = express();
const elk = new ELK();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// Health check
app.get('/health', (req, res) => {
	res.json({ status: 'ok', service: 'ELK Layout Service' });
});

// Main layout endpoint
app.post('/api/layout', async (req, res) => {
	try {
		const startTime = Date.now();
		const { graph, config } = req.body;

		if (!graph || !graph.children) {
			return res.status(400).json({
				error: 'Invalid graph structure',
			});
		}

		// Apply layout
		const layoutedGraph = await elk.layout({
			...graph,
			layoutOptions: {
				'elk.algorithm': 'layered',
				'elk.direction': 'DOWN',
				'elk.spacing.nodeNode': '80',
				'elk.layered.spacing.nodeNodeBetweenLayers': '120',
				'elk.spacing.edgeNode': '50',
				'elk.spacing.edgeEdge': '30',
				'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
				'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
				'elk.edgeRouting': 'SPLINES',
				'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
				'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
				'elk.spacing.componentComponent': '100',
				...config,
			},
		});

		const layoutTime = Date.now() - startTime;

		res.json({
			layout: layoutedGraph,
			metadata: {
				layoutTime,
				nodeCount: countNodes(layoutedGraph),
				edgeCount: graph.edges?.length || 0,
			},
		});

		console.log(`Layout computed in ${layoutTime}ms`);
	} catch (error) {
		console.error('Layout error:', error);
		res.status(500).json({
			error: 'Layout computation failed',
			message: error.message,
		});
	}
});

// Batch layout endpoint (for multiple graphs)
app.post('/api/layout/batch', async (req, res) => {
	try {
		const { graphs } = req.body;
		const results = await Promise.all(
			graphs.map(graph => elk.layout(graph))
		);
		res.json({ layouts: results });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// Helper function
function countNodes(graph) {
	let count = graph.children?.length || 0;
	graph.children?.forEach(child => {
		count += countNodes(child);
	});
	return count;
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
	console.log(`🚀 ELK Layout Service running on port ${PORT}`);
	console.log(`   Health: http://localhost:${PORT}/health`);
	console.log(`   Layout: http://localhost:${PORT}/api/layout`);
});
*/

console.log('Backend layout service template ready!');
console.log('Uncomment the code above when you need backend processing.');
console.log('Current setup uses client-side ELK (recommended for <2k nodes).');

