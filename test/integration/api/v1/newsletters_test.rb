require "test_helper"

class Api::V1::NewslettersTest < ActionDispatch::IntegrationTest
  include ActionMailer::TestHelper

  def token_from(mail, path)
    CGI.unescape(mail.text_part.body.to_s[%r{#{path}\?token=(\S+)}, 1])
  end

  test "a visitor signs up, confirms, gets a newsletter and unsubscribes" do
    assert_enqueued_emails(1) { post api_v1_newsletter_subscription_path, params: { email: " Reader@Example.com " }, as: :json }
    assert_response :accepted
    perform_enqueued_jobs
    confirm_mail = ActionMailer::Base.deliveries.last
    assert_equal [ "reader@example.com" ], confirm_mail.to

    # Not confirmed yet: not a recipient.
    assert_not_includes Newsletter.recipient_emails, "reader@example.com"
    post confirm_api_v1_newsletter_subscription_path, params: { token: token_from(confirm_mail, "/newsletter/confirm") }, as: :json
    assert_response :no_content
    assert_includes Newsletter.recipient_emails, "reader@example.com"

    newsletter = Newsletter.create!(subject: "December at the farm", body: "First paragraph.\n\nSecond <b>paragraph</b>.")
    sign_in_as users(:owner)
    post deliver_api_v1_admin_newsletter_path(newsletter), as: :json
    assert_response :ok
    perform_enqueued_jobs

    issue = ActionMailer::Base.deliveries.find { |m| m.to == [ "reader@example.com" ] && m.subject == "December at the farm" }
    assert issue
    assert_includes issue.html_part.body.to_s, "Second &lt;b&gt;paragraph&lt;/b&gt;."
    assert_match %r{/api/v1/newsletter_subscription/unsubscribe\?token=}, issue["List-Unsubscribe"].to_s
    assert_equal "List-Unsubscribe=One-Click", issue["List-Unsubscribe-Post"].to_s
    assert_equal Newsletter.recipient_emails.size, newsletter.reload.recipients_count

    post unsubscribe_api_v1_newsletter_subscription_path, params: { token: token_from(issue, "/newsletter/unsubscribe") }, as: :json
    assert_response :no_content
    assert_not_includes Newsletter.recipient_emails, "reader@example.com"
  end

  test "guests who turned on offers and news get it, and unsubscribing turns that off" do
    users(:ada).update!(marketing_consent_at: Time.current)
    assert_includes Newsletter.recipient_emails, users(:ada).email
    assert_not_includes Newsletter.recipient_emails, users(:grace).email

    post unsubscribe_api_v1_newsletter_subscription_path, params: { token: Newsletter.token_for(users(:ada).email, :unsubscribe) }, as: :json
    assert_nil users(:ada).reload.marketing_consent_at
  end

  test "a bad or reused-purpose token is refused" do
    post confirm_api_v1_newsletter_subscription_path, params: { token: Newsletter.token_for("x@example.com", :unsubscribe) }, as: :json
    assert_error :unprocessable_content, "invalid_token"
  end

  test "the owner writes a draft, sends a test, and can't send it twice" do
    users(:ada).update!(marketing_consent_at: Time.current)
    sign_in_as users(:owner)
    post api_v1_admin_newsletters_path, params: { newsletter: { subject: "", body: "" } }, as: :json
    assert_response :unprocessable_content

    post api_v1_admin_newsletters_path, params: { newsletter: { subject: "News", body: "Hello" } }, as: :json
    assert_response :created
    id = response.parsed_body.dig("newsletter", "id")

    assert_enqueued_emails(1) { post test_api_v1_admin_newsletter_path(id), as: :json }
    post deliver_api_v1_admin_newsletter_path(id), as: :json
    assert_response :ok
    post deliver_api_v1_admin_newsletter_path(id), as: :json
    assert_error :unprocessable_content, "already_sent"
    patch api_v1_admin_newsletter_path(id), params: { newsletter: { subject: "Changed" } }, as: :json
    assert_error :unprocessable_content, "already_sent"

    get api_v1_admin_newsletters_path, as: :json
    assert_equal 1, response.parsed_body.dig("audience", "guests")
  end

  test "guests can't reach the newsletter admin" do
    sign_in_as users(:ada)
    get api_v1_admin_newsletters_path, as: :json
    assert_response :forbidden
  end
end
