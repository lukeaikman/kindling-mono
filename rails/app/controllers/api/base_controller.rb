module Api
  class BaseController < ActionController::API
    # Include authentication for API (will use token-based in future)
    include Authentication
    
    # Skip CSRF for API requests
    # API authentication will use tokens instead of sessions
  end
end


