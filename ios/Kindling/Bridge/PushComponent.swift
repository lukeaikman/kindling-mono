import Foundation
import HotwireNative
import UIKit

/// Bridge component that triggers the iOS push-notification permission
/// prompt when the web fires a "request-permission" event. The actual
/// APNs registration + token delivery is handled by PushRegistration
/// and AppDelegate's remote-notification callbacks.
final class PushComponent: BridgeComponent {
    override class var name: String { "push" }

    override func onReceive(message: Message) {
        print("[Push] bridge onReceive event=\(message.event)")
        guard let event = Event(rawValue: message.event) else {
            print("[Push] unknown event, ignoring")
            return
        }

        switch event {
        case .requestPermission:
            PushRegistration.requestAuthorizationAndRegister()
        }
    }
}

private extension PushComponent {
    enum Event: String {
        case requestPermission = "request-permission"
    }
}
