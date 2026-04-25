# native-to-rails roadmap

Top-level tracker for the React Native → Rails (+ Hotwire Native shells) migration. Each row points to the epic folder where the detailed plan, phase breakdown, and per-epic roadmap live.

The canonical, longer-form epic descriptions are in [NATIVE_TO_RAILS_EPICS.md](NATIVE_TO_RAILS_EPICS.md). This table is the at-a-glance status board.

**Status values**: `Not started`, `Planning`, `In progress`, `Shipped`, `Deferred`, `Mostly shipped (deferrals noted)`.

| Epic ID | Title | Summary | Status |
|---|---|---|---|
| 0 | [Mobile frontend shell](epic-0-mobile-frontend-shell/) | Hotwire Native iOS shell + Turbo/Stimulus + path config + bridges (date, haptics, push) + deep-link parity. The "shell layer" the rest of the epics render inside. | Mostly shipped — Phases A, B, C, E, F, G, I shipped. D (Android), H (offline polish), J (camera) deferred. |
| 1 | [Splash, intro, deep-link parity](epic-1-splash-intro-deeplink/) | Reproduce app-open, first-touch attribution, splash timing, and deep-link routing exactly in the Rails-served Hotwire Native shell. | Shipped (delivered as the verification surface for Epic 0 phases A–G, I). |
| 2 | [Onboarding](epic-2-onboarding/) | Migrate welcome → location → family → extended-family → wrap-up with parity on conditional questions, relationship semantics, and progression. | Planning (detailed plan exists; implementation status to audit). |
| 3 | [Registration and auth](epic-3-auth/) | Move session authority to Rails using `WKWebView` cookie jar. Preserve current auth UX and offline safeguards. | Not started in Hotwire era. RN-era API auth plans archived under `rn-archive-ref/` for reference when work begins. |
| 4 | [Dashboard and "Your People"](epic-4-your-people/) | Post-auth landing surface and the people graph (executors, guardians, beneficiaries). Invitation system plan archived under `rn-archive-ref/`. | Not started. |
| 5 | [Asset Entry](epic-5-asset-entry/) | Asset entry by type (one-by-one), including photo capture. Subsumes deferred shell Phase J — camera bridge will land here when Epic 5 starts so data model and capture UI ship together. | Not started. |

## How to use this roadmap

- **Add an epic**: append a row, create `epic-N-<slug>/`, drop a detailed plan + per-epic `epic-N-<slug>-roadmap.md` inside.
- **Update status**: when the underlying epic's status changes, update its row here in the same commit.
- **Defer an epic or phase**: rename the folder with a `-deferred` suffix and add a `why-deferred.md` capturing concise reasoning. Update status to `Deferred`.

The lplan skill (`~/.claude/skills/lplan/SKILL.md`) enforces this convention for new epic plans.
