require "test_helper"

class UserTest < ActiveSupport::TestCase
  def build_user(**attrs)
    User.new({ name: "Sam Taylor", email: "sam@example.com", password: "password123" }.merge(attrs))
  end

  test "valid with name, email and password" do
    assert build_user.valid?
  end

  test "strips and lowercases email" do
    assert_equal "sam@example.com", build_user(email: "  Sam@Example.COM ").email
  end

  test "strips name" do
    assert_equal "Sam Taylor", build_user(name: "  Sam Taylor  ").name
  end

  test "rejects a duplicate email regardless of case" do
    user = build_user(email: "ADA@example.com")
    assert_not user.valid?
    assert_includes user.errors[:email], "is already registered"
  end

  test "requires a well-formed email" do
    assert_not build_user(email: "").valid?
    assert_not build_user(email: "not-an-email").valid?
  end

  test "requires a name of at most 100 characters" do
    assert_not build_user(name: "   ").valid?
    assert build_user(name: "a" * 100).valid?
    assert_not build_user(name: "a" * 101).valid?
  end

  test "requires a password of 8 to 72 characters" do
    assert_not build_user(password: nil).valid?
    assert_not build_user(password: "short12").valid?
    assert build_user(password: "a" * 8).valid?
    assert build_user(password: "a" * 72).valid?
    assert_not build_user(password: "a" * 73).valid?
  end

  test "database rejects a duplicate email even without validations" do
    assert_raises(ActiveRecord::RecordNotUnique) do
      build_user(email: "Ada@Example.com").save(validate: false)
    end
  end
end
