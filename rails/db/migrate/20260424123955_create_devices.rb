class CreateDevices < ActiveRecord::Migration[8.1]
  def change
    create_table :devices do |t|
      t.string :apns_token, null: false
      t.string :platform, null: false
      t.references :onboarding_session, foreign_key: true
      t.references :user, foreign_key: true
      t.datetime :last_registered_at, null: false

      t.timestamps
    end
    add_index :devices, :apns_token, unique: true
  end
end
