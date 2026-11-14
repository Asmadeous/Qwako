Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      resources :registrations, only: :create
      resource :session, only: %i[show create destroy]
      resource :google_session, only: :create
      resource :profile, only: %i[update destroy] do
        get :export
      end
      resource :email_verification, only: %i[create update]
      resource :password_reset, only: %i[create update]
      resources :contact_messages, only: :create
      resources :listings, only: %i[index show]
      resources :saved_listings, only: %i[index create destroy], param: :listing_id
      resources :bookings, only: %i[index show create] do
        member do
          post :cancel
          post :reschedule
        end
        resource :review, only: :create
        resource :payment, only: :create do
          post :verify
        end
      end
      resources :conversations, only: %i[index show create] do
        resources :messages, only: :create
      end
      resources :notifications, only: :index do
        post :read, on: :member
        post :read_all, on: :collection
      end
      namespace :webhooks do
        resource :paystack, only: :create, controller: "paystack"
      end

      namespace :admin do
        resource :overview, only: :show, controller: "overview"
        resource :calendar, only: :show, controller: "calendar"
        resources :listings, only: %i[index show create update destroy] do
          resources :blocks, only: :create
        end
        resources :blocks, only: :destroy
        resources :categories, only: %i[index create update destroy]
        resources :amenities, only: %i[index create update destroy]
        resource :finances, only: :show
        resources :uploads, only: :create
        resources :bookings, only: %i[index show] do
          member do
            post :cancel
            post :mark_refunded
            post :refund
            post :accept
            post :decline
            post :reschedule
          end
        end
        resources :guests, only: %i[index show]
        resources :conversations, only: %i[index show create] do
          resources :messages, only: :create
        end
        resources :contact_messages, only: :index do
          post :handle, on: :member
        end
        resources :reviews, only: %i[index update]
        resources :staff, only: %i[index create destroy]
        resources :audit_logs, only: :index
      end
    end
  end

  # Health check for load balancers and uptime monitors: 200 when the app boots.
  get "up" => "rails/health#show", as: :rails_health_check
end
