import { Controller } from "@hotwired/stimulus"

// data-controller="family-form"
// Form-level values:
//   data-family-form-user-last-name-value     — surname auto-fill source
//   data-family-form-partner-first-name-value — last-render partner first name
//                                                (controller updates it as user types)
//   data-family-form-relationship-kind-value  — last-render relationship_status
// data-action on the form element routes delegated events. Element roles via
// data-role attributes (no per-target wiring needed for sub-elements).
export default class extends Controller {
  static values = {
    userLastName:       { type: String, default: "" },
    partnerFirstName:   { type: String, default: "" },
    relationshipKind:   { type: String, default: "" }
  }

  // Date-field label adapts based on relationship_status. Cohabiting needs
  // the label to convey we're asking about cohabitation start, not wedding.
  static PARTNER_DATE_LABELS = {
    "married":           "Wedding date",
    "civil-partnership": "Civil partnership date",
    "cohabiting":        "When did you start living together?"
  }

  // Co-parent radio option labels per partnered state. Values stay stable
  // regardless of state — only the human-facing label changes.
  static PARTNERED_KINDS = ["married", "civil-partnership", "cohabiting"]

  connect() {
    const form = this.element
    this.partnerFields            = form.querySelector("[data-role='partner-fields']")
    this.relationshipInputs       = Array.from(form.querySelectorAll("[data-role='relationship-status'] input"))
    this.spouseFirstNameInput     = form.querySelector("[data-role='spouse-first-name']")
    this.spouseLastNameInput      = form.querySelector("[data-role='spouse-last-name']")
    this.partnerStartedAtRow      = form.querySelector("[data-role='partner-started-at']")?.closest(".mobile-form-row, [data-role='partner-started-at']")
    this.timesWidowedRow          = form.querySelector("[data-role='times-widowed-row']")
    this.hasChildrenInputs        = Array.from(form.querySelectorAll("[data-role='has-children'] input"))
    this.childrenSection          = form.querySelector("[data-role='children-section']")
    this.childrenList             = form.querySelector("[data-children-list]")
    this.childTemplate            = form.querySelector("[data-child-template]")

    if (!this.childrenList || !this.childTemplate) return

    this.updatePartnerFields()
    this.updatePartnerStartedAtLabel()
    this.updateTimesWidowedRow()
    this.updateChildrenSection()
    this.refreshAllChildCardChrome()
    this.refreshAllChildCoParentOptions()
  }

  // ---------- Delegated event routers ----------

  formChange(event) {
    if (event.target.closest("[data-role='relationship-status']")) {
      this.relationshipKindValue = this.currentRelationshipKind() || ""
      this.updatePartnerFields()
      this.updatePartnerStartedAtLabel()
      this.updateTimesWidowedRow()
      this.refreshAllChildCoParentOptions()
    }
    if (event.target.closest("[data-role='has-children']")) {
      this.updateChildrenSection()
    }
    if (event.target.closest("[data-role='co-parent-type']")) {
      const card = event.target.closest("[data-child-card]")
      if (card) this.updateCoParentSubFields(card)
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
      this.refreshAllChildCardChrome()
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

    if (event.target === this.spouseFirstNameInput) {
      this.partnerFirstNameValue = this.spouseFirstNameInput.value.trim()
      this.refreshAllChildCoParentOptions()
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
    return this.constructor.PARTNERED_KINDS.includes(this.currentRelationshipKind())
  }

  hasChildren() {
    return this.hasChildrenInputs.some((input) => input.checked && input.value === "yes")
  }

  currentRelationshipKind() {
    return this.relationshipInputs.find((input) => input.checked)?.value || ""
  }

  partnerLabel() {
    const live = this.spouseFirstNameInput?.value?.trim()
    if (live) return live
    if (this.partnerFirstNameValue) return this.partnerFirstNameValue

    switch (this.currentRelationshipKind()) {
      case "married":            return "your spouse"
      case "civil-partnership":  return "your civil partner"
      case "cohabiting":         return "your partner"
      default:                   return "your partner"
    }
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

  updatePartnerStartedAtLabel() {
    // The date_field partial wraps the input with a form_row that has the
    // user-facing label. We update both the picker_title (data-attribute on
    // the trigger button, when shown) and the form-row label text.
    const kind = this.currentRelationshipKind()
    const labelText = this.constructor.PARTNER_DATE_LABELS[kind]
    if (!labelText || !this.partnerStartedAtRow) return

    // The label may live on a sibling form_row (date_field renders that wrapper).
    const labelEl = this.element.querySelector("label[for*='partner_started_at']")
    if (labelEl) labelEl.textContent = labelText

    // Bridge button (mobile shell): also update the picker title attribute.
    const bridgeButton = this.element.querySelector("[data-role='partner-started-at'] [data-controller='date-field']") ||
                         this.element.querySelector("[data-role='partner-started-at']")
    if (bridgeButton) bridgeButton.dataset.dateFieldTitleValue = labelText
  }

  updateTimesWidowedRow() {
    if (!this.timesWidowedRow) return
    const widowed = this.currentRelationshipKind() === "widowed"
    this.timesWidowedRow.hidden = !widowed
    if (!widowed) {
      const input = this.timesWidowedRow.querySelector("[data-role='times-widowed']")
      if (input) input.value = "0"
    }
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
  }

  refreshAllChildCardChrome() {
    const cards = Array.from(this.childrenList.querySelectorAll("[data-child-card]"))
    cards.forEach((card, index) => {
      const number = card.querySelector("[data-child-number]")
      if (number) number.textContent = String(index + 1)

      const removeButton = card.querySelector("[data-remove-child]")
      if (removeButton) removeButton.hidden = cards.length <= 1
    })
  }

  refreshAllChildCoParentOptions() {
    if (!this.childrenList) return
    this.childrenList.querySelectorAll("[data-child-card]").forEach((card) => this.updateCoParentOptions(card))
    this.childrenList.querySelectorAll("[data-child-card]").forEach((card) => this.updateCoParentSubFields(card))
  }

  // Re-renders the radio labels (and value list) for a single child card based
  // on whether the user is currently partnered. When partnered, the top option
  // is "Yes, with [partner-name]". Otherwise just "Yes".
  updateCoParentOptions(card) {
    const group = card.querySelector("[data-role='co-parent-type']")
    if (!group) return

    const partnered = this.hasPartner()
    const partnerLabel = this.partnerLabel()
    const previouslyPicked = group.querySelector("input[type='radio']:checked")?.value

    const options = partnered
      ? [
          ["yes_with_partner", `Yes, with ${partnerLabel}`],
          ["yes_with_other",   "Yes, with someone else"],
          ["no_deceased",      "No — their other parent is deceased"],
          ["no_sole",          "No, I have sole parental responsibility"]
        ]
      : [
          ["yes_with_other",   "Yes"],
          ["no_deceased",      "No — their other parent is deceased"],
          ["no_sole",          "No, I have sole parental responsibility"]
        ]

    // Locate the form_row body that wraps the radios. The choice_group partial
    // renders the radios inside that wrapper; we replace radio rows in place.
    const radioContainer = group  // group is the .mobile-choice-group div itself
    const childIndex = card.dataset.childIndex || this.childIndexFromCard(card)
    const fieldName = `onboarding_session[children_payload][${childIndex}][co_parent_type]`

    radioContainer.innerHTML = options.map(([value, label]) => {
      const optionId = `child_${childIndex}_co_parent_type_${value.replace(/_/g, "-")}`
      const checked = (previouslyPicked === value && (partnered || value !== "yes_with_partner"))
      return `<div class="mobile-choice-option mobile-radio-option" data-controller="haptic" data-haptic-style-value="light">
        <input type="radio" name="${escapeHtml(fieldName)}" id="${escapeHtml(optionId)}" value="${escapeHtml(value)}" ${checked ? "checked" : ""} data-action="change->choice-group#select">
        <label for="${escapeHtml(optionId)}">${escapeHtml(label)}</label>
      </div>`
    }).join("")

    // If a previously-picked "yes_with_partner" is now invalid (un-partnered),
    // reset the sub-field state so we don't render orphaned partner-rel-to-child.
    if (previouslyPicked === "yes_with_partner" && !partnered) {
      this.clearCoParentSubFields(card)
    }
  }

  childIndexFromCard(card) {
    // The card's data-child-card attr doesn't carry an index by default.
    // Derive from any input name within the card.
    const anyInput = card.querySelector("input[name^='onboarding_session[children_payload]']")
    const match = anyInput?.name?.match(/children_payload\]\[(\d+)\]/)
    return match ? match[1] : "0"
  }

  updateCoParentSubFields(card) {
    const checked = card.querySelector("[data-role='co-parent-type'] input[type='radio']:checked")?.value
    const partnerRel = card.querySelector("[data-role='co-parent-partner-rel']")
    const otherFields = card.querySelector("[data-role='co-parent-other-fields']")

    if (partnerRel)  partnerRel.hidden  = checked !== "yes_with_partner"
    if (otherFields) otherFields.hidden = checked !== "yes_with_other"
  }

  clearCoParentSubFields(card) {
    const partnerRel = card.querySelector("[data-role='co-parent-partner-rel']")
    const otherFields = card.querySelector("[data-role='co-parent-other-fields']")
    if (partnerRel)  partnerRel.hidden  = true
    if (otherFields) otherFields.hidden = true
  }

  addChildCard() {
    const html = this.childTemplate.innerHTML
      .replaceAll("__INDEX__", String(this.nextIndex()))
      .replaceAll("__CHILD_ID__", this.childId())

    this.childrenList.insertAdjacentHTML("beforeend", html)
    const newCard = this.childrenList.lastElementChild
    const lastNameInput = newCard?.querySelector("[data-role='child-last-name']")

    if (lastNameInput && this.spouseLastNameInput?.value.trim() && this.userLastNameValue) {
      lastNameInput.value = this.userLastNameValue
      lastNameInput.dataset.prefilled = "true"
    }

    this.refreshAllChildCardChrome()
    if (newCard) {
      this.updateCoParentOptions(newCard)
      this.updateCoParentSubFields(newCard)
    }
  }

  nextIndex() {
    return this.childrenList.querySelectorAll("[data-child-card]").length
  }

  childId() {
    return window.crypto?.randomUUID?.() || `child-${Date.now()}-${Math.floor(Math.random() * 10000)}`
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
