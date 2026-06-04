#!/usr/bin/env bun

import fs from "node:fs";
import path from "node:path";

type ParsedArgs = {
  architecturePath: string;
  format: "json" | "text";
  query: string;
};

type Cell = {
  name: string;
  intent: string;
  directory: string;
  upstreamDependencies: string;
  downstreamDependencies: string;
  criticalBoundary: string;
};

function tokenize(value: string): string[] {
  return value.toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

function parseArgs(argv: string[]): ParsedArgs {
  const args = [...argv];
  let architecturePath = path.resolve(process.cwd(), "architecture.md");
  let format: "json" | "text" = "json";
  const keywords: string[] = [];

  while (args.length > 0) {
    const current = args.shift()!;
    if (current === "--architecture") {
      const next = args.shift();
      if (!next) {
        throw new Error("Missing value for --architecture");
      }
      architecturePath = path.resolve(process.cwd(), next);
      continue;
    }
    if (current === "--text") {
      format = "text";
      continue;
    }
    keywords.push(current);
  }

  if (keywords.length === 0) {
    throw new Error("Usage: bun arch-lookup.ts [--architecture path] [--text] <feature keywords>");
  }

  return {
    architecturePath,
    format,
    query: keywords.join(" ").trim(),
  };
}

function parseArchitecture(markdown: string): Cell[] {
  const lines = markdown.split(/\r?\n/);
  const cells: Cell[] = [];
  let currentCell: Cell | null = null;

  for (const line of lines) {
    const cellMatch = line.match(/^##\s+Cell:\s*(.+?)\s*$/i);
    if (cellMatch) {
      if (currentCell) {
        cells.push(currentCell);
      }
      currentCell = {
        name: cellMatch[1].trim(),
        intent: "",
        directory: "",
        upstreamDependencies: "None",
        downstreamDependencies: "None",
        criticalBoundary: "",
      };
      continue;
    }

    if (!currentCell) {
      continue;
    }

    const fieldMatch = line.match(/^- \*\*(.+?):\*\*\s*(.+?)\s*$/);
    if (!fieldMatch) {
      continue;
    }

    const key = fieldMatch[1].trim().toLowerCase();
    const value = fieldMatch[2].trim();

    if (key === "intent") {
      currentCell.intent = value;
    } else if (key === "directory") {
      currentCell.directory = value.replace(/`/g, "");
    } else if (key === "upstream dependencies") {
      currentCell.upstreamDependencies = value;
    } else if (key === "downstream dependencies") {
      currentCell.downstreamDependencies = value;
    } else if (key === "critical boundary") {
      currentCell.criticalBoundary = value;
    }
  }

  if (currentCell) {
    cells.push(currentCell);
  }

  return cells;
}

function buildDocument(cell: Cell): string {
  return [
    cell.name,
    cell.intent,
    cell.directory,
    cell.upstreamDependencies,
    cell.downstreamDependencies,
    cell.criticalBoundary,
  ].join(" ");
}

function buildMacroOverview(cells: Cell[]) {
  return cells.map((cell) => ({
    name: cell.name,
    directory: cell.directory,
    intent: cell.intent,
    criticalBoundary: cell.criticalBoundary,
  }));
}

function computeBm25Scores(queryTerms: string[], cells: Cell[]) {
  const documents = cells.map((cell) => tokenize(buildDocument(cell)));
  const averageLength =
    documents.reduce((sum, document) => sum + document.length, 0) / (documents.length || 1);
  const k1 = 1.2;
  const b = 0.75;

  return cells.map((cell, index) => {
    const document = documents[index];
    const termFrequency = new Map<string, number>();
    for (const term of document) {
      termFrequency.set(term, (termFrequency.get(term) ?? 0) + 1);
    }

    let rawScore = 0;
    const matchedTerms: string[] = [];

    for (const term of new Set(queryTerms)) {
      const frequency = termFrequency.get(term) ?? 0;
      if (frequency === 0) {
        continue;
      }

      matchedTerms.push(term);
      const docsWithTerm = documents.filter((candidate) => candidate.includes(term)).length;
      const idf = Math.log(1 + (documents.length - docsWithTerm + 0.5) / (docsWithTerm + 0.5));
      const numerator = frequency * (k1 + 1);
      const denominator =
        frequency + k1 * (1 - b + b * (document.length / (averageLength || 1)));
      rawScore += idf * (numerator / denominator);
    }

    const coverage = matchedTerms.length / (new Set(queryTerms).size || 1);
    const normalized = Number((0.7 * coverage + 0.3 * (rawScore / (rawScore + 1 || 1))).toFixed(3));

    return {
      cell,
      rawScore: Number(rawScore.toFixed(4)),
      score: normalized,
      matchedTerms,
    };
  });
}

function buildGreenfieldResult(
  query: string,
  architecturePath: string,
  macroOverview: ReturnType<typeof buildMacroOverview>,
  reason: string,
  topMatches: Array<Record<string, unknown>> = [],
) {
  return {
    query,
    architecturePath,
    score: 0,
    isGreenfield: true,
    reason,
    macroOverview,
    cell: null,
    topMatches,
  };
}

function formatText(result: ReturnType<typeof buildGreenfieldResult> & { cell?: Cell | null }) {
  const lines = [
    "Read Gate Result",
    `Architecture: ${result.architecturePath}`,
    `Query: ${result.query}`,
    `Greenfield: ${result.isGreenfield ? "yes" : "no"}`,
    `Score: ${result.score}`,
    `Reason: ${result.reason}`,
    "",
    "Macro topology:",
  ];

  if (result.macroOverview.length === 0) {
    lines.push("- No cells defined yet");
  } else {
    for (const cell of result.macroOverview) {
      lines.push(`- ${cell.name} :: ${cell.directory} :: ${cell.intent}`);
    }
  }

  if (result.cell) {
    lines.push("", "Matched cell:");
    lines.push(`- Name: ${result.cell.name}`);
    lines.push(`- Directory: ${result.cell.directory}`);
    lines.push(`- Intent: ${result.cell.intent}`);
    lines.push(`- Critical Boundary: ${result.cell.criticalBoundary}`);
  }

  return lines.join("\n");
}

export function main(argv: string[] = process.argv.slice(2)) {
  const { architecturePath, format, query } = parseArgs(argv);
  const queryTerms = tokenize(query);

  if (!fs.existsSync(architecturePath)) {
    const result = buildGreenfieldResult(
      query,
      architecturePath,
      [],
      "architecture.md is missing. Scaffold it before scoping the feature.",
    );
    console.log(format === "text" ? formatText(result) : JSON.stringify(result, null, 2));
    return;
  }

  const architecture = fs.readFileSync(architecturePath, "utf8");
  const cells = parseArchitecture(architecture);
  const macroOverview = buildMacroOverview(cells);

  if (cells.length === 0) {
    const result = buildGreenfieldResult(
      query,
      architecturePath,
      macroOverview,
      "architecture.md exists but contains no parsable Cell definitions.",
    );
    console.log(format === "text" ? formatText(result) : JSON.stringify(result, null, 2));
    return;
  }

  const ranked = computeBm25Scores(queryTerms, cells)
    .sort((left, right) => right.score - left.score || right.rawScore - left.rawScore);
  const best = ranked[0];
  const topMatches = ranked.slice(0, 3).map((match) => ({
    name: match.cell.name,
    directory: match.cell.directory,
    intent: match.cell.intent,
    score: match.score,
    rawScore: match.rawScore,
    matchedTerms: match.matchedTerms,
  }));

  if (!best || best.score < 0.5) {
    const result = buildGreenfieldResult(
      query,
      architecturePath,
      macroOverview,
      "No Cell crossed the 0.5 confidence threshold. Create a new Cell before scoping.",
      topMatches,
    );
    console.log(format === "text" ? formatText(result) : JSON.stringify(result, null, 2));
    return;
  }

  const result = {
    query,
    architecturePath,
    score: best.score,
    isGreenfield: false,
    reason: `Matched Cell "${best.cell.name}" above the 0.5 confidence threshold.`,
    macroOverview,
    cell: {
      ...best.cell,
      rawScore: best.rawScore,
      matchedTerms: best.matchedTerms,
    },
    topMatches,
  };

  console.log(format === "text" ? formatText(result) : JSON.stringify(result, null, 2));
}

if (import.meta.main) {
  try {
    main();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
  }
}
