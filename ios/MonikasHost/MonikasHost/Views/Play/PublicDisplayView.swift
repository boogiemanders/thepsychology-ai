import SwiftUI

/// Rendered on the external display (TV via AirPlay or HDMI).
/// Shows the public lobby: big room code, big QR, players list.
/// In gameplay (M3), this becomes the game scene — timer, actor, team, round.
struct PublicDisplayView: View {
    @Environment(RoomStore.self) private var store

    var body: some View {
        GeometryReader { geo in
            ZStack {
                Color.black.ignoresSafeArea()

                if store.room == nil {
                    VStack(spacing: 18) {
                        Text("MONIKAS")
                            .font(.system(size: min(geo.size.width * 0.14, 200), weight: .bold))
                            .tracking(-2)
                            .foregroundStyle(.white)
                        Text("Open the app on your phone and create a room.")
                            .font(.system(size: 24))
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if store.room?.status == .lobby {
                    lobbyContent(size: geo.size)
                } else {
                    gameStartedContent(size: geo.size)
                }
            }
        }
        .preferredColorScheme(.dark)
    }

    private func lobbyContent(size: CGSize) -> some View {
        let code = store.room?.roomCode ?? "----"
        let joinURL = "\(Constants.webJoinBaseURL)/\(code)"
        let qrSize = min(size.height * 0.55, 520)

        return VStack(spacing: 0) {
            HStack(alignment: .center, spacing: 64) {
                VStack(alignment: .leading, spacing: 18) {
                    Text("ROOM")
                        .font(.system(size: 28, weight: .medium, design: .monospaced))
                        .tracking(8)
                        .foregroundStyle(.secondary)
                    Text(code)
                        .font(.system(size: min(size.width * 0.2, 320), weight: .bold, design: .monospaced))
                        .tracking(-6)
                        .foregroundStyle(.white)
                        .minimumScaleFactor(0.4)
                        .lineLimit(1)
                }

                VStack(spacing: 18) {
                    if let qr = QRCodeGenerator.make(joinURL, size: 900) {
                        Image(uiImage: qr)
                            .interpolation(.none)
                            .resizable()
                            .scaledToFit()
                            .frame(width: qrSize, height: qrSize)
                            .padding(28)
                            .background(Color.white)
                            .clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
                    }
                    Text("Scan to join")
                        .font(.system(size: 22, weight: .medium, design: .monospaced))
                        .tracking(4)
                        .textCase(.uppercase)
                        .foregroundStyle(.secondary)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .padding(.horizontal, 80)

            VStack(alignment: .leading, spacing: 14) {
                HStack {
                    Text("Players")
                        .font(.system(size: 18, weight: .medium, design: .monospaced))
                        .tracking(4)
                        .textCase(.uppercase)
                        .foregroundStyle(.tertiary)
                    Spacer()
                    Text("\(store.players.count)")
                        .font(.system(size: 18, design: .monospaced))
                        .foregroundStyle(.tertiary)
                }

                if store.players.isEmpty {
                    Text("Waiting for players...")
                        .font(.system(size: 26))
                        .foregroundStyle(.secondary)
                        .padding(.vertical, 14)
                } else {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 22) {
                            ForEach(store.players) { p in
                                HStack(spacing: 14) {
                                    Circle()
                                        .fill(Color.white.opacity(0.12))
                                        .frame(width: 56, height: 56)
                                        .overlay(
                                            Text(initials(p.displayName))
                                                .font(.system(size: 20, weight: .semibold))
                                                .foregroundStyle(.secondary)
                                        )
                                    Text(p.displayName)
                                        .font(.system(size: 32, weight: .medium))
                                        .foregroundStyle(.white)
                                }
                                .padding(.vertical, 12)
                                .padding(.horizontal, 20)
                                .background(Color.white.opacity(0.06))
                                .clipShape(Capsule())
                            }
                        }
                    }
                }
            }
            .padding(.horizontal, 80)
            .padding(.bottom, 40)
        }
    }

    private func gameStartedContent(size: CGSize) -> some View {
        let actor = activeActorName ?? "—"
        return VStack(spacing: 30) {
            Text("GAME STARTED")
                .font(.system(size: min(size.width * 0.08, 120), weight: .bold, design: .monospaced))
                .tracking(8)
                .foregroundStyle(.white)
            Text("First up")
                .font(.system(size: 22, weight: .medium, design: .monospaced))
                .tracking(4)
                .textCase(.uppercase)
                .foregroundStyle(.tertiary)
            Text(actor)
                .font(.system(size: min(size.width * 0.15, 240), weight: .bold))
                .tracking(-4)
                .foregroundStyle(.white)
                .minimumScaleFactor(0.3)
                .lineLimit(1)
            Text("Gameplay loop — timer, card, Got It / Skip — arrives in Milestone 3.")
                .font(.system(size: 16))
                .foregroundStyle(.tertiary)
                .padding(.top, 20)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(40)
    }

    private var activeActorName: String? {
        guard let id = store.room?.activeActorPlayerId else { return nil }
        return store.players.first(where: { $0.id == id })?.displayName
    }

    private func initials(_ name: String) -> String {
        name.split(separator: " ")
            .compactMap { $0.first }
            .prefix(2)
            .map { String($0).uppercased() }
            .joined()
    }
}
