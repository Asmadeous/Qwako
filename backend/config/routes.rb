Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      resources :registrations, only: :create
      resource :session, only: %i[show create destroy]
      resource :profile, only: :update
      resource :password_reset, only: %i[create update]
      resources :listings, only: %i[index show]
      resources :bookings, only: %i[index show create] do
        post :cancel, on: :member
        resource :payment, only: :create do
          post :verify
        end
      end
      namespace :webhooks do
        resource :paystack, only: :create, controller: "paystack"
      end

      namespace :admin do
        resources :listings, only: %i[index show create update destroy]
        resources :categories, only: %i[index create update destroy]
        resources :amenities, only: %i[index create update destroy]
        resource :finances, only: :show
        resources :uploads, only: :create
        resources :bookings, only: %i[index show] do
          member do
            post :cancel
            post :mark_refunded
          end
        end
      end
    end
  end

  # Health check for load balancers and uptime monitors: 200 when the app boots.
  get "up" => "rails/health#show", as: :rails_health_check
end
