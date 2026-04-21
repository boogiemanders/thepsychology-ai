import SwiftUI

struct HomeView: View {
    @Environment(RoomStore.self) private var store

    @State private var hostName: String = ""
    @State private var showingCreate: Bool = false
    @State private var isCreating: Bool = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                Spacer()

                VStack(alignment: .leading, spacing: 6) {
                    Text("Monikas")
                        .font(.system(size: 56, weight: .bold, design: .default))
                        .tracking(-1.5)
                    Text("A party game for your living room.")
                        .font(.system(size: 16))
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 24)

                Spacer()

                VStack(spacing: 12) {
                    Button {
                        showingCreate = true
                    } label: {
                        Text("Create room")
                            .font(.system(size: 17, weight: .medium))
                            .frame(maxWidth: .infinity, minHeight: 56)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.white)
                    .foregroundStyle(.black)

                    Button {
                        // TODO: Resume flow (M5)
                    } label: {
                        Text("Resume")
                            .font(.system(size: 17, weight: .medium))
                            .frame(maxWidth: .infinity, minHeight: 56)
                    }
                    .buttonStyle(.bordered)
                    .disabled(true)

                    NavigationLink {
                        SettingsView()
                    } label: {
                        Text("Settings")
                            .font(.system(size: 14))
                            .foregroundStyle(.secondary)
                    }
                    .padding(.top, 8)
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 40)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color.black)
            .navigationDestination(isPresented: Binding(
                get: { store.room != nil },
                set: { if !$0 { store.leave() } }
            )) {
                LobbyView()
            }
            .sheet(isPresented: $showingCreate) {
                createRoomSheet
                    .presentationDetents([.fraction(0.4)])
            }
        }
        .preferredColorScheme(.dark)
    }

    private var createRoomSheet: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("Your name")
                .font(.system(size: 11, weight: .medium))
                .tracking(1.4)
                .textCase(.uppercase)
                .foregroundStyle(.secondary)

            TextField("Host", text: $hostName)
                .textFieldStyle(.plain)
                .font(.system(size: 22, weight: .medium))
                .padding(.vertical, 12)
                .padding(.horizontal, 16)
                .background(Color(white: 0.1))
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))

            Button {
                Task {
                    isCreating = true
                    await store.createRoom(hostName: hostName.trimmingCharacters(in: .whitespacesAndNewlines))
                    isCreating = false
                    if store.room != nil { showingCreate = false }
                }
            } label: {
                Text(isCreating ? "Creating..." : "Create")
                    .font(.system(size: 17, weight: .medium))
                    .frame(maxWidth: .infinity, minHeight: 52)
            }
            .buttonStyle(.borderedProminent)
            .tint(.white)
            .foregroundStyle(.black)
            .disabled(hostName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || isCreating)

            if let error = store.errorMessage {
                Text(error)
                    .font(.system(size: 13))
                    .foregroundStyle(.red)
            }
        }
        .padding(.horizontal, 24)
        .padding(.top, 24)
        .frame(maxHeight: .infinity, alignment: .top)
        .background(Color.black)
    }
}
