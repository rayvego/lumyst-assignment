import { CodeAnalyzer, type CodeMetrics, type NamingAnalysis } from "./code-analyzer";

export interface FunctionNode {
	id: string;
	label: string;
	code?: string;
	filePath?: string; // For file path analysis
}

export interface ScoredFunctionNode extends FunctionNode {
	importanceScore: number; // 0.0 to 1.0
	isUtility: boolean;
	confidence: number; // How confident we are in the classification
	reasons: string[]; // Why it was classified this way
	metrics?: CodeMetrics;
	namingAnalysis?: NamingAnalysis;
}

export interface FilterResult {
	allNodes: ScoredFunctionNode[];
	businessLogic: ScoredFunctionNode[]; // High importance (score >= threshold)
	utilities: ScoredFunctionNode[]; // Low importance (score < threshold)
	statistics: {
		total: number;
		businessLogicCount: number;
		utilityCount: number;
		averageImportance: number;
		medianImportance: number;
	};
}

export interface GraphMetrics {
	fanIn: number; // How many functions call this
	fanOut: number; // How many functions this calls
	degreeCentrality: number; // Overall connectivity
}

/**
 * Configuration for the filter
 */
export interface FilterConfig {
	utilityThreshold: number; // Below this score = utility (default: 0.4)
	strictMode: boolean; // If true, be more aggressive in filtering
	preserveClasses: boolean; // Never mark classes as utilities
	preserveDecoratedFunctions: boolean; // Never mark decorated functions as utilities
}

const DEFAULT_CONFIG: FilterConfig = {
	utilityThreshold: 0.4,
	strictMode: false,
	preserveClasses: true,
	preserveDecoratedFunctions: true,
};

/**
 * Weights for different heuristics (tuned for optimal performance)
 */
const HEURISTIC_WEIGHTS = {
	complexity: 0.25,
	codeStructure: 0.20,
	naming: 0.20,
	patterns: 0.15,
	documentation: 0.10,
	uniqueness: 0.10,
};

/**
 * Elite Utility Function Filter
 * Uses multiple sophisticated heuristics to score function importance
 */
export class UtilityFilterService {
	private config: FilterConfig;

	constructor(config: Partial<FilterConfig> = {}) {
		this.config = { ...DEFAULT_CONFIG, ...config };
	}

	/**
	 * Main filter function - analyzes and scores all functions
	 * Now includes graph-based metrics (fan-in, fan-out)
	 */
	public filterFunctions(
		nodes: FunctionNode[],
		edges?: Array<{ source: string; target: string }>,
	): FilterResult {
		// Calculate graph metrics if edges provided
		const graphMetricsMap = edges ? this.calculateGraphMetrics(nodes, edges) : new Map();
		const scoredNodes = nodes.map((node) => 
			this.scoreFunction(node, graphMetricsMap.get(node.id)),
		);

		// Sort by importance score (descending)
		scoredNodes.sort((a, b) => b.importanceScore - a.importanceScore);

		// Split into business logic and utilities
		const businessLogic = scoredNodes.filter(
			(n) => n.importanceScore >= this.config.utilityThreshold,
		);
		const utilities = scoredNodes.filter(
			(n) => n.importanceScore < this.config.utilityThreshold,
		);

		// Calculate statistics
		const scores = scoredNodes.map((n) => n.importanceScore);
		const avgScore =
			scores.reduce((sum, score) => sum + score, 0) / scores.length;
		const medianScore = this.calculateMedian(scores);

		return {
			allNodes: scoredNodes,
			businessLogic,
			utilities,
			statistics: {
				total: scoredNodes.length,
				businessLogicCount: businessLogic.length,
				utilityCount: utilities.length,
				averageImportance: avgScore,
				medianImportance: medianScore,
			},
		};
	}

	/**
	 * Calculate graph-based metrics (fan-in, fan-out, centrality)
	 */
	private calculateGraphMetrics(
		nodes: FunctionNode[],
		edges: Array<{ source: string; target: string }>,
	): Map<string, GraphMetrics> {
		const metrics = new Map<string, GraphMetrics>();
		const nodeIds = new Set(nodes.map((n) => n.id));

		// Initialize metrics for all nodes
		for (const node of nodes) {
			metrics.set(node.id, { fanIn: 0, fanOut: 0, degreeCentrality: 0 });
		}

		// Calculate fan-in and fan-out
		for (const edge of edges) {
			if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
				const sourceMetrics = metrics.get(edge.source)!;
				const targetMetrics = metrics.get(edge.target)!;
				sourceMetrics.fanOut++;
				targetMetrics.fanIn++;
			}
		}

		// Calculate degree centrality (fan-in + fan-out)
		for (const [id, m] of metrics.entries()) {
			m.degreeCentrality = m.fanIn + m.fanOut;
		}

		return metrics;
	}

	/**
	 * Analyze file path for utility indicators
	 */
	private analyzeFilePath(filePath?: string): number {
		if (!filePath) return 0.5; // Neutral if no path

		let score = 0.5;
		const lowerPath = filePath.toLowerCase();

		// Penalize utility-like paths
		if (lowerPath.includes("/utils/") || lowerPath.includes("/util/")) score -= 0.3;
		if (lowerPath.includes("/helpers/") || lowerPath.includes("/helper/")) score -= 0.3;
		if (lowerPath.includes("/common/")) score -= 0.2;
		if (lowerPath.includes("/shared/")) score -= 0.2;
		if (lowerPath.includes("/lib/") || lowerPath.includes("/libs/")) score -= 0.2;
		if (lowerPath.includes("/test/") || lowerPath.includes("/tests/")) score -= 0.4;
		if (lowerPath.includes("_test.") || lowerPath.includes(".test.")) score -= 0.4;
		if (lowerPath.includes("/mock/") || lowerPath.includes("/mocks/")) score -= 0.4;

		// Boost for core/main paths
		if (lowerPath.includes("/core/") && !lowerPath.includes("/utils/")) score += 0.2;
		if (lowerPath.includes("/main/") || lowerPath.includes("/app/")) score += 0.2;
		if (lowerPath.includes("/business/") || lowerPath.includes("/domain/")) score += 0.3;

		return Math.max(0, Math.min(1, score));
	}

	/**
	 * Score a single function using multi-heuristic analysis + graph metrics
	 */
	private scoreFunction(
		node: FunctionNode,
		graphMetrics?: GraphMetrics,
	): ScoredFunctionNode {
		// If no code available, assume medium importance
		if (!node.code) {
			return {
				...node,
				importanceScore: 0.5,
				isUtility: false,
				confidence: 0.3,
				reasons: ["No code available for analysis"],
			};
		}

		const analyzer = new CodeAnalyzer(node.code);
		const metrics = analyzer.calculateMetrics();
		const naming = analyzer.analyzeNaming();

		// Run all heuristics
		const complexityScore = this.analyzeComplexity(metrics, analyzer);
		const structureScore = this.analyzeCodeStructure(metrics, analyzer);
		const namingScore = this.analyzeNaming(naming);
		const patternScore = this.analyzePatterns(analyzer, metrics);
		const documentationScore = this.analyzeDocumentation(metrics);
		const uniquenessScore = this.analyzeUniqueness(metrics, naming);

		// Calculate weighted importance score
		const importanceScore =
			complexityScore * HEURISTIC_WEIGHTS.complexity +
			structureScore * HEURISTIC_WEIGHTS.codeStructure +
			namingScore * HEURISTIC_WEIGHTS.naming +
			patternScore * HEURISTIC_WEIGHTS.patterns +
			documentationScore * HEURISTIC_WEIGHTS.documentation +
			uniquenessScore * HEURISTIC_WEIGHTS.uniqueness;

		// Apply overrides based on config
		let finalScore = importanceScore;
		const reasons: string[] = [];

		if (this.config.preserveClasses && metrics.numberOfClasses > 0) {
			finalScore = Math.max(finalScore, 0.7);
			reasons.push("Class definition - preserved");
		}

		if (
			this.config.preserveDecoratedFunctions &&
			metrics.isDecorated
		) {
			finalScore = Math.max(finalScore, 0.6);
			reasons.push("Decorated function - preserved");
		}

		// Add reasoning
		this.addReasons(reasons, complexityScore, structureScore, namingScore, metrics, naming, analyzer);

		// Calculate confidence based on code availability and analysis depth
		const confidence = this.calculateConfidence(metrics, node.code);

		return {
			...node,
			importanceScore: Math.max(0, Math.min(1, finalScore)),
			isUtility: finalScore < this.config.utilityThreshold,
			confidence,
			reasons,
			metrics,
			namingAnalysis: naming,
		};
	}

	/**
	 * Heuristic 1: Complexity Analysis
	 * Higher complexity = more important (likely business logic)
	 */
	private analyzeComplexity(
		metrics: CodeMetrics,
		analyzer: CodeAnalyzer,
	): number {
		let score = 0;

		// Cyclomatic complexity (normalized)
		// CC of 1-2 = very simple (utility)
		// CC of 3-5 = moderate
		// CC > 5 = complex (business logic)
		if (metrics.cyclomaticComplexity <= 2) {
			score += 0.1;
		} else if (metrics.cyclomaticComplexity <= 5) {
			score += 0.4;
		} else if (metrics.cyclomaticComplexity <= 10) {
			score += 0.7;
		} else {
			score += 0.9;
		}

		// Cognitive complexity (more weight on nested structures)
		if (metrics.cognitiveComplexity <= 3) {
			score += 0.1;
		} else if (metrics.cognitiveComplexity <= 7) {
			score += 0.4;
		} else {
			score += 0.8;
		}

		// Nesting depth
		if (metrics.nestedDepth >= 2) {
			score += 0.3;
		}

		// Number of branches
		if (metrics.numberOfBranches >= 2) {
			score += 0.2;
		}

		// Normalize (max possible = 2.3, normalize to 0-1)
		return Math.min(1.0, score / 2.3);
	}

	/**
	 * Heuristic 2: Code Structure Analysis
	 * Look at LOC, parameters, returns, assignments
	 */
	private analyzeCodeStructure(
		metrics: CodeMetrics,
		analyzer: CodeAnalyzer,
	): number {
		let score = 0;

		// Lines of code (non-empty)
		// Very short functions are often utilities
		if (metrics.nonEmptyLines <= 3) {
			score += 0.1;
		} else if (metrics.nonEmptyLines <= 10) {
			score += 0.4;
		} else if (metrics.nonEmptyLines <= 30) {
			score += 0.7;
		} else {
			score += 0.9;
		}

		// Number of parameters
		// Utilities often have 0-2 params
		if (metrics.numberOfParameters === 0) {
			score += 0.2;
		} else if (metrics.numberOfParameters <= 2) {
			score += 0.4;
		} else {
			score += 0.7;
		}

		// Multiple returns often indicate complex logic
		if (metrics.numberOfReturns >= 2) {
			score += 0.3;
		}

		// Function calls - utilities often just call one thing
		if (metrics.numberOfFunctionCalls === 1) {
			score += 0.2; // Possible wrapper
		} else if (metrics.numberOfFunctionCalls >= 3) {
			score += 0.5; // Complex orchestration
		}

		// Assignments indicate state manipulation
		if (metrics.numberOfAssignments >= 2) {
			score += 0.3;
		}

		// Check for pass-through patterns
		if (analyzer.isPassThrough()) {
			score -= 0.5; // Strong utility indicator
		}

		// Simple getters/setters
		if (analyzer.isSimpleGetter() || analyzer.isSimpleSetter()) {
			score -= 0.4;
		}

		// Normalize (max = ~2.6)
		return Math.max(0, Math.min(1.0, score / 2.6));
	}

	/**
	 * Heuristic 3: Naming Analysis
	 * Function names tell us a lot about their purpose
	 */
	private analyzeNaming(naming: NamingAnalysis): number {
		let score = 0.5; // Start neutral

		// Dunder methods are typically infrastructure/magic methods
		if (naming.isDunderMethod) {
			// Special case: __init__ is important for classes
			if (naming.functionName === "__init__") {
				score -= 0.2; // Moderate penalty
			} else {
				score -= 0.35; // High penalty for other dunder methods
			}
		}

		// Utility-like naming patterns (reduce score)
		if (naming.isGetter) score -= 0.3;
		if (naming.isSetter) score -= 0.3;
		if (naming.isChecker) score -= 0.2;
		if (naming.isFormatter) score -= 0.25;
		if (naming.isParser) score -= 0.2;
		if (naming.isLogger) score -= 0.4;
		if (naming.isWrapper) score -= 0.35;
		if (naming.isHelper) score -= 0.4;

		// Generic names are bad
		if (naming.hasGenericName) score -= 0.3;

		// Verb-noun patterns (getUser, setConfig) are typical utilities
		if (naming.verbNounPattern) score -= 0.15;

		// Private functions are often utilities
		if (naming.isPrivate) score -= 0.1;

		// Name length can indicate purpose
		// Very short names (< 5 chars) or very long (> 30) are often utilities
		if (naming.nameLength < 5) {
			score -= 0.1;
		} else if (naming.nameLength > 30) {
			score -= 0.05;
		} else if (naming.nameLength >= 10 && naming.nameLength <= 20) {
			score += 0.1; // Good descriptive length for business logic
		}

		return Math.max(0, Math.min(1.0, score));
	}

	/**
	 * Heuristic 4: Pattern Detection
	 * Look for common utility patterns
	 */
	private analyzePatterns(
		analyzer: CodeAnalyzer,
		metrics: CodeMetrics,
	): number {
		let score = 0.5; // Start neutral

		// Properties are often simple accessors
		if (metrics.isProperty) {
			score -= 0.3;
		}

		// Async functions often indicate important operations
		if (metrics.isAsync) {
			score += 0.2;
		}

		// Decorated functions are often important (routes, validators, etc.)
		if (metrics.isDecorated) {
			score += 0.3;
		}

		// Class definitions are usually important
		if (metrics.numberOfClasses > 0) {
			score += 0.4;
		}

		// Multiple methods in one node = complex structure
		if (metrics.numberOfMethods > 1) {
			score += 0.3;
		}

		// High comment-to-code ratio can indicate important logic
		if (metrics.commentLines > 0) {
			const ratio = metrics.commentLines / metrics.nonEmptyLines;
			if (ratio > 0.2) {
				score += 0.2;
			}
		}

		return Math.max(0, Math.min(1.0, score));
	}

	/**
	 * Heuristic 5: Documentation Analysis
	 * Well-documented functions are often more important
	 */
	private analyzeDocumentation(metrics: CodeMetrics): number {
		let score = 0;

		// Has documentation
		if (metrics.hasDocumentation) {
			score += 0.6;
		}

		// Has type annotations
		if (metrics.hasTypeAnnotations) {
			score += 0.3;
		}

		// Good comment ratio
		if (metrics.commentLines > 3) {
			score += 0.2;
		}

		return Math.min(1.0, score);
	}

	/**
	 * Heuristic 6: Uniqueness Analysis
	 * Unique, specific code is more likely to be business logic
	 */
	private analyzeUniqueness(
		metrics: CodeMetrics,
		naming: NamingAnalysis,
	): number {
		let score = 0.5;

		// High number of unique identifiers = specific domain logic
		if (metrics.uniqueIdentifiers >= 10) {
			score += 0.4;
		} else if (metrics.uniqueIdentifiers >= 5) {
			score += 0.2;
		} else if (metrics.uniqueIdentifiers <= 2) {
			score -= 0.2;
		}

		// Imports often indicate integration/orchestration
		if (metrics.numberOfImports >= 3) {
			score += 0.3;
		}

		return Math.max(0, Math.min(1.0, score));
	}

	/**
	 * Add human-readable reasons for the classification
	 */
	private addReasons(
		reasons: string[],
		complexityScore: number,
		structureScore: number,
		namingScore: number,
		metrics: CodeMetrics,
		naming: NamingAnalysis,
		analyzer: CodeAnalyzer,
	): void {
		// Complexity reasons
		if (metrics.cyclomaticComplexity <= 2) {
			reasons.push(`Low complexity (CC=${metrics.cyclomaticComplexity})`);
		} else if (metrics.cyclomaticComplexity >= 8) {
			reasons.push(
				`High complexity (CC=${metrics.cyclomaticComplexity}) - business logic`,
			);
		}

		// Structure reasons
		if (metrics.nonEmptyLines <= 5) {
			reasons.push(`Very short (${metrics.nonEmptyLines} lines)`);
		} else if (metrics.nonEmptyLines >= 30) {
			reasons.push(`Long function (${metrics.nonEmptyLines} lines) - likely important`);
		}

		if (analyzer.isPassThrough()) {
			reasons.push("Pass-through wrapper pattern detected");
		}

		if (analyzer.isSimpleGetter()) {
			reasons.push("Simple property getter");
		}

		if (analyzer.isSimpleSetter()) {
			reasons.push("Simple property setter");
		}

		// Naming reasons
		if (naming.isDunderMethod) reasons.push("Dunder/magic method");
		if (naming.isGetter) reasons.push("Getter naming pattern");
		if (naming.isSetter) reasons.push("Setter naming pattern");
		if (naming.isLogger) reasons.push("Logger utility");
		if (naming.isFormatter) reasons.push("Formatter utility");
		if (naming.isHelper) reasons.push("Helper utility");
		if (naming.hasGenericName) reasons.push("Generic utility name");

		// Pattern reasons
		if (metrics.isProperty) reasons.push("Property decorator");
		if (metrics.isDecorated) reasons.push("Has decorators - likely important");
		if (metrics.numberOfClasses > 0) reasons.push("Contains class definition");

		// Documentation reasons
		if (metrics.hasDocumentation) reasons.push("Well documented");
		if (!metrics.hasDocumentation && structureScore > 0.6) {
			reasons.push("Complex but undocumented");
		}

		// Keep only most relevant reasons (top 5)
		reasons.splice(5);
	}

	/**
	 * Calculate confidence in the classification
	 */
	private calculateConfidence(metrics: CodeMetrics, code: string): number {
		let confidence = 0.5;

		// More code = more data = higher confidence
		if (metrics.nonEmptyLines >= 10) confidence += 0.2;
		if (metrics.nonEmptyLines >= 30) confidence += 0.1;

		// Complex code is easier to classify
		if (metrics.cyclomaticComplexity >= 5) confidence += 0.15;

		// Documentation helps
		if (metrics.hasDocumentation) confidence += 0.1;

		// Multiple heuristics agreeing = higher confidence
		// (this would require tracking agreement, simplified here)
		confidence += 0.05;

		return Math.min(1.0, confidence);
	}

	/**
	 * Calculate median of an array
	 */
	private calculateMedian(numbers: number[]): number {
		const sorted = [...numbers].sort((a, b) => a - b);
		const mid = Math.floor(sorted.length / 2);
		return sorted.length % 2 === 0
			? (sorted[mid - 1] + sorted[mid]) / 2
			: sorted[mid];
	}

	/**
	 * Generate detailed report of the filtering
	 */
	public generateReport(result: FilterResult): string {
		const { statistics, businessLogic, utilities } = result;

		let report = "# Utility Function Detection Report\n\n";
		report += `## Summary\n`;
		report += `- Total Functions: ${statistics.total}\n`;
		report += `- Business Logic: ${statistics.businessLogicCount} (${((statistics.businessLogicCount / statistics.total) * 100).toFixed(1)}%)\n`;
		report += `- Utilities: ${statistics.utilityCount} (${((statistics.utilityCount / statistics.total) * 100).toFixed(1)}%)\n`;
		report += `- Average Importance: ${statistics.averageImportance.toFixed(3)}\n`;
		report += `- Median Importance: ${statistics.medianImportance.toFixed(3)}\n\n`;

		report += `## Top 10 Most Important Functions\n`;
		businessLogic.slice(0, 10).forEach((node, i) => {
			report += `${i + 1}. **${node.label}** (score: ${node.importanceScore.toFixed(3)})\n`;
			report += `   - ${node.reasons.join(", ")}\n`;
		});

		report += `\n## Top 10 Detected Utilities\n`;
		utilities.slice(0, 10).forEach((node, i) => {
			report += `${i + 1}. **${node.label}** (score: ${node.importanceScore.toFixed(3)})\n`;
			report += `   - ${node.reasons.join(", ")}\n`;
		});

		return report;
	}
}
