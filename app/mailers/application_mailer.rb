class ApplicationMailer < ActionMailer::Base
  default from: ENV.fetch("MAIL_FROM", "TG Homes <no-reply@tgbnb.test>")
  layout "mailer"
end
