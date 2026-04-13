document.addEventListener("DOMContentLoaded", () => {
  wireAlertDismissals()
  wireCollapses()
  wireDropdowns()
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
