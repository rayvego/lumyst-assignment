
export enum ProgrammingLanguage {
	PYTHON = "python",
	JAVASCRIPT = "javascript",
	TYPESCRIPT = "typescript",
	JAVA = "java",
	GO = "go",
	RUST = "rust",
	CPP = "cpp",
	CSHARP = "csharp",
	RUBY = "ruby",
	PHP = "php",
	UNKNOWN = "unknown",
}

export interface CodeMetrics {
	// Basic Metrics
	linesOfCode: number;
	nonEmptyLines: number;
	commentLines: number;
	codeToCommentRatio: number;

	// Complexity Metrics
	cyclomaticComplexity: number;
	nestedDepth: number;
	numberOfBranches: number;
	cognitiveComplexity: number;

	// Function Analysis
	numberOfParameters: number;
	numberOfReturns: number;
	numberOfFunctionCalls: number;
	numberOfAssignments: number;

	// Code Patterns
	hasDocumentation: boolean;
	hasTypeAnnotations: boolean;
	isDecorated: boolean;
	isProperty: boolean;
	isAsync: boolean;

	// Structure Analysis
	numberOfImports: number;
	numberOfClasses: number;
	numberOfMethods: number;
	uniqueIdentifiers: number;

	// Language-specific
	detectedLanguage: ProgrammingLanguage;
}

export interface NamingAnalysis {
	functionName: string;
	isGetter: boolean;
	isSetter: boolean;
	isChecker: boolean; // is_, has_, can_, check_
	isFormatter: boolean; // format_, to_, as_, convert_
	isParser: boolean; // parse_, from_, decode_
	isLogger: boolean; // log_, debug_, info_
	isWrapper: boolean; // wrapper_, wrap_
	isHelper: boolean; // helper_, util_
		isPrivate: boolean;
		nameLength: number;
		hasGenericName: boolean;
		verbNounPattern: boolean; // getUser, setConfig - typical utility pattern
		isDunderMethod: boolean; // __init__, __call__, __str__, etc.
}

/**
 * Language Configuration for pattern matching
 */
interface LanguageConfig {
	functionPatterns: RegExp[];
	classPatterns: RegExp[];
	commentPatterns: RegExp[];
	stringPatterns: RegExp[];
	branchKeywords: string[];
	loopKeywords: string[];
	returnKeywords: string[];
	decoratorPatterns: RegExp[];
	propertyPatterns: RegExp[];
	asyncPatterns: RegExp[];
	typeHintPatterns: RegExp[];
}

/**
 * Universal Code Analyzer - Works with any programming language
 */
export class CodeAnalyzer {
	private code: string;
	private lines: string[];
	private language: ProgrammingLanguage;
	private config: LanguageConfig;

	private static readonly LANGUAGE_CONFIGS: Record<
		ProgrammingLanguage,
		LanguageConfig
	> = {
		[ProgrammingLanguage.PYTHON]: {
			functionPatterns: [/def\s+(\w+)/, /async\s+def\s+(\w+)/],
			classPatterns: [/class\s+(\w+)/],
			commentPatterns: [/^\s*#/, /^\s*"""/, /^\s*'''/],
			stringPatterns: [/"""[\s\S]*?"""/, /'''[\s\S]*?'''/, /"[^"]*"/, /'[^']*'/],
			branchKeywords: ["if", "elif", "else", "match", "case"],
			loopKeywords: ["for", "while"],
			returnKeywords: ["return", "yield"],
			decoratorPatterns: [/@\w+/],
			propertyPatterns: [/@property/],
			asyncPatterns: [/async\s+def/],
			typeHintPatterns: [/->\s*[\w\[\],\s]+/, /:\s*[\w\[\],\s]+\s*[=)]/],
		},
		[ProgrammingLanguage.JAVASCRIPT]: {
			functionPatterns: [
				/function\s+(\w+)/,
				/(\w+)\s*=\s*function/,
				/(\w+)\s*=\s*\(/,
				/(\w+)\s*:\s*function/,
			],
			classPatterns: [/class\s+(\w+)/],
			commentPatterns: [/^\s*\/\//, /^\s*\/\*/, /^\s*\*/],
			stringPatterns: [/\/\*[\s\S]*?\*\//, /"[^"]*"/, /'[^']*'/, /`[^`]*`/],
			branchKeywords: ["if", "else", "switch", "case"],
			loopKeywords: ["for", "while", "do"],
			returnKeywords: ["return"],
			decoratorPatterns: [/@\w+/],
			propertyPatterns: [/get\s+\w+/, /set\s+\w+/],
			asyncPatterns: [/async\s+function/, /async\s+\w+\s*\(/],
			typeHintPatterns: [],
		},
		[ProgrammingLanguage.TYPESCRIPT]: {
			functionPatterns: [
				/function\s+(\w+)/,
				/(\w+)\s*=\s*function/,
				/(\w+)\s*=\s*\(/,
				/(\w+)\s*:\s*\(/,
			],
			classPatterns: [/class\s+(\w+)/, /interface\s+(\w+)/, /type\s+(\w+)/],
			commentPatterns: [/^\s*\/\//, /^\s*\/\*/, /^\s*\*/],
			stringPatterns: [/\/\*[\s\S]*?\*\//, /"[^"]*"/, /'[^']*'/, /`[^`]*`/],
			branchKeywords: ["if", "else", "switch", "case"],
			loopKeywords: ["for", "while", "do"],
			returnKeywords: ["return"],
			decoratorPatterns: [/@\w+/],
			propertyPatterns: [/get\s+\w+/, /set\s+\w+/],
			asyncPatterns: [/async\s+function/, /async\s+\w+\s*\(/],
			typeHintPatterns: [/:\s*[\w<>\[\],\s|&]+/, /<[\w,\s]+>/],
		},
		[ProgrammingLanguage.JAVA]: {
			functionPatterns: [
				/\w+\s+\w+\s*\([^)]*\)\s*\{/,
				/(public|private|protected)\s+\w+\s+(\w+)/,
			],
			classPatterns: [
				/class\s+(\w+)/,
				/interface\s+(\w+)/,
				/enum\s+(\w+)/,
			],
			commentPatterns: [/^\s*\/\//, /^\s*\/\*/, /^\s*\*/],
			stringPatterns: [/\/\*[\s\S]*?\*\//, /"[^"]*"/],
			branchKeywords: ["if", "else", "switch", "case"],
			loopKeywords: ["for", "while", "do"],
			returnKeywords: ["return"],
			decoratorPatterns: [/@\w+/],
			propertyPatterns: [/get\w+\s*\(/, /set\w+\s*\(/],
			asyncPatterns: [],
			typeHintPatterns: [],
		},
		[ProgrammingLanguage.GO]: {
			functionPatterns: [/func\s+(\w+)/, /func\s+\(\w+\s+\*?\w+\)\s+(\w+)/],
			classPatterns: [/type\s+(\w+)\s+struct/],
			commentPatterns: [/^\s*\/\//, /^\s*\/\*/],
			stringPatterns: [/\/\*[\s\S]*?\*\//, /"[^"]*"/, /`[^`]*`/],
			branchKeywords: ["if", "else", "switch", "case", "select"],
			loopKeywords: ["for", "range"],
			returnKeywords: ["return"],
			decoratorPatterns: [],
			propertyPatterns: [],
			asyncPatterns: [/go\s+func/, /go\s+\w+/],
			typeHintPatterns: [/\w+\s+[\w\*\[\]]+/],
		},
		[ProgrammingLanguage.RUST]: {
			functionPatterns: [/fn\s+(\w+)/, /pub\s+fn\s+(\w+)/],
			classPatterns: [/struct\s+(\w+)/, /enum\s+(\w+)/, /trait\s+(\w+)/],
			commentPatterns: [/^\s*\/\//, /^\s*\/\*/],
			stringPatterns: [/\/\*[\s\S]*?\*\//, /"[^"]*"/],
			branchKeywords: ["if", "else", "match"],
			loopKeywords: ["for", "while", "loop"],
			returnKeywords: ["return"],
			decoratorPatterns: [/#\[\w+\]/],
			propertyPatterns: [],
			asyncPatterns: [/async\s+fn/],
			typeHintPatterns: [/->\s*[\w<>&]+/],
		},
		[ProgrammingLanguage.CPP]: {
			functionPatterns: [/\w+\s+\w+\s*\([^)]*\)\s*\{/],
			classPatterns: [/class\s+(\w+)/, /struct\s+(\w+)/],
			commentPatterns: [/^\s*\/\//, /^\s*\/\*/],
			stringPatterns: [/\/\*[\s\S]*?\*\//, /"[^"]*"/],
			branchKeywords: ["if", "else", "switch", "case"],
			loopKeywords: ["for", "while", "do"],
			returnKeywords: ["return"],
			decoratorPatterns: [],
			propertyPatterns: [],
			asyncPatterns: [],
			typeHintPatterns: [],
		},
		[ProgrammingLanguage.CSHARP]: {
			functionPatterns: [/\w+\s+\w+\s*\([^)]*\)\s*\{/],
			classPatterns: [/class\s+(\w+)/, /interface\s+(\w+)/],
			commentPatterns: [/^\s*\/\//, /^\s*\/\*/],
			stringPatterns: [/\/\*[\s\S]*?\*\//, /"[^"]*"/],
			branchKeywords: ["if", "else", "switch", "case"],
			loopKeywords: ["for", "while", "do", "foreach"],
			returnKeywords: ["return"],
			decoratorPatterns: [/\[\w+\]/],
			propertyPatterns: [/\{\s*get/, /\{\s*set/],
			asyncPatterns: [/async\s+\w+/],
			typeHintPatterns: [],
		},
		[ProgrammingLanguage.RUBY]: {
			functionPatterns: [/def\s+(\w+)/],
			classPatterns: [/class\s+(\w+)/, /module\s+(\w+)/],
			commentPatterns: [/^\s*#/],
			stringPatterns: [/"[^"]*"/, /'[^']*'/],
			branchKeywords: ["if", "elsif", "else", "case", "when"],
			loopKeywords: ["for", "while", "until", "each"],
			returnKeywords: ["return"],
			decoratorPatterns: [],
			propertyPatterns: [/attr_accessor/, /attr_reader/, /attr_writer/],
			asyncPatterns: [],
			typeHintPatterns: [],
		},
		[ProgrammingLanguage.PHP]: {
			functionPatterns: [/function\s+(\w+)/],
			classPatterns: [/class\s+(\w+)/, /interface\s+(\w+)/],
			commentPatterns: [/^\s*\/\//, /^\s*\/\*/, /^\s*#/],
			stringPatterns: [/\/\*[\s\S]*?\*\//, /"[^"]*"/, /'[^']*'/],
			branchKeywords: ["if", "else", "elseif", "switch", "case"],
			loopKeywords: ["for", "while", "do", "foreach"],
			returnKeywords: ["return"],
			decoratorPatterns: [],
			propertyPatterns: [],
			asyncPatterns: [],
			typeHintPatterns: [/:\s*\??\w+/],
		},
		[ProgrammingLanguage.UNKNOWN]: {
			functionPatterns: [],
			classPatterns: [],
			commentPatterns: [],
			stringPatterns: [],
			branchKeywords: [],
			loopKeywords: [],
			returnKeywords: [],
			decoratorPatterns: [],
			propertyPatterns: [],
			asyncPatterns: [],
			typeHintPatterns: [],
		},
	};

	constructor(code: string, language?: ProgrammingLanguage) {
		this.code = code;
		this.lines = code.split("\n");
		this.language = language || this.detectLanguage();
		this.config = CodeAnalyzer.LANGUAGE_CONFIGS[this.language];
	}

	/**
	 * Auto-detect programming language from code patterns
	 */
	private detectLanguage(): ProgrammingLanguage {
		const signatures: Array<[ProgrammingLanguage, RegExp]> = [
			[ProgrammingLanguage.PYTHON, /def\s+\w+.*:|class\s+\w+.*:|import\s+\w+/],
			[
				ProgrammingLanguage.TYPESCRIPT,
				/interface\s+\w+|type\s+\w+\s*=|:\s*\w+\s*=/,
			],
			[ProgrammingLanguage.JAVASCRIPT, /function\s+\w+|const\s+\w+\s*=/],
			[
				ProgrammingLanguage.JAVA,
				/(public|private|protected)\s+class|public\s+static\s+void/,
			],
			[ProgrammingLanguage.GO, /func\s+\w+|package\s+\w+/],
			[ProgrammingLanguage.RUST, /fn\s+\w+|pub\s+fn|impl\s+\w+/],
			[ProgrammingLanguage.CPP, /#include|std::|template\s*</],
			[
				ProgrammingLanguage.CSHARP,
				/namespace\s+\w+|using\s+System|public\s+class/,
			],
			[ProgrammingLanguage.RUBY, /def\s+\w+|require\s+['"]|attr_accessor/],
			[ProgrammingLanguage.PHP, /<\?php|namespace\s+\w+;|\$\w+\s*=/],
		];

		for (const [lang, pattern] of signatures) {
			if (pattern.test(this.code)) {
				return lang;
			}
		}

		return ProgrammingLanguage.UNKNOWN;
	}

	/**
	 * Extract function/class/method name from code (language-agnostic)
	 */
	public extractName(): string {
		// Try all configured patterns
		for (const pattern of [
			...this.config.functionPatterns,
			...this.config.classPatterns,
		]) {
			const match = this.code.match(pattern);
			if (match) {
				// Return first captured group or second (for patterns with qualifiers)
				return match[1] || match[2] || match[0];
			}
		}

		// Fallback: try to find any identifier-like pattern
		const genericMatch = this.code.match(/\b([a-zA-Z_]\w{2,})\b/);
		return genericMatch ? genericMatch[1] : "unknown";
	}

	/**
	 * Analyze naming patterns (language-agnostic)
	 */
	public analyzeNaming(): NamingAnalysis {
		const name = this.extractName();
		const lowerName = name.toLowerCase();

		// Check for camelCase/PascalCase verb-noun patterns (getUser, setConfig)
		const verbNounPattern =
			/^(get|set|is|has|can|should|fetch|update|create|delete|remove|add|find|search|filter|map|reduce|parse|format|convert|validate|check)[A-Z]/.test(
				name,
			);

		// Check for dunder methods (Python magic methods)
		const isDunderMethod = /^__\w+__$/.test(name);

		return {
			functionName: name,
			isGetter:
				/^(get|fetch|retrieve|obtain|read|load|find|query)[_A-Z]/.test(name),
			isSetter:
				/^(set|update|write|save|store|put|modify|change)[_A-Z]/.test(name),
			isChecker:
				/^(is|has|can|should|will|check|verify|validate|ensure|test)[_A-Z]/.test(
					name,
				),
			isFormatter:
				/^(format|to|as|convert|transform|render|stringify|serialize)[_A-Z]/.test(
					name,
				),
			isParser:
				/^(parse|from|decode|extract|read|load|deserialize)[_A-Z]/.test(name),
			isLogger:
				/^(log|debug|info|warn|error|trace|print|dump|console)[_A-Z]/.test(
					name,
				),
			isWrapper: /^(wrap|wrapper|wrapped|delegate|proxy)[_A-Z]/.test(name),
			isHelper: /^(helper|util|utils|aux|auxiliary|support)[_A-Z]/.test(name),
			isPrivate:
				name.startsWith("_") ||
				name.startsWith("__") ||
				name.startsWith("private"),
			nameLength: name.length,
			hasGenericName:
				/^(func|function|method|helper|util|tmp|temp|handler|process|do|run|execute|perform|main|test)$/i.test(
					name,
				),
			verbNounPattern,
			isDunderMethod,
		};
	}

	/**
	 * Calculate comprehensive code metrics
	 */
	public calculateMetrics(): CodeMetrics {
		const nonEmptyLines = this.lines.filter(
			(line) => line.trim().length > 0,
		).length;
		const commentLines = this.countCommentLines();

		return {
			linesOfCode: this.lines.length,
			nonEmptyLines,
			commentLines,
			codeToCommentRatio:
				commentLines > 0 ? nonEmptyLines / commentLines : nonEmptyLines,

			cyclomaticComplexity: this.calculateCyclomaticComplexity(),
			nestedDepth: this.calculateNestingDepth(),
			numberOfBranches: this.countBranches(),
			cognitiveComplexity: this.calculateCognitiveComplexity(),

			numberOfParameters: this.countParameters(),
			numberOfReturns: this.countReturns(),
			numberOfFunctionCalls: this.countFunctionCalls(),
			numberOfAssignments: this.countAssignments(),

			hasDocumentation: this.hasDocumentation(),
			hasTypeAnnotations: this.hasTypeAnnotations(),
			isDecorated: this.isDecorated(),
			isProperty: this.isProperty(),
			isAsync: this.isAsync(),

			numberOfImports: this.countImports(),
			numberOfClasses: this.countClasses(),
			numberOfMethods: this.countMethods(),
			uniqueIdentifiers: this.countUniqueIdentifiers(),

			detectedLanguage: this.language,
		};
	}

	/**
	 * Calculate Cyclomatic Complexity (language-agnostic)
	 * CC = Number of decision points + 1
	 */
	private calculateCyclomaticComplexity(): number {
		const code = this.removeStringsAndComments();
		let complexity = 1; // Base complexity

		// Count branch keywords
		for (const keyword of this.config.branchKeywords) {
			const pattern = new RegExp(`\\b${keyword}\\b`, "g");
			const matches = code.match(pattern);
			complexity += matches ? matches.length : 0;
		}

		// Count loop keywords
		for (const keyword of this.config.loopKeywords) {
			const pattern = new RegExp(`\\b${keyword}\\b`, "g");
			const matches = code.match(pattern);
			complexity += matches ? matches.length : 0;
		}

		// Count logical operators
		const logicalOps = code.match(/(\&\&|\|\||and\b|or\b)/g);
		complexity += logicalOps ? logicalOps.length : 0;

		// Count ternary operators
		const ternary = code.match(/\?/g);
		complexity += ternary ? ternary.length : 0;

		return complexity;
	}

	/**
	 * Calculate Cognitive Complexity (more sophisticated than CC)
	 * Penalizes nested structures more heavily
	 */
	private calculateCognitiveComplexity(): number {
		let complexity = 0;
		let nestingLevel = 0;
		const code = this.removeStringsAndComments();

		for (const line of code.split("\n")) {
			const trimmed = line.trim();

			// Calculate nesting level
			const indent = line.length - line.trimStart().length;
			const currentNesting = Math.floor(indent / (this.language === ProgrammingLanguage.PYTHON ? 4 : 2));

			// Check for control structures
			const allKeywords = [
				...this.config.branchKeywords,
				...this.config.loopKeywords,
			];
			for (const keyword of allKeywords) {
				if (new RegExp(`\\b${keyword}\\b`).test(trimmed)) {
					// Add complexity with nesting penalty
					complexity += 1 + currentNesting;
					nestingLevel = currentNesting + 1;
				}
			}

			// Penalize logical operators in nested structures
			const logicalOps = trimmed.match(/(\&\&|\|\||and\b|or\b)/g);
			if (logicalOps) {
				complexity += logicalOps.length * (1 + currentNesting);
			}
		}

		return complexity;
	}

	/**
	 * Calculate maximum nesting depth
	 */
	private calculateNestingDepth(): number {
		let maxDepth = 0;
		let currentDepth = 0;

		// Count braces/indentation depth
		for (const line of this.lines) {
			const trimmed = line.trim();
			if (!trimmed) continue;

			// For brace-based languages
			if (this.language !== ProgrammingLanguage.PYTHON) {
				currentDepth += (trimmed.match(/\{/g) || []).length;
				currentDepth -= (trimmed.match(/\}/g) || []).length;
				maxDepth = Math.max(maxDepth, currentDepth);
			} else {
				// For indentation-based languages
				const indent = line.length - line.trimStart().length;
				const depth = Math.floor(indent / 4);
				maxDepth = Math.max(maxDepth, depth);
			}
		}

		return maxDepth;
	}

	/**
	 * Count comment lines
	 */
	private countCommentLines(): number {
		let count = 0;
		for (const line of this.lines) {
			for (const pattern of this.config.commentPatterns) {
				if (pattern.test(line)) {
					count++;
					break;
				}
			}
		}
		return count;
	}

	/**
	 * Count branching statements
	 */
	private countBranches(): number {
		const code = this.removeStringsAndComments();
		let count = 0;

		for (const keyword of this.config.branchKeywords) {
			const pattern = new RegExp(`\\b${keyword}\\b`, "g");
			const matches = code.match(pattern);
			count += matches ? matches.length : 0;
		}

		return count;
	}

	/**
	 * Count function parameters (language-agnostic)
	 */
	private countParameters(): number {
		// Find function signature
		for (const pattern of this.config.functionPatterns) {
			const match = this.code.match(pattern);
			if (match) {
				// Extract parameter list
				const paramsMatch = this.code.match(/\(([^)]*)\)/);
				if (paramsMatch) {
					const params = paramsMatch[1].trim();
					if (!params) return 0;

					// Split by comma and filter
					const paramList = params
						.split(",")
						.map((p) => p.trim())
						.filter((p) => p.length > 0);

					// Filter out common special parameters
					return paramList.filter(
						(p) =>
							!p.match(
								/^(self|this|cls|\*args|\*\*kwargs|\.\.\.|void|\*|\*\*)\s*$/,
							),
					).length;
				}
			}
		}

		return 0;
	}

	/**
	 * Count return statements
	 */
	private countReturns(): number {
		const code = this.removeStringsAndComments();
		let count = 0;

		for (const keyword of this.config.returnKeywords) {
			const pattern = new RegExp(`\\b${keyword}\\b`, "g");
			const matches = code.match(pattern);
			count += matches ? matches.length : 0;
		}

		return count;
	}

	/**
	 * Count function calls
	 */
	private countFunctionCalls(): number {
		const code = this.removeStringsAndComments();
		// Match identifier followed by opening parenthesis
		const matches = code.match(/[a-zA-Z_]\w*\s*\(/g);
		return matches ? matches.length : 0;
	}

	/**
	 * Count assignment statements
	 */
	private countAssignments(): number {
		const code = this.removeStringsAndComments();
		// Match various assignment patterns
		const patterns = [
			/[a-zA-Z_]\w*\s*=/g, // Simple assignment
			/[a-zA-Z_]\w*\s*(\+|-|\*|\/|%|&|\||^|<<|>>)=/g, // Augmented assignment
		];

		let count = 0;
		for (const pattern of patterns) {
			const matches = code.match(pattern);
			count += matches ? matches.length : 0;
		}

		return count;
	}

	/**
	 * Check if code has documentation
	 */
	private hasDocumentation(): boolean {
		// Check for docstrings, JSDoc, Javadoc, etc.
		return (
			/"""[\s\S]*?"""|'''[\s\S]*?'''/.test(this.code) || // Python docstring
			/\/\*\*[\s\S]*?\*\//.test(this.code) || // JSDoc/Javadoc
			/\/\/\//.test(this.code) || // XML doc comments (C#)
			/#\s*@\w+/.test(this.code)
		); // Ruby YARD
	}

	/**
	 * Check if code has type annotations
	 */
	private hasTypeAnnotations(): boolean {
		for (const pattern of this.config.typeHintPatterns) {
			if (pattern.test(this.code)) return true;
		}
		return false;
	}

	/**
	 * Check if function is decorated
	 */
	private isDecorated(): boolean {
		for (const pattern of this.config.decoratorPatterns) {
			if (pattern.test(this.code)) return true;
		}
		return false;
	}

	/**
	 * Check if it's a property
	 */
	private isProperty(): boolean {
		for (const pattern of this.config.propertyPatterns) {
			if (pattern.test(this.code)) return true;
		}
		return false;
	}

	/**
	 * Check if it's async
	 */
	private isAsync(): boolean {
		for (const pattern of this.config.asyncPatterns) {
			if (pattern.test(this.code)) return true;
		}
		return false;
	}

	/**
	 * Count import statements
	 */
	private countImports(): number {
		const patterns = [
			/^import\s+/gm,
			/^from\s+\w+\s+import/gm,
			/^using\s+/gm,
			/^#include/gm,
			/^require/gm,
		];

		let count = 0;
		for (const pattern of patterns) {
			const matches = this.code.match(pattern);
			count += matches ? matches.length : 0;
		}

		return count;
	}

	/**
	 * Count class definitions
	 */
	private countClasses(): number {
		let count = 0;
		for (const pattern of this.config.classPatterns) {
			const matches = this.code.match(pattern);
			count += matches ? matches.length : 0;
		}
		return count;
	}

	/**
	 * Count method definitions
	 */
	private countMethods(): number {
		let count = 0;
		for (const pattern of this.config.functionPatterns) {
			const matches = this.code.match(pattern);
			count += matches ? matches.length : 0;
		}
		return count;
	}

	/**
	 * Count unique identifiers
	 */
	private countUniqueIdentifiers(): number {
		const code = this.removeStringsAndComments();
		const identifiers = code.match(/\b[a-zA-Z_]\w*\b/g);
		if (!identifiers) return 0;

		// Filter out keywords
		const allKeywords = [
			...this.config.branchKeywords,
			...this.config.loopKeywords,
			...this.config.returnKeywords,
			"class",
			"function",
			"def",
			"import",
			"from",
		];

		const unique = new Set(
			identifiers.filter((id) => !allKeywords.includes(id.toLowerCase())),
		);
		return unique.size;
	}

	/**
	 * Remove strings and comments for better analysis
	 */
	private removeStringsAndComments(): string {
		let result = this.code;

		// Remove strings
		for (const pattern of this.config.stringPatterns) {
			result = result.replace(pattern, "");
		}

		// Remove single-line comments
		result = result.replace(/\/\/.*$/gm, "");
		result = result.replace(/#.*$/gm, "");

		return result;
	}

	/**
	 * Detect if code is a simple pass-through (wrapper)
	 */
	public isPassThrough(): boolean {
		const code = this.removeStringsAndComments();
		const codeLines = code
			.split("\n")
			.map((l) => l.trim())
			.filter((l) => l.length > 0);

		// Remove function/class definition lines
		const bodyLines = codeLines.filter(
			(l) =>
				!this.config.functionPatterns.some((p) => p.test(l)) &&
				!this.config.classPatterns.some((p) => p.test(l)) &&
				!l.match(/^[\{\}]\s*$/),
		);

		// Check if it's just a function call followed by return
		const hasOnlyOneOrTwoStatements = bodyLines.length <= 2;
		const hasDirectReturn = this.config.returnKeywords.some((kw) =>
			new RegExp(`\\b${kw}\\s+\\w+\\(`).test(code),
		);

		return hasOnlyOneOrTwoStatements && hasDirectReturn;
	}

	/**
	 * Check if it's a simple property getter
	 */
	public isSimpleGetter(): boolean {
		const code = this.removeStringsAndComments();
		const naming = this.analyzeNaming();

		return (
			(this.isProperty() || naming.isGetter) &&
			this.countReturns() === 1 &&
			this.calculateCyclomaticComplexity() <= 2 &&
			this.lines.length <= 5
		);
	}

	/**
	 * Check if it's a simple setter
	 */
	public isSimpleSetter(): boolean {
		const naming = this.analyzeNaming();

		return (
			(this.isProperty() || naming.isSetter) &&
			this.countAssignments() === 1 &&
			this.countReturns() === 0 &&
			this.lines.length <= 5
		);
	}
}
