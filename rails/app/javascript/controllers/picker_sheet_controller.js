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
    document.body.classList.add("mobile-sheet-open")
  }

  close(event) {
    event.preventDefault()
    this.sheetTarget.hidden = true
    document.body.classList.remove("mobile-sheet-open")
  }

  choose(event) {
    event.preventDefault()
    const value = event.currentTarget.dataset.pickerValue || ""
    this.selectTarget.value = value
    this.selectTarget.dispatchEvent(new Event("change", { bubbles: true }))
    this.sheetTarget.hidden = true
    document.body.classList.remove("mobile-sheet-open")
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
}
