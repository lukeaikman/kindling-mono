export function initExtendedFamilyForm() {
  const siblingsInputs = document.querySelectorAll("[data-role='siblings-alive'] input")
  if (!siblingsInputs.length) return

  const countField = document.querySelector("[data-role='siblings-count']")
  const numberInput = countField?.querySelector("input")
  if (!countField || !numberInput) return

  const sync = () => {
    const selected = Array.from(siblingsInputs).find((input) => input.checked)?.value
    const shouldShow = selected === "yes"
    countField.hidden = !shouldShow

    if (!shouldShow) {
      numberInput.value = ""
    }
  }

  siblingsInputs.forEach((input) => input.addEventListener("change", sync))
  sync()
}
