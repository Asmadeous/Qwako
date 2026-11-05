module ApiTestHelpers
  def sign_in_as(user, password: "password123")
    post api_v1_session_path, params: { email: user.email, password: }, as: :json
    assert_response :ok
  end

  def assert_error(status, code)
    assert_response status
    assert_equal code, response.parsed_body.dig("error", "code"), response.body
  end
end
