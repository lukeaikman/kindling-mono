import { BridgeComponent } from "@hotwired/hotwire-native-bridge"

// data-controller="date-field"
// Targets: input (<input type="date">, transparent overlay), label (visible span)
// Values: title (picker header), placeholder (label text when no date set)
export default class extends BridgeComponent {
  static component = "date-picker"
  static targets = ["input", "label"]
  static values = { title: String, placeholder: String }

  connect() {
    super.connect()
    this.sync()
  }

  // Bound to the input's click. In the shell, we intercept and open the
  // native wheel. In a browser, we do NOT preventDefault — the browser's
  // own date picker opens naturally because the input receives the tap.
  open(event) {
    if (!this.enabled) return

    event.preventDefault()
    this.#openNative()
  }

  // Bound to the input's change event (browser path updates the value,
  // native path assigns directly and dispatches change).
  sync() {
    const iso = this.inputTarget.value
    this.labelTarget.textContent = iso ? this.#format(iso) : this.placeholderValue
    this.labelTarget.classList.toggle("is-placeholder", !iso)
  }

  #openNative() {
    this.send("display", {
      title: this.titleValue,
      value: this.inputTarget.value || null,
      minDate: this.inputTarget.min || null,
      maxDate: this.inputTarget.max || null
    }, (message) => {
      const picked = message?.data?.value
      if (!picked) return
      this.inputTarget.value = picked
      this.inputTarget.dispatchEvent(new Event("change", { bubbles: true }))
    })
  }

  #format(iso) {
    const [year, month, day] = iso.split("-").map(Number)
    if (!year || !month || !day) return iso
    const date = new Date(Date.UTC(year, month - 1, day))
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC"
    }).format(date)
  }
}
