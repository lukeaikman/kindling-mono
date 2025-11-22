Rails.application.routes.draw do
  mount Motor::Admin => '/motor_admin'
  # Authentication routes
  resource :session
  resources :passwords, param: :token
  
  # Admin routes
  namespace :admin do
    root "dashboard#index"
    get "dashboard", to: "dashboard#index"
    get "about", to: "about#index"
    resource :settings, only: [:edit, :update]
  end
  
  # Root redirects to admin dashboard (or login if not authenticated)
  root "admin/dashboard#index"
  
  # API routes (for future use)
  namespace :api do
    namespace :v1 do
      # API endpoints will go here
    end
  end

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check
end
