# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

# Create default admin user for development
if Rails.env.development?
  user = User.find_or_initialize_by(email_address: "admin@kindling.local")
  user.assign_attributes(
    first_name: "Admin",
    last_name: "User",
    password: "Password12345",
    password_confirmation: "Password12345"
  )
  
  if user.save
    puts "✓ Created/updated admin user: admin@kindling.local / Password12345"
  else
    puts "✗ Error creating admin user: #{user.errors.full_messages.join(', ')}"
  end
end
