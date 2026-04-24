import Foundation
import HotwireNative
import UIKit

/// Bridge component that plays a single native haptic when the web
/// sends a "play" event. No reply.
final class HapticsComponent: BridgeComponent {
    override class var name: String { "haptics" }

    override func onReceive(message: Message) {
        guard let event = Event(rawValue: message.event) else { return }

        switch event {
        case .play:
            handlePlay(message: message)
        }
    }

    private func handlePlay(message: Message) {
        guard let data: PlayData = message.data() else { return }
        Self.play(style: data.style)
    }

    private static func play(style: String) {
        switch style {
        case "light":
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
        case "medium":
            UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        case "heavy":
            UIImpactFeedbackGenerator(style: .heavy).impactOccurred()
        case "soft":
            UIImpactFeedbackGenerator(style: .soft).impactOccurred()
        case "rigid":
            UIImpactFeedbackGenerator(style: .rigid).impactOccurred()
        case "success":
            UINotificationFeedbackGenerator().notificationOccurred(.success)
        case "warning":
            UINotificationFeedbackGenerator().notificationOccurred(.warning)
        case "error":
            UINotificationFeedbackGenerator().notificationOccurred(.error)
        case "selection":
            UISelectionFeedbackGenerator().selectionChanged()
        default:
            break
        }
    }
}

private extension HapticsComponent {
    enum Event: String {
        case play
    }

    struct PlayData: Decodable {
        let style: String
    }
}
