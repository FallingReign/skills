# SYSTEM TOPOLOGY

Keep this file short enough that an agent can read it before scoping work.

## Cell: [Subsystem Name]
- **Intent:** [One sentence describing the responsibility owned by this cell]
- **Directory:** `[path\to\directory\or\directories]`
- **Upstream Dependencies:** [Cells that depend on this cell, or `None`]
- **Downstream Dependencies:** [Cells this cell depends on, or `None`]
- **Critical Boundary:** [The primary structural rule this cell must preserve]

## Cell: [Another Subsystem]
- **Intent:** [One sentence describing the responsibility owned by this cell]
- **Directory:** `[path\to\directory\or\directories]`
- **Upstream Dependencies:** [Cells that depend on this cell, or `None`]
- **Downstream Dependencies:** [Cells this cell depends on, or `None`]
- **Critical Boundary:** [The primary structural rule this cell must preserve]

## Notes

- Add one Cell per owned subsystem.
- Prefer updating an existing Cell over creating overlapping Cells.
- If a feature truly needs a new domain, append a new Cell before coding.
- Keep dependency arrows honest. If two Cells both mutate the same state directly, the map is wrong.
