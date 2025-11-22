class User < ApplicationRecord
  has_secure_password
  has_many :sessions, dependent: :destroy

  normalizes :email_address, with: ->(e) { e.strip.downcase }
  
  validates :first_name, presence: true
  validates :last_name, presence: true
  validates :email_address, presence: true
  
  def full_name
    "#{first_name} #{last_name}".strip
  end
end
