module Admin
  class DashboardController < ApplicationController
    before_action :require_authentication
    
    def index
      # Dashboard landing page
    end
  end
end

