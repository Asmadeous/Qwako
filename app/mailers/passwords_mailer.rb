class PasswordsMailer < ApplicationMailer
  def reset(user, url)
    @user = user
    @url = url
    mail to: user.email, subject: "Reset your TG-Homes password"
  end
end
