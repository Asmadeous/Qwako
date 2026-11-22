class AccountMailer < ApplicationMailer
  def verify_email(user, url)
    @user = user
    @url = url
    mail to: user.email, subject: "Confirm your email | T&G BnB"
  end

  def invitation(user, url, inviter)
    @user = user
    @url = url
    @inviter = inviter
    mail to: user.email, subject: "#{inviter.name} added you to the T&G BnB team"
  end
end
