# Origins allowed to call the API with credentials in addition to the site's
# own origin. Production serves the client from Rails, so it needs none;
# development defaults to the Vite dev server. CORS_ORIGINS is comma-separated.
module CorsOrigins
  def self.allowed
    @allowed ||= ENV.fetch("CORS_ORIGINS") { Rails.env.production? ? "" : "http://localhost:5173" }
      .split(",").map(&:strip).reject(&:empty?).freeze
  end
end

if CorsOrigins.allowed.any?
  Rails.application.config.middleware.insert_before 0, Rack::Cors do
    allow do
      origins(*CorsOrigins.allowed)

      resource "/api/*",
        headers: :any,
        methods: %i[get post put patch delete options head],
        credentials: true
    end
  end
end
