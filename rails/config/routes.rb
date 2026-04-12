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
    post "intro/continue", to: "startup#continue_intro", as: :intro_continue
    get "video-intro", to: "startup#video_intro", as: :video_intro
    get "risk-questionnaire", to: "startup#risk_questionnaire", as: :risk_questionnaire
    post "complete-video", to: "startup#complete_video", as: :complete_video
    post "complete-questionnaire", to: "startup#complete_questionnaire", as: :complete_questionnaire
    get "login", to: "sessions#new", as: :login
    post "login", to: "sessions#create"
    get "dashboard", to: "dashboard#show", as: :dashboard
    get "auth/secure-account", to: "auth#secure_account", as: :secure_account

    get "onboarding", to: "onboarding#index", as: :onboarding
    get "onboarding/welcome", to: "onboarding#welcome", as: :onboarding_welcome
    patch "onboarding/welcome", to: "onboarding#update_welcome"
    get "onboarding/location", to: "onboarding#location", as: :onboarding_location
    patch "onboarding/location", to: "onboarding#update_location"
    get "onboarding/family", to: "onboarding#family", as: :onboarding_family
    patch "onboarding/family", to: "onboarding#update_family"
    get "onboarding/extended-family", to: "onboarding#extended_family", as: :onboarding_extended_family
    patch "onboarding/extended-family", to: "onboarding#update_extended_family"
    get "onboarding/wrap-up", to: "onboarding#wrap_up", as: :onboarding_wrap_up
    post "onboarding/wrap-up/continue", to: "onboarding#continue_wrap_up", as: :onboarding_wrap_up_continue
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
