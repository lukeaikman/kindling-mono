# Why Phase J (Camera bridge) is deferred

**Deferred**: 2026-04-25.

## Reasoning

Phase J was scoped on the assumption it was **parity work** — bring the existing photo-attach feature across from the React Native app. An audit of both the RN app and the kindling-api during lplan setup found the opposite:

- **RN app at `../native-app/`**: no camera/image-picker libs in `package.json`, no photo-attach UI on any screen, no "Take photo" / "Upload photo" strings anywhere. The asset-entry screen at `native-app/src/.../bequeathal/important-items/entry.tsx` captures title + beneficiaries + value only.
- **API at `../kindling-api/`**: Active Storage configured but unused — no `has_*_attached`, no upload routes, no attachment models.
- **Rails monorepo**: no `Asset` model, Epic 5 (which is *the* epic that introduces photos to the product) is unstarted.

So Phase J in isolation was building plumbing for a feature that doesn't exist on any platform, and verification ("attach to in-progress asset record") had nothing to attach to.

Building the camera bridge now would mean either:

- creating a throwaway `Asset` scaffold purely to exercise the bridge end-to-end, or
- shipping a bridge that sits dormant until Epic 5 catches up.

Both are wasted motion. Worse, product decisions about photos (single vs multi, client-side resize, cloud storage choice) would be made with no Epic 5 product context to anchor them.

## What's required to un-defer

Epic 5 (Asset Entry) starts. Camera capture lands inside Epic 5 alongside the Asset model, the photo-attach UI, and the storage decision — all defined together with shared product context.

## Picked-up procedure

1. When Epic 5 starts, move this folder's contents (including `00-input-2026-04-24.md` from the earlier lplan setup, this `why-deferred.md`, and any other artefacts) into a subfolder of [`../../epic-5-asset-entry/`](../../epic-5-asset-entry/) — likely `epic-5-asset-entry/asset-entry-camera-capture/` or similar, named in the context of Epic 5's piece taxonomy.
2. Update [Epic 0 roadmap](../epic-0-mobile-frontend-shell-roadmap.md) — change J's status note to "Subsumed into Epic 5" with a link to the new home.
3. Update [Epic 5 roadmap](../../epic-5-asset-entry/epic-5-asset-entry-roadmap.md) piece 5.4 status to `Planning` or `In progress`.
4. Drop the `-deferred` suffix is not relevant here — the folder itself relocates rather than reactivating.

## Artefacts in this folder

- `00-input-2026-04-24.md` — the original Phase J roadmap entry pulled in for an aborted lplan run on 2026-04-24. Kept for context when this work resumes inside Epic 5.
