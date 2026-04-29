# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_04_29_120000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "api_sessions", force: :cascade do |t|
    t.datetime "access_expires_at", null: false
    t.string "access_token_digest", null: false
    t.datetime "created_at", null: false
    t.string "device_id"
    t.string "device_name"
    t.datetime "refresh_expires_at", null: false
    t.string "refresh_token_digest", null: false
    t.datetime "revoked_at"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["access_token_digest"], name: "index_api_sessions_on_access_token_digest", unique: true
    t.index ["refresh_expires_at"], name: "index_api_sessions_on_refresh_expires_at"
    t.index ["refresh_token_digest"], name: "index_api_sessions_on_refresh_token_digest", unique: true
    t.index ["user_id"], name: "index_api_sessions_on_user_id"
  end

  create_table "devices", force: :cascade do |t|
    t.string "apns_token", null: false
    t.datetime "created_at", null: false
    t.datetime "last_registered_at", null: false
    t.bigint "onboarding_session_id"
    t.string "platform", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.string "vendor_id"
    t.index ["apns_token"], name: "index_devices_on_apns_token", unique: true
    t.index ["onboarding_session_id"], name: "index_devices_on_onboarding_session_id"
    t.index ["user_id"], name: "index_devices_on_user_id"
    t.index ["vendor_id"], name: "index_devices_on_vendor_id", unique: true
  end

  create_table "marriages", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.date "ended_at"
    t.string "kind", null: false
    t.bigint "partner_person_id", null: false
    t.string "phase", default: "active", null: false
    t.date "started_at"
    t.datetime "updated_at", null: false
    t.bigint "will_maker_person_id", null: false
    t.index ["partner_person_id"], name: "index_marriages_on_partner_person_id"
    t.index ["will_maker_person_id", "partner_person_id"], name: "index_marriages_on_pair", unique: true
    t.index ["will_maker_person_id"], name: "index_marriages_on_active", unique: true, where: "((phase)::text = 'active'::text)"
    t.index ["will_maker_person_id"], name: "index_marriages_on_will_maker_person_id"
    t.check_constraint "will_maker_person_id <> partner_person_id", name: "marriages_distinct_persons"
  end

  create_table "motor_alert_locks", force: :cascade do |t|
    t.bigint "alert_id", null: false
    t.datetime "created_at", null: false
    t.string "lock_timestamp", null: false
    t.datetime "updated_at", null: false
    t.index ["alert_id", "lock_timestamp"], name: "index_motor_alert_locks_on_alert_id_and_lock_timestamp", unique: true
    t.index ["alert_id"], name: "index_motor_alert_locks_on_alert_id"
  end

  create_table "motor_alerts", force: :cascade do |t|
    t.bigint "author_id"
    t.string "author_type"
    t.datetime "created_at", null: false
    t.datetime "deleted_at"
    t.text "description"
    t.boolean "is_enabled", default: true, null: false
    t.string "name", null: false
    t.text "preferences", null: false
    t.bigint "query_id", null: false
    t.text "to_emails", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "motor_alerts_name_unique_index", unique: true, where: "(deleted_at IS NULL)"
    t.index ["query_id"], name: "index_motor_alerts_on_query_id"
    t.index ["updated_at"], name: "index_motor_alerts_on_updated_at"
  end

  create_table "motor_api_configs", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "credentials", null: false
    t.datetime "deleted_at"
    t.text "description"
    t.string "name", null: false
    t.text "preferences", null: false
    t.datetime "updated_at", null: false
    t.string "url", null: false
    t.index ["name"], name: "motor_api_configs_name_unique_index", unique: true, where: "(deleted_at IS NULL)"
  end

  create_table "motor_audits", force: :cascade do |t|
    t.string "action"
    t.string "associated_id"
    t.string "associated_type"
    t.string "auditable_id"
    t.string "auditable_type"
    t.text "audited_changes"
    t.text "comment"
    t.datetime "created_at"
    t.string "remote_address"
    t.string "request_uuid"
    t.bigint "user_id"
    t.string "user_type"
    t.string "username"
    t.bigint "version", default: 0
    t.index ["associated_type", "associated_id"], name: "motor_auditable_associated_index"
    t.index ["auditable_type", "auditable_id", "version"], name: "motor_auditable_index"
    t.index ["created_at"], name: "index_motor_audits_on_created_at"
    t.index ["request_uuid"], name: "index_motor_audits_on_request_uuid"
    t.index ["user_id", "user_type"], name: "motor_auditable_user_index"
  end

  create_table "motor_configs", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "key", null: false
    t.datetime "updated_at", null: false
    t.text "value", null: false
    t.index ["key"], name: "index_motor_configs_on_key", unique: true
    t.index ["updated_at"], name: "index_motor_configs_on_updated_at"
  end

  create_table "motor_dashboards", force: :cascade do |t|
    t.bigint "author_id"
    t.string "author_type"
    t.datetime "created_at", null: false
    t.datetime "deleted_at"
    t.text "description"
    t.text "preferences", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["title"], name: "motor_dashboards_title_unique_index", unique: true, where: "(deleted_at IS NULL)"
    t.index ["updated_at"], name: "index_motor_dashboards_on_updated_at"
  end

  create_table "motor_forms", force: :cascade do |t|
    t.string "api_config_name", null: false
    t.text "api_path", null: false
    t.bigint "author_id"
    t.string "author_type"
    t.datetime "created_at", null: false
    t.datetime "deleted_at"
    t.text "description"
    t.string "http_method", null: false
    t.string "name", null: false
    t.text "preferences", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "motor_forms_name_unique_index", unique: true, where: "(deleted_at IS NULL)"
    t.index ["updated_at"], name: "index_motor_forms_on_updated_at"
  end

  create_table "motor_note_tag_tags", force: :cascade do |t|
    t.bigint "note_id", null: false
    t.bigint "tag_id", null: false
    t.index ["note_id", "tag_id"], name: "motor_note_tags_note_id_tag_id_index", unique: true
    t.index ["tag_id"], name: "index_motor_note_tag_tags_on_tag_id"
  end

  create_table "motor_note_tags", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "motor_note_tags_name_unique_index", unique: true
  end

  create_table "motor_notes", force: :cascade do |t|
    t.bigint "author_id"
    t.string "author_type"
    t.text "body"
    t.datetime "created_at", null: false
    t.datetime "deleted_at"
    t.string "record_id", null: false
    t.string "record_type", null: false
    t.datetime "updated_at", null: false
    t.index ["author_id", "author_type"], name: "motor_notes_author_id_author_type_index"
    t.index ["record_id", "record_type"], name: "motor_notes_record_id_record_type_index"
  end

  create_table "motor_notifications", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description"
    t.bigint "recipient_id", null: false
    t.string "recipient_type", null: false
    t.string "record_id"
    t.string "record_type"
    t.string "status", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["recipient_id", "recipient_type"], name: "motor_notifications_recipient_id_recipient_type_index"
    t.index ["record_id", "record_type"], name: "motor_notifications_record_id_record_type_index"
  end

  create_table "motor_queries", force: :cascade do |t|
    t.bigint "author_id"
    t.string "author_type"
    t.datetime "created_at", null: false
    t.datetime "deleted_at"
    t.text "description"
    t.string "name", null: false
    t.text "preferences", null: false
    t.text "sql_body", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "motor_queries_name_unique_index", unique: true, where: "(deleted_at IS NULL)"
    t.index ["updated_at"], name: "index_motor_queries_on_updated_at"
  end

  create_table "motor_reminders", force: :cascade do |t|
    t.bigint "author_id", null: false
    t.string "author_type", null: false
    t.datetime "created_at", null: false
    t.bigint "recipient_id", null: false
    t.string "recipient_type", null: false
    t.string "record_id"
    t.string "record_type"
    t.datetime "scheduled_at", null: false
    t.datetime "updated_at", null: false
    t.index ["author_id", "author_type"], name: "motor_reminders_author_id_author_type_index"
    t.index ["recipient_id", "recipient_type"], name: "motor_reminders_recipient_id_recipient_type_index"
    t.index ["record_id", "record_type"], name: "motor_reminders_record_id_record_type_index"
    t.index ["scheduled_at"], name: "index_motor_reminders_on_scheduled_at"
  end

  create_table "motor_resources", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.text "preferences", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_motor_resources_on_name", unique: true
    t.index ["updated_at"], name: "index_motor_resources_on_updated_at"
  end

  create_table "motor_taggable_tags", force: :cascade do |t|
    t.bigint "tag_id", null: false
    t.bigint "taggable_id", null: false
    t.string "taggable_type", null: false
    t.index ["tag_id"], name: "index_motor_taggable_tags_on_tag_id"
    t.index ["taggable_id", "taggable_type", "tag_id"], name: "motor_polymorphic_association_tag_index", unique: true
  end

  create_table "motor_tags", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "motor_tags_name_unique_index", unique: true
  end

  create_table "onboarding_sessions", force: :cascade do |t|
    t.string "attribution_source"
    t.string "campaign"
    t.text "children_payload"
    t.datetime "completed_at"
    t.string "country_of_residence"
    t.datetime "created_at", null: false
    t.string "current_step"
    t.string "currently_resident_in_uk"
    t.date "date_of_birth"
    t.string "divorce_status", default: "no", null: false
    t.string "domiciled_in_uk"
    t.string "first_name"
    t.string "first_show"
    t.string "has_children"
    t.datetime "intro_seen_at"
    t.string "last_name"
    t.datetime "last_seen_at"
    t.string "location_id"
    t.string "middle_names"
    t.string "nationality"
    t.integer "number_of_siblings"
    t.string "parents_alive"
    t.string "parents_in_law_alive"
    t.date "partner_started_at"
    t.datetime "questionnaire_completed_at"
    t.text "raw_url"
    t.string "relationship_status"
    t.integer "risk_questionnaire_version"
    t.string "siblings_alive"
    t.string "spouse_first_name"
    t.string "spouse_last_name"
    t.integer "times_divorced", default: 0, null: false
    t.integer "times_widowed", default: 0, null: false
    t.string "token", null: false
    t.datetime "updated_at", null: false
    t.datetime "video_completed_at"
    t.integer "video_intro_version"
    t.index ["last_seen_at"], name: "index_onboarding_sessions_on_last_seen_at"
    t.index ["token"], name: "index_onboarding_sessions_on_token", unique: true
  end

  create_table "parentages", force: :cascade do |t|
    t.bigint "child_person_id", null: false
    t.datetime "created_at", null: false
    t.string "kind", null: false
    t.bigint "parent_person_id", null: false
    t.integer "position", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["child_person_id"], name: "index_parentages_on_child_person_id"
    t.index ["parent_person_id", "child_person_id"], name: "index_parentages_on_parent_person_id_and_child_person_id", unique: true
    t.index ["parent_person_id", "position"], name: "index_parentages_on_parent_person_id_and_position"
    t.index ["parent_person_id"], name: "index_parentages_on_parent_person_id"
    t.check_constraint "parent_person_id <> child_person_id", name: "parentages_distinct_persons"
  end

  create_table "people", force: :cascade do |t|
    t.string "address_line_1"
    t.string "address_line_2"
    t.string "city"
    t.string "country_of_residence"
    t.datetime "created_at", null: false
    t.string "currently_resident_in_uk"
    t.date "date_of_birth"
    t.boolean "disabled", default: false, null: false
    t.string "domiciled_in_uk"
    t.string "email"
    t.string "first_name"
    t.boolean "lacks_mental_capacity", default: false, null: false
    t.string "last_name"
    t.string "middle_names"
    t.string "nationality"
    t.integer "number_of_siblings"
    t.string "parents_alive"
    t.string "parents_in_law_alive"
    t.string "phone"
    t.integer "position", default: 0, null: false
    t.string "postcode"
    t.string "relationship_kind", default: "other", null: false
    t.string "siblings_alive"
    t.integer "times_divorced", default: 0, null: false
    t.integer "times_widowed", default: 0, null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["user_id"], name: "index_people_on_user_id"
    t.index ["user_id"], name: "index_people_on_user_spouse", unique: true, where: "((relationship_kind)::text = 'spouse'::text)"
    t.index ["user_id"], name: "index_people_on_user_will_maker", unique: true, where: "((relationship_kind)::text = 'self'::text)"
  end

  create_table "sessions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "ip_address"
    t.datetime "updated_at", null: false
    t.string "user_agent"
    t.bigint "user_id", null: false
    t.index ["user_id"], name: "index_sessions_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "attribution_source"
    t.string "campaign"
    t.datetime "completed_at"
    t.datetime "created_at", null: false
    t.string "current_step"
    t.string "email_address"
    t.integer "failed_login_count", default: 0, null: false
    t.string "first_name"
    t.string "first_show"
    t.datetime "intro_seen_at"
    t.string "last_name"
    t.datetime "last_seen_at"
    t.datetime "locked_until"
    t.string "password_digest"
    t.string "phone"
    t.datetime "questionnaire_completed_at"
    t.text "raw_url"
    t.integer "risk_questionnaire_version"
    t.string "status", default: "active", null: false
    t.string "token_digest"
    t.datetime "updated_at", null: false
    t.datetime "video_completed_at"
    t.integer "video_intro_version"
    t.bigint "will_maker_person_id"
    t.index ["email_address"], name: "index_users_on_email_address_when_set", unique: true, where: "(email_address IS NOT NULL)"
    t.index ["token_digest"], name: "index_users_on_token_digest", unique: true
    t.index ["will_maker_person_id"], name: "index_users_on_will_maker_person_id"
  end

  create_table "wills", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "finalized_at"
    t.string "status", default: "draft", null: false
    t.bigint "supersedes_id"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.integer "version", default: 1, null: false
    t.index ["supersedes_id"], name: "index_wills_on_supersedes_id"
    t.index ["user_id", "version"], name: "index_wills_on_user_id_and_version", unique: true
    t.index ["user_id"], name: "index_wills_on_active", unique: true, where: "((status)::text = 'active'::text)"
    t.index ["user_id"], name: "index_wills_on_user_id"
  end

  add_foreign_key "api_sessions", "users"
  add_foreign_key "devices", "onboarding_sessions"
  add_foreign_key "devices", "users"
  add_foreign_key "marriages", "people", column: "partner_person_id"
  add_foreign_key "marriages", "people", column: "will_maker_person_id"
  add_foreign_key "motor_alert_locks", "motor_alerts", column: "alert_id"
  add_foreign_key "motor_alerts", "motor_queries", column: "query_id"
  add_foreign_key "motor_note_tag_tags", "motor_note_tags", column: "tag_id"
  add_foreign_key "motor_note_tag_tags", "motor_notes", column: "note_id"
  add_foreign_key "motor_taggable_tags", "motor_tags", column: "tag_id"
  add_foreign_key "parentages", "people", column: "child_person_id"
  add_foreign_key "parentages", "people", column: "parent_person_id"
  add_foreign_key "people", "users"
  add_foreign_key "sessions", "users"
  add_foreign_key "users", "people", column: "will_maker_person_id"
  add_foreign_key "wills", "users"
  add_foreign_key "wills", "wills", column: "supersedes_id"
end
