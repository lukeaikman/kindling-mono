# Epic 5 — Asset Entry — roadmap

Tracker for sub-pieces of Epic 5. Full epic context in [NATIVE_TO_RAILS_EPICS.md](../NATIVE_TO_RAILS_EPICS.md#epic-5--asset-entry-by-asset-type-one-by-one).

Epic 5 is **not started**. Asset entry by type (one-by-one) — house, car, savings, important items, etc. Photo capture lands inside this epic (the deferred shell Phase J — camera bridge — folds in here so data model + capture UI ship together with shared product context).

**Status values**: `Not started`, `Planning`, `In progress`, `Shipped`, `Deferred`.

| Piece ID | Title | Summary | Status |
|---|---|---|---|
| 5.1 | Detailed plan | TBD when Epic 5 is picked up. Will define Asset model + category taxonomy + photo strategy. | Not started |
| 5.2 | Asset model + Active Storage | `Asset` with `has_many_attached :photos`. Cloud-storage decision (S3 vs disk). | Not started |
| 5.3 | Asset list + entry screens | Per-category entry forms, list views. | Not started |
| 5.4 | Camera bridge (ex-Phase J) | Native camera + library picker bridged into the asset entry flow. Replaces deferred shell Phase J. | Not started (subsumes [Epic 0 / Phase J](../epic-0-mobile-frontend-shell/phase-j-camera-bridge-deferred/)) |
| 5.5 | Photo upload pipeline | Direct upload vs multipart; client-side resize/compress. | Not started |
| 5.6 | Beneficiary allocation per asset | UI for assigning beneficiaries to specific assets. | Not started |

## How to use this roadmap

When Epic 5 starts, the camera-bridge planning artefacts already collected at [`../epic-0-mobile-frontend-shell/phase-j-camera-bridge-deferred/`](../epic-0-mobile-frontend-shell/phase-j-camera-bridge-deferred/) should move here under piece 5.4's subfolder.
