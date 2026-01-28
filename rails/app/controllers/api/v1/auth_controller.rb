module Api
  module V1
    class AuthController < Api::BaseController
      allow_unauthenticated_access only: %i[register validate_email login logout]

      def register
        email = normalize_email(params[:email])
        password = params[:password].to_s
        first_name = params[:first_name].to_s.strip
        last_name = params[:last_name].to_s.strip
        phone = params[:phone]
        device_id = params[:device_id].to_s.strip
        device_name = params[:device_name].to_s.strip.presence

        errors = validate_registration_params(
          email: email,
          password: password,
          first_name: first_name,
          last_name: last_name,
          device_id: device_id
        )

        if errors.present?
          return render_error(:unprocessable_entity, "validation_error", "Validation failed", details: errors)
        end

        if User.exists?(email_address: email)
          return render_error(:conflict, "email_taken", "Email address already in use")
        end

        user = User.new(
          email_address: email,
          password: password,
          first_name: first_name,
          last_name: last_name,
          phone: phone
        )

        unless user.save
          return render_error(:unprocessable_entity, "validation_error", "Validation failed", details: user.errors.to_hash)
        end

        session, access_token, refresh_token = ApiSession.issue_for(
          user: user,
          device_id: device_id,
          device_name: device_name
        )

        render json: {
          user_id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email_address,
          access_token: access_token,
          access_expires_at: session.access_expires_at,
          refresh_token: refresh_token,
          refresh_expires_at: session.refresh_expires_at
        }, status: :created
      end

      def validate_email
        email = normalize_email(params[:email])

        unless valid_email?(email)
          return render_error(:unprocessable_entity, "invalid_email", "Email format is invalid")
        end

        render json: { available: !User.exists?(email_address: email) }, status: :ok
      end

      def login
        email = normalize_email(params[:email])
        password = params[:password].to_s
        device_id = params[:device_id].to_s.strip
        device_name = params[:device_name].to_s.strip.presence

        errors = {}
        errors[:email] = ["is invalid"] unless valid_email?(email)
        errors[:password] = ["can't be blank"] if password.blank?
        errors[:device_id] = ["can't be blank"] if device_id.blank?

        return render_error(:unprocessable_entity, "validation_error", "Validation failed", details: errors) if errors.present?

        user = User.find_by(email_address: email)
        return handle_failed_login(nil) if user.nil?

        lockout_error = lockout_error_for(user)
        return lockout_error if lockout_error.present?

        unless User.authenticate_by(email_address: email, password: password)
          return handle_failed_login(user)
        end

        reset_lockout_for(user)
        session, access_token, refresh_token = ApiSession.issue_for(
          user: user,
          device_id: device_id,
          device_name: device_name
        )

        render json: {
          access_token: access_token,
          access_expires_at: session.access_expires_at,
          refresh_token: refresh_token,
          refresh_expires_at: session.refresh_expires_at,
          user: {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email_address,
            phone: user.phone
          }
        }, status: :ok
      end

      def logout
        token = bearer_token
        session = ApiSession.find_by_access_token(token)

        if session.nil? || session.revoked? || session.access_expired?
          return render_error(:unauthorized, "invalid_token", "Access token is invalid or expired")
        end

        session.revoke!
        render json: { success: true }, status: :ok
      end

      def session_validate
        token = bearer_token
        session = ApiSession.find_by_access_token(token)

        if session.nil? || session.revoked? || session.access_expired?
          return render_error(:unauthorized, "invalid_token", "Access token is invalid or expired")
        end

        user = session.user
        render json: {
          valid: true,
          user_id: user.id,
          profile: {
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email_address,
            phone: user.phone
          },
          access_expires_at: session.access_expires_at
        }, status: :ok
      end

      def session_refresh
        token = bearer_token
        session = ApiSession.find_by_refresh_token(token)

        return render_error(:unauthorized, "invalid_token", "Refresh token is invalid or expired") if session.nil?
        return render_error(:forbidden, "revoked_session", "Session has been revoked") if session.revoked?
        return render_error(:unauthorized, "invalid_token", "Refresh token is invalid or expired") if session.refresh_expired?

        new_session, access_token, refresh_token = ApiSession.rotate_for(session)

        render json: {
          access_token: access_token,
          access_expires_at: new_session.access_expires_at,
          refresh_token: refresh_token,
          refresh_expires_at: new_session.refresh_expires_at
        }, status: :ok
      end

      def profile
        token = bearer_token
        session = ApiSession.find_by_access_token(token)

        if session.nil? || session.revoked? || session.access_expired?
          return render_error(:unauthorized, "invalid_token", "Access token is invalid or expired")
        end

        user = session.user
        render json: {
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email_address,
          phone: user.phone
        }, status: :ok
      end

      private

      def render_error(status, code, message, details: nil)
        body = {
          error: message,
          code: code,
          status: Rack::Utils.status_code(status),
          request_id: request.request_id
        }
        body[:details] = details if details.present?
        render json: body, status: status
      end

      def normalize_email(email)
        email.to_s.strip.downcase
      end

      def valid_email?(email)
        email.present? && /\A[^@\s]+@[^@\s]+\.[^@\s]+\z/.match?(email)
      end

      def valid_password?(password)
        password.length >= 12 && password.match?(/[A-Za-z]/) && password.match?(/\d/)
      end

      def validate_registration_params(email:, password:, first_name:, last_name:, device_id:)
        errors = {}

        errors[:email] = ["is invalid"] unless valid_email?(email)
        errors[:password] = ["must be at least 12 characters and include letters and numbers"] unless valid_password?(password)
        errors[:first_name] = ["can't be blank"] if first_name.blank?
        errors[:last_name] = ["can't be blank"] if last_name.blank?
        errors[:device_id] = ["can't be blank"] if device_id.blank?

        errors
      end

      def bearer_token
        auth_header = request.headers["Authorization"].to_s
        return if auth_header.blank?

        scheme, token = auth_header.split(" ", 2)
        return unless scheme&.casecmp("Bearer")&.zero?

        token
      end

      def lockout_error_for(user)
        return render_error(:forbidden, "locked_support_required", "Account locked. Contact support.") if user.locked?
        return render_error(:forbidden, "account_suspended", "Account suspended.") if user.suspended?

        if user.locked_until.present? && user.locked_until.future?
          return render_error(:forbidden, "locked_temporarily", "Account temporarily locked. Try again later.")
        end

        nil
      end

      def handle_failed_login(user)
        if user.nil?
          return render_error(:unauthorized, "invalid_credentials", "Invalid email or password.")
        end

        new_count = user.failed_login_count + 1
        updates = { failed_login_count: new_count }

        if new_count >= 6
          updates[:status] = "locked"
          updates[:locked_until] = nil
          user.update_columns(updates)
          return render_error(:forbidden, "locked_support_required", "Account locked. Contact support.")
        end

        if new_count >= 3
          updates[:locked_until] = 1.hour.from_now
          user.update_columns(updates)
          return render_error(:forbidden, "locked_temporarily", "Account temporarily locked. Try again later.")
        end

        user.update_columns(updates)
        render_error(:unauthorized, "invalid_credentials", "Invalid email or password.")
      end

      def reset_lockout_for(user)
        return if user.failed_login_count.zero? && user.locked_until.nil?

        user.update_columns(failed_login_count: 0, locked_until: nil)
      end
    end
  end
end
