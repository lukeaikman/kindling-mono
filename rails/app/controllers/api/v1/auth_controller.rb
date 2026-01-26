module Api
  module V1
    class AuthController < Api::BaseController
      allow_unauthenticated_access only: %i[register validate_email]

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
    end
  end
end
