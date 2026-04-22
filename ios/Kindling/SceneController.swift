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

    window = UIWindow(windowScene: windowScene)
    window?.rootViewController = navigator.rootViewController
    window?.makeKeyAndVisible()

    navigator.start()
  }
}
