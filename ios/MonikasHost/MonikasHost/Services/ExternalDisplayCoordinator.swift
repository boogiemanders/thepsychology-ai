import UIKit
import SwiftUI
import Observation

/// Watches for external UIWindowScenes (AirPlay mirroring to a separate scene,
/// or a physical external display). When one appears, renders `PublicDisplayView`
/// in a second UIWindow attached to that scene. Phone keeps the main window.
///
/// Uses the iOS 13+ scene APIs only — no deprecated UIScreen notifications.
@Observable
final class ExternalDisplayCoordinator: @unchecked Sendable {
    private(set) var isConnected: Bool = false

    private var externalWindow: UIWindow?
    private var willConnectObserver: NSObjectProtocol?
    private var didDisconnectObserver: NSObjectProtocol?

    /// Set by the owner once the room store exists. Used to drive `PublicDisplayView`.
    var roomStore: RoomStore? {
        didSet { Task { @MainActor in self.refreshRoot() } }
    }

    @MainActor
    init() {
        // Pick up any external scene that's already active at launch.
        if let existing = UIApplication.shared.connectedScenes
            .compactMap({ $0 as? UIWindowScene })
            .first(where: { $0.screen != UIScreen.main }) {
            attach(scene: existing)
        }

        willConnectObserver = NotificationCenter.default.addObserver(
            forName: UIScene.willConnectNotification,
            object: nil,
            queue: .main
        ) { [weak self] note in
            guard let scene = note.object as? UIWindowScene,
                  scene.screen != UIScreen.main else { return }
            MainActor.assumeIsolated { self?.attach(scene: scene) }
        }

        didDisconnectObserver = NotificationCenter.default.addObserver(
            forName: UIScene.didDisconnectNotification,
            object: nil,
            queue: .main
        ) { [weak self] note in
            guard let scene = note.object as? UIWindowScene,
                  scene.screen != UIScreen.main else { return }
            MainActor.assumeIsolated { self?.detach() }
        }
    }

    deinit {
        if let willConnectObserver { NotificationCenter.default.removeObserver(willConnectObserver) }
        if let didDisconnectObserver { NotificationCenter.default.removeObserver(didDisconnectObserver) }
    }

    @MainActor
    private func attach(scene: UIWindowScene) {
        let window = UIWindow(windowScene: scene)
        window.rootViewController = makeHost()
        window.isHidden = false
        self.externalWindow = window
        self.isConnected = true
    }

    @MainActor
    private func detach() {
        externalWindow?.isHidden = true
        externalWindow = nil
        isConnected = false
    }

    @MainActor
    private func makeHost() -> UIViewController {
        if let roomStore {
            return UIHostingController(rootView: PublicDisplayView().environment(roomStore))
        }
        return UIHostingController(rootView: PublicDisplayView())
    }

    @MainActor
    private func refreshRoot() {
        guard let window = externalWindow else { return }
        window.rootViewController = makeHost()
    }
}
