import SwiftUI

private let minPlayersToStart = 1

struct LobbyView: View {
    @Environment(RoomStore.self) private var store
    @State private var starting = false
    @State private var showCardSheet = false

    var body: some View {
        if store.room?.status != .lobby && store.room != nil {
            GameplayPlaceholderView()
        } else {
            lobbyBody
        }
    }

    private var lobbyBody: some View {
        GeometryReader { geo in
            let isLandscape = geo.size.width > geo.size.height

            ZStack {
                Color.black.ignoresSafeArea()

                if isLandscape {
                    VStack(spacing: 0) {
                        HStack(spacing: 48) {
                            roomCodeBlock(huge: true)
                            qrBlock(size: min(geo.size.height * 0.6, 420))
                        }
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .padding(.horizontal, 48)

                        playerStrip
                            .padding(.horizontal, 48)
                            .padding(.bottom, 16)

                        startButton
                            .padding(.horizontal, 24)
                            .padding(.bottom, 24)
                    }
                } else {
                    VStack(spacing: 20) {
                        roomCodeBlock(huge: false)
                            .padding(.horizontal, 32)
                            .padding(.top, 20)

                        qrBlock(size: min(geo.size.width * 0.6, 280))
                            .frame(maxHeight: .infinity)

                        playerStrip
                            .padding(.horizontal, 24)

                        startButton
                            .padding(.bottom, 24)
                    }
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Leave") { store.leave() }
                        .foregroundStyle(.secondary)
                }
            }
        }
        .preferredColorScheme(.dark)
    }

    // MARK: - Pieces

    private func roomCodeBlock(huge: Bool) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Room")
                .font(.system(size: huge ? 22 : 12, weight: .medium, design: .monospaced))
                .tracking(huge ? 6 : 2)
                .textCase(.uppercase)
                .foregroundStyle(.tertiary)
            Text(store.room?.roomCode ?? "----")
                .font(.system(size: huge ? 240 : 96, weight: .bold, design: .monospaced))
                .tracking(huge ? -6 : -2)
                .foregroundStyle(.white)
                .minimumScaleFactor(0.6)
                .lineLimit(1)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func qrBlock(size: CGFloat) -> some View {
        VStack(alignment: .center, spacing: 14) {
            if let code = store.room?.roomCode,
               let url = URL(string: "\(Constants.webJoinBaseURL)/\(code)"),
               let qr = QRCodeGenerator.make(url.absoluteString, size: 800) {
                Image(uiImage: qr)
                    .interpolation(.none)
                    .resizable()
                    .scaledToFit()
                    .frame(width: size, height: size)
                    .padding(20)
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
            } else {
                RoundedRectangle(cornerRadius: 24, style: .continuous)
                    .fill(Color.white.opacity(0.05))
                    .frame(width: size + 40, height: size + 40)
            }

            Text("Scan to join")
                .font(.system(size: 14, weight: .medium, design: .monospaced))
                .tracking(3)
                .textCase(.uppercase)
                .foregroundStyle(.secondary)
        }
    }

    private var playerStrip: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("Players")
                    .font(.system(size: 12, weight: .medium, design: .monospaced))
                    .tracking(2)
                    .textCase(.uppercase)
                    .foregroundStyle(.tertiary)
                Spacer()
                Text("\(store.players.count)")
                    .font(.system(size: 12, design: .monospaced))
                    .foregroundStyle(.tertiary)
            }

            if store.players.isEmpty {
                Text("Waiting for players...")
                    .font(.system(size: 16))
                    .foregroundStyle(.secondary)
                    .padding(.vertical, 14)
            } else {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 20) {
                        ForEach(store.players) { p in
                            HStack(spacing: 10) {
                                Circle()
                                    .fill(Color.white.opacity(0.1))
                                    .frame(width: 36, height: 36)
                                    .overlay(
                                        Text(initials(p.displayName))
                                            .font(.system(size: 13, weight: .semibold))
                                            .foregroundStyle(.secondary)
                                    )
                                VStack(alignment: .leading, spacing: 2) {
                                    HStack(spacing: 6) {
                                        Text(p.displayName)
                                            .font(.system(size: 20, weight: .medium))
                                            .foregroundStyle(.white)
                                        if p.id == store.selfPlayerId {
                                            Text("(host)")
                                                .font(.system(size: 11))
                                                .foregroundStyle(.tertiary)
                                        }
                                    }
                                    Text(cardCountLabel(for: p))
                                        .font(.system(size: 11, design: .monospaced))
                                        .foregroundStyle(cardsDone(for: p) ? .green : .secondary)
                                }
                            }
                            .padding(.vertical, 8)
                            .padding(.horizontal, 14)
                            .background(Color.white.opacity(0.05))
                            .clipShape(Capsule())
                        }
                    }
                }
            }
        }
    }

    private func initials(_ name: String) -> String {
        name.split(separator: " ")
            .compactMap { $0.first }
            .prefix(2)
            .map { String($0).uppercased() }
            .joined()
    }

    private func cardCountLabel(for p: Player) -> String {
        let n = store.cardCounts[p.id] ?? 0
        return "\(n)/5 cards"
    }

    private func cardsDone(for p: Player) -> Bool {
        (store.cardCounts[p.id] ?? 0) >= 5
    }

    private var startButton: some View {
        let enabled = store.players.count >= minPlayersToStart && !starting
        let myCards = store.selfPlayerId.flatMap { store.cardCounts[$0] } ?? 0

        return VStack(spacing: 10) {
            Button {
                showCardSheet = true
            } label: {
                Text(myCards >= 5 ? "Edit your 5 cards" : "Write your 5 cards (\(myCards)/5)")
                    .font(.system(size: 15, weight: .medium))
                    .frame(maxWidth: .infinity, minHeight: 46)
            }
            .buttonStyle(.bordered)
            .tint(.white)

            Button {
                starting = true
                Task {
                    await store.startGame()
                    starting = false
                }
            } label: {
                Text(starting ? "Starting..." : (store.players.count < minPlayersToStart
                    ? "Need \(minPlayersToStart - store.players.count) more"
                    : "Start game"))
                    .font(.system(size: 17, weight: .semibold))
                    .frame(maxWidth: .infinity, minHeight: 56)
            }
            .buttonStyle(.borderedProminent)
            .tint(.white)
            .foregroundStyle(.black)
            .disabled(!enabled)
        }
        .padding(.horizontal, 24)
        .sheet(isPresented: $showCardSheet) {
            CardSubmitView()
                .environment(store)
        }
    }
}

/// Placeholder shown after host taps Start. Real gameplay arrives in Milestone 3.
struct GameplayPlaceholderView: View {
    @Environment(RoomStore.self) private var store

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            VStack(spacing: 20) {
                Text("GAME STARTED")
                    .font(.system(size: 40, weight: .bold, design: .monospaced))
                    .tracking(4)
                    .foregroundStyle(.white)
                if let actor = activeActorName {
                    Text("First up: \(actor)")
                        .font(.system(size: 22))
                        .foregroundStyle(.secondary)
                }
                Text("Gameplay loop — timer, card, Got It / Skip — arrives in Milestone 3.")
                    .font(.system(size: 14))
                    .foregroundStyle(.tertiary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }
        }
        .preferredColorScheme(.dark)
    }

    private var activeActorName: String? {
        guard let id = store.room?.activeActorPlayerId else { return nil }
        return store.players.first(where: { $0.id == id })?.displayName
    }
}
