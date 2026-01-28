class ApiSession < ApplicationRecord
  belongs_to :user

  scope :active, -> { where(revoked_at: nil).where("refresh_expires_at > ?", Time.current) }

  def self.issue_for(user:, device_id:, device_name: nil)
    transaction do
      where(user_id: user.id, revoked_at: nil).update_all(revoked_at: Time.current)

      session, access_token, refresh_token = build_session_for(
        user: user,
        device_id: device_id,
        device_name: device_name
      )

      [session, access_token, refresh_token]
    end
  end

  def active?
    revoked_at.nil? && refresh_expires_at.future?
  end

  def revoked?
    revoked_at.present?
  end

  def expired?
    refresh_expires_at <= Time.current
  end

  def access_expired?
    access_expires_at <= Time.current
  end

  def refresh_expired?
    refresh_expires_at <= Time.current
  end

  def revoke!
    update!(revoked_at: Time.current)
  end

  def self.find_by_access_token(token)
    return if token.blank?

    find_by(access_token_digest: digest(token))
  end

  def self.find_by_refresh_token(token)
    return if token.blank?

    find_by(refresh_token_digest: digest(token))
  end

  def self.rotate_for(session)
    transaction do
      session.update!(revoked_at: Time.current)
      build_session_for(
        user: session.user,
        device_id: session.device_id,
        device_name: session.device_name
      )
    end
  end

  def self.generate_token
    SecureRandom.hex(32)
  end

  def self.digest(token)
    OpenSSL::Digest::SHA256.hexdigest(token)
  end

  def self.build_session_for(user:, device_id:, device_name: nil)
    access_token = generate_token
    refresh_token = generate_token
    access_expires_at = 30.minutes.from_now
    refresh_expires_at = 90.days.from_now

    session = create!(
      user: user,
      access_token_digest: digest(access_token),
      refresh_token_digest: digest(refresh_token),
      access_expires_at: access_expires_at,
      refresh_expires_at: refresh_expires_at,
      device_id: device_id,
      device_name: device_name
    )

    [session, access_token, refresh_token]
  end
end
