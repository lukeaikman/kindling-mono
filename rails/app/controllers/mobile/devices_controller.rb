module Mobile
  class DevicesController < BaseController
    allow_unauthenticated_access
    skip_before_action :verify_authenticity_token, only: :create

    def create
      token = params.require(:apns_token)
      platform = params.require(:platform)

      device = Device.find_or_initialize_by(apns_token: token)
      device.platform = platform
      device.last_registered_at = Time.current
      device.onboarding_session = onboarding_session if onboarding_session.present?
      device.user = Current.user if authenticated?

      if device.save
        head :created
      else
        head :unprocessable_entity
      end
    end
  end
end
