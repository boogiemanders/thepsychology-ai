import SwiftUI
import AVFoundation

struct AudioPlayerView: View {
    let title: String
    let audioURL: String
    let startPosition: TimeInterval
    let onPositionChange: (TimeInterval) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var player: AVPlayer?
    @State private var isPlaying = false
    @State private var currentTime: TimeInterval = 0
    @State private var duration: TimeInterval = 0
    @State private var playbackRate: Float = 1.0
    @State private var timer: Timer?

    private let rates: [Float] = [0.75, 1.0, 1.25, 1.5, 2.0]

    var body: some View {
        NavigationStack {
            VStack(spacing: 32) {
                Spacer()

                // Title
                VStack(spacing: 8) {
                    Image(systemName: "headphones")
                        .font(.system(size: 48))
                        .foregroundStyle(.secondary)
                        .padding(.bottom, 8)
                    Text(title)
                        .font(.title3.weight(.semibold))
                        .foregroundStyle(.white)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 32)
                }

                Spacer()

                // Progress
                VStack(spacing: 8) {
                    Slider(value: $currentTime, in: 0...max(duration, 1)) { editing in
                        if !editing {
                            seek(to: currentTime)
                        }
                    }
                    .tint(.white)

                    HStack {
                        Text(formatTime(currentTime))
                            .font(.caption.monospacedDigit())
                            .foregroundStyle(.secondary)
                        Spacer()
                        Text(formatTime(duration))
                            .font(.caption.monospacedDigit())
                            .foregroundStyle(.secondary)
                    }
                }
                .padding(.horizontal, 24)

                // Controls
                HStack(spacing: 40) {
                    // Skip back 15s
                    Button {
                        skip(by: -15)
                    } label: {
                        Image(systemName: "gobackward.15")
                            .font(.title2)
                            .foregroundStyle(.white)
                    }

                    // Play/Pause
                    Button {
                        togglePlayback()
                    } label: {
                        Image(systemName: isPlaying ? "pause.circle.fill" : "play.circle.fill")
                            .font(.system(size: 64))
                            .foregroundStyle(.white)
                    }

                    // Skip forward 30s
                    Button {
                        skip(by: 30)
                    } label: {
                        Image(systemName: "goforward.30")
                            .font(.title2)
                            .foregroundStyle(.white)
                    }
                }

                // Speed
                HStack(spacing: 0) {
                    ForEach(rates, id: \.self) { rate in
                        Button {
                            setRate(rate)
                        } label: {
                            Text(rate == 1.0 ? "1x" : String(format: "%.2gx", rate))
                                .font(.caption.weight(.medium))
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(playbackRate == rate ? Color.white : Color.clear)
                                .foregroundStyle(playbackRate == rate ? .black : .secondary)
                                .clipShape(Capsule())
                        }
                    }
                }
                .padding(.bottom, 32)
            }
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                        .foregroundStyle(.white)
                }
            }
        }
        .onAppear { setupPlayer() }
        .onDisappear { cleanup() }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }

    // MARK: - Player

    private func setupPlayer() {
        guard let url = URL(string: audioURL) else { return }

        let playerItem = AVPlayerItem(url: url)
        player = AVPlayer(playerItem: playerItem)

        // Observe duration
        Task {
            if let dur = try? await playerItem.asset.load(.duration) {
                await MainActor.run {
                    duration = CMTimeGetSeconds(dur)
                }
            }
        }

        // Seek to start position
        if startPosition > 0 {
            let time = CMTime(seconds: startPosition, preferredTimescale: 600)
            player?.seek(to: time)
            currentTime = startPosition
        }

        // Start time updates
        timer = Timer.scheduledTimer(withTimeInterval: 0.5, repeats: true) { _ in
            guard let player else { return }
            currentTime = CMTimeGetSeconds(player.currentTime())
            onPositionChange(currentTime)
        }

        try? AVAudioSession.sharedInstance().setCategory(.playback)
        try? AVAudioSession.sharedInstance().setActive(true)
    }

    private func togglePlayback() {
        if isPlaying {
            player?.pause()
        } else {
            player?.play()
            player?.rate = playbackRate
        }
        isPlaying.toggle()
    }

    private func skip(by seconds: TimeInterval) {
        let newTime = max(0, min(currentTime + seconds, duration))
        seek(to: newTime)
    }

    private func seek(to time: TimeInterval) {
        let cmTime = CMTime(seconds: time, preferredTimescale: 600)
        player?.seek(to: cmTime)
        currentTime = time
    }

    private func setRate(_ rate: Float) {
        playbackRate = rate
        if isPlaying {
            player?.rate = rate
        }
    }

    private func cleanup() {
        timer?.invalidate()
        player?.pause()
        onPositionChange(currentTime)
    }

    private func formatTime(_ time: TimeInterval) -> String {
        let minutes = Int(time) / 60
        let seconds = Int(time) % 60
        return String(format: "%d:%02d", minutes, seconds)
    }
}

#Preview {
    AudioPlayerView(
        title: "Brain Regions & Functions",
        audioURL: "",
        startPosition: 0
    ) { _ in }
    .preferredColorScheme(.dark)
}
