# In production Rails serves the React build on the same origin, so CORS is
# only needed when the Vite dev server (or another listed origin) calls the API.
# CORS_ORIGINS is a comma-separated list; it defaults to the Vite dev server.
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins(*ENV.fetch("CORS_ORIGINS", "http://localhost:5173").split(",").map(&:strip))

    resource "/api/*",
      headers: :any,
      methods: %i[get post put patch delete options head],
      credentials: true
  end
end
