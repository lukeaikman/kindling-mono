module Mobile
  class ConfigController < ApplicationController
    allow_unauthenticated_access

    def show
      return head :not_found unless params[:resource] == "path_configuration"

      path = Rails.root.join("config/mobile/path_configuration.json")
      if stale?(etag: path, last_modified: path.mtime)
        render json: path.read
      end
    end
  end
end
