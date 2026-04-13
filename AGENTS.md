# AGENTS.md

## Purpose
Default execution rules for this monorepo. Read these before planning or implementation.

## Core engineering stance
- Build the Rails way: prefer convention over configuration, boring defaults, and fewer moving parts.
- Choose the simplest design that solves the real problem end-to-end.
- Avoid over-engineering: no speculative abstractions, no helper pyramids, no premature service layers.
- Keep logic close to where it is used unless reuse is proven.

## Decision filters (must pass all)
1. **Rails-first:** Would this look natural in a high-quality Rails app?
2. **DHH bar:** Is this coherent, simple, and maintainable without ceremony?
3. **Security bar:** Would a security consultant sign off on data handling, auth, and trust boundaries?
4. **First-principles bar:** Can we explain why each step exists and remove anything non-essential?

If a proposal fails any filter, simplify and retry.

## Planning rules
- Start with user outcomes and legal/business invariants.
- Prefer a thin vertical slice over broad scaffolding.
- Define explicit non-goals for each phase.
- Include rollback and observability for risky behavior changes.
- Write acceptance criteria before implementation tasks.

## Implementation rules
- Prefer built-in Rails capabilities before adding dependencies.
- Keep APIs explicit and versioned only when needed.
- Validate all external input at boundaries.
- Store the minimum sensitive data required.
- Make error handling deterministic and user-facing where appropriate.
- Keep naming plain-language and domain-oriented.

## Testing rules
- **TDD is mandatory by default.**
- Write tests first, then implementation, then refactor.
- Every behavior change must include tests that would fail without the change.
- Test critical business rules first (especially trust/progression decisions).
- Add integration tests for route-to-route behavior changes.
- Add regression tests for every production bug fix.
- Avoid brittle snapshot-heavy strategies for core logic.
- Require meaningful coverage on all touched code paths; no untested logic merges.
- No merge without passing critical-path tests.

## Anti-patterns to avoid
- Massive generic helper modules.
- Deep indirection for simple CRUD/workflow operations.
- Rewriting stable behavior without parity tests.
- Introducing async/event complexity where synchronous flow is enough.
