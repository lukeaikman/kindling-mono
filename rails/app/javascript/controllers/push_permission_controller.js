import { BridgeComponent } from "@hotwired/hotwire-native-bridge"

// data-controller="push-permission"
// Fires a "request-permission" event on the native "push" component
// when its element is clicked. Silent in browser — controller simply
// doesn't mount because the bridge isn't present.
export default class extends BridgeComponent {
  static component = "push"

  connect() {
    super.connect()
    this.handler = this.#request.bind(this)
    this.element.addEventListener("click", this.handler)
  }

  disconnect() {
    if (this.handler) {
      this.element.removeEventListener("click", this.handler)
    }
    super.disconnect()
  }

  #request() {
    if (!this.enabled) return
    this.send("request-permission", {})
  }
}
