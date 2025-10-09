import { AnalysisData, FunctionAnalysis, UtilityDetectionResult } from '../types/utility-analysis';
/**
 * Static Analysis Service for detecting and filtering trivial utility functions
 * from a FastAPI codebase.
 *
 * This service uses multiple algorithms and techniques to identify utility functions
 * vs business logic functions without using LLMs or complex ML models.
 */
export declare class UtilityAnalysisService {
    private readonly UTILITY_KEYWORDS;
    private readonly BUSINESS_KEYWORDS;
    private readonly FASTAPI_DECORATORS;
    /**
     * Main analysis method that processes the input data and returns utility detection results
     */
    analyzeUtilityFunctions(inputData: AnalysisData): UtilityDetectionResult;
    /**
     * Analyzes a single function and extracts features and scores
     */
    private analyzeSingleFunction;
    /**
     * Extracts static code features from function code
     */
    private extractFeatures;
    /**
     * Calculates cyclomatic complexity by counting decision points
     */
    private calculateCyclomaticComplexity;
    /**
     * Calculates maximum nesting level in the code
     */
    private calculateMaxNestingLevel;
    /**
     * Counts variable assignments and declarations
     */
    private countVariables;
    /**
     * Counts external function/method calls
     */
    private countExternalCalls;
    /**
     * Checks if function has docstring/documentation
     */
    private hasDocstring;
    /**
     * Counts function parameters
     */
    private countParameters;
    /**
     * Checks if function has decorators
     */
    private hasDecorators;
    /**
     * Counts string manipulation operations
     */
    private countStringOperations;
    /**
     * Counts mathematical operations
     */
    private countMathOperations;
    /**
     * Counts conditional statements
     */
    private countConditionalStatements;
    /**
     * Helper method to count multiple patterns
     */
    private countMultiplePatterns;
    /**
     * Helper method to count single pattern occurrences
     */
    private countPatterns;
    /**
     * Calculates utility score (higher = more likely to be utility function)
     */
    private calculateUtilityScore;
    /**
     * Calculates business relevance score (higher = more business logic)
     */
    private calculateBusinessRelevanceScore;
    /**
     * Calculates complexity score
     */
    private calculateComplexityScore;
    /**
     * Calculates final importance score
     */
    private calculateImportanceScore;
    /**
     * Classifies function based on scores
     */
    private classifyFunction;
    /**
     * Generates human-readable reasoning for the classification
     */
    private generateReasoning;
    /**
     * Generates summary statistics
     */
    private generateSummary;
    /**
     * Filters functions by classification
     */
    filterByClassification(result: UtilityDetectionResult, classification: 'business-logic' | 'utility' | 'infrastructure'): FunctionAnalysis[];
    /**
     * Gets top N most important functions
     */
    getTopImportantFunctions(result: UtilityDetectionResult, n: number): FunctionAnalysis[];
    /**
     * Gets bottom N least important (most utility-like) functions
     */
    getBottomUtilityFunctions(result: UtilityDetectionResult, n: number): FunctionAnalysis[];
}
