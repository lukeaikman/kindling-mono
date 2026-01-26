class CreateApiSessions < ActiveRecord::Migration[8.1]
  def change
    create_table :api_sessions do |t|
      t.references :user, null: false, foreign_key: true
      t.string :access_token_digest, null: false
      t.string :refresh_token_digest, null: false
      t.datetime :access_expires_at, null: false
      t.datetime :refresh_expires_at, null: false
      t.datetime :revoked_at
      t.string :device_id
      t.string :device_name

      t.timestamps
    end

    add_index :api_sessions, :access_token_digest, unique: true
    add_index :api_sessions, :refresh_token_digest, unique: true
    add_index :api_sessions, :refresh_expires_at
  end
end
class CreateApiSessions < ActiveRecord::Migration[8.1]
  def change
    create_table :api_sessions do |t|
      t.references :user, null: false, foreign_key: true
      t.string :access_token_digest, null: false
      t.string :refresh_token_digest, null: false
      t.datetime :access_expires_at, null: false
      t.datetime :refresh_expires_at, null: false
      t.datetime :revoked_at
      t.string :device_id
      t.string :device_name

      t.timestamps
    end

    add_index :api_sessions, :access_token_digest, unique: true
    add_index :api_sessions, :refresh_token_digest, unique: true
    add_index :api_sessions, :refresh_expires_at
  end
end
