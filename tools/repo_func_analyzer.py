import ast
import os
import json
import networkx as nx
from radon.complexity import cc_visit
from radon.metrics import mi_visit

# ----------------------------
# DOMAIN KEYWORDS
# ----------------------------
DOMAIN_KEYWORDS = {
    "db", "database", "user", "auth", "token", "order", "payment",
    "item", "items", "create", "read", "update", "delete", "openapi",
    "route", "request", "response", "router", "http", "status", "oauth",
    "login", "logout", "session", "validate", "schema", "serialize"
}

# ----------------------------
# FUNCTION EXTRACTION
# ----------------------------
def extract_functions_from_repo(repo_path):
    all_functions = []
    for root, _, files in os.walk(repo_path):
        for file in files:
            if file.endswith(".py"):
                full_path = os.path.join(root, file)
                all_functions.extend(extract_functions_from_file(full_path))
    return all_functions

def extract_functions_from_file(file_path):
    functions = []
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            source = f.read()
    except Exception:
        return []

    try:
        tree = ast.parse(source)
    except SyntaxError:
        return []

    lines = source.splitlines(keepends=True)

    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef) and hasattr(node, "end_lineno"):
            func_code = ''.join(lines[node.lineno - 1: node.end_lineno])
            functions.append({
                "id": f"code:{file_path}:{node.name}:{node.lineno}",
                "label": node.name,
                "code": func_code,
                "type": "Function",
                "file_path": file_path,
                "lineno": node.lineno
            })

    return functions

# ----------------------------
# ENRICHMENT & ANALYSIS
# ----------------------------
def calc_domain_relevance(func):
    text = (func["label"] + " " + func["code"]).lower()
    matched = sum(1 for kw in DOMAIN_KEYWORDS if kw in text)
    domain_score = matched / len(DOMAIN_KEYWORDS)
    return domain_score

def enrich_function(func):
    code = func["code"]
    try:
        blocks = cc_visit(code)
        complexity = sum(b.complexity for b in blocks)
        mi_score = mi_visit(code, True)
    except Exception:
        complexity = 0
        mi_score = 0

    try:
        tree = ast.parse(code)
    except Exception:
        calls = []
    else:
        calls = [
            n.func.id
            for n in ast.walk(tree)
            if isinstance(n, ast.Call) and isinstance(n.func, ast.Name)
        ]

    loc = code.count('\n') + 1
    domain_score = calc_domain_relevance(func)

    func["metrics"] = {
        "loc": loc,
        "cyclomatic_complexity": complexity,
        "mi": mi_score,
        "calls": calls,
        "domain_score": domain_score
    }

    return func

# ----------------------------
# TRIVIAL FUNCTION HEURISTICS
# ----------------------------
def is_trivial_function(func):
    name = func["label"]
    loc = func["metrics"]["loc"]
    complexity = func["metrics"]["cyclomatic_complexity"]
    calls = func["metrics"]["calls"]

    if name.startswith(("get_", "set_", "to_", "from_", "is_", "has_")) and loc <= 5:
        return True
    if loc <= 3 and complexity <= 1:
        return True
    if len(calls) == 1 and complexity <= 1:
        return True
    if "return" in func["code"] and loc <= 2 and not calls:
        return True
    return False

# ----------------------------
# CALL GRAPH + RANKING
# ----------------------------
def build_call_graph(functions):
    G = nx.DiGraph()
    for func in functions:
        G.add_node(func["label"])
        for callee in func["metrics"]["calls"]:
            G.add_edge(func["label"], callee)
    return G

def rank_functions(functions, graph):
    centrality = nx.pagerank(graph) if graph else {}

    scored = []
    for func in functions:
        name = func["label"]
        loc = func["metrics"]["loc"]
        complexity = func["metrics"]["cyclomatic_complexity"]
        domain_score = func["metrics"]["domain_score"]
        central_score = centrality.get(name, 0)

        score = (
            0.3 * min(complexity / 10, 1.0) +
            0.2 * min(loc / 50, 1.0) +
            0.3 * central_score +
            0.2 * domain_score
        )

        scored.append({
            "functionId": func["id"],
            "name": name,
            "file": func["file_path"],
            "score": round(score, 4),
            "rank": None,
            "is_trivial": is_trivial_function(func)
        })

    scored = sorted(scored, key=lambda x: x["score"], reverse=True)
    for i, func in enumerate(scored):
        func["rank"] = i + 1
    return scored

# ----------------------------
# MAIN FUNCTION
# ----------------------------
def main(repo_path, output_path):
    print(f"Extracting functions from {repo_path}")
    functions = extract_functions_from_repo(repo_path)

    print(f"Analyzing {len(functions)} functions...")
    enriched = [enrich_function(f) for f in functions]
    graph = build_call_graph(enriched)
    ranked = rank_functions(enriched, graph)

    output = {
        "analysisData": {
            "graphNodes": enriched,
            "rankedFunctions": ranked
        }
    }

    print(f"Writing analysis to {output_path}")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2)

# ----------------------------
# ENTRY POINT
# ----------------------------
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Static analysis of Python repo to identify important functions.")
    parser.add_argument("repo", help="Path to the Python source code repository")
    parser.add_argument("-o", "--output", default="functions_ranked.json", help="Path to output JSON file")

    args = parser.parse_args()
    main(args.repo, args.output)
