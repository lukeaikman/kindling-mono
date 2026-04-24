import { BridgeComponent } from "@hotwired/hotwire-native-bridge"

// data-controller="haptic" data-haptic-style-value="medium"
// Attaches to any element; fires a haptic on click. Browser silent.
export default class extends BridgeComponent {
  static component = "haptics"
  static values = { style: { type: String, default: "medium" } }

  connect() {
    super.connect()
    this.handler = this.#play.bind(this)
    this.element.addEventListener("click", this.handler)
  }

  disconnect() {
    if (this.handler) {
      this.element.removeEventListener("click", this.handler)
    }
    super.disconnect()
  }

  #play() {
    if (!this.enabled) return
    this.send("play", { style: this.styleValue })
  }
}
