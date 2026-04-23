import Foundation
import HotwireNative
import UIKit

/// Bridge component that presents a native bottom-sheet picker
/// (UISheetPresentationController with medium + large detents) when
/// the web sends a "display" event. Replies { selectedIndex } when the
/// user taps a row, or no reply if the sheet is dismissed.
final class PickerComponent: BridgeComponent {
    override class var name: String { "picker-sheet" }

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

        let picker = PickerSheetViewController(
            title: data.title,
            items: data.items,
            selectedIndex: data.selectedIndex
        ) { [weak self] selectedIndex in
            self?.reply(
                to: Event.display.rawValue,
                with: SelectionData(selectedIndex: selectedIndex)
            )
        }

        if let sheet = picker.sheetPresentationController {
            sheet.detents = [.medium(), .large()]
            sheet.prefersGrabberVisible = true
            sheet.preferredCornerRadius = 16
        }

        host.present(picker, animated: true)
    }
}

// MARK: Events

private extension PickerComponent {
    enum Event: String {
        case display
    }
}

// MARK: Message data

private extension PickerComponent {
    struct DisplayData: Decodable {
        let title: String
        let items: [Item]
        let selectedIndex: Int?
    }

    struct Item: Decodable {
        let title: String
        let index: Int
    }

    struct SelectionData: Encodable {
        let selectedIndex: Int
    }
}

// MARK: - Picker view controller

private final class PickerSheetViewController: UIViewController {
    private let sheetTitle: String
    private let items: [PickerComponent.Item]
    private let initialSelectedIndex: Int?
    private let onSelect: (Int) -> Void

    private let tableView = UITableView(frame: .zero, style: .plain)

    init(title: String, items: [PickerComponent.Item], selectedIndex: Int?, onSelect: @escaping (Int) -> Void) {
        self.sheetTitle = title
        self.items = items
        self.initialSelectedIndex = selectedIndex
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

        tableView.translatesAutoresizingMaskIntoConstraints = false
        tableView.dataSource = self
        tableView.delegate = self
        tableView.register(UITableViewCell.self, forCellReuseIdentifier: "cell")
        view.addSubview(tableView)

        NSLayoutConstraint.activate([
            titleLabel.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 16),
            titleLabel.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 16),
            titleLabel.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -16),

            tableView.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 12),
            tableView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            tableView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            tableView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
    }
}

extension PickerSheetViewController: UITableViewDataSource, UITableViewDelegate {
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int { items.count }

    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "cell", for: indexPath)
        cell.textLabel?.text = items[indexPath.row].title
        cell.accessoryType = (indexPath.row == initialSelectedIndex) ? .checkmark : .none
        return cell
    }

    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        tableView.deselectRow(at: indexPath, animated: false)
        let index = items[indexPath.row].index
        dismiss(animated: true) { [onSelect] in
            onSelect(index)
        }
    }
}
