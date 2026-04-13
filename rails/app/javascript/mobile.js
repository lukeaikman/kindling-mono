import { initChoiceGroups } from "mobile/choice_group"
import { initExtendedFamilyForm } from "mobile/extended_family_form"
import { initFamilyForm } from "mobile/family_form"
import { initPickerSheets } from "mobile/picker_sheet"
import { initSplashRedirect } from "mobile/splash_redirect"

document.documentElement.classList.add("js")

document.addEventListener("DOMContentLoaded", () => {
  initChoiceGroups()
  initPickerSheets()
  initFamilyForm()
  initExtendedFamilyForm()
  initSplashRedirect()
})
