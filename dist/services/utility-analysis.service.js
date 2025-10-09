"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UtilityAnalysisService = void 0;
/**
 * Static Analysis Service for detecting and filtering trivial utility functions
 * from a FastAPI codebase.
 *
 * This service uses multiple algorithms and techniques to identify utility functions
 * vs business logic functions without using LLMs or complex ML models.
 */
class UtilityAnalysisService {
    constructor() {
        this.UTILITY_KEYWORDS = [
            'utils', 'helper', 'util', 'get_', 'set_', 'format_', 'parse_', 'convert_',
            'transform_', 'validate_', 'check_', 'is_', 'has_', 'to_', 'from_',
            'encode_', 'decode_', 'serialize_', 'deserialize_', 'trim_', 'split_',
            'join_', 'strip_', 'clean_', 'normalize_', 'sanitize_', 'log_', 'logger_'
        ];
        this.BUSINESS_KEYWORDS = [
            'create_', 'update_', 'delete_', 'process_', 'handle_', 'manage_',
            'calculate_', 'compute_', 'analyze_', 'generate_', 'build_', 'execute_',
            'run_', 'perform_', 'apply_', 'register_', 'authenticate_', 'authorize_',
            'route_', 'endpoint_', 'api_', 'service_'
        ];
        this.FASTAPI_DECORATORS = [
            '@app.get', '@app.post', '@app.put', '@app.delete', '@app.patch',
            '@router.get', '@router.post', '@router.put', '@router.delete', '@router.patch',
            '@api_route', '@depends'
        ];
    }
    /**
     * Main analysis method that processes the input data and returns utility detection results
     */
    analyzeUtilityFunctions(inputData) {
        // Filter for functions and methods only
        const codeNodes = inputData.graphNodes.filter(node => (node.type === 'Function' || node.type === 'Method') &&
            node.code !== null &&
            node.code.trim().length > 0);
        const functionAnalyses = codeNodes.map(node => this.analyzeSingleFunction(node));
        // Sort by importance score (descending)
        functionAnalyses.sort((a, b) => b.importanceScore - a.importanceScore);
        const summary = this.generateSummary(functionAnalyses);
        return {
            functions: functionAnalyses,
            summary
        };
    }
    /**
     * Analyzes a single function and extracts features and scores
     */
    analyzeSingleFunction(node) {
        const code = node.code;
        const features = this.extractFeatures(code);
        const utilityScore = this.calculateUtilityScore(node.label, code, features);
        const businessRelevanceScore = this.calculateBusinessRelevanceScore(node.label, code, features);
        const complexityScore = this.calculateComplexityScore(features);
        // Weighted importance score
        const importanceScore = this.calculateImportanceScore(utilityScore, businessRelevanceScore, complexityScore);
        const classification = this.classifyFunction(importanceScore, businessRelevanceScore, utilityScore);
        const reasoning = this.generateReasoning(node.label, features, utilityScore, businessRelevanceScore, complexityScore);
        return {
            id: node.id,
            label: node.label,
            type: node.type,
            code: code,
            features,
            importanceScore,
            utilityScore,
            businessRelevanceScore,
            classification,
            reasoning
        };
    }
    /**
     * Extracts static code features from function code
     */
    extractFeatures(code) {
        const lines = code.split('\n').filter(line => line.trim().length > 0);
        const codeText = code.toLowerCase();
        return {
            linesOfCode: lines.length,
            cyclomaticComplexity: this.calculateCyclomaticComplexity(code),
            nestingLevel: this.calculateMaxNestingLevel(code),
            variableCount: this.countVariables(code),
            returnStatements: this.countPatterns(code, /return\s+/g),
            externalCalls: this.countExternalCalls(code),
            hasDocstring: this.hasDocstring(code),
            parameterCount: this.countParameters(code),
            hasDecorators: this.hasDecorators(code),
            stringOperations: this.countStringOperations(code),
            mathOperations: this.countMathOperations(code),
            conditionalStatements: this.countConditionalStatements(code)
        };
    }
    /**
     * Calculates cyclomatic complexity by counting decision points
     */
    calculateCyclomaticComplexity(code) {
        const decisionPoints = [
            /\bif\b/g, /\belif\b/g, /\belse\b/g, /\bwhile\b/g, /\bfor\b/g,
            /\btry\b/g, /\bexcept\b/g, /\bfinally\b/g, /\band\b/g, /\bor\b/g,
            /\?\s*[^:]*:/g // ternary operators
        ];
        let complexity = 1; // base complexity
        decisionPoints.forEach(pattern => {
            const matches = code.match(pattern);
            if (matches)
                complexity += matches.length;
        });
        return complexity;
    }
    /**
     * Calculates maximum nesting level in the code
     */
    calculateMaxNestingLevel(code) {
        let maxLevel = 0;
        let currentLevel = 0;
        for (let char of code) {
            if (char === '{' || char === '(' || char === '[') {
                currentLevel++;
                maxLevel = Math.max(maxLevel, currentLevel);
            }
            else if (char === '}' || char === ')' || char === ']') {
                currentLevel--;
            }
        }
        // Also check indentation-based nesting (Python style)
        const lines = code.split('\n');
        let maxIndent = 0;
        lines.forEach(line => {
            const indent = line.match(/^\s*/)?.[0]?.length || 0;
            maxIndent = Math.max(maxIndent, Math.floor(indent / 4)); // assuming 4-space indentation
        });
        return Math.max(maxLevel, maxIndent);
    }
    /**
     * Counts variable assignments and declarations
     */
    countVariables(code) {
        const patterns = [
            /\b\w+\s*=\s*[^=]/g, // assignments
            /\blet\s+\w+/g, /\bconst\s+\w+/g, /\bvar\s+\w+/g, // JS declarations
            /\b\w+:\s*\w+/g // type annotations
        ];
        let count = 0;
        patterns.forEach(pattern => {
            const matches = code.match(pattern);
            if (matches)
                count += matches.length;
        });
        return count;
    }
    /**
     * Counts external function/method calls
     */
    countExternalCalls(code) {
        const patterns = [
            /\w+\.\w+\(/g, // method calls
            /\w+\(/g // function calls
        ];
        let count = 0;
        patterns.forEach(pattern => {
            const matches = code.match(pattern);
            if (matches)
                count += matches.length;
        });
        return count;
    }
    /**
     * Checks if function has docstring/documentation
     */
    hasDocstring(code) {
        return /"""[\s\S]*?"""|'''[\s\S]*?'''|\/\*\*[\s\S]*?\*\//g.test(code);
    }
    /**
     * Counts function parameters
     */
    countParameters(code) {
        const funcDefMatch = code.match(/def\s+\w+\s*\(([^)]*)\)|function\s+\w+\s*\(([^)]*)\)/);
        if (!funcDefMatch)
            return 0;
        const params = funcDefMatch[1] || funcDefMatch[2] || '';
        if (!params.trim())
            return 0;
        return params.split(',').filter(p => p.trim().length > 0).length;
    }
    /**
     * Checks if function has decorators
     */
    hasDecorators(code) {
        return /@\w+/g.test(code);
    }
    /**
     * Counts string manipulation operations
     */
    countStringOperations(code) {
        const patterns = [
            /\.strip\(/g, /\.split\(/g, /\.join\(/g, /\.replace\(/g,
            /\.upper\(/g, /\.lower\(/g, /\.trim\(/g, /\.substring\(/g,
            /\.startswith\(/g, /\.endswith\(/g, /\.find\(/g, /\.format\(/g
        ];
        return this.countMultiplePatterns(code, patterns);
    }
    /**
     * Counts mathematical operations
     */
    countMathOperations(code) {
        const patterns = [
            /[+\-*/%]/g, /\bmath\./g, /\bnumpy\./g, /\bsum\(/g,
            /\bmin\(/g, /\bmax\(/g, /\babs\(/g, /\bround\(/g
        ];
        return this.countMultiplePatterns(code, patterns);
    }
    /**
     * Counts conditional statements
     */
    countConditionalStatements(code) {
        const patterns = [/\bif\b/g, /\belif\b/g, /\belse\b/g, /\?\s*[^:]*:/g];
        return this.countMultiplePatterns(code, patterns);
    }
    /**
     * Helper method to count multiple patterns
     */
    countMultiplePatterns(code, patterns) {
        let count = 0;
        patterns.forEach(pattern => {
            const matches = code.match(pattern);
            if (matches)
                count += matches.length;
        });
        return count;
    }
    /**
     * Helper method to count single pattern occurrences
     */
    countPatterns(code, pattern) {
        const matches = code.match(pattern);
        return matches ? matches.length : 0;
    }
    /**
     * Calculates utility score (higher = more likely to be utility function)
     */
    calculateUtilityScore(label, code, features) {
        let score = 0;
        // Name-based scoring
        const labelLower = label.toLowerCase();
        const hasUtilityKeyword = this.UTILITY_KEYWORDS.some(keyword => labelLower.includes(keyword));
        if (hasUtilityKeyword)
            score += 0.3;
        // Simple function characteristics
        if (features.linesOfCode <= 5)
            score += 0.2;
        if (features.cyclomaticComplexity <= 2)
            score += 0.15;
        if (features.nestingLevel <= 1)
            score += 0.1;
        if (features.parameterCount <= 2)
            score += 0.1;
        if (features.returnStatements === 1)
            score += 0.05;
        // String/math operations indicate utility functions
        if (features.stringOperations > 0)
            score += Math.min(0.1, features.stringOperations * 0.02);
        if (features.mathOperations > 0)
            score += Math.min(0.1, features.mathOperations * 0.02);
        // Path-based scoring (check if in utils/helpers directory)
        if (/utils?|helpers?|lib|common/i.test(code))
            score += 0.1;
        return Math.min(score, 1.0);
    }
    /**
     * Calculates business relevance score (higher = more business logic)
     */
    calculateBusinessRelevanceScore(label, code, features) {
        let score = 0;
        // Name-based scoring
        const labelLower = label.toLowerCase();
        const hasBusinessKeyword = this.BUSINESS_KEYWORDS.some(keyword => labelLower.includes(keyword));
        if (hasBusinessKeyword)
            score += 0.3;
        // FastAPI-specific patterns
        const hasFastAPIDecorator = this.FASTAPI_DECORATORS.some(decorator => code.includes(decorator));
        if (hasFastAPIDecorator)
            score += 0.4;
        // API endpoint patterns
        if (/route|endpoint|api/i.test(labelLower))
            score += 0.2;
        if (/(get|post|put|delete|patch)_/i.test(labelLower))
            score += 0.2;
        // Complex business logic indicators
        if (features.cyclomaticComplexity > 5)
            score += 0.1;
        if (features.linesOfCode > 20)
            score += 0.1;
        if (features.nestingLevel > 2)
            score += 0.1;
        // Database/external service interactions
        if (/database|db|query|session|repository|service/i.test(code))
            score += 0.15;
        if (/async|await/i.test(code))
            score += 0.1;
        return Math.min(score, 1.0);
    }
    /**
     * Calculates complexity score
     */
    calculateComplexityScore(features) {
        let score = 0;
        // Normalize scores to 0-1 range
        score += Math.min(features.cyclomaticComplexity / 10, 0.3);
        score += Math.min(features.linesOfCode / 50, 0.3);
        score += Math.min(features.nestingLevel / 5, 0.2);
        score += Math.min(features.externalCalls / 10, 0.2);
        return Math.min(score, 1.0);
    }
    /**
     * Calculates final importance score
     */
    calculateImportanceScore(utilityScore, businessRelevanceScore, complexityScore) {
        // Higher business relevance and complexity = higher importance
        // Higher utility score = lower importance
        const importance = (businessRelevanceScore * 0.5) + (complexityScore * 0.3) - (utilityScore * 0.2);
        return Math.max(0, Math.min(1, importance));
    }
    /**
     * Classifies function based on scores
     */
    classifyFunction(importanceScore, businessRelevanceScore, utilityScore) {
        if (businessRelevanceScore > 0.6 || importanceScore > 0.7) {
            return 'business-logic';
        }
        else if (utilityScore > 0.5 || importanceScore < 0.3) {
            return 'utility';
        }
        else {
            return 'infrastructure';
        }
    }
    /**
     * Generates human-readable reasoning for the classification
     */
    generateReasoning(label, features, utilityScore, businessRelevanceScore, complexityScore) {
        const reasons = [];
        if (utilityScore > 0.5) {
            reasons.push(`High utility score (${utilityScore.toFixed(2)}) due to utility naming patterns`);
        }
        if (businessRelevanceScore > 0.5) {
            reasons.push(`High business relevance (${businessRelevanceScore.toFixed(2)}) indicating business logic`);
        }
        if (features.linesOfCode <= 5) {
            reasons.push(`Very short function (${features.linesOfCode} lines)`);
        }
        if (features.cyclomaticComplexity <= 2) {
            reasons.push(`Low complexity (${features.cyclomaticComplexity})`);
        }
        else if (features.cyclomaticComplexity > 5) {
            reasons.push(`High complexity (${features.cyclomaticComplexity})`);
        }
        if (features.stringOperations > 0) {
            reasons.push(`Contains string operations (${features.stringOperations})`);
        }
        if (features.hasDecorators) {
            reasons.push(`Has decorators (likely API endpoint)`);
        }
        if (reasons.length === 0) {
            reasons.push('Standard function with moderate complexity');
        }
        return reasons.join('; ');
    }
    /**
     * Generates summary statistics
     */
    generateSummary(analyses) {
        const total = analyses.length;
        const businessLogic = analyses.filter(a => a.classification === 'business-logic').length;
        const utility = analyses.filter(a => a.classification === 'utility').length;
        const infrastructure = analyses.filter(a => a.classification === 'infrastructure').length;
        const avgImportance = analyses.reduce((sum, a) => sum + a.importanceScore, 0) / total;
        return {
            totalFunctions: total,
            businessLogicFunctions: businessLogic,
            utilityFunctions: utility,
            infrastructureFunctions: infrastructure,
            averageImportanceScore: Number(avgImportance.toFixed(3))
        };
    }
    /**
     * Filters functions by classification
     */
    filterByClassification(result, classification) {
        return result.functions.filter(f => f.classification === classification);
    }
    /**
     * Gets top N most important functions
     */
    getTopImportantFunctions(result, n) {
        return result.functions.slice(0, n);
    }
    /**
     * Gets bottom N least important (most utility-like) functions
     */
    getBottomUtilityFunctions(result, n) {
        return result.functions.slice(-n).reverse();
    }
}
exports.UtilityAnalysisService = UtilityAnalysisService;
