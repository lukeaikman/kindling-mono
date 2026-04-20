module CookieTestHelper
  def write_signed_cookie(key, value)
    ActionDispatch::TestRequest.create.cookie_jar.tap do |jar|
      jar.signed[key] = value
      cookies[key.to_s] = jar[key]
    end
  end

  def read_signed_cookie(key)
    raw = cookies[key.to_s]
    return nil if raw.blank?

    jar = ActionDispatch::TestRequest.create.cookie_jar
    jar[key] = raw
    jar.signed[key]
  end
end

ActiveSupport.on_load(:action_dispatch_integration_test) do
  include CookieTestHelper
end
