class AddPartnerAndDivorceCountersToOnboardingSessions < ActiveRecord::Migration[8.1]
  def change
    # `partner_started_at`: wedding date / civil-partnership date / cohabitation
    # start date — single column, label adapts in the view based on relationship_status.
    # Required when `relationship_status = "cohabiting"` (IH(PFD)A 1975 2-year claim
    # eligibility), optional otherwise.
    add_column :onboarding_sessions, :partner_started_at, :date

    # `times_divorced` / `times_widowed`: integer counters. Replace the prior
    # divorce_status enum (kept on the schema for now, will drop in Wave 2).
    add_column :onboarding_sessions, :times_divorced, :integer, null: false, default: 0
    add_column :onboarding_sessions, :times_widowed, :integer, null: false, default: 0
  end
end
