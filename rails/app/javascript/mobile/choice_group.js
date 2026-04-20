// Document-level delegates bind once when the module is imported.
// initChoiceGroups() is safe to call on every turbo:load — it only syncs state.
document.addEventListener("change", (event) => {
  const input = event.target
  if (!(input instanceof HTMLInputElement) || input.type !== "radio") return

  const group = input.closest("[data-mobile-choice-group]")
  if (!group) return

  syncChoiceGroup(group)
})

document.addEventListener("click", (event) => {
  const resetButton = event.target.closest("[data-mobile-choice-reset]")
  if (!resetButton) return

  event.preventDefault()

  const group = resetButton.closest("[data-mobile-choice-group]")
  if (!group) return

  group.querySelectorAll("input[type='radio']").forEach((input) => {
    input.checked = false
  })

  syncChoiceGroup(group)
})

export function initChoiceGroups() {
  document.querySelectorAll("[data-mobile-choice-group]").forEach(syncChoiceGroup)
}

function syncChoiceGroup(group) {
  const checkedInput = group.querySelector("input[type='radio']:checked")
  const collapsible = group.dataset.mobileChoiceGroup === "true"

  group.classList.toggle("is-collapsed", collapsible && Boolean(checkedInput))

  group.querySelectorAll(".mobile-radio-option").forEach((option) => {
    const input = option.querySelector("input[type='radio']")
    const isSelected = input === checkedInput

    option.classList.toggle("is-selected", isSelected)

    let resetButton = option.querySelector("[data-mobile-choice-reset]")
    if (!resetButton && isSelected && collapsible) {
      resetButton = document.createElement("button")
      resetButton.type = "button"
      resetButton.className = "mobile-radio-reset"
      resetButton.dataset.mobileChoiceReset = "true"
      resetButton.setAttribute("aria-label", "Change selection")
      resetButton.innerHTML = "&#8635;"
      option.appendChild(resetButton)
    }

    if (resetButton) {
      resetButton.hidden = !(isSelected && collapsible)
    }
  })
}
