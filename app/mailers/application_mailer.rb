class ApplicationMailer < ActionMailer::Base
  default from: ENV.fetch("MAIL_FROM", "T&G BnB <no-reply@tgbnb.test>")
  layout "mailer"
end
