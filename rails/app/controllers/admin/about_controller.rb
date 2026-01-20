module Admin
  class AboutController < ApplicationController
    before_action :require_authentication
    
    def index
      # About page
    end
  end
end


