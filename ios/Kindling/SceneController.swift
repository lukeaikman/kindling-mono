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

        #if KINDLING_ORIGIN_DEV
        // Shake events flow up the responder chain from whatever is
        // first-responder to the window. If nothing is first-responder
        // (e.g. the Hotwire error screen), motion events are dropped
        // before they reach the window. Claim first responder so the
        // chain is always non-empty.
        window.becomeFirstResponder()

        if shouldAutoShowChooser() {
            // Physical device, no override saved — the compile-time
            // localhost default can't work. Show the chooser before
            // the navigator starts so the user configures a tunnel
            // URL first, rather than staring at an error page.
            presentChooserThenStartNavigator(on: window)
            return
        }
        #endif

        navigator.start()
    }

    #if KINDLING_ORIGIN_DEV
    private func shouldAutoShowChooser() -> Bool {
        #if targetEnvironment(simulator)
        return false
        #else
        let saved = UserDefaults.standard.string(forKey: Origin.overrideDefaultsKey)
        return saved?.isEmpty ?? true
        #endif
    }

    private func presentChooserThenStartNavigator(on window: UIWindow) {
        let chooser = DevOriginController()
        chooser.onDismiss = { [weak self] in
            // User saved → they'll force-quit + relaunch (alert told them).
            // User cancelled → start the navigator anyway so the error
            // screen renders; they can shake to reopen the chooser.
            self?.navigator.start()
        }

        let nav = UINavigationController(rootViewController: chooser)
        nav.modalPresentationStyle = .formSheet
        nav.isModalInPresentation = false

        DispatchQueue.main.async {
            window.rootViewController?.present(nav, animated: false)
        }
    }
    #endif
}

/// Catches shake gestures anywhere in the app and opens the dev origin
/// chooser. Dev builds only — Release builds skip the handler entirely.
final class ShakeObservingWindow: UIWindow {
    #if KINDLING_ORIGIN_DEV
    private var chooserIsPresented = false

    override var canBecomeFirstResponder: Bool { true }
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
