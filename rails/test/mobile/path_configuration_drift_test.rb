# Requires the ios/ directory to be present in the working tree — don't
# exclude from CI checkouts if a future Rails-only Docker build lands.
require "test_helper"

class PathConfigurationDriftTest < ActiveSupport::TestCase
  CANONICAL = Rails.root.join("config/mobile/path_configuration.json")
  IOS_BUNDLED = Rails.root.join("../ios/Kindling/path-configuration.json")

  test "iOS bundled path_configuration is byte-identical to Rails canonical" do
    assert_equal CANONICAL.read, IOS_BUNDLED.read,
      "Rails canonical and iOS bundled path_configuration.json have diverged. Re-copy the Rails file into the iOS target."
  end

  test "every GET /mobile/* route has at least one matching path_configuration rule" do
    patterns = JSON.parse(CANONICAL.read).fetch("rules").flat_map { |r| r.fetch("patterns") }
    regexes = patterns.map { |p| Regexp.new(p) }

    # Only GET routes need path-config rules. POST/PATCH/DELETE endpoints
    # respond with redirects; the native shell path-configs the GET target,
    # never the form-submit verb itself.
    mobile_routes = Rails.application.routes.routes
      .select { |r| r.verb == "GET" }
      .map { |r| r.path.spec.to_s.sub("(.:format)", "") }
      .select { |path| path.start_with?("/mobile/") }

    # Exclude the config endpoint itself — it's shell → server, not
    # shell → user-facing page.
    mobile_routes -= ["/mobile/config/:resource.json", "/mobile/config/:resource"]

    unmatched = mobile_routes.reject { |path| regexes.any? { |re| path.match?(re) } }
    assert unmatched.empty?, "These GET /mobile/* routes have no matching path-config rule: #{unmatched.join(', ')}. Add a rule to rails/config/mobile/path_configuration.json (and ios/Kindling/path-configuration.json) in the same PR that added the route."
  end
end
