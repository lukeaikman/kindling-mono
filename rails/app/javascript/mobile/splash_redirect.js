import { Turbo } from "@hotwired/turbo-rails"

export function initSplashRedirect() {
  const root = document.getElementById("mobile-splash-root")
  if (!root) return
  if (root.dataset.splashRedirected === "true") return
  root.dataset.splashRedirected = "true"

  const destination = root.dataset.destination || "/mobile/intro"

  window.setTimeout(() => {
    Turbo.visit(destination, { action: "replace" })
  }, 450)
}
