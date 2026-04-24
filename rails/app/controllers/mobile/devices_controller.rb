module Mobile
  class DevicesController < BaseController
    allow_unauthenticated_access
    skip_before_action :verify_authenticity_token, only: :create

    def create
      token = params.require(:apns_token)
      platform = params.require(:platform)
      vendor_id = params[:vendor_id].presence

      device = if vendor_id
        Device.find_or_initialize_by(vendor_id: vendor_id)
      else
        Device.find_or_initialize_by(apns_token: token)
      end

      device.apns_token = token
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
