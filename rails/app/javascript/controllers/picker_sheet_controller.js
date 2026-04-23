import { BridgeComponent } from "@hotwired/hotwire-native-bridge"

// data-controller="picker-sheet"
// Targets:
//   sheet  — the overlay element (web fallback only)
//   select — the underlying <select> (hidden)
//   label  — the visible label showing current selection
//   option — each option row (web fallback only)
export default class extends BridgeComponent {
  static component = "picker-sheet"
  static targets = ["sheet", "select", "label", "option"]

  connect() {
    super.connect()
    this.sync()
  }

  open(event) {
    event.preventDefault()

    if (this.enabled) {
      this.#openNative()
    } else {
      this.#openWeb()
    }
  }

  close(event) {
    event?.preventDefault()
    this.#closeWeb()
  }

  choose(event) {
    event.preventDefault()
    const value = event.currentTarget.dataset.pickerValue || ""
    this.#applyValue(value)
    this.#closeWeb()
  }

  // Bound to the hidden <select>'s change event.
  selectChanged() {
    this.sync()
  }

  sync() {
    const selectedOption = this.selectTarget.selectedOptions[0]
    const selectedValue = this.selectTarget.value
    const placeholder = this.element.dataset.placeholder || ""

    this.labelTarget.textContent = selectedValue
      ? selectedOption?.textContent?.trim() || placeholder
      : placeholder
    this.labelTarget.classList.toggle("is-placeholder", !selectedValue)

    this.optionTargets.forEach((option) => {
      option.classList.toggle("is-selected", option.dataset.pickerValue === selectedValue)
    })
  }

  #openNative() {
    const title = this.element.querySelector(".mobile-picker__panel-title")?.textContent?.trim() ?? ""
    const options = Array.from(this.selectTarget.options).filter((o) => o.value !== "")
    const items = options.map((option, index) => ({ title: option.textContent.trim(), index }))
    const selectedIndex = options.findIndex((option) => option.value === this.selectTarget.value)

    this.send("display", { title, items, selectedIndex: selectedIndex >= 0 ? selectedIndex : null }, (message) => {
      const option = options[message?.data?.selectedIndex]
      if (option) this.#applyValue(option.value)
    })
  }

  #applyValue(value) {
    this.selectTarget.value = value
    this.selectTarget.dispatchEvent(new Event("change", { bubbles: true }))
  }

  #openWeb() {
    this.sheetTarget.hidden = false
    // Force a reflow so the initial transform:translateY(100%) paints
    // before we add .is-open — otherwise the browser coalesces and skips
    // the transition.
    this.sheetTarget.offsetHeight // eslint-disable-line no-unused-expressions
    this.sheetTarget.classList.add("is-open")
    document.body.classList.add("mobile-sheet-open")
  }

  #closeWeb() {
    if (!this.sheetTarget.classList.contains("is-open")) return

    this.sheetTarget.classList.remove("is-open")
    document.body.classList.remove("mobile-sheet-open")

    const panel = this.sheetTarget.querySelector(".mobile-picker__panel")
    const onEnd = (event) => {
      if (event.target !== panel || event.propertyName !== "transform") return
      panel.removeEventListener("transitionend", onEnd)
      this.sheetTarget.hidden = true
    }
    panel.addEventListener("transitionend", onEnd)
  }
}
