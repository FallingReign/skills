---
name: architecture-enforcer
description: Enforce a Cellular Architecture workflow before scoping, coding, and verification. Use when a repository defines or needs `architecture.md`, cell boundaries, `@invariant` file contracts, or `ast-grep` boundary checks; also use for greenfield cell creation, architecture-aware refactors, and boundary-sensitive TDD.
---

# Architecture Enforcer

Apply the three gates in order. Do not discover architecture by reading the whole repository first.

## Phase 1: Read Gate

1. Preflight on the target repository root.
   - If `architecture.md` is missing, enter Greenfield mode immediately.
   - Create `architecture.md` from `references/architecture-template.md`.
   - Define the new Cell before scoping files or implementation.

2. When `architecture.md` exists, run the lookup script with feature keywords.
   - Prefer Bun when it exists:
     ```powershell
     bun .agents\skills\architecture-enforcer\scripts\arch-lookup.ts feature keywords
     ```
   - Fall back to Node in environments without Bun:
     ```powershell
     node .agents\skills\architecture-enforcer\scripts\arch-lookup.js feature keywords
     ```

3. Read the JSON response fields:
   - `macroOverview`: the macro-topology summary to keep in working memory
   - `cell`: the best matching Cell object, or `null`
   - `score`: normalized 0-1 confidence for the best match
   - `isGreenfield`: `true` when no confident match exists
   - `topMatches`: alternate Cells worth checking before creating a new one

4. Gate the next step with the response.
   - If `isGreenfield` is `true` or `score < 0.5`, append a new Cell to `architecture.md` before you scope or code.
   - If a Cell matches, stay inside that Cell. Do not invent a parallel path, state store, or service boundary elsewhere.

## Phase 2: Code Gate

1. Before editing a file, inspect its top-level comment block for `@invariant`.
2. Treat every invariant as a hard structural rule, not a suggestion.
3. If a file is a cell boundary, entry point, store, adapter, or public API and it does not have an invariant block, add one using `references/invariant-template.md`.
4. If your change alters the file's structural contract, update the invariant block in the same turn.

Use invariants to prevent the common failure mode: adding a second path to the same state or dependency just because it is locally convenient.

## Phase 3: Verification Gate

1. If the project already runs `ast-grep` from its normal test command, use that existing command.
2. Otherwise run `ast-grep` directly before finishing the task. Do not substitute grep or regex checks.

Example direct invocation with the bundled working rule:

```powershell
ast-grep scan --rule .agents\skills\architecture-enforcer\references\ast-grep-typescript-import-boundary.yml .
```

That rule is intentionally concrete and small. Copy it into the target project, then adapt the import path, language, and message to the real boundary being enforced.

## Bundled Resources

- `scripts/arch-lookup.ts`: Bun-friendly TypeScript version of the Read Gate lookup
- `scripts/arch-lookup.js`: portable Node fallback for the same lookup contract
- `references/architecture-template.md`: starter `architecture.md` structure for Greenfield mode
- `references/invariant-template.md`: reusable top-level file invariant patterns
- `references/ast-grep-typescript-import-boundary.yml`: runnable example rule for import-boundary enforcement

## Operating Notes

- Keep `architecture.md` small and current. It is a map, not a design document dump.
- Only read deeper code after the Read Gate identifies the owning Cell.
- When a change spans multiple Cells, treat one Cell as the owner and describe cross-cell dependencies explicitly in `architecture.md`.
- Update architecture artifacts as part of the same task that changes the boundary. Do not defer the map fix.
