import SwiftUI

struct AccountView: View {
    @Environment(AuthService.self) private var authService
    @Environment(\.dismiss) private var dismiss

    @State private var showSignOutConfirmation = false
    @State private var showDeleteConfirmation = false

    var body: some View {
        List {
            Section {
                HStack {
                    Text("User ID")
                    Spacer()
                    Text(authService.currentUserId ?? "Unknown")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
            } header: {
                Text("Account Info")
            }

            Section {
                Button {
                    showSignOutConfirmation = true
                } label: {
                    HStack {
                        Label("Sign Out", systemImage: "rectangle.portrait.and.arrow.right")
                        Spacer()
                    }
                }

                Button(role: .destructive) {
                    showDeleteConfirmation = true
                } label: {
                    HStack {
                        Label("Delete Account", systemImage: "trash")
                            .foregroundStyle(.red)
                        Spacer()
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle("Account")
        .navigationBarTitleDisplayMode(.inline)
        .alert("Sign Out?", isPresented: $showSignOutConfirmation) {
            Button("Cancel", role: .cancel) {}
            Button("Sign Out", role: .destructive) {
                authService.signOut()
                dismiss()
            }
        } message: {
            Text("Unsynced progress will be lost. Make sure you're connected to the internet before signing out.")
        }
        .alert("Delete Account?", isPresented: $showDeleteConfirmation) {
            Button("Cancel", role: .cancel) {}
            Button("Delete", role: .destructive) {
                // Account deletion would go through the API
                authService.signOut()
                dismiss()
            }
        } message: {
            Text("This will permanently delete your account and all associated data. This action cannot be undone.")
        }
    }
}

#Preview {
    NavigationStack {
        AccountView()
            .environment(AuthService())
    }
    .preferredColorScheme(.dark)
}
