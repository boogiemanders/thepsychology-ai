import SwiftUI

/// Sheet shown from LobbyView — host writes 5 cards for the deck.
struct CardSubmitView: View {
    @Environment(RoomStore.self) private var store
    @Environment(\.dismiss) private var dismiss

    @State private var texts: [String] = Array(repeating: "", count: 5)
    @State private var notes: [String] = Array(repeating: "", count: 5)
    @State private var showNote: [Bool] = Array(repeating: false, count: 5)
    @State private var saving = false
    @State private var saveError: String?

    private var filledCount: Int { texts.filter { !$0.trimmingCharacters(in: .whitespaces).isEmpty }.count }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    Text("Anything goes — people everyone knows, oddly specific behaviors, characters, objects. No censorship. Secret notes show up in the recap.")
                        .font(.system(size: 13))
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)

                    ForEach(0..<5, id: \.self) { i in
                        VStack(alignment: .leading, spacing: 6) {
                            HStack(spacing: 10) {
                                Text(String(format: "%02d", i + 1))
                                    .font(.system(size: 11, design: .monospaced))
                                    .foregroundStyle(.tertiary)
                                    .frame(width: 20, alignment: .leading)
                                TextField("A card...", text: $texts[i])
                                    .textFieldStyle(.plain)
                                    .padding(.vertical, 10)
                                    .padding(.horizontal, 12)
                                    .background(Color.white.opacity(0.06))
                                    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                                Button {
                                    showNote[i].toggle()
                                } label: {
                                    Image(systemName: showNote[i] ? "minus.circle" : "plus.circle")
                                        .foregroundStyle(.tertiary)
                                }
                            }
                            if showNote[i] {
                                TextField("secret note", text: $notes[i])
                                    .textFieldStyle(.plain)
                                    .font(.system(size: 13))
                                    .padding(.vertical, 8)
                                    .padding(.horizontal, 12)
                                    .background(Color.white.opacity(0.04))
                                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                                    .padding(.leading, 30)
                            }
                        }
                    }

                    if let e = saveError {
                        Text(e).font(.system(size: 13)).foregroundStyle(.red)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 16)
                .padding(.bottom, 40)
            }
            .background(Color.black)
            .navigationTitle("Your 5 cards")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }.foregroundStyle(.secondary)
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        saving = true
                        Task {
                            let payload: [(text: String, note: String?)] = (0..<5).compactMap { i in
                                let t = texts[i].trimmingCharacters(in: .whitespaces)
                                guard !t.isEmpty else { return nil }
                                let n = notes[i].trimmingCharacters(in: .whitespaces)
                                return (text: t, note: n.isEmpty ? nil : n)
                            }
                            let ok = await store.submitCards(payload)
                            saving = false
                            if ok { dismiss() }
                            else { saveError = store.errorMessage ?? "Save failed" }
                        }
                    } label: {
                        Text(saving ? "Saving..." : "Save \(filledCount)")
                    }
                    .disabled(saving || filledCount == 0)
                }
            }
        }
        .preferredColorScheme(.dark)
    }
}
