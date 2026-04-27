import { BridgeComponent } from "@hotwired/hotwire-native-bridge"

// data-controller="date-field" (applied to the <button> trigger)
// Targets: input (hidden <input type="date"> holding the submit value),
//          label (visible span)
// Values: title (native picker header), placeholder (label text when blank)
//
// Rendered for any mobile-UA request (the partial's user-agent branch
// short-circuits desktop UAs to a plain date_field_tag with no controller).
// At runtime two paths apply:
//   - this.enabled === true (native shell connected): bridge the picker
//     across to the native iOS sheet.
//   - this.enabled === false (mobile UA in a browser — DevTools emulation,
//     mobile Safari outside the shell, etc.): fall back to the browser's
//     own native date picker via showPicker() with a click() fallback.
//     Without this fallback, "mobile UA + no bridge" silently no-ops.
export default class extends BridgeComponent {
  static component = "date-picker"
  static targets = ["input", "label"]
  static values = { title: String, placeholder: String }

  connect() {
    super.connect()
    this.sync()
  }

  open(event) {
    event.preventDefault()

    if (this.enabled) {
      this.#openNative()
    } else {
      this.#openBrowser()
    }
  }

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

  #openBrowser() {
    if (typeof this.inputTarget.showPicker === "function") {
      try {
        this.inputTarget.showPicker()
        return
      } catch (_error) {
        // showPicker can throw if the input is unfocusable or detached;
        // fall through to the click fallback.
      }
    }
    this.inputTarget.click()
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
