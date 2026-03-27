import SwiftUI

struct StorageView: View {
    @Environment(ContentManager.self) private var contentManager

    @State private var showDeleteConfirmation = false

    var body: some View {
        VStack(spacing: 24) {
            // Total usage
            VStack(spacing: 8) {
                Image(systemName: "internaldrive")
                    .font(.system(size: 36))
                    .foregroundStyle(.secondary)

                Text(contentManager.formattedStorageUsage)
                    .font(.system(size: 32, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)

                Text("Total downloaded content")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .padding(.top, 32)

            // Breakdown
            VStack(spacing: 12) {
                storageRow(
                    icon: "book",
                    label: "Lessons",
                    count: contentManager.getDownloadedLessons().count
                )
                storageRow(
                    icon: "pencil.and.list.clipboard",
                    label: "Exams",
                    count: contentManager.getDownloadedExams().count
                )
            }
            .padding()
            .background(Color(.systemGray6))
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .padding(.horizontal)

            Spacer()

            // Delete all
            Button(role: .destructive) {
                showDeleteConfirmation = true
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: "trash")
                    Text("Delete All Downloads")
                }
                .frame(maxWidth: .infinity)
                .frame(height: 48)
            }
            .buttonStyle(.bordered)
            .tint(.red)
            .padding(.horizontal)
            .padding(.bottom, 16)
        }
        .alert("Delete All Downloads?", isPresented: $showDeleteConfirmation) {
            Button("Cancel", role: .cancel) {}
            Button("Delete All", role: .destructive) {
                try? contentManager.deleteAllDownloads()
            }
        } message: {
            Text("This will remove all downloaded lessons and exams. Your progress will not be affected.")
        }
    }

    private func storageRow(icon: String, label: String, count: Int) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundStyle(.secondary)
                .frame(width: 24)
            Text(label)
                .font(.subheadline)
                .foregroundStyle(.white)
            Spacer()
            Text("\(count) items")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }
}

#Preview {
    StorageView()
        .environment(ContentManager(
            apiClient: APIClient(authService: AuthService()),
            localStore: LocalStore()
        ))
        .preferredColorScheme(.dark)
}
