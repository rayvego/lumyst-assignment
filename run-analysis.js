#!/usr/bin/env node

const { UtilityAnalysisService } = require('./dist/services/utility-analysis.service.js');
const analysisData = require('./core/data/analysis-with-code.json');

console.log('FastAPI Utility Function Analysis Demo\n');

const service = new UtilityAnalysisService();
const inputData = analysisData.analysisData;

console.log('Input Data Summary:');
console.log(`- Total nodes: ${inputData.graphNodes.length}`);

const codeNodes = inputData.graphNodes.filter(node => 
    (node.type === 'Function' || node.type === 'Method') && 
    node.code !== null && 
    node.code.trim().length > 0
);
console.log(`- Functions/Methods with code: ${codeNodes.length}\n`);

const startTime = Date.now();
const result = service.analyzeUtilityFunctions(inputData);
const endTime = Date.now();

console.log(`Analysis completed in ${endTime - startTime}ms\n`);

console.log('Analysis Summary:');
console.log(`- Total Functions Analyzed: ${result.summary.totalFunctions}`);
console.log(`- Business Logic Functions: ${result.summary.businessLogicFunctions} (${((result.summary.businessLogicFunctions / result.summary.totalFunctions) * 100).toFixed(1)}%)`);
console.log(`- Utility Functions: ${result.summary.utilityFunctions} (${((result.summary.utilityFunctions / result.summary.totalFunctions) * 100).toFixed(1)}%)`);
console.log(`- Infrastructure Functions: ${result.summary.infrastructureFunctions} (${((result.summary.infrastructureFunctions / result.summary.totalFunctions) * 100).toFixed(1)}%)`);
console.log(`- Average Importance Score: ${result.summary.averageImportanceScore}\n`);

console.log('Top 5 Most Important Functions (Business Logic):');
console.log('='.repeat(60));
const topFunctions = service.getTopImportantFunctions(result, 5);
topFunctions.forEach((func, index) => {
    console.log(`${index + 1}. ${func.label} (${func.type})`);
    console.log(`   Importance: ${func.importanceScore.toFixed(3)} | Business: ${func.businessRelevanceScore.toFixed(3)} | Utility: ${func.utilityScore.toFixed(3)}`);
    console.log(`   Classification: ${func.classification}`);
    console.log(`   ${func.features.linesOfCode} lines | Complexity: ${func.features.cyclomaticComplexity}`);
    console.log('');
});

console.log('Top 5 Utility Functions:');
console.log('='.repeat(60));
const utilityFunctions = service.getBottomUtilityFunctions(result, 5);
utilityFunctions.forEach((func, index) => {
    console.log(`${index + 1}. ${func.label} (${func.type})`);
    console.log(`   Importance: ${func.importanceScore.toFixed(3)} | Business: ${func.businessRelevanceScore.toFixed(3)} | Utility: ${func.utilityScore.toFixed(3)}`);
    console.log(`   Classification: ${func.classification}`);
    console.log(`   ${func.features.linesOfCode} lines | Complexity: ${func.features.cyclomaticComplexity}`);
    console.log('');
});

console.log('Analysis Complete!');
