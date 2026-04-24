import HotwireNative
import UIKit

final class SceneController: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?
    private var navigator: Navigator?

    func scene(
        _ scene: UIScene,
        willConnectTo session: UISceneSession,
        options connectionOptions: UIScene.ConnectionOptions
    ) {
        guard let windowScene = scene as? UIWindowScene else { return }

        let window = ShakeObservingWindow(windowScene: windowScene)
        self.window = window
        buildAndAttachNavigator()
        window.makeKeyAndVisible()

        #if KINDLING_ORIGIN_DEV
        window.becomeFirstResponder()
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleDevOriginUpdated),
            name: .devOriginUpdated,
            object: nil
        )

        if shouldAutoShowChooser() {
            presentChooser(on: window)
            return
        }
        #endif

        navigator?.start()
    }

    private func buildAndAttachNavigator() {
        let nav = Navigator(
            configuration: Navigator.Configuration(
                name: "main",
                startLocation: Origin.rails.appendingPathComponent("mobile/open")
            )
        )
        navigator = nav
        window?.rootViewController = nav.rootViewController
    }

    #if KINDLING_ORIGIN_DEV
    @objc private func handleDevOriginUpdated() {
        // Reload path config against the new origin.
        let bundledConfig = Bundle.main.url(forResource: "path-configuration", withExtension: "json")!
        let serverConfig = Origin.rails.appendingPathComponent("mobile/config/path_configuration.json")
        Hotwire.loadPathConfiguration(from: [
            .file(bundledConfig),
            .server(serverConfig)
        ])

        // Rebuild the navigator so its startLocation captures the
        // fresh Origin.rails, then swap it in as the window root.
        buildAndAttachNavigator()
        navigator?.start()
    }

    private func shouldAutoShowChooser() -> Bool {
        #if targetEnvironment(simulator)
        return false
        #else
        let saved = UserDefaults.standard.string(forKey: Origin.overrideDefaultsKey)
        return saved?.isEmpty ?? true
        #endif
    }

    private func presentChooser(on window: UIWindow) {
        let chooser = DevOriginController()
        chooser.onDismiss = { [weak self] in
            // Only fires on Cancel — save/clear dismiss without the
            // callback. Start the navigator so the error screen
            // renders; user can shake to reopen the chooser.
            self?.navigator?.start()
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
