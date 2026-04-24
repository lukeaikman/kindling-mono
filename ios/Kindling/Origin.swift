import Foundation

enum Origin {
    static let overrideDefaultsKey = "kindling.dev.overrideURL"

    /// Re-read on every access so Dev-build hot-reloads (chooser saves
    /// a new tunnel URL) take effect immediately. Negligible perf cost
    /// — only hit at navigator build + path-config load time.
    static var rails: URL {
        #if KINDLING_ORIGIN_DEV
        if let override = devOverride() {
            return override
        }
        return URL(string: "http://localhost:3010")!
        #elseif KINDLING_ORIGIN_PROD
        return URL(string: "https://kindling.app")!
        #else
        #error("No origin flag set. Check Dev.xcconfig / Release.xcconfig contains -D KINDLING_ORIGIN_DEV or -D KINDLING_ORIGIN_PROD.")
        #endif
    }

    #if KINDLING_ORIGIN_DEV
    private static func devOverride() -> URL? {
        guard let raw = UserDefaults.standard.string(forKey: overrideDefaultsKey),
              !raw.isEmpty,
              let url = URL(string: raw),
              url.scheme == "https" else { return nil }
        return url
    }
    #endif
}

extension Notification.Name {
    static let devOriginUpdated = Notification.Name("kindling.dev.originUpdated")
}
