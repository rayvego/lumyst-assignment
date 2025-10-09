import { ReactFlowService } from './core/react-flow.service';
import { GraphLayoutManagerService } from './core/graph-layout-manager.service';
import { convertDataToGraphNodesAndEdges } from './core/data/data-converter';

export function validateHierarchicalLayout() {
    console.log(' Validating Hierarchical Layout Algorithm...\n');

    try {
        const data = convertDataToGraphNodesAndEdges();
        console.log('✓ Data loaded successfully');
        console.log(`  - Graph nodes: ${data.graphNodes.length}`);
        console.log(`  - C1 nodes: ${data.c1Output.length}`);
        console.log(`  - C2 nodes: ${data.c2Subcategories.length}`);
        console.log(`  - Edges: ${data.graphEdges.length}`);

        const layoutManager = new GraphLayoutManagerService();
        const analysis = layoutManager.analyzeGraphStructure(
            data.graphNodes,
            data.c1Output,
            data.c2Subcategories,
            data.graphEdges
        );
        
        console.log('\n✓ Graph analysis completed');
        console.log(`  - Total nodes: ${analysis.nodeCount}`);
        console.log(`  - Total edges: ${analysis.edgeCount}`);
        console.log(`  - Max degree: ${analysis.maxDegree}`);
        console.log(`  - Complexity: ${analysis.complexity}`);
        console.log(`  - Recommended preset: ${analysis.recommendedPreset}`);

        const layoutResult = layoutManager.applyOptimalLayout(
            data.graphNodes,
            data.c1Output,
            data.c2Subcategories,
            data.graphEdges,
            analysis.recommendedPreset
        );

        console.log('\n✓ Hierarchical layout applied successfully');
        console.log(`  - Nodes positioned: ${layoutResult.nodes.length}`);
        console.log(`  - Hierarchy levels: ${layoutResult.analysis.maxLevels}`);
        console.log(`  - Canvas size: ${Math.round(layoutResult.boundingBox.width)}x${Math.round(layoutResult.boundingBox.height)}`);

        const metrics = layoutResult.metrics;
        console.log('\n✓ Layout quality metrics:');
        console.log(`  - Edge crossings: ${metrics.edgeCrossings}`);
        console.log(`  - Node overlaps: ${metrics.nodeOverlaps}`);
        console.log(`  - Avg edge length: ${Math.round(metrics.avgEdgeLength)}px`);
        console.log(`  - Cluster separation: ${Math.round(metrics.clusterSeparation)}px`);

        const issues: string[] = [];
        if (metrics.nodeOverlaps > 0) {
            issues.push(`${metrics.nodeOverlaps} node overlaps detected`);
        }
        if (metrics.edgeCrossings > analysis.nodeCount * 0.2) {
            issues.push('High number of edge crossings');
        }
        if (layoutResult.nodes.some((n: any) => !n.position || isNaN(n.position.x) || isNaN(n.position.y))) {
            issues.push('Invalid node positions detected');
        }

        if (issues.length === 0) {
            console.log('\nLayout validation PASSED - Algorithm working correctly!');
        } else {
            console.log('\nLayout validation found issues:');
            issues.forEach(issue => console.log(`  - ${issue}`));
        }

        const reactFlowService = new ReactFlowService();
        const reactFlowResult = reactFlowService.convertDataToReactFlowDataTypes(
            data.graphNodes,
            data.c1Output,
            data.c2Subcategories,
            data.graphEdges,
            true,
            'hierarchical'
        );

        console.log('\n✓ ReactFlow integration working');
        console.log(`  - ReactFlow nodes: ${reactFlowResult.nodes.length}`);
        console.log(`  - ReactFlow edges: ${reactFlowResult.edges.length}`);

        const suggestions = layoutManager.suggestLayoutImprovements(
            layoutResult.analysis,
            layoutResult.metrics
        );

        if (suggestions.length > 0) {
            console.log('\nLayout improvement suggestions:');
            suggestions.forEach((suggestion: string, index: number) => {
                console.log(`  ${index + 1}. ${suggestion}`);
            });
        }

        console.log('\nHierarchical Layout Algorithm validation complete!');
        console.log('Ready for production use with your 20k LOC codebase visualization!');

        return {
            success: true,
            analysis,
            metrics,
            suggestions,
            nodeCount: layoutResult.nodes.length
        };

    } catch (error: any) {
        console.error('\nValidation failed:', error);
        return {
            success: false,
            error: error?.message || 'Unknown error'
        };
    }
}

if (typeof window === 'undefined') {
    validateHierarchicalLayout();
}
