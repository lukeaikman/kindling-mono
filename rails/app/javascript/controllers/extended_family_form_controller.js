import { Controller } from "@hotwired/stimulus"

// data-controller="extended-family-form"
// data-action="change->extended-family-form#changed"
//
// Uses the existing data-role="siblings-alive" / data-role="siblings-count" markup rather
// than Stimulus targets, so the choice-group partial doesn't need to thread an extra target
// attribute through.
export default class extends Controller {
  connect() {
    this.sync()
  }

  changed(event) {
    if (!event.target.closest("[data-role='siblings-alive']")) return
    this.sync()
  }

  sync() {
    const selected = this.element.querySelector("[data-role='siblings-alive'] input:checked")?.value
    const countField = this.element.querySelector("[data-role='siblings-count']")
    const numberInput = countField?.querySelector("input")
    if (!countField || !numberInput) return

    const shouldShow = selected === "yes"
    countField.hidden = !shouldShow
    if (!shouldShow) numberInput.value = ""
  }
}
