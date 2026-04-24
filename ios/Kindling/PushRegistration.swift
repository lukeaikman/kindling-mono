import Foundation
import UIKit
import UserNotifications

/// Owns the iOS push-notification permission prompt and device-token
/// lifecycle. Requests authorization, registers with APNs, posts the
/// returned token to Rails. No sends — Rails is the sender.
enum PushRegistration {
    /// Ask iOS for push permission. If granted, trigger APNs
    /// registration. The resulting device token arrives on AppDelegate
    /// and is forwarded via `deliverToken(_:)`.
    static func requestAuthorizationAndRegister() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, _ in
            guard granted else { return }
            DispatchQueue.main.async {
                UIApplication.shared.registerForRemoteNotifications()
            }
        }
    }

    /// Post the APNs token to Rails. Re-uses the existing WKWebView
    /// cookie jar so the request is tied to the current onboarding
    /// session (or authenticated user, if present). Sends
    /// identifierForVendor alongside the token so reinstalls update
    /// the existing device row in place rather than creating a zombie.
    static func deliverToken(_ tokenData: Data) {
        let token = tokenData.map { String(format: "%02x", $0) }.joined()
        let vendorId = UIDevice.current.identifierForVendor?.uuidString ?? ""

        var components = URLComponents()
        components.queryItems = [
            URLQueryItem(name: "apns_token", value: token),
            URLQueryItem(name: "platform", value: "ios"),
            URLQueryItem(name: "vendor_id", value: vendorId)
        ]

        var request = URLRequest(url: Origin.rails.appendingPathComponent("mobile/devices"))
        request.httpMethod = "POST"
        request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
        // LocalTunnel gates non-browser requests behind a reminder page unless
        // this header is set. No-op against ngrok or production.
        request.setValue("true", forHTTPHeaderField: "Bypass-Tunnel-Reminder")
        request.httpBody = components.percentEncodedQuery?.data(using: .utf8)
        request.httpShouldHandleCookies = true

        URLSession.shared.dataTask(with: request) { _, response, error in
            if let error {
                print("[PushRegistration] POST failed: \(error.localizedDescription)")
                return
            }
            guard let http = response as? HTTPURLResponse else { return }
            if http.statusCode == 201 {
                print("[PushRegistration] token registered (vendor=\(vendorId.prefix(8))…)")
            } else {
                print("[PushRegistration] unexpected status \(http.statusCode)")
            }
        }.resume()
    }
}
