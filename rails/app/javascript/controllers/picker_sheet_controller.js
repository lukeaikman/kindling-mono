import { Controller } from "@hotwired/stimulus"

// data-controller="picker-sheet"
// Targets:
//   sheet  — the overlay element
//   select — the underlying <select> (hidden)
//   label  — the visible label showing current selection
//   option — each option row
export default class extends Controller {
  static targets = ["sheet", "select", "label", "option"]

  connect() {
    this.sync()
  }

  open(event) {
    event.preventDefault()
    this.sheetTarget.hidden = false
    // Force a reflow so the initial transform:translateY(100%) paints
    // before we add .is-open — otherwise the browser coalesces and skips
    // the transition.
    this.sheetTarget.offsetHeight // eslint-disable-line no-unused-expressions
    this.sheetTarget.classList.add("is-open")
    document.body.classList.add("mobile-sheet-open")
  }

  close(event) {
    event?.preventDefault()
    this.#startClose()
  }

  choose(event) {
    event.preventDefault()
    const value = event.currentTarget.dataset.pickerValue || ""
    this.selectTarget.value = value
    this.selectTarget.dispatchEvent(new Event("change", { bubbles: true }))
    this.#startClose()
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

  #startClose() {
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
