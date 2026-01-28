module Api
  class BaseController < ActionController::API
    # API controllers use token auth (no cookie sessions).

    def self.allow_unauthenticated_access(**_options)
      # No-op placeholder for API controllers.
    end
  end
end


