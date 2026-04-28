# Wave 2 transitional config.
#
# `support_unencrypted_data = true` lets the app read rows whose encrypted
# columns still hold plaintext (test fixtures, legacy admin User rows that
# pre-date the `encrypts` declaration on User#email_address). New writes
# always encrypt; reads succeed regardless of whether the bytes happen to
# be encrypted or plaintext.
#
# Before public launch we MUST flip this to false and re-encrypt any
# remaining plaintext rows. Tracked in `planning/PRE_LAUNCH_TODO.md` under
# "Active Record encryption mode audit".
Rails.application.config.active_record.encryption.support_unencrypted_data = true

# `extend_queries = true` rewrites `where(encrypted_attr: x)` to also match
# plaintext rows. Without this, fixture-loaded rows (whose YAML values bypass
# the model and land as plaintext) become unfindable by the very columns
# `encrypts` declares. New writes still encrypt; queries find both.
Rails.application.config.active_record.encryption.extend_queries = true
