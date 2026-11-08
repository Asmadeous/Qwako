Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      resources :registrations, only: :create
      resource :session, only: %i[show create destroy]
      resource :profile, only: :update
      resources :listings, only: %i[index show]
      resources :bookings, only: %i[index show create] do
        resource :payment, only: :create do
          post :verify
        end
      end
      namespace :webhooks do
        resource :paystack, only: :create, controller: "paystack"
      end

      namespace :admin do
        resources :listings, only: %i[index create update]
        resources :uploads, only: :create
      end
    end
  end

  # Health check for load balancers and uptime monitors: 200 when the app boots.
  get "up" => "rails/health#show", as: :rails_health_check
end
