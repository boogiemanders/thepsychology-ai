import SwiftUI

@main
struct MonikasHostApp: App {
    var body: some Scene {
        WindowGroup {
            RootView()
        }
    }
}

/// Owns the service graph. Built on the main actor so RoomStore (@MainActor) is happy.
private struct RootView: View {
    @State private var api = APIClient()
    @State private var display = ExternalDisplayCoordinator()
    @State private var roomStore: RoomStore?

    var body: some View {
        Group {
            if let roomStore {
                HomeView()
                    .environment(api)
                    .environment(roomStore)
                    .environment(display)
            } else {
                Color.black.ignoresSafeArea()
            }
        }
        .preferredColorScheme(.dark)
        .task {
            if roomStore == nil {
                let store = RoomStore(api: api)
                roomStore = store
                display.roomStore = store
            }
        }
    }
}
