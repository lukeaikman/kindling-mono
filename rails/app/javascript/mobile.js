// Turbo loads before any bridge-component imports (Phase F onward depend on this).
import "@hotwired/turbo-rails"
import "controllers"

import { initChoiceGroups } from "mobile/choice_group"
import { initExtendedFamilyForm } from "mobile/extended_family_form"
import { initFamilyForm } from "mobile/family_form"
import { initPickerSheets } from "mobile/picker_sheet"
import { initSplashRedirect } from "mobile/splash_redirect"

document.documentElement.classList.add("js")

const runInit = () => {
  initChoiceGroups()
  initPickerSheets()
  initFamilyForm()
  initExtendedFamilyForm()
  initSplashRedirect()
}

// Interim double-listener bridges to Phase B's Stimulus controllers.
document.addEventListener("DOMContentLoaded", runInit)
document.addEventListener("turbo:load", runInit)
