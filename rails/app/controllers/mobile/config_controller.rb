module Mobile
  class ConfigController < ApplicationController
    allow_unauthenticated_access

    # Public unauthenticated endpoint hitting disk per request. Bounded so a
    # misbehaving / malicious client can't burn file IO in a loop. 60/min/IP
    # is ~generous for our one consumer (the iOS shell fetches once per cold
    # start) and well above normal headroom.
    rate_limit to: 60, within: 1.minute

    def show
      return head :not_found unless params[:resource] == "path_configuration"

      path = Rails.root.join("config/mobile/path_configuration.json")
      if stale?(etag: path, last_modified: path.mtime)
        render json: path.read
      end
    end
  end
end
