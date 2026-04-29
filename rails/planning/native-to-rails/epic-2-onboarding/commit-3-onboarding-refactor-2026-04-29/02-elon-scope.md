# Step 2 — Elon scope challenge (2026-04-29)

> Challenge the scope of Claude's draft. What's actually load-bearing? What can be deleted?

## Challenge 1 — Why are we doing this commit at all?

The shipped UX works. Wave 1 + the polish passes (eager-Person isn't required to make the form behave correctly today). The user has confirmed the family-step UX in browser. So **what specifically does Wave 2 Commit 3 deliver that the user cares about?**

Three candidate justifications, only one is real:

a. **"It's needed for the new family shape."** No — the new family shape (per-child co-parent, smart partner labels, two-up names) is already shipped against the OnboardingSession JSON blob. Working today.

b. **"Encryption-at-rest for PII."** This is real. OnboardingSession's `first_name`, `spouse_first_name`, `children_payload` are stored unencrypted in the DB. Person has `encrypts ..., deterministic: true`. Until Commit 3 lands, anonymous-User PII still pools in OnboardingSession plaintext. **This is the actual reason to do this commit before launch**, and it's PRE_LAUNCH-class, not feature work.

c. **"It unblocks Epic 4 (your-people)."** Real but distant. Epic 4 needs Person rows that survive past onboarding — which requires Commit 3 + Commit 5.

So the single load-bearing reason is: **"plaintext PII in `onboarding_sessions.children_payload` is bad."** Everything else is infrastructure for future work that isn't being built this week.

**Implication**: this is a PRE_LAUNCH-class refactor, not a value-add for the current user. Ship date should be governed by "before public launch", not "before next feature push". Rushing is wrong; over-investing is also wrong.

## Challenge 2 — Sub-commit packaging

Claude proposed 5 sub-commits (3a–3e). Test: which of these are genuinely independent value, vs ceremony?

- **3a (welcome) + 3b (location)** — same Person, more fields. They're one transaction conceptually. Why two commits?
- **3d (extended-family)** — same Person again, more fields. Why a third commit for the same pattern?
- **3e (wrap-up + summary_facts)** — small. summary_facts rewrite has no per-step risk; bundle with 3d.
- **3c (family)** — genuinely different: writes Marriage + Parentage rows, has cascade rules. Stands alone.

Revised packaging:
- **3a — Person eager + welcome + location + extended-family + wrap-up** (the "trivial" steps; one Person, field updates only)
- **3b — Family** (the only step with real shape)

Two commits, not five. Each end-to-end. The "trivial" commit lands a working onboarding for everyone except partnered users with kids; the family commit completes it.

If 3a turns out to be larger than expected, split it then. Don't pre-split.

## Challenge 3 — Eager `User#after_create` Person creation

Claude justifies this by analogy to the eager Will. But:

- Wills sit dormant until something attaches to them (Bequest, etc.). The eager Will costs ~0 — it's a row with `version: 1, status: "draft"` and nothing else. Future code does `current_user.draft_will.bequests.create!(...)`.

- A will-maker Person, eagerly created, has `relationship_kind: "self"` and nothing else. *Could* future code attach to it before welcome runs? No — there's nothing to attach. Marriage and Parentage are family-step level and *require* welcome to have completed (you can't be married without having a name). So the "always-present" property buys us... nothing concrete.

What it does cost:
- Cascade-delete of one extra row per anonymous-User cleanup
- A test-scaffolding gotcha: `User.create!` now creates a Person, which means tests that expect `user.people.count == 0` now fail

Lazy creation in `update_welcome` (the only place the will-maker Person gets data) is **simpler, costs less, and adds zero nil-handling**, because outside `update_welcome` the rest of the code can safely assume `will_maker_person` exists (welcome has run by then).

The previous conversation went lazy → eager based on a "consistency with spouse/child Person rows" argument, but that's the wrong axis. Spouse/child are eagerly created during the family step *because their data exists then*. Eager-on-User-create for the will-maker is creating data that doesn't exist yet.

**Verdict**: ditch eager. Build the Person on first welcome submit. One `||` build, in one method. Done.

## Challenge 4 — Stable client_id for children

Claude proposes carrying a `client_id` per child card across re-renders, so validation errors don't reshuffle cards. But:

- The current implementation works without this — OnboardingSession's JSON blob carries the IDs in re-renders for free. After Commit 3, re-renders happen on validation errors only.
- Validation errors at the family step are: missing first_name on a child, missing co-parent fields when type is set, etc. These are per-card errors. The user fixes the field, resubmits.
- If the form re-renders with cards in original order (which it will, because we re-render `current_user.parentages.order(:created_at)`), there's no shuffle.

The only failure mode is: user adds Child 1 + Child 2, Child 1 has a validation error, on re-render Child 2 hasn't been saved to DB yet (transaction rolled back), so we re-render from form params not DB rows. **In that case, yes, we need form-param ordering preservation.** A simple `position` integer in the form (already there as a hidden field equivalent) handles this — we don't need a SecureRandom.hex.

**Simpler approach**: form carries `children[][position]` (0, 1, 2, …). On render, iterate children in that order. No client_id; just position.

For matching existing rows on save: `children[][id]` is set after the row first persists; absent before. Match on id, fall back to position-aware build.

## Challenge 5 — Marriage#end!

`Marriage#end!(reason:)` looks tidy but it's one update statement with branching. The branching is also wrong-shaped: `reason: "divorced"` in the form *isn't* a reason for ending; it's the new state of the will-maker. If the user picks `single` after being married, the prior marriage didn't "end with reason single" — it ended with whatever ended it. We don't know.

**Simplification**: when `relationship_kind` changes off a partnership, just transition the prior Marriage to `phase: "separated"` and stamp `ended_at: Date.current`. The form doesn't ask "how did your prior marriage end?" so we don't pretend to know. If the user said `divorced`, they're between marriages, but the prior Marriage's *cause* is unrecorded.

Rename `Marriage#end!` to nothing — just inline the update in `sync_partner`. It's two lines:
```ruby
active.update!(phase: "separated", ended_at: Date.current)
```

That's not a domain operation that needs a name yet. (If we later add divorce/widowed branching from the form, then we earn a method name.)

## Challenge 6 — `times_divorced` / `times_widowed` columns

These are counters on Person, but Marriage rows record the same information (count of `phase: "divorced"` Marriages). Why store both?

The form *does* capture them (as raw integer inputs, "How many times have you been divorced?"). The user might not bother filling out historic Marriage rows. So the counter is faster than asking for full history.

But: they're *also* dual sources of truth. If a user has 2 divorced Marriages and `times_divorced: 1`, which is right?

**Pragmatic**: keep the counters as the user-supplied truth (form captures them directly), and don't materialise prior Marriage rows unless the user adds them. This is the current design. Don't try to derive.

But: tests for `summary_facts` need to be clear about which value it shows. Use the counter.

## Challenge 7 — Validation contexts

Claude proposes per-step contexts on Person (`:welcome_step`, `:location_step`, `:extended_family_step`). This mirrors OnboardingSession's pattern.

**Test**: do we *need* contexts? The Person is updated only via the controller, which knows what step it's on. Field-level "required at step X" can equivalently be checked in the controller before save:

```ruby
def update_welcome
  person = current_user.will_maker_person || current_user.people.build(relationship_kind: "self")
  person.assign_attributes(welcome_params)
  unless welcome_params.values_at(:first_name, :last_name, :date_of_birth).all?(&:present?)
    person.errors.add(:base, "All fields required")
    raise ActiveRecord::RecordInvalid, person
  end
  person.save!
  current_user.update!(will_maker_person: person, current_step: "location")
  redirect_to mobile_onboarding_location_path
rescue ActiveRecord::RecordInvalid
  render :welcome, status: :unprocessable_entity
end
```

But this is uglier than `save!(context: :welcome_step)` with the `with_options on: :welcome_step do ... end` block on the model. AR contexts are exactly the right tool.

**Verdict**: keep contexts. Claude was right here.

## Challenge 8 — `summary_facts` move

Move from OnboardingSession to User. Why on User and not the will-maker Person?

The summary describes the *user's life situation* — partner, children, parents — pieced together from the user's User+Person+Marriage+Parentage rows. That's cross-model orchestration. It's a User-level view because User is the aggregate.

But: if we put a `User#summary_facts` method that knows about Marriage shapes and Parentage shapes, that's User reaching into many tables. Is that fat-model bloat?

DHH would say: yes, this is fine. User is the natural aggregate root for "the user's situation". Reaching into associations from User is what associations are for.

**Verdict**: keep on User. Fine.

## Stripped-down sub-commit list

After challenges:

- **3a** — *Lazy* will-maker Person creation in `update_welcome`; refactor welcome + location + extended-family + wrap-up onto Person. Ship `summary_facts` on User in this commit too (it's read-only logic, doesn't depend on family-step shape). Probably 1.5 days.
- **3b** — Family step: Marriage + Parentage shape, sync_partner / sync_children helpers. Probably 1.5 days.

**Total**: ~3 days. One day faster than Claude's 3.5, and only because we cut ceremony.

## Anti-features

Things Claude implicitly proposed that we should NOT do:

- ❌ Eager Person creation in `User#after_create`
- ❌ `Marriage#end!` method (just inline the update)
- ❌ SecureRandom.hex(6) `client_id` per child (use `position` integer)
- ❌ 5 sub-commits (use 2)

## Things to keep that Claude got right

- ✅ Validation contexts on Person (`:welcome_step` etc.)
- ✅ Manual `sync_children` not `accepts_nested_attributes_for`
- ✅ `summary_facts` on User
- ✅ `times_divorced` / `times_widowed` as user-supplied counters, not derived
- ✅ Cascade-delete on Person when child is removed
- ✅ Co-parent type-change destroys prior ad-hoc Person + recreates
