# Wave 2 Commit 3 — OnboardingController refactor (lplan, 2026-04-29)

**Final executable spec**: [06-dhh-v2-final.md](06-dhh-v2-final.md)

## Reading order

1. [00-input.md](00-input.md) — context, what's already shipped, decisions baked in pre-lplan, open questions
2. [01-claude-draft.md](01-claude-draft.md) — first sketch (5 sub-commits, eager Person creation, `apply_*_step!` style — superseded)
3. [02-elon-scope.md](02-elon-scope.md) — strip ceremony: 2 sub-commits not 5, lazy Person, no `Marriage#end!`
4. [03-dhh-v1.md](03-dhh-v1.md) — Rails-y synthesis after Elon-scope
5. [04-qa-review.md](04-qa-review.md) — bugs + gaps + tests (B1–B11, G1–G5, T1–T4)
6. [05-elon-fp.md](05-elon-fp.md) — first-principles second pass; `find_or_initialize_by`, plain method for `active_marriage`, no service objects
7. **[06-dhh-v2-final.md](06-dhh-v2-final.md)** — what we ship. Folds in QA + Elon-FP. Two sub-commits: 3a trivial steps + 3b family step.

## TL;DR

After Commit 2 left `Mobile::BaseController` with both legacy `onboarding_session` machinery and new `current_user` machinery side-by-side, Commit 3 swaps `Mobile::OnboardingController` onto `current_user` + the unified-shape models (Person/Marriage/Parentage/Will). Two sub-commits:

- **3a** — welcome / location / extended-family / wrap-up actions write to `current_user.will_maker_person` (created lazily on first welcome submit). `summary_facts` moves from OnboardingSession to User.
- **3b** — family step writes to Marriage + Parentage with controller-level orchestration (`sync_partner!`, `sync_children!`, `sync_co_parent!`). Wave 1 family-step UX preserved exactly.

After 3b lands: `OnboardingController` has zero references to `OnboardingSession`. Commit 5 then drops the legacy table.
