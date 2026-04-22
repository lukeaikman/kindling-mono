# Pre-launch TODO

Items deferred during phase work that MUST be addressed before the app ships to TestFlight / production. Each entry: what, why, rough effort, origin phase.

## Cache-Control header on `Mobile::ConfigController#show`

**What**: add `expires_in` or explicit `Cache-Control` header to the `path_configuration.json` response so CDNs and proxies can cache-and-revalidate.

```ruby
def show
  return head :not_found unless params[:resource] == "path_configuration"

  path = Rails.root.join("config/mobile/path_configuration.json")
  expires_in 5.minutes, public: true, must_revalidate: true
  if stale?(etag: path, last_modified: path.mtime)
    render json: path.read
  end
end
```

**Why**: Phase C's `stale?` sets `ETag` and `Last-Modified` but no `Cache-Control`. A Rails-direct client (URLSession) respects ETag/Last-Modified anyway. A Cloudflare / Fastly / nginx layer in front of production would not know how to cache the response without `Cache-Control: public, max-age=...`. Adding it reduces origin load once real traffic hits.

**Effort**: 1 line. Add a request spec that asserts `Cache-Control` is present.

**Origin**: Phase C detail plan (§1.2 ConfigController). Deferred because no CDN fronts the dev environment and Phase C's scope doesn't include production infrastructure tuning.

---

<!-- Add new entries below as they land. Keep each self-contained: what, why, effort, origin. -->
