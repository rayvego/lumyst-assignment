import type { GraphNode, GraphEdge } from './types';

type WithCodeNode = GraphNode & {
  filePath?: string;
  syntaxType?: string; // Function, Method, Class, etc. (if available)
  code?: string; // raw code when using analysis-with-code.json
};

export interface FunctionImportance {
  id: string;
  label: string;
  importanceScore: number; // 0..1
  isUtility: boolean;
  reasons: string[];
}

export interface RankOptions {
  // Scores/weights
  wFanIn?: number; // callers
  wFanOut?: number; // callees
  wCentrality?: number; // simple degree centrality proxy
  wNameUtilityPenalty?: number; // name-based utility penalty
  wTrivialBodyPenalty?: number; // body-size triviality penalty
  wTestPenalty?: number; // downweight tests
  wFileUtilityPenalty?: number; // file-path based penalty
  utilityThreshold?: number; // <= threshold => utility
}

const DEFAULT_OPTS: Required<RankOptions> = {
  wFanIn: 0.35,
  wFanOut: 0.10,
  wCentrality: 0.15,
  wNameUtilityPenalty: 0.15,
  wTrivialBodyPenalty: 0.20,
  wTestPenalty: 0.03,
  wFileUtilityPenalty: 0.02,
  utilityThreshold: 0.35,
};

// Simple heuristics lists
const UTILITY_NAME_PATTERNS = [
  /parse/i,
  /format/i,
  /encode|decode/i,
  /util|utils|helper/i,
  /to[A-Z]/,
  /is[A-Z]|has[A-Z]|can[A-Z]/,
  /map|filter|reduce/i,
  /logger|log|debug/i,
  /^get$|^set$|^__str__$|^__repr__$/i,
];

const UTILITY_FILE_PATTERNS = [
  /\butils?\b/i,
  /helpers?/i,
  /formatters?/i,
  /parsers?/i,
  /logging|logger/i,
  /constants?/i,
  /types?/i,
  /schemas?/i,
  /tests?\b|__tests__/i,
];

function normalizeScore(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

function estimateBodyTriviality(code?: string): { triviality: number; reasons: string[] } {
  const reasons: string[] = [];
  if (!code) return { triviality: 0.0, reasons };

  const lines = code.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const loc = lines.length;
  const chars = code.length;

  // Heuristic 1: very short functions
  if (loc <= 3 || chars <= 120) {
    reasons.push('very_short');
  }

  // Heuristic 2: single return or simple expression
  const singleReturn = lines.filter(l => /^return\b/.test(l)).length === 1 && loc <= 6;
  if (singleReturn) reasons.push('single_return');

  // Heuristic 3: no control flow
  const hasControl = /(if|for|while|try|except|match|await|yield|with)\b/.test(code);
  if (!hasControl) reasons.push('no_control_flow');

  // Heuristic 4: simple property access or cast/convert
  const simpleExpr = /return\s+([\w.\[\]\(\)\-\+\*\/\s'"`,:]+);?\s*$/.test(code) && !hasControl;
  if (simpleExpr) reasons.push('simple_expression');

  // Aggregate
  const raw = (reasons.length >= 2 ? 0.9 : reasons.length === 1 ? 0.5 : 0.0);
  return { triviality: raw, reasons };
}

export class ImportanceRankingService {
  rank(
    nodes: WithCodeNode[],
    edges: GraphEdge[],
    opts: RankOptions = {}
  ): FunctionImportance[] {
    const settings = { ...DEFAULT_OPTS, ...opts };

    // Build degree maps
    const fanIn = new Map<string, number>();
    const fanOut = new Map<string, number>();
    for (const e of edges) {
      fanOut.set(e.source, (fanOut.get(e.source) ?? 0) + 1);
      fanIn.set(e.target, (fanIn.get(e.target) ?? 0) + 1);
    }

    // Collect stats ranges
    const fanInVals = nodes.map(n => fanIn.get(n.id) ?? 0);
    const fanOutVals = nodes.map(n => fanOut.get(n.id) ?? 0);
    const maxIn = Math.max(0, ...fanInVals);
    const maxOut = Math.max(0, ...fanOutVals);
    const maxDeg = Math.max(0, ...nodes.map(n => (fanIn.get(n.id) ?? 0) + (fanOut.get(n.id) ?? 0)));

    const results: FunctionImportance[] = [];

    for (const n of nodes) {
      const reasons: string[] = [];

      const name = n.label || '';
      const path = (n as any).filePath || '';

      // Degree-based importance
      const inScore = normalizeScore(fanIn.get(n.id) ?? 0, 0, Math.max(1, maxIn));
      const outScore = normalizeScore(fanOut.get(n.id) ?? 0, 0, Math.max(1, maxOut));
      const centScore = normalizeScore((fanIn.get(n.id) ?? 0) + (fanOut.get(n.id) ?? 0), 0, Math.max(1, maxDeg));

      // Name-based utility penalty
      const nameMatches = UTILITY_NAME_PATTERNS.some(rx => rx.test(name));
      if (nameMatches) reasons.push('name_utility_like');
      const namePenalty = nameMatches ? 1 : 0;

      // File-based utility penalty
      const fileMatches = UTILITY_FILE_PATTERNS.some(rx => rx.test(path));
      if (fileMatches) reasons.push('file_utility_like');
      const filePenalty = fileMatches ? 1 : 0;

      // Body triviality
      const { triviality, reasons: trivReasons } = estimateBodyTriviality((n as any).code);
      reasons.push(...trivReasons);

      // Test penalty (by path)
      const isTest = /(^|\/)tests?(\/|$)|(^|\/)test_/i.test(path);
      if (isTest) reasons.push('test_path');
      const testPenalty = isTest ? 1 : 0;

      // Aggregate importance
      const rawImportance =
        settings.wFanIn * inScore +
        settings.wFanOut * outScore +
        settings.wCentrality * centScore -
        settings.wNameUtilityPenalty * namePenalty -
        settings.wFileUtilityPenalty * filePenalty -
        settings.wTrivialBodyPenalty * triviality -
        settings.wTestPenalty * testPenalty;

      const importanceScore = Math.max(0, Math.min(1, rawImportance));
      const isUtility = importanceScore <= settings.utilityThreshold;

      if (isUtility) reasons.push('below_threshold');

      results.push({
        id: n.id,
        label: n.label,
        importanceScore,
        isUtility,
        reasons,
      });
    }

    return results.sort((a, b) => b.importanceScore - a.importanceScore);
  }
}

export function annotateNodesWithImportance(
  nodes: GraphNode[],
  ranking: FunctionImportance[],
): GraphNode[] {
  const byId = new Map(ranking.map(r => [r.id, r] as const));
  return nodes.map(n => {
    const r = byId.get(n.id);
    if (!r) return n;
    return { ...n, importanceScore: r.importanceScore, isUtility: r.isUtility };
  });
}