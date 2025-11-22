class ApplicationController < ActionController::Base
  include Authentication
  
  # Only for HTML requests (admin UI)
  protect_from_forgery with: :exception
end
