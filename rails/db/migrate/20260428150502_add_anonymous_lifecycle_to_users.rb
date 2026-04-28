# Wave 2 Commit 1, migration 2/8.
#
# Anonymous-User lifecycle + attribution columns previously held by
# `onboarding_sessions`. Cookie carries plaintext token; DB stores
# token_digest only (Q1: defence-in-depth against DB exfiltration).
class AddAnonymousLifecycleToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :token_digest, :string
    add_index :users, :token_digest, unique: true

    add_column :users, :current_step, :string
    add_column :users, :intro_seen_at, :datetime
    add_column :users, :last_seen_at, :datetime
    add_column :users, :completed_at, :datetime

    add_column :users, :attribution_source, :string
    add_column :users, :campaign, :string
    add_column :users, :raw_url, :text
    add_column :users, :first_show, :string
    add_column :users, :video_intro_version, :integer
    add_column :users, :risk_questionnaire_version, :integer
    add_column :users, :video_completed_at, :datetime
    add_column :users, :questionnaire_completed_at, :datetime
  end
end
