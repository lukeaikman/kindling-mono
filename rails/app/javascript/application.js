document.addEventListener("DOMContentLoaded", () => {
  wireAlertDismissals()
  wireCollapses()
  wireDropdowns()
  wireMobileRadioGroups()
  wireMobileFamilyForms()
  wireMobileExtendedFamilyForms()
})

function wireAlertDismissals() {
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-bs-dismiss='alert']")
    if (!button) return

    const alert = button.closest(".alert")
    if (!alert) return

    alert.classList.remove("show")
    alert.remove()
  })
}

function wireCollapses() {
  document.querySelectorAll("[data-bs-toggle='collapse']").forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault()

      const target = document.querySelector(trigger.dataset.bsTarget)
      if (!target) return

      const isOpen = target.classList.toggle("show")
      trigger.setAttribute("aria-expanded", isOpen ? "true" : "false")
    })
  })
}

function wireDropdowns() {
  document.addEventListener("click", (event) => {
    const toggle = event.target.closest("[data-bs-toggle='dropdown']")

    if (!toggle) {
      closeOpenDropdowns()
      return
    }

    event.preventDefault()

    const menu = toggle.parentElement?.querySelector(".dropdown-menu")
    if (!menu) return

    const shouldOpen = !menu.classList.contains("show")
    closeOpenDropdowns()

    if (shouldOpen) {
      menu.classList.add("show")
      toggle.setAttribute("aria-expanded", "true")
    }
  })

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeOpenDropdowns()
  })
}

function closeOpenDropdowns() {
  document.querySelectorAll(".dropdown-menu.show").forEach((menu) => {
    menu.classList.remove("show")

    const toggle = menu.parentElement?.querySelector("[data-bs-toggle='dropdown']")
    toggle?.setAttribute("aria-expanded", "false")
  })
}

function wireMobileRadioGroups() {
  document.querySelectorAll("[data-mobile-collapsible='true']").forEach(syncMobileRadioGroup)

  document.addEventListener("change", (event) => {
    const input = event.target
    if (!(input instanceof HTMLInputElement) || input.type !== "radio") return

    const group = input.closest("[data-mobile-collapsible='true']")
    if (!group) return

    syncMobileRadioGroup(group)
  })

  document.addEventListener("click", (event) => {
    const resetButton = event.target.closest("[data-mobile-radio-reset]")
    if (!resetButton) return

    event.preventDefault()

    const group = resetButton.closest("[data-mobile-collapsible='true']")
    if (!group) return

    group.querySelectorAll("input[type='radio']").forEach((input) => {
      input.checked = false
    })

    syncMobileRadioGroup(group)
  })
}

function syncMobileRadioGroup(group) {
  const checkedInput = group.querySelector("input[type='radio']:checked")
  group.classList.toggle("is-collapsed", Boolean(checkedInput))

  group.querySelectorAll(".mobile-radio-option").forEach((option) => {
    const input = option.querySelector("input[type='radio']")
    const isSelected = input === checkedInput

    option.classList.toggle("is-selected", isSelected)

    let resetButton = option.querySelector("[data-mobile-radio-reset]")
    if (!resetButton && isSelected) {
      resetButton = document.createElement("button")
      resetButton.type = "button"
      resetButton.className = "mobile-radio-reset"
      resetButton.dataset.mobileRadioReset = "true"
      resetButton.setAttribute("aria-label", "Change selection")
      resetButton.innerHTML = "&#8635;"
      option.appendChild(resetButton)
    }

    if (resetButton) {
      resetButton.hidden = !isSelected
    }
  })
}

function wireMobileFamilyForms() {
  document.querySelectorAll("[data-mobile-family-form]").forEach((form) => {
    const partnerFields = form.querySelector("[data-role='partner-fields']")
    const relationshipInputs = Array.from(form.querySelectorAll("[data-role='relationship-status'] input"))
    const spouseFirstNameInput = form.querySelector("[name='onboarding_session[spouse_first_name]']")
    const spouseLastNameInput = form.querySelector("[data-role='spouse-last-name']")
    const hasChildrenInputs = Array.from(form.querySelectorAll("[data-role='has-children'] input"))
    const childrenSection = form.querySelector("[data-role='children-section']")
    const childrenList = form.querySelector("[data-children-list]")
    const childTemplate = form.querySelector("[data-child-template]")
    const addChildButton = form.querySelector("[data-add-child]")
    const userLastName = form.dataset.userLastName || ""

    if (!childrenList || !childTemplate) return

    const hasPartner = () => relationshipInputs.some((input) => input.checked && ["married", "civil-partnership", "cohabiting"].includes(input.value))
    const hasChildren = () => hasChildrenInputs.some((input) => input.checked && input.value === "yes")
    const relationshipValue = () => relationshipInputs.find((input) => input.checked)?.value || ""
    const defaultResponsibilityValue = () => (hasPartner() ? "co-responsibility-with-spouse" : "sole-responsibility")
    const partnerFallbackName = () => {
      switch (relationshipValue()) {
        case "married":
          return "your spouse"
        case "civil-partnership":
          return "your civil partner"
        case "cohabiting":
          return "your partner"
        default:
          return "your partner"
      }
    }
    const partnerDisplayName = () => spouseFirstNameInput?.value.trim() || partnerFallbackName()
    const responsibilityOptions = () => {
      const options = []

      if (hasPartner()) {
        options.push({
          value: "co-responsibility-with-spouse",
          label: `Co-guardianship with ${partnerDisplayName()}`,
        })
      }

      options.push({ value: "sole-responsibility", label: "Sole guardianship" })
      options.push({ value: "add-co-guardian", label: "Add guardian" })

      return options
    }

    const nextIndex = () => childrenList.querySelectorAll("[data-child-card]").length
    const childId = () => (window.crypto?.randomUUID?.() || `child-${Date.now()}-${Math.floor(Math.random() * 10000)}`)

    const refreshChildCardChrome = () => {
      const cards = Array.from(childrenList.querySelectorAll("[data-child-card]"))

      cards.forEach((card, index) => {
        const number = card.querySelector("[data-child-number]")
        if (number) number.textContent = String(index + 1)

        const removeButton = card.querySelector("[data-remove-child]")
        if (removeButton) removeButton.hidden = cards.length <= 1
      })
    }

    const renderResponsibilityOptions = (select, selectedValue) => {
      select.innerHTML = responsibilityOptions().map((option) => {
        const selected = option.value === selectedValue ? ` selected="selected"` : ""
        return `<option value="${escapeHtml(option.value)}"${selected}>${escapeHtml(option.label)}</option>`
      }).join("")
      select.value = selectedValue
    }

    const refreshResponsibilityOptions = () => {
      const availableValues = responsibilityOptions().map((option) => option.value)
      const defaultValue = defaultResponsibilityValue()

      childrenList.querySelectorAll("[data-child-card]").forEach((card) => {
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

        renderResponsibilityOptions(select, nextValue)
      })

      updateResponsibilitySections()
    }

    const updateResponsibilitySections = () => {
      childrenList.querySelectorAll("[data-child-card]").forEach((card) => {
        const select = card.querySelector("[data-role='responsibility']")
        const coGuardianFields = card.querySelector("[data-role='co-guardian-fields']")
        if (!select || !coGuardianFields) return

        coGuardianFields.hidden = select.value !== "add-co-guardian"
      })
    }

    const updatePartnerFields = () => {
      if (!partnerFields) return

      if (hasPartner()) {
        partnerFields.hidden = false

        if (spouseLastNameInput && !spouseLastNameInput.value.trim() && userLastName && spouseLastNameInput.dataset.touched !== "true") {
          spouseLastNameInput.value = userLastName
          spouseLastNameInput.dataset.prefilled = "true"
        }
      } else {
        partnerFields.hidden = true

        form.querySelectorAll("[name='onboarding_session[spouse_first_name]'], [name='onboarding_session[spouse_last_name]']").forEach((input) => {
          input.value = ""
        })
      }
    }

    const addChildCard = () => {
      const html = childTemplate.innerHTML
        .replaceAll("__INDEX__", String(nextIndex()))
        .replaceAll("__CHILD_ID__", childId())

      childrenList.insertAdjacentHTML("beforeend", html)
      const newCard = childrenList.lastElementChild
      const lastNameInput = newCard?.querySelector("[data-role='child-last-name']")
      const responsibilitySelect = newCard?.querySelector("[data-role='responsibility']")

      if (lastNameInput && spouseLastNameInput?.value.trim() && userLastName) {
        lastNameInput.value = userLastName
        lastNameInput.dataset.prefilled = "true"
      }

      if (responsibilitySelect) {
        responsibilitySelect.dataset.manual = "false"
      }

      refreshChildCardChrome()
      refreshResponsibilityOptions()
    }

    const updateChildrenSection = () => {
      if (!childrenSection) return

      if (hasChildren()) {
        childrenSection.hidden = false

        if (!childrenList.querySelector("[data-child-card]")) {
          addChildCard()
        }
      } else {
        childrenSection.hidden = true
        childrenList.innerHTML = ""
      }

      refreshResponsibilityOptions()
    }

    relationshipInputs.forEach((input) => {
      input.addEventListener("change", () => {
        updatePartnerFields()
        refreshResponsibilityOptions()
      })
    })

    hasChildrenInputs.forEach((input) => {
      input.addEventListener("change", updateChildrenSection)
    })

    addChildButton?.addEventListener("click", (event) => {
      event.preventDefault()
      addChildCard()
    })

    spouseLastNameInput?.addEventListener("focus", () => {
      if (spouseLastNameInput.dataset.prefilled === "true" && spouseLastNameInput.dataset.touched !== "true") {
        spouseLastNameInput.value = ""
        spouseLastNameInput.dataset.touched = "true"
      }
    })

    spouseLastNameInput?.addEventListener("input", () => {
      spouseLastNameInput.dataset.touched = "true"
      spouseLastNameInput.dataset.prefilled = "false"
    })

    spouseFirstNameInput?.addEventListener("input", refreshResponsibilityOptions)

    childrenList.addEventListener("click", (event) => {
      const removeButton = event.target.closest("[data-remove-child]")
      if (!removeButton) return

      event.preventDefault()
      removeButton.closest("[data-child-card]")?.remove()
      refreshChildCardChrome()
    })

    childrenList.addEventListener("change", (event) => {
      if (event.target.matches("[data-role='responsibility']")) {
        event.target.dataset.manual = "true"
        updateResponsibilitySections()
      }
    })

    childrenList.addEventListener("focusin", (event) => {
      const input = event.target.closest("[data-role='child-last-name']")
      if (!input) return

      if (input.dataset.prefilled === "true" && input.dataset.touched !== "true") {
        input.value = ""
        input.dataset.touched = "true"
      }
    })

    childrenList.addEventListener("input", (event) => {
      const input = event.target.closest("[data-role='child-last-name']")
      if (!input) return

      input.dataset.touched = "true"
      input.dataset.prefilled = "false"
    })

    updatePartnerFields()
    updateChildrenSection()
    refreshChildCardChrome()
    refreshResponsibilityOptions()
  })
}

function wireMobileExtendedFamilyForms() {
  const siblingsInputs = document.querySelectorAll("[data-role='siblings-alive']")
  if (!siblingsInputs.length) return

  const countField = document.querySelector("[data-role='siblings-count']")
  const numberInput = countField?.querySelector("input")
  if (!countField || !numberInput) return

  const sync = () => {
    const selected = Array.from(siblingsInputs).find((input) => input.checked)?.value
    const shouldShow = selected === "yes"
    countField.hidden = !shouldShow
    if (!shouldShow) numberInput.value = ""
  }

  siblingsInputs.forEach((input) => input.addEventListener("change", sync))
  sync()
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}
