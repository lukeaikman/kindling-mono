import Foundation
import HotwireNative
import UIKit

/// Bridge component that presents a native wheel-style date picker
/// (UIDatePicker with .wheels style) in a medium-detent bottom sheet
/// when the web sends a "display" event. Replies { value: "YYYY-MM-DD" }
/// when Done is tapped, no reply if dismissed.
final class DatePickerComponent: BridgeComponent {
    override class var name: String { "date-picker" }

    override func onReceive(message: Message) {
        guard let event = Event(rawValue: message.event) else { return }

        switch event {
        case .display:
            handleDisplay(message: message)
        }
    }

    // MARK: Private

    private var hostViewController: UIViewController? {
        delegate?.destination as? UIViewController
    }

    private func handleDisplay(message: Message) {
        guard let data: DisplayData = message.data() else { return }
        guard let host = hostViewController else { return }

        let picker = DatePickerSheetViewController(
            title: data.title,
            initialDate: Self.parseISO(data.value),
            minimumDate: Self.parseISO(data.minDate),
            maximumDate: Self.parseISO(data.maxDate)
        ) { [weak self] pickedDate in
            self?.reply(
                to: Event.display.rawValue,
                with: SelectionData(value: Self.formatISO(pickedDate))
            )
        }

        if let sheet = picker.sheetPresentationController {
            sheet.detents = [.custom(identifier: .init("datePickerCompact")) { _ in 370 }]
            sheet.prefersGrabberVisible = true
            sheet.preferredCornerRadius = 16
        }

        host.present(picker, animated: true)
    }

    // MARK: ISO helpers

    private static let isoFormatter: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = TimeZone.current
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()

    private static func parseISO(_ value: String?) -> Date? {
        guard let value, !value.isEmpty else { return nil }
        return isoFormatter.date(from: value)
    }

    private static func formatISO(_ date: Date) -> String {
        isoFormatter.string(from: date)
    }
}

// MARK: Events

private extension DatePickerComponent {
    enum Event: String {
        case display
    }
}

// MARK: Message data

private extension DatePickerComponent {
    struct DisplayData: Decodable {
        let title: String
        let value: String?
        let minDate: String?
        let maxDate: String?
    }

    struct SelectionData: Encodable {
        let value: String
    }
}

// MARK: - Date picker sheet view controller

private final class DatePickerSheetViewController: UIViewController {
    private let sheetTitle: String
    private let initialDate: Date?
    private let minimumDate: Date?
    private let maximumDate: Date?
    private let onSelect: (Date) -> Void

    private let datePicker = UIDatePicker()

    init(title: String, initialDate: Date?, minimumDate: Date?, maximumDate: Date?, onSelect: @escaping (Date) -> Void) {
        self.sheetTitle = title
        self.initialDate = initialDate
        self.minimumDate = minimumDate
        self.maximumDate = maximumDate
        self.onSelect = onSelect
        super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) { fatalError("not used") }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground

        let titleLabel = UILabel()
        titleLabel.text = sheetTitle
        titleLabel.font = .preferredFont(forTextStyle: .headline)
        titleLabel.textAlignment = .center
        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(titleLabel)

        datePicker.datePickerMode = .date
        datePicker.preferredDatePickerStyle = .wheels
        if let minimumDate { datePicker.minimumDate = minimumDate }
        if let maximumDate { datePicker.maximumDate = maximumDate }
        if let initialDate { datePicker.date = initialDate }
        datePicker.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(datePicker)

        let doneButton = UIButton(type: .system)
        doneButton.setTitle("Done", for: .normal)
        doneButton.titleLabel?.font = .preferredFont(forTextStyle: .headline)
        doneButton.translatesAutoresizingMaskIntoConstraints = false
        doneButton.addAction(UIAction { [weak self] _ in
            guard let self else { return }
            let chosen = self.datePicker.date
            self.onSelect(chosen)
            self.dismiss(animated: true)
        }, for: .touchUpInside)
        view.addSubview(doneButton)

        NSLayoutConstraint.activate([
            titleLabel.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 16),
            titleLabel.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 16),
            titleLabel.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -16),

            datePicker.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 8),
            datePicker.centerXAnchor.constraint(equalTo: view.centerXAnchor),

            doneButton.topAnchor.constraint(equalTo: datePicker.bottomAnchor, constant: 8),
            doneButton.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -16),
            doneButton.bottomAnchor.constraint(lessThanOrEqualTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -12)
        ])
    }
}
