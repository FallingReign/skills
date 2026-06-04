# Architecture Enforcer — Revised Evolution Proposal

## Decision Filter

Evaluate every addition against this question:

> Does this reduce token consumption and agent cognition more than it increases maintenance burden?

This proposal keeps `architecture-enforcer` focused on **architecture governance only**:

- ownership
- routing
- dependency legitimacy
- validation
- reconciliation

It does **not** expand into conventions, workflow orchestration, memory, deployment, or implementation indexing.

It is also designed so that, in the future, implementation work could be delegated to a fresh agent whose working universe is restricted to the selected **module**.

That future delegation pattern is **not** being implemented now, but it should be cleanly supported by the architecture model.

---

## 1. Re-assessment of the Current Implementation

## What the current skill already proves

The existing `architecture-enforcer` already demonstrates the core architecture-governance pattern:

- a small architecture artefact
- deterministic initial lookup
- scoped context before broad exploration
- local validation via invariants and ast-grep

Those are all valuable because they reduce free-form architectural discovery by the LLM.

## What is still missing

The biggest gaps are:

### A. The map is too flat

Today the model is basically a flat cell registry.
That creates three problems:

- navigation gets worse as the registry grows
- lookup often stops too early at “the right cell”
- cells risk becoming arbitrary buckets instead of ownership units

### B. Reconciliation is weak or absent

Right now the loop is mostly:

`map -> lookup -> work -> validation`

That is incomplete.
Without reconciliation, the map drifts and eventually stops saving tokens.
At that point agents fall back to expensive rediscovery.

### C. Ownership is not modelled strongly enough

The most valuable architectural fact is not directory layout.
It is:

- who owns mutable state
- who owns external integration contracts
- who may write
- who may only read
- which dependencies are legitimate

The next version should optimise around those facts first.

## Conclusion

The next version should **finish the architecture governance loop**, not broaden scope.

The right direction is:

- stronger hierarchy
- stronger ownership model
- script-driven reconciliation
- no function registry
- one human-readable source of truth
- clean support for future module-scoped delegation

---

## 2. Revised Architecture Model

The model should stop at:

- **System** -> overall topology
- **Cluster** -> domain grouping
- **Cell** -> the smallest unit that owns mutable state or an external integration contract
- **Module** -> the smallest practical routing boundary for implementation work inside a cell

## Why stop at Module

Function-level entries do not clear the maintenance bar.

They add:
- churn
- map growth
- reconciliation cost
- opportunities for staleness

but they do **not** provide enough additional architectural leverage.

Once the correct module is selected, the remaining work should move to deterministic implementation discovery:

- ast-grep
- code search
- symbol search

That keeps the architecture map:

- small
- stable
- cheap to maintain
- focused on routing and ownership

## Why Module is the lowest level

A module should be the smallest practical unit that can answer the questions a future restricted implementation agent would need:

- which module owns this work
- which paths are in scope
- which state or contracts are owned here
- which dependencies are legitimate

That means the module boundary is not just a folder label.
It is the lowest architecture-level routing and scoping unit.

---

## 3. Architecture Map Design Principles

The architecture map is **not**:

- documentation
- a code index
- a function catalogue
- a full folder inventory
- an implementation inventory

The architecture map **is**:

- a routing system
- an ownership system
- a dependency system
- a validation input
- a reconciliation input

Only include information that helps an agent:

- find the correct place to work
- understand ownership
- understand allowed dependencies
- validate boundaries
- reconcile the map against reality

If a field does not support one of those jobs, it probably does not belong in the map.

---

## 4. Single Source of Truth

There should be exactly **one** architecture map persisted on disk.

Recommended file:

- `architecture.map.yaml`

## Why YAML

YAML is the right tradeoff here because it is:

- deterministic enough for script parsing and validation
- human-readable
- reviewable in diffs
- expressive without requiring duplicate rendered summaries

That means we can keep:

- one source of truth
- no permanent generated markdown summaries
- no duplicate checked-in views

## Runtime views remain optional

If someone wants a visualisation later, a script can render one on demand.
But visualisation is optional and can be deferred indefinitely because the YAML map itself is readable enough.

---

## 5. Proposed Map Format

## Recommended file

- `architecture.map.yaml`

## Proposed schema shape

```yaml
version: 2
system:
  id: acme-platform
  name: Acme Platform
  intent: Overall topology of the product.
  clusters:
    - id: billing
      name: Billing
      intent: Domain grouping for invoices, collections, and settlement.
      cells:
        - id: invoice
          name: Invoice
          intent: Owns invoice state and invoice-facing integration contracts.
          owns:
            mutableState:
              - Invoice aggregate
              - Invoice status history
            externalContracts:
              - Invoice API
          writeAuthority:
            allowedModules:
              - status
              - lifecycle
            notes:
              - Only Invoice cell modules may mutate invoice status.
              - Other cells may read through approved query paths but must not write directly.
          paths:
            - src/billing/invoice/**
          dependsOn:
            cells:
              - billing.money
              - shared.audit
            externalContracts:
              - stripe.invoices
          modules:
            - id: status
              name: Status
              intent: Applies invoice lifecycle rules and status changes.
              paths:
                - src/billing/invoice/status/**
              owns:
                mutableState:
                  - Invoice.status
                  - Invoice.statusHistory
                externalContracts: []
              responsibilities:
                - Perform invoice status transitions
                - Validate legal transition rules
              allowedDependencies:
                cells:
                  - billing.money
                  - shared.audit
                externalContracts:
                  - stripe.invoices
            - id: queries
              name: Queries
              intent: Read-model and query access for invoice views.
              paths:
                - src/billing/invoice/queries/**
              owns:
                mutableState: []
                externalContracts: []
              responsibilities:
                - Serve invoice reads without mutating invoice state
              allowedDependencies:
                cells:
                  - billing.money
                externalContracts: []
```

---

## 6. Required Fields by Level

## System

Required:
- `id`
- `name`
- `intent`
- `clusters[]`

## Cluster

Required:
- `id`
- `name`
- `intent`
- `cells[]`

## Cell

Required:
- `id`
- `name`
- `intent`
- `owns.mutableState[]`
- `owns.externalContracts[]`
- `writeAuthority.allowedModules[]`
- `paths[]`
- `dependsOn.cells[]`
- `dependsOn.externalContracts[]`
- `modules[]`

Optional but useful:
- `writeAuthority.notes[]`

## Module

Required:
- `id`
- `name`
- `intent`
- `paths[]`
- `owns.mutableState[]`
- `owns.externalContracts[]`
- `allowedDependencies.cells[]`
- `allowedDependencies.externalContracts[]`

Optional but useful:
- `responsibilities[]`

## Important omission

There is **no function registry**.

Function discovery belongs to Phase 2 implementation tooling, not the architecture map.

---

## 7. Ownership-First Modelling Rules

These rules matter more than structural prettiness.

### Rule 1: Cells are ownership units, not folders

A new cell should exist only when there is a new owner of:

- mutable state, or
- an external integration contract

### Rule 2: Modules are the smallest practical routing boundary

A module should be small enough that a future fresh implementation agent can treat it as its working universe, plus explicitly permitted neighbours.

That means a module entry should provide enough information to answer:

- what paths are in scope
- what it owns directly
- what it may depend on
- whether it may write owned state

### Rule 3: Most growth should happen below the cell, at module level

When new behaviour is added, prefer:

- existing module
- new module inside existing cell

before considering a new cell.

### Rule 4: Write authority should be explicit

For each cell, the map should make clear:

- what the cell owns
- which modules may write owned state
- what other cells must not write directly

### Rule 5: Module ownership may be narrower than cell ownership

The cell is the owner of the state or contract in the architecture sense.
A module may own the **practical write path** or sub-area within that cell.

This is useful because future delegated implementation work needs module-level scoping facts, not just cell-level facts.

### Rule 6: Read paths are weaker than write paths

The most important boundary to govern is mutation.
Read access matters, but write authority is the core governance signal.

### Rule 7: Paths support routing; they do not define ownership by themselves

A directory path is evidence of placement, not the source of truth.
Ownership comes from the map.

---

## 8. Lookup Model

## Goal

Phase 1 lookup should answer only these questions:

- Where does this belong?
- Which cell owns the relevant state or contract?
- Which module should I work in?
- Which paths are in scope?
- What dependencies are legitimate?

Once that answer is produced, architecture lookup is complete.

## Lookup output should stop at Module

Suggested output shape:

```json
{
  "query": "invoice status transition",
  "architecturePath": "architecture.map.yaml",
  "isGreenfield": false,
  "confidence": {
    "cluster": 0.91,
    "cell": 0.88,
    "module": 0.84
  },
  "path": {
    "system": "acme-platform",
    "cluster": "billing",
    "cell": "invoice",
    "module": "status"
  },
  "scope": {
    "modulePaths": [
      "src/billing/invoice/status/**"
    ],
    "cellPaths": [
      "src/billing/invoice/**"
    ]
  },
  "owner": {
    "cell": {
      "id": "invoice",
      "name": "Invoice",
      "intent": "Owns invoice state and invoice-facing integration contracts."
    },
    "owns": {
      "mutableState": ["Invoice aggregate", "Invoice status history"],
      "externalContracts": ["Invoice API"]
    },
    "writeAuthority": {
      "allowedModules": ["status", "lifecycle"],
      "notes": [
        "Only Invoice cell modules may mutate invoice status."
      ]
    }
  },
  "module": {
    "id": "status",
    "name": "Status",
    "intent": "Applies invoice lifecycle rules and status changes.",
    "owns": {
      "mutableState": ["Invoice.status", "Invoice.statusHistory"],
      "externalContracts": []
    },
    "allowedDependencies": {
      "cells": ["billing.money", "shared.audit"],
      "externalContracts": ["stripe.invoices"]
    }
  },
  "recommendation": "modify-existing-module",
  "topMatches": [
    {
      "cluster": "billing",
      "cell": "invoice",
      "module": "status",
      "score": 0.84
    },
    {
      "cluster": "billing",
      "cell": "invoice",
      "module": "queries",
      "score": 0.42
    }
  ]
}
```

## Recommendation states

The lookup script should distinguish:

- `modify-existing-module`
- `add-module-in-existing-cell`
- `add-cell`

It should **not** invent function-level recommendations.

## Greenfield rule

Greenfield should mean one of two things only:

1. no existing cell matches with acceptable confidence, or
2. the task introduces a new mutable-state owner or external-contract owner

A weak module match inside a strong cell match usually means:

- add a module in the existing cell

not:

- add a new cell

---

## 9. Two-Phase Operating Model

The skill should explicitly separate two phases.

## Phase 1: Architecture Lookup

Purpose:
Use the architecture map to determine:

- owning cell
- target module
- module scope paths
- owned state and contracts
- allowed dependencies
- whether this is existing-module work, new-module work, or true new-cell work

Tools:
- `arch-lookup`
- optional future visualisation tooling

Inputs:
- task keywords
- optional changed-file hints
- optional path hints

Outputs:
- cluster / cell / module resolution
- scope facts for the selected module
- ownership facts
- allowed dependency facts
- recommendation type

## Phase 2: Implementation Discovery

Purpose:
Once the module is known, inspect the implementation deterministically.

Tools:
- ast-grep
- code search
- symbol search
- file reads

Questions answered here:
- which files inside the module matter?
- where are the write paths?
- what concrete symbols need to change?
- what implementation details are relevant?

## Why this separation matters

It prevents the architecture map from becoming a code index.
That keeps the map small and durable while still enabling precise implementation discovery after routing.

It also cleanly supports future delegated execution, because Phase 1 can hand a future fresh implementation agent a compact module-scoped context pack.

---

## 10. Revised Reconciliation Model

Reconciliation should be primarily script-driven, not LLM-authored from scratch.

The ideal loop is:

`Architecture Map -> Lookup -> Work -> Validation -> Reconciliation`

The agent’s role is to:

- run the scripts
- review deterministic outputs
- apply suggested patches
- only use judgment where ambiguity remains

## Reconciliation priorities

Order these by value:

1. ownership reconciliation
2. dependency reconciliation
3. structure reconciliation
4. patch suggestion generation

### A. Ownership reconciliation

This is the highest-value reconciliation layer.

Detect:
- writes to owned state outside the owning cell
- writes to owned state from non-authorised modules inside the cell
- external contract usage outside the owning cell when forbidden
- duplicate ownership claims between cells
- parallel mutation paths that bypass the declared owner

Outputs:
- `ownershipViolations`
- `parallelWritePaths`
- `duplicateOwners`
- `candidateWriteAuthorityUpdates`

### B. Dependency reconciliation

Detect:
- imports crossing into undeclared cells
- new dependencies missing from `dependsOn`
- module-level dependency usage outside `allowedDependencies`
- dead declared dependencies no longer observed
- use of undeclared external contracts

Outputs:
- `undeclaredDependencies`
- `invalidModuleDependencies`
- `unusedDeclaredDependencies`
- `candidateDependencyPatches`

### C. Structure reconciliation

Detect:
- new module-like directories under a cell path
- declared module paths that no longer exist
- files appearing under a cell but outside all declared modules
- files appearing outside all declared cell paths

Outputs:
- `candidateModules`
- `missingModules`
- `unmappedFiles`
- `orphanPaths`

### D. Suggested patch generation

The script should generate suggested map updates wherever possible.

Examples:
- add module patch
- remove stale module patch
- add dependency patch
- adjust write-authority patch
- adjust module-level allowed-dependency patch

The goal is not perfect automatic mutation.
The goal is to avoid forcing the agent to reconstruct architecture knowledge manually.

---

## 11. Determinism Standard for Reconciliation

Prefer checks that can be produced from local scripts with clear rules.

Good examples:
- path existence checks
- module directory detection
- import graph extraction
- boundary rule evaluation
- static detection of forbidden writes or forbidden client usage

Avoid vague, high-interpretation reconciliation steps unless no deterministic signal exists.

When ambiguity remains, the script should say:
- what was observed
- why it may be drift
- what patch is suggested

rather than pretending certainty.

---

## 12. Script Changes Required

## A. `arch-lookup`

Replace the current flat-cell lookup with hierarchical lookup over:

- system
- cluster
- cell
- module

Required behaviour:
- parse `architecture.map.yaml`
- rank cluster, then cell, then module
- return ownership, scope, and dependency facts
- distinguish `modify-existing-module`, `add-module-in-existing-cell`, and `add-cell`

## B. `arch-validate`

Purpose:
Validate the integrity of the map and the declared boundaries.

Responsibilities:
- validate YAML structure / required fields
- ensure IDs are unique
- ensure module paths are nested inside owning cell paths
- ensure allowed write modules actually exist
- ensure dependency references point to real cells where applicable
- ensure module-level allowed dependencies are subsets of legitimate cell-level dependencies where appropriate
- optionally generate targeted ast-grep rules from ownership/dependency declarations

## C. `arch-reconcile`

Purpose:
Compare the map with the current codebase and report drift.

Responsibilities:
- ownership reconciliation
- dependency reconciliation
- structure reconciliation
- suggested patch generation

Outputs:
- JSON report to stdout
- optional patch suggestions
- optional terminal summary

Do **not** require a persisted markdown report.
Reports can be generated on demand.

## D. `arch-migrate`

Purpose:
Upgrade existing flat `architecture.md` installations into `architecture.map.yaml`.

This is important for adoption and should preserve as much existing information as possible.

## E. Optional future visualisation

Visualisation is explicitly lower priority and should not drive the architecture file design.
YAML readability means this can be deferred until it is actually needed.

---

## 13. Skill Instruction Changes

The skill should move to four explicit gates:

1. **Lookup Gate**
2. **Implementation Discovery Gate**
3. **Validation Gate**
4. **Reconciliation Gate**

## 1. Lookup Gate

- If no architecture map exists, enter greenfield mode.
- Create `architecture.map.yaml` before broad scoping.
- Run `arch-lookup` using task keywords and optional path hints.
- Determine whether the task is:
  - existing module work
  - new module inside existing cell
  - true new cell
- Do not inspect the whole repository before this step.

## 2. Implementation Discovery Gate

After the module is known:
- inspect only the selected module and directly relevant neighbours
- use ast-grep, code search, or symbol search to locate concrete implementation units
- do not extend the architecture map downward into functions

## 3. Validation Gate

Before finishing:
- run `arch-validate`
- run project ast-grep rules or generated boundary rules
- inspect and update `@invariant` blocks on boundary files if structural contracts changed

## 4. Reconciliation Gate

Before finishing:
- run `arch-reconcile`
- review deterministic drift findings
- apply suggested map patches where needed
- if the change modified ownership, dependencies, or module structure, update the map in the same turn

## Instruction emphasis

The revised skill should state clearly:

- the architecture map is a routing / ownership / dependency system
- the architecture map stops at module level
- cells are scarce; modules are where most growth happens
- ownership is more important than file layout
- reconciliation is mandatory because stale maps stop saving tokens
- module selection should produce enough scope information for future module-restricted implementation delegation

---

## 14. Template Changes Required

## Replace the current flat markdown template

Add:
- `references/architecture-map-template.yaml`

Remove the assumption that `architecture.md` is the persisted architecture artefact.

## Keep invariant templates

The invariant template is still useful, but it should be tightened around ownership.

Suggested direction:

```ts
/**
 * @invariant Cell: Invoice
 * @invariant Module: Status
 * @invariant Owns invoice status writes for the Invoice cell.
 * @invariant Only authorised Invoice modules may mutate Invoice.status.
 * @invariant Other cells may read through approved paths but must not write directly.
 * @invariant Update this block in the same turn when the structural contract changes.
 */
```

The important thing is that invariants reinforce:
- ownership
- write authority
- forbidden bypasses

not just general structure.

---

## 15. Validation Priorities

Validation should focus on the highest-value architecture facts.

## Highest priority

1. ownership integrity
2. write-authority enforcement
3. dependency legitimacy
4. module-to-cell containment
5. module-scope legitimacy for future delegated implementation work

## Lower priority

- descriptive completeness
- presentation quality
- deep implementation indexing

This keeps the governance system aligned with the token-efficiency goal.

---

## 16. Migration Plan

## Phase 0: backward-compatible transition

For a transition period:
- if `architecture.map.yaml` exists, use the new model
- else fall back to legacy `architecture.md`

## Phase 1: migrate flat cells into the new structure

`arch-migrate` should:
- create one system
- create one default cluster such as `core`
- convert each legacy cell into a new `cell`
- create a default module such as `main` for each cell path
- preserve existing intent, dependencies, and critical boundary notes where possible

## Phase 2: enrich ownership data

After migration, refine the map to add:
- explicit owned mutable state
- explicit owned external contracts
- explicit write authority by module
- module-level allowed dependencies

This is the most important enrichment step.

## Phase 3: refine module structure

Split default `main` modules into real modules only where it improves routing, reconciliation, and future delegation scope.
Do not over-model.

## Phase 4: activate reconciliation

Start with:
- structure drift detection
- dependency drift detection

Then add stricter:
- ownership and write-authority reconciliation
- module-level scope and dependency reconciliation

Once the signals are stable, ownership violations can become hard failures.

---

## 17. Minimal Viable V2

The smallest useful V2, aligned with the new constraints, is:

1. one persisted file: `architecture.map.yaml`
2. hierarchy: `System -> Cluster -> Cell -> Module`
3. ownership-first cell schema
4. module-scope facts sufficient for future delegated implementation work
5. hierarchical `arch-lookup`
6. `arch-validate` for schema / containment / dependency integrity
7. `arch-reconcile` for ownership, dependency, and structure drift
8. `arch-migrate` for legacy adoption

This is enough to complete the core architecture-governance loop while staying small and portable.

---

## 18. Final Recommendation

The strongest version of `architecture-enforcer` is not a richer documentation system.
It is a **small, deterministic architecture routing and ownership system**.

That means:

- use one human-readable source of truth: `architecture.map.yaml`
- stop the map at `Module`
- separate architecture lookup from implementation discovery
- prioritise ownership and write authority over structural detail
- make reconciliation primarily script-driven
- make module entries strong enough to support future module-restricted implementation delegation
- only keep information that saves tokens and reduces agent cognition

That is the version most likely to remain portable, maintainable, and actually used.