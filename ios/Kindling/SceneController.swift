import HotwireNative
import UIKit

final class SceneController: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    private lazy var navigator = Navigator(
        configuration: Navigator.Configuration(
            name: "main",
            startLocation: Origin.rails.appendingPathComponent("mobile/open")
        )
    )

    func scene(
        _ scene: UIScene,
        willConnectTo session: UISceneSession,
        options connectionOptions: UIScene.ConnectionOptions
    ) {
        guard let windowScene = scene as? UIWindowScene else { return }

        let window = ShakeObservingWindow(windowScene: windowScene)
        window.rootViewController = navigator.rootViewController
        window.makeKeyAndVisible()
        self.window = window

        navigator.start()
    }
}

/// Catches shake gestures anywhere in the app and opens the dev origin
/// chooser. Dev builds only — Release builds skip the handler entirely.
final class ShakeObservingWindow: UIWindow {
    #if KINDLING_ORIGIN_DEV
    private var chooserIsPresented = false
    #endif

    override func motionEnded(_ motion: UIEvent.EventSubtype, with event: UIEvent?) {
        super.motionEnded(motion, with: event)

        #if KINDLING_ORIGIN_DEV
        guard motion == .motionShake else { return }
        presentDevOriginChooser()
        #endif
    }

    #if KINDLING_ORIGIN_DEV
    private func presentDevOriginChooser() {
        guard !chooserIsPresented, let top = topViewController else { return }
        chooserIsPresented = true

        let chooser = DevOriginController()
        chooser.onDismiss = { [weak self] in self?.chooserIsPresented = false }

        let nav = UINavigationController(rootViewController: chooser)
        nav.modalPresentationStyle = .formSheet
        top.present(nav, animated: true)
    }

    private var topViewController: UIViewController? {
        var top = rootViewController
        while let presented = top?.presentedViewController {
            top = presented
        }
        return top
    }
    #endif
}
