import Foundation
import Network
import Observation

@Observable
final class NetworkMonitor {
    private let monitor = NWPathMonitor()
    private let queue = DispatchQueue(label: "ai.thepsychology.eppp.networkmonitor")

    private(set) var isConnected = true
    private(set) var connectionType: ConnectionType = .unknown

    var onConnectionRestored: (() -> Void)?

    enum ConnectionType {
        case wifi
        case cellular
        case wired
        case unknown
    }

    init() {
        startMonitoring()
    }

    deinit {
        monitor.cancel()
    }

    private func startMonitoring() {
        monitor.pathUpdateHandler = { [weak self] path in
            guard let self else { return }
            let wasConnected = self.isConnected
            let newConnected = path.status == .satisfied

            DispatchQueue.main.async {
                self.isConnected = newConnected
                self.connectionType = self.resolveConnectionType(path)

                if !wasConnected && newConnected {
                    self.onConnectionRestored?()
                }
            }
        }
        monitor.start(queue: queue)
    }

    private func resolveConnectionType(_ path: NWPath) -> ConnectionType {
        if path.usesInterfaceType(.wifi) { return .wifi }
        if path.usesInterfaceType(.cellular) { return .cellular }
        if path.usesInterfaceType(.wiredEthernet) { return .wired }
        return .unknown
    }
}
