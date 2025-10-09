import { UtilityAnalysisService } from '../services/utility-analysis.service';
import { AnalysisData } from '../types/utility-analysis';
import analysisData from '../data/analysis-with-code.json';

/**
 * Demo script to test the Utility Analysis Service
 */
async function runUtilityAnalysisDemo() {
  console.log('🔍 Starting FastAPI Utility Function Analysis...\n');

  const service = new UtilityAnalysisService();
  const inputData: AnalysisData = analysisData.analysisData;

  console.log(`📊 Input Data Summary:`);
  console.log(`- Total nodes: ${inputData.graphNodes.length}`);
  
  const codeNodes = inputData.graphNodes.filter(node => 
    (node.type === 'Function' || node.type === 'Method') && 
    node.code !== null && 
    node.code.trim().length > 0
  );
  console.log(`- Functions/Methods with code: ${codeNodes.length}\n`);

  // Run the analysis
  const startTime = Date.now();
  const result = service.analyzeUtilityFunctions(inputData);
  const endTime = Date.now();

  console.log(`⚡ Analysis completed in ${endTime - startTime}ms\n`);

  // Display summary
  console.log('📈 Analysis Summary:');
  console.log(`- Total Functions Analyzed: ${result.summary.totalFunctions}`);
  console.log(`- Business Logic Functions: ${result.summary.businessLogicFunctions} (${((result.summary.businessLogicFunctions / result.summary.totalFunctions) * 100).toFixed(1)}%)`);
  console.log(`- Utility Functions: ${result.summary.utilityFunctions} (${((result.summary.utilityFunctions / result.summary.totalFunctions) * 100).toFixed(1)}%)`);
  console.log(`- Infrastructure Functions: ${result.summary.infrastructureFunctions} (${((result.summary.infrastructureFunctions / result.summary.totalFunctions) * 100).toFixed(1)}%)`);
  console.log(`- Average Importance Score: ${result.summary.averageImportanceScore}\n`);

  // Display top 10 most important functions (business logic)
  console.log('🏆 Top 10 Most Important Functions (Business Logic):');
  console.log('=' .repeat(80));
  const topFunctions = service.getTopImportantFunctions(result, 10);
  topFunctions.forEach((func, index) => {
    console.log(`${index + 1}. ${func.label} (${func.type})`);
    console.log(`   📍 ID: ${func.id}`);
    console.log(`   ⭐ Importance Score: ${func.importanceScore.toFixed(3)}`);
    console.log(`   🏢 Business Relevance: ${func.businessRelevanceScore.toFixed(3)}`);
    console.log(`   🔧 Utility Score: ${func.utilityScore.toFixed(3)}`);
    console.log(`   📋 Classification: ${func.classification}`);
    console.log(`   💡 Reasoning: ${func.reasoning}`);
    console.log(`   📏 Code Length: ${func.features.linesOfCode} lines`);
    console.log(`   🔀 Complexity: ${func.features.cyclomaticComplexity}`);
    console.log('');
  });

  // Display top 10 utility functions
  console.log('🛠️  Top 10 Utility Functions (Likely Trivial):');
  console.log('=' .repeat(80));
  const utilityFunctions = service.getBottomUtilityFunctions(result, 10);
  utilityFunctions.forEach((func, index) => {
    console.log(`${index + 1}. ${func.label} (${func.type})`);
    console.log(`   📍 ID: ${func.id}`);
    console.log(`   ⭐ Importance Score: ${func.importanceScore.toFixed(3)}`);
    console.log(`   🏢 Business Relevance: ${func.businessRelevanceScore.toFixed(3)}`);
    console.log(`   🔧 Utility Score: ${func.utilityScore.toFixed(3)}`);
    console.log(`   📋 Classification: ${func.classification}`);
    console.log(`   💡 Reasoning: ${func.reasoning}`);
    console.log(`   📏 Code Length: ${func.features.linesOfCode} lines`);
    console.log(`   🔀 Complexity: ${func.features.cyclomaticComplexity}`);
    console.log('');
  });

  // Show some code examples
  console.log('📝 Code Examples:');
  console.log('=' .repeat(80));
  
  const businessExample = result.functions.find(f => f.classification === 'business-logic');
  if (businessExample) {
    console.log('🏢 Business Logic Example:');
    console.log(`Function: ${businessExample.label}`);
    console.log('```typescript');
    console.log(businessExample.code.substring(0, 300) + (businessExample.code.length > 300 ? '...' : ''));
    console.log('```\n');
  }

  const utilityExample = result.functions.find(f => f.classification === 'utility');
  if (utilityExample) {
    console.log('🛠️ Utility Function Example:');
    console.log(`Function: ${utilityExample.label}`);
    console.log('```typescript');
    console.log(utilityExample.code.substring(0, 300) + (utilityExample.code.length > 300 ? '...' : ''));
    console.log('```\n');
  }

  // Classification breakdown
  console.log('📊 Detailed Classification Breakdown:');
  console.log('=' .repeat(50));
  
  const businessFunctions = service.filterByClassification(result, 'business-logic');
  const utilityFunctionsList = service.filterByClassification(result, 'utility');
  const infrastructureFunctions = service.filterByClassification(result, 'infrastructure');

  console.log(`\n🏢 Business Logic Functions (${businessFunctions.length}):`);
  businessFunctions.slice(0, 5).forEach(f => {
    console.log(`  - ${f.label} (score: ${f.importanceScore.toFixed(3)})`);
  });
  if (businessFunctions.length > 5) {
    console.log(`  ... and ${businessFunctions.length - 5} more`);
  }

  console.log(`\n🛠️ Utility Functions (${utilityFunctionsList.length}):`);
  utilityFunctionsList.slice(0, 5).forEach(f => {
    console.log(`  - ${f.label} (score: ${f.importanceScore.toFixed(3)})`);
  });
  if (utilityFunctionsList.length > 5) {
    console.log(`  ... and ${utilityFunctionsList.length - 5} more`);
  }

  console.log(`\n🏗️ Infrastructure Functions (${infrastructureFunctions.length}):`);
  infrastructureFunctions.slice(0, 5).forEach(f => {
    console.log(`  - ${f.label} (score: ${f.importanceScore.toFixed(3)})`);
  });
  if (infrastructureFunctions.length > 5) {
    console.log(`  ... and ${infrastructureFunctions.length - 5} more`);
  }

  console.log('\n✅ Analysis Complete!');
  console.log('\n📋 Methodology Summary:');
  console.log('This analysis used static code analysis techniques including:');
  console.log('• Function naming pattern analysis');
  console.log('• Code complexity metrics (cyclomatic complexity, nesting)');
  console.log('• FastAPI-specific pattern detection');
  console.log('• String/math operation counting');
  console.log('• Parameter and variable analysis');
  console.log('• Decorator and docstring detection');
  console.log('• Multi-factor scoring algorithm');
}

// Run the demo if this file is executed directly
if (require.main === module) {
  runUtilityAnalysisDemo().catch(console.error);
}

export { runUtilityAnalysisDemo };