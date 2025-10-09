export interface CodeNode {
  id: string;
  label: string;
  code: string | null;
  type: string;
}

export interface AnalysisData {
  graphNodes: CodeNode[];
}

export interface FunctionFeatures {
  linesOfCode: number;
  cyclomaticComplexity: number;
  nestingLevel: number;
  variableCount: number;
  returnStatements: number;
  externalCalls: number;
  hasDocstring: boolean;
  parameterCount: number;
  hasDecorators: boolean;
  stringOperations: number;
  mathOperations: number;
  conditionalStatements: number;
}

export interface FunctionAnalysis {
  id: string;
  label: string;
  type: string;
  code: string;
  features: FunctionFeatures;
  importanceScore: number;
  utilityScore: number;
  businessRelevanceScore: number;
  classification: 'business-logic' | 'utility' | 'infrastructure';
  reasoning: string;
}

export interface UtilityDetectionResult {
  functions: FunctionAnalysis[];
  summary: {
    totalFunctions: number;
    businessLogicFunctions: number;
    utilityFunctions: number;
    infrastructureFunctions: number;
    averageImportanceScore: number;
  };
}