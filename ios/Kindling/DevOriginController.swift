#if KINDLING_ORIGIN_DEV

import UIKit

final class DevOriginController: UIViewController {
    var onDismiss: (() -> Void)?

    private let textField = UITextField()
    private let errorLabel = UILabel()

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground
        title = "Dev origin override"

        navigationItem.leftBarButtonItem = UIBarButtonItem(
            systemItem: .cancel,
            primaryAction: UIAction { [weak self] _ in
                self?.dismiss(animated: true) { self?.onDismiss?() }
            }
        )
        navigationItem.rightBarButtonItem = UIBarButtonItem(
            systemItem: .save,
            primaryAction: UIAction { [weak self] _ in self?.save() }
        )

        let stack = UIStackView(arrangedSubviews: [
            makeLabel("Paste an HTTPS tunnel URL (e.g. https://xyz.ngrok.io). Leave blank + Clear to revert to the compile-time default."),
            textField,
            errorLabel,
            makeClearButton()
        ])
        stack.axis = .vertical
        stack.spacing = 12
        stack.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(stack)

        textField.placeholder = "https://…"
        textField.borderStyle = .roundedRect
        textField.autocapitalizationType = .none
        textField.autocorrectionType = .no
        textField.keyboardType = .URL
        textField.text = UserDefaults.standard.string(forKey: Origin.overrideDefaultsKey)

        errorLabel.textColor = .systemRed
        errorLabel.font = .preferredFont(forTextStyle: .footnote)
        errorLabel.numberOfLines = 0
        errorLabel.text = nil

        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 20),
            stack.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            stack.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20)
        ])
    }

    private func makeLabel(_ text: String) -> UILabel {
        let label = UILabel()
        label.text = text
        label.font = .preferredFont(forTextStyle: .footnote)
        label.textColor = .secondaryLabel
        label.numberOfLines = 0
        return label
    }

    private func makeClearButton() -> UIButton {
        var config = UIButton.Configuration.plain()
        config.title = "Clear override"
        let button = UIButton(configuration: config, primaryAction: UIAction { [weak self] _ in
            UserDefaults.standard.removeObject(forKey: Origin.overrideDefaultsKey)
            self?.showQuitAlert(message: "Override cleared. The app will now quit. Relaunch from the home screen to use the compile-time default.")
        })
        return button
    }

    private func save() {
        let raw = textField.text?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        if raw.isEmpty {
            errorLabel.text = "Enter a URL or use Clear."
            return
        }
        guard let url = URL(string: raw), url.scheme == "https", url.host != nil else {
            errorLabel.text = "URL must start with https:// and be valid."
            return
        }

        UserDefaults.standard.set(url.absoluteString, forKey: Origin.overrideDefaultsKey)
        showQuitAlert(message: "Saved. The app will now quit. Relaunch from the home screen to connect to \(url.host ?? url.absoluteString).")
    }

    private func showQuitAlert(message: String) {
        let alert = UIAlertController(title: "Relaunch required", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "Quit now", style: .destructive) { _ in
            // Dev builds only — fine to hard-exit. Clean cold launch
            // is the only way Origin.rails and the Navigator re-read
            // the saved UserDefaults key.
            UserDefaults.standard.synchronize()
            exit(0)
        })
        present(alert, animated: true)
    }
}

#endif
