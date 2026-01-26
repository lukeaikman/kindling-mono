class User < ApplicationRecord
  has_secure_password
  has_many :sessions, dependent: :destroy
  has_many :api_sessions, dependent: :destroy

  normalizes :email_address, with: ->(e) { e.strip.downcase }
  
  validates :first_name, presence: true
  validates :last_name, presence: true
  validates :email_address,
            presence: true,
            uniqueness: true,
            format: { with: /\A[^@\s]+@[^@\s]+\.[^@\s]+\z/ }
  validate :password_complexity, if: -> { password.present? }

  enum :status, { active: "active", locked: "locked", suspended: "suspended" }, default: "active"
  
  def full_name
    "#{first_name} #{last_name}".strip
  end

  private

  def password_complexity
    unless password.length >= 12 && password.match?(/[A-Za-z]/) && password.match?(/\d/)
      errors.add(:password, "must be at least 12 characters and include letters and numbers")
    end
  end
end
