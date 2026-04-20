import { Controller } from "@hotwired/stimulus"

// data-controller="family-form"
// data-family-form-user-last-name-value="<user's surname>"
// data-action on the form element routes delegated events (see extended_family ERB
// pattern — the ERB uses data-role attributes for element roles so the controller
// doesn't need Stimulus targets for every sub-element).
export default class extends Controller {
  static values = { userLastName: { type: String, default: "" } }

  connect() {
    const form = this.element
    this.partnerFields = form.querySelector("[data-role='partner-fields']")
    this.relationshipInputs = Array.from(form.querySelectorAll("[data-role='relationship-status'] input"))
    this.spouseFirstNameInput = form.querySelector("[name='onboarding_session[spouse_first_name]']")
    this.spouseLastNameInput = form.querySelector("[data-role='spouse-last-name']")
    this.hasChildrenInputs = Array.from(form.querySelectorAll("[data-role='has-children'] input"))
    this.childrenSection = form.querySelector("[data-role='children-section']")
    this.childrenList = form.querySelector("[data-children-list]")
    this.childTemplate = form.querySelector("[data-child-template]")

    if (!this.childrenList || !this.childTemplate) return

    this.updatePartnerFields()
    this.updateChildrenSection()
    this.refreshChildCardChrome()
    this.refreshResponsibilityOptions()
  }

  // ---------- Delegated event routers ----------

  formChange(event) {
    if (event.target.closest("[data-role='relationship-status']")) {
      this.updatePartnerFields()
      this.refreshResponsibilityOptions()
    }
    if (event.target.closest("[data-role='has-children']")) {
      this.updateChildrenSection()
    }
    if (event.target === this.spouseFirstNameInput) {
      this.refreshResponsibilityOptions()
    }
    if (event.target.matches("[data-role='responsibility']") && event.target.closest("[data-child-card]")) {
      event.target.dataset.manual = "true"
      this.updateResponsibilitySections()
    }
  }

  formClick(event) {
    const addButton = event.target.closest("[data-add-child]")
    if (addButton) {
      event.preventDefault()
      this.addChildCard()
      return
    }

    const removeButton = event.target.closest("[data-remove-child]")
    if (removeButton && removeButton.closest("[data-children-list]")) {
      event.preventDefault()
      removeButton.closest("[data-child-card]")?.remove()
      this.refreshChildCardChrome()
      this.refreshResponsibilityOptions()
    }
  }

  formFocusin(event) {
    if (event.target === this.spouseLastNameInput) {
      this.onSpouseLastNameFocus()
      return
    }

    const childLastName = event.target.closest("[data-role='child-last-name']")
    if (childLastName && this.childrenList?.contains(childLastName)) {
      if (childLastName.dataset.prefilled === "true" && childLastName.dataset.touched !== "true") {
        childLastName.value = ""
        childLastName.dataset.touched = "true"
      }
    }
  }

  formInput(event) {
    if (event.target === this.spouseLastNameInput) {
      this.spouseLastNameInput.dataset.touched = "true"
      this.spouseLastNameInput.dataset.prefilled = "false"
      return
    }

    const childLastName = event.target.closest("[data-role='child-last-name']")
    if (childLastName && this.childrenList?.contains(childLastName)) {
      childLastName.dataset.touched = "true"
      childLastName.dataset.prefilled = "false"
    }
  }

  // ---------- Private helpers ----------

  onSpouseLastNameFocus() {
    const input = this.spouseLastNameInput
    if (input?.dataset.prefilled === "true" && input.dataset.touched !== "true") {
      input.value = ""
      input.dataset.touched = "true"
    }
  }

  hasPartner() {
    return this.relationshipInputs.some(
      (input) => input.checked && ["married", "civil-partnership", "cohabiting"].includes(input.value)
    )
  }

  hasChildren() {
    return this.hasChildrenInputs.some((input) => input.checked && input.value === "yes")
  }

  relationshipValue() {
    return this.relationshipInputs.find((input) => input.checked)?.value || ""
  }

  defaultResponsibilityValue() {
    return this.hasPartner() ? "co-responsibility-with-spouse" : "sole-responsibility"
  }

  partnerFallbackName() {
    switch (this.relationshipValue()) {
      case "married": return "your spouse"
      case "civil-partnership": return "your civil partner"
      case "cohabiting": return "your partner"
      default: return "your partner"
    }
  }

  partnerDisplayName() {
    return this.spouseFirstNameInput?.value.trim() || this.partnerFallbackName()
  }

  responsibilityOptions() {
    const options = []
    if (this.hasPartner()) {
      options.push({ value: "co-responsibility-with-spouse", label: `Co-guardianship with ${this.partnerDisplayName()}` })
    }
    options.push({ value: "sole-responsibility", label: "Sole guardianship" })
    options.push({ value: "add-co-guardian", label: "Add guardian" })
    return options
  }

  nextIndex() {
    return this.childrenList.querySelectorAll("[data-child-card]").length
  }

  childId() {
    return window.crypto?.randomUUID?.() || `child-${Date.now()}-${Math.floor(Math.random() * 10000)}`
  }

  refreshChildCardChrome() {
    const cards = Array.from(this.childrenList.querySelectorAll("[data-child-card]"))
    cards.forEach((card, index) => {
      const number = card.querySelector("[data-child-number]")
      if (number) number.textContent = String(index + 1)

      const removeButton = card.querySelector("[data-remove-child]")
      if (removeButton) removeButton.hidden = cards.length <= 1
    })
  }

  renderResponsibilityOptions(select, selectedValue) {
    select.innerHTML = this.responsibilityOptions().map((option) => {
      const selected = option.value === selectedValue ? ` selected="selected"` : ""
      return `<option value="${escapeHtml(option.value)}"${selected}>${escapeHtml(option.label)}</option>`
    }).join("")
    select.value = selectedValue
    select.dispatchEvent(new Event("change", { bubbles: true }))
  }

  refreshResponsibilityOptions() {
    const availableValues = this.responsibilityOptions().map((option) => option.value)
    const defaultValue = this.defaultResponsibilityValue()

    this.childrenList.querySelectorAll("[data-child-card]").forEach((card) => {
      const select = card.querySelector("[data-role='responsibility']")
      if (!select) return

      const manual = select.dataset.manual === "true"
      const currentValue = select.value
      let nextValue = currentValue

      if (!manual) {
        nextValue = defaultValue
      } else if (!availableValues.includes(currentValue)) {
        nextValue = defaultValue
      }

      this.renderResponsibilityOptions(select, nextValue)
    })
  }

  updateResponsibilitySections() {
    this.childrenList.querySelectorAll("[data-child-card]").forEach((card) => {
      const select = card.querySelector("[data-role='responsibility']")
      const coGuardianFields = card.querySelector("[data-role='co-guardian-fields']")
      if (!select || !coGuardianFields) return

      coGuardianFields.hidden = select.value !== "add-co-guardian"
    })
  }

  updatePartnerFields() {
    if (!this.partnerFields) return

    if (this.hasPartner()) {
      this.partnerFields.hidden = false

      if (this.spouseLastNameInput && !this.spouseLastNameInput.value.trim() && this.userLastNameValue && this.spouseLastNameInput.dataset.touched !== "true") {
        this.spouseLastNameInput.value = this.userLastNameValue
        this.spouseLastNameInput.dataset.prefilled = "true"
      }
    } else {
      this.partnerFields.hidden = true
      this.element.querySelectorAll("[name='onboarding_session[spouse_first_name]'], [name='onboarding_session[spouse_last_name]']").forEach((input) => {
        input.value = ""
      })
    }
  }

  addChildCard() {
    const html = this.childTemplate.innerHTML
      .replaceAll("__INDEX__", String(this.nextIndex()))
      .replaceAll("__CHILD_ID__", this.childId())

    this.childrenList.insertAdjacentHTML("beforeend", html)
    const newCard = this.childrenList.lastElementChild
    const lastNameInput = newCard?.querySelector("[data-role='child-last-name']")
    const responsibilitySelect = newCard?.querySelector("[data-role='responsibility']")

    if (lastNameInput && this.spouseLastNameInput?.value.trim() && this.userLastNameValue) {
      lastNameInput.value = this.userLastNameValue
      lastNameInput.dataset.prefilled = "true"
    }

    if (responsibilitySelect) {
      responsibilitySelect.dataset.manual = "false"
    }

    this.refreshChildCardChrome()
    this.refreshResponsibilityOptions()
  }

  updateChildrenSection() {
    if (!this.childrenSection) return

    if (this.hasChildren()) {
      this.childrenSection.hidden = false
      if (!this.childrenList.querySelector("[data-child-card]")) {
        this.addChildCard()
      }
    } else {
      this.childrenSection.hidden = true
      this.childrenList.innerHTML = ""
    }

    this.refreshResponsibilityOptions()
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}
