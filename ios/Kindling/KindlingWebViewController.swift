import HotwireNative
import UIKit

final class KindlingWebViewController: HotwireWebViewController {
  override func viewDidLoad() {
    super.viewDidLoad()
    installBrandTitleView()
  }

  private func installBrandTitleView() {
    guard let image = UIImage(named: "KindlingLogo") else { return }

    let imageView = UIImageView(image: image)
    imageView.contentMode = .scaleAspectFit
    // Logo source is 271×51 at @2x → ~135×25pt natural. Cap the nav-bar
    // titleView to a sensible height and let aspect ratio dictate width.
    let height: CGFloat = 24
    let width = image.size.width * (height / image.size.height)
    imageView.frame = CGRect(x: 0, y: 0, width: width, height: height)

    navigationItem.titleView = imageView
  }
}
