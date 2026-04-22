import HotwireNative
import UIKit

@main
final class AppDelegate: UIResponder, UIApplicationDelegate {
  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    configureHotwire()
    return true
  }

  // MARK: UISceneSession Lifecycle

  func application(
    _ application: UIApplication,
    configurationForConnecting connectingSceneSession: UISceneSession,
    options: UIScene.ConnectionOptions
  ) -> UISceneConfiguration {
    UISceneConfiguration(name: "Default", sessionRole: connectingSceneSession.role)
  }

  private func configureHotwire() {
    let bundledConfig = Bundle.main.url(forResource: "path-configuration", withExtension: "json")!
    let serverConfig = Origin.rails.appendingPathComponent("mobile/config/path_configuration.json")

    Hotwire.loadPathConfiguration(from: [
      .file(bundledConfig),
      .server(serverConfig)
    ])

    #if DEBUG
    Hotwire.config.debugLoggingEnabled = true
    #endif
  }
}
