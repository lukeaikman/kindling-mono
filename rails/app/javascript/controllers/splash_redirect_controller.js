import { Controller } from "@hotwired/stimulus"
import { Turbo } from "@hotwired/turbo-rails"

// data-controller="splash-redirect"
// data-splash-redirect-url-value="<destination>"   (required — no default; splash without a destination is a bug)
// data-splash-redirect-delay-value="450"            (optional)
export default class extends Controller {
  static values = {
    url: String,
    delay: { type: Number, default: 450 },
  }

  connect() {
    if (!this.urlValue) {
      throw new Error("splash-redirect: data-splash-redirect-url-value is required")
    }

    this.timeoutId = window.setTimeout(() => {
      Turbo.visit(this.urlValue, { action: "replace" })
    }, this.delayValue)
  }

  disconnect() {
    if (this.timeoutId) window.clearTimeout(this.timeoutId)
  }
}
