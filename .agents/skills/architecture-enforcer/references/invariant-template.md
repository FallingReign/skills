# `@invariant` Template

Add a top-level block comment to boundary files, stores, adapters, and public APIs.

## TypeScript / JavaScript

```ts
/**
 * @invariant Owns [state, API, or boundary].
 * @invariant All writes flow through [store/service/function].
 * @invariant Do not import or call [forbidden dependency or parallel path].
 * @invariant Update this block in the same turn when the structural contract changes.
 */
```

## Python

```python
"""
@invariant Owns [state, API, or boundary].
@invariant All writes flow through [store/service/function].
@invariant Do not import or call [forbidden dependency or parallel path].
@invariant Update this block in the same turn when the structural contract changes.
"""
```

## Writing Rules

- State what the file owns.
- State the required path for reads or writes.
- State the forbidden bypass explicitly.
- Keep the block structural. Do not fill it with implementation trivia.
