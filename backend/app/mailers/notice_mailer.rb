# One plain email for anything Notify tells someone: a title, a line or two
# and a link to the page about it.
class NoticeMailer < ApplicationMailer
  def notice(user, subject:, body:, url:)
    @user = user
    @body = body
    @url = url
    mail to: user.email, subject: "#{subject} | T&G BnB"
  end
end
