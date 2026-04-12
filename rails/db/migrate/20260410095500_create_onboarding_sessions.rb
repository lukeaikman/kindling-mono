class CreateOnboardingSessions < ActiveRecord::Migration[8.1]
  def change
    create_table :onboarding_sessions do |t|
      t.string :token, null: false
      t.string :current_step
      t.datetime :intro_seen_at
      t.datetime :last_seen_at

      t.string :attribution_source
      t.string :campaign
      t.string :location_id
      t.text :raw_url
      t.integer :video_intro_version
      t.integer :risk_questionnaire_version
      t.string :first_show
      t.datetime :video_completed_at
      t.datetime :questionnaire_completed_at

      t.string :first_name
      t.string :middle_names
      t.string :last_name
      t.date :date_of_birth
      t.string :country_of_residence
      t.string :nationality
      t.string :domiciled_in_uk
      t.string :currently_resident_in_uk
      t.string :relationship_status
      t.string :divorce_status, null: false, default: "no"
      t.string :has_children
      t.string :spouse_first_name
      t.string :spouse_last_name
      t.text :children_payload
      t.string :parents_alive
      t.string :parents_in_law_alive
      t.string :siblings_alive
      t.integer :number_of_siblings
      t.datetime :completed_at

      t.timestamps
    end

    add_index :onboarding_sessions, :token, unique: true
    add_index :onboarding_sessions, :last_seen_at
  end
end
