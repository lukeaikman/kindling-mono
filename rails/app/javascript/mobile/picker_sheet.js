export function initPickerSheets() {
  document.querySelectorAll("[data-mobile-picker]").forEach(syncPicker)

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-mobile-picker-trigger]")
    if (trigger) {
      event.preventDefault()
      const picker = trigger.closest("[data-mobile-picker]")
      openPicker(picker)
      return
    }

    const option = event.target.closest("[data-mobile-picker-option]")
    if (option) {
      event.preventDefault()
      const picker = option.closest("[data-mobile-picker]")
      applyPickerSelection(picker, option.dataset.value || "")
      closePicker(picker)
      return
    }

    const closeButton = event.target.closest("[data-mobile-picker-close]")
    if (closeButton) {
      event.preventDefault()
      const picker = closeButton.closest("[data-mobile-picker]")
      closePicker(picker)
    }
  })

  document.addEventListener("change", (event) => {
    const select = event.target
    if (!(select instanceof HTMLSelectElement) || !select.matches("[data-mobile-picker-select]")) return

    syncPicker(select.closest("[data-mobile-picker]"))
  })
}

function openPicker(picker) {
  if (!picker) return

  const sheet = picker.querySelector("[data-mobile-picker-sheet]")
  if (!sheet) return

  sheet.hidden = false
  document.body.classList.add("mobile-sheet-open")
}

function closePicker(picker) {
  if (!picker) return

  const sheet = picker.querySelector("[data-mobile-picker-sheet]")
  if (!sheet) return

  sheet.hidden = true
  document.body.classList.remove("mobile-sheet-open")
}

function applyPickerSelection(picker, value) {
  const select = picker?.querySelector("[data-mobile-picker-select]")
  if (!select) return

  select.value = value
  select.dispatchEvent(new Event("change", { bubbles: true }))
}

function syncPicker(picker) {
  if (!picker) return

  const select = picker.querySelector("[data-mobile-picker-select]")
  const label = picker.querySelector("[data-mobile-picker-label]")
  const options = picker.querySelectorAll("[data-mobile-picker-option]")
  if (!select || !label) return

  const selectedOption = select.selectedOptions[0]
  const selectedValue = select.value
  const placeholder = picker.dataset.placeholder || ""

  label.textContent = selectedValue ? selectedOption?.textContent?.trim() || placeholder : placeholder
  label.classList.toggle("is-placeholder", !selectedValue)

  options.forEach((option) => {
    option.classList.toggle("is-selected", option.dataset.value === selectedValue)
  })
}
