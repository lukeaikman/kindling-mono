# Epic 2 — Onboarding — roadmap

Tracker for sub-pieces of Epic 2. Full epic context in [NATIVE_TO_RAILS_EPICS.md](../NATIVE_TO_RAILS_EPICS.md#epic-2--onboarding). Detailed plan in [EPIC_2_ONBOARDING_DETAILED_PLAN.md](EPIC_2_ONBOARDING_DETAILED_PLAN.md).

**Status values**: `Not started`, `Planning`, `In progress`, `Shipped`, `Deferred`.

| Piece ID | Title | Summary | Status |
|---|---|---|---|
| 2.1 | Detailed plan | Discovery + delivery + QA matrix for welcome → location → family → extended-family → wrap-up. | Shipped |
| 2.2 | Welcome step | Identity + DOB + age warnings. | Audit needed |
| 2.3 | Location step | Residency / domicile questions. | Audit needed |
| 2.4 | Family step | Relationship status, spouse/partner, children, guardian defaults, co-guardians. | Audit needed |
| 2.5 | Extended-family step | Parents/siblings (informational). | Audit needed |
| 2.6 | Wrap-up step | Transition to account security. | Audit needed |
| 2.7 | Autosave + draft-resume | Idempotent + resumable per step. | Audit needed |
| 2.8 | Conditional-visibility shared module | Validation + visibility rules in pure Ruby/JS, decoupled from views. | Audit needed |

> **Audit pending**: rows 2.2–2.8 carry `Audit needed` because shipped status across these substeps wasn't part of the lplan reorg context. First action when picking up Epic 2 is to walk the codebase and replace `Audit needed` with the real status.

## How to use this roadmap

Update the table whenever a piece changes status. When a piece grows into a substantial workstream, give it its own subfolder with a detailed plan.
