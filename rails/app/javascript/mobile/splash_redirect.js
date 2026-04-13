export function initSplashRedirect() {
  const root = document.getElementById("mobile-splash-root")
  if (!root) return

  const destination = root.dataset.destination || "/mobile/intro"

  window.setTimeout(() => {
    window.location.assign(destination)
  }, 450)
}
