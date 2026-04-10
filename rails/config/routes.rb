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

  namespace :mobile do
    root "startup#index"
    get "open", to: "startup#open"
    get "intro", to: "startup#intro"
    get "video-intro", to: "startup#video_intro", as: :video_intro
    get "risk-questionnaire", to: "startup#risk_questionnaire", as: :risk_questionnaire
    post "complete-video", to: "startup#complete_video", as: :complete_video
    post "complete-questionnaire", to: "startup#complete_questionnaire", as: :complete_questionnaire
  end
  
  # API routes (for future use)
  namespace :api do
    namespace :v1 do
      post "auth/register", to: "auth#register"
      post "auth/register/validate-email", to: "auth#validate_email"
      post "auth/login", to: "auth#login"
      post "auth/logout", to: "auth#logout"
      get "auth/session/validate", to: "auth#session_validate"
      post "auth/session/refresh", to: "auth#session_refresh"
      get "auth/user/profile", to: "auth#profile"
    end
  end

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check
end
