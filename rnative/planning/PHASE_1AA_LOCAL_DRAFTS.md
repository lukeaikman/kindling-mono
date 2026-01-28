## Phase 1aa: Local Drafts + User Scoping (Pre-Registration)

### Goal
Enable offline-first drafting before registration, then attach all records to the server user ID at the forced registration gate. Prevent cross-user data leakage on shared devices.

### Scope
1. Allow users to draft locally without registration.
2. Associate all draft data with a **local draft identity**.
3. Force registration after onboarding to sync data to the server (online required).
4. Introduce **user-scoped local storage** so multiple users don’t see each other’s data.
5. Defer FaceID protection of drafts to Phase 1b (as agreed).

---

### Why this is needed
Current local storage uses global keys (no per-user scope), so any new user can see another user’s data. This is not acceptable once multi-user is introduced.

---

### Key Design Decisions
- **Do not store passwords offline.**
- Allow users to continue drafting offline and prompt them to register when online.
- A local draft can be reopened without authentication in Phase 1aa.
- In Phase 1b, gate draft access behind FaceID.
- Use **serverId on Person** (not on other entities in Phase 1aa) instead of replacing local IDs.
- Initial sync should be a **single backend endpoint** that handles ordering and returns ID mappings.
- Conflict strategy: **last edited wins** (multi-device offline drafts are not expected).

---

### Data Model Additions
#### 1) Draft identity
Introduce `draftUserId` (UUID) used before registration:
- Stored locally in SecureStore or AsyncStorage
- Used as the owner ID for all draft data

#### 2) User-scoped storage keys
Namespace all storage keys with `ownerId`, where `ownerId` can be:
- `draftUserId` (pre-registration)
- `serverUserId` (after registration)

Example:
```
kindling:<ownerId>:will-data
kindling:<ownerId>:person-data
kindling:<ownerId>:bequeathal-data
```

#### 3) Person object enhancements
Add optional fields:
- `serverId?: string`
- `isDraft?: boolean`

This allows the will-maker `Person` to map to a server identity later, without breaking local references.

---

### Registration Gate + Sync Flow (Draft → Registered)
1. User completes onboarding and reaches “Secure your will”.
2. If offline:
   - keep draft local
   - show “Connect to finish registration” gating message
3. When online registration succeeds:
   - server returns `userId`
   - send **single initial-sync payload** (user + people + will + relationships)
   - update `Person.serverId` for all created people
   - update `WillData.userId` to the server-mapped Person ID
4. Future loads use `serverUserId` namespace

---

### Multi-user Device Support
On logout:
- Either clear local data (single-user mode), or
- Switch to another `ownerId` (multi-profile mode)

In Phase 1aa we assume **single active profile**, but storage must be user-scoped for safe future multi-profile.

---

### Phase 1aa Deliverables
- Draft owner ID management (create/restore)
- User-scoped storage keys
- Initial sync payload builder + response handler (Person.serverId + will-maker mapping only)
- Update `useAppState` to accept scoped storage keys
- Update `Person` model + `WillData.userId` handling
- Offline/online messaging (see below)

---

### Invariants (explicit)
1. `Person.id` never changes locally.
2. `Person.serverId` is only set after a successful initial sync.
3. `WillData.userId` always points to the local will-maker `Person.id`.

---

### Offline/Online Messaging
- **Offline at registration gate:** “You can keep drafting offline. To secure and sync your will, please connect to the internet to create an account.”
- **Offline on app open with draft:** “You’re offline. Your draft is saved locally on this device.”

---

### Testing (must-have)
- Offline draft persists across app restart
- Offline draft remains accessible without auth (Phase 1aa)
- Registration online attaches serverId to all people and updates WillData.userId
- Single initial-sync endpoint returns mappings and success flag
- Last edited wins on conflict (if ever encountered)
- Logout switches/clears scoped data correctly

---

### Out of Scope (Phase 1aa)
- FaceID / biometric gating of draft (Phase 1b)
- Multi-profile UI (beyond scoped storage keys)
- Server-side draft sync retries / conflict resolution
- Offline sync queue / retry tooling
- serverId fields on non-Person entities

Reviewed
