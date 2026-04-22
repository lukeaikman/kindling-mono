import Foundation

enum Origin {
  static let rails: URL = {
    #if KINDLING_ORIGIN_DEV
    return URL(string: "http://localhost:3010")!
    #elseif KINDLING_ORIGIN_PROD
    return URL(string: "https://kindling.app")!
    #else
    #error("No origin flag set. Check Dev.xcconfig / Release.xcconfig contains -D KINDLING_ORIGIN_DEV or -D KINDLING_ORIGIN_PROD.")
    #endif
  }()
}
