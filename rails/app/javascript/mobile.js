// Turbo loads before any bridge-component imports (Phase F onward depend on this).
import "@hotwired/turbo-rails"
import "controllers"

import { initChoiceGroups } from "mobile/choice_group"
import { initExtendedFamilyForm } from "mobile/extended_family_form"
import { initFamilyForm } from "mobile/family_form"
import { initPickerSheets } from "mobile/picker_sheet"
import { initSplashRedirect } from "mobile/splash_redirect"

document.documentElement.classList.add("js")

// turbo:load fires on initial page load AND every Turbo visit, so it's all we need.
// Phase B replaces these init calls with Stimulus controllers that auto-connect.
document.addEventListener("turbo:load", () => {
  initChoiceGroups()
  initPickerSheets()
  initFamilyForm()
  initExtendedFamilyForm()
  initSplashRedirect()
})
