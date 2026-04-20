import { Controller } from "@hotwired/stimulus"

// Data attributes on the root element:
//   data-controller="choice-group"
//   data-choice-group-collapsible-value="true"   (optional, default false)
export default class extends Controller {
  static values = { collapsible: { type: Boolean, default: false } }

  connect() {
    this.sync()
  }

  // Bound to radio change via data-action="change->choice-group#select".
  select() {
    this.sync()
  }

  // Bound to injected reset-button click via data-action="click->choice-group#reset".
  reset(event) {
    event.preventDefault()
    this.element.querySelectorAll("input[type='radio']").forEach((input) => {
      input.checked = false
    })
    this.sync()
  }

  sync() {
    const checked = this.element.querySelector("input[type='radio']:checked")
    this.element.classList.toggle("is-collapsed", this.collapsibleValue && Boolean(checked))

    this.element.querySelectorAll(".mobile-radio-option").forEach((option) => {
      const input = option.querySelector("input[type='radio']")
      const isSelected = input === checked

      option.classList.toggle("is-selected", isSelected)

      let resetButton = option.querySelector("[data-choice-group-reset]")

      if (!resetButton && isSelected && this.collapsibleValue) {
        resetButton = document.createElement("button")
        resetButton.type = "button"
        resetButton.className = "mobile-radio-reset"
        resetButton.dataset.choiceGroupReset = "true"
        resetButton.dataset.action = "click->choice-group#reset"
        resetButton.setAttribute("aria-label", "Change selection")
        resetButton.innerHTML = "&#8635;"
        option.appendChild(resetButton)
      }

      if (resetButton) {
        resetButton.hidden = !(isSelected && this.collapsibleValue)
      }
    })
  }
}
