class AccountMailer < ApplicationMailer
  # Sent once, when the account is made. Email sign-ups also get the button to
  # confirm their address; Google sign-ups are confirmed already.
  def welcome(user, confirm_url: nil)
    @user = user
    @confirm_url = confirm_url
    @homes_url = "#{Notify.app_url}/homes"
    @account_url = "#{Notify.app_url}/account"
    mail to: user.email, subject: "Welcome to TG-Homes"
  end

  def verify_email(user, url)
    @user = user
    @url = url
    mail to: user.email, subject: "Confirm your email | TG-Homes"
  end

  def invitation(user, url, inviter)
    @user = user
    @url = url
    @inviter = inviter
    mail to: user.email, subject: "#{inviter.name} added you to the TG-Homes team"
  end
end
