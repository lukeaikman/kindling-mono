// Turbo loads before any bridge-component imports (Phase F onward depend on this).
import "@hotwired/turbo-rails"
import "@hotwired/hotwire-native-bridge"
import "controllers"

document.documentElement.classList.add("js")
