import SwiftUI

struct SignUpView: View {
    @Environment(AuthService.self) private var authService
    @Environment(\.dismiss) private var dismiss

    @State private var email = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var isLoading = false
    @State private var errorMessage: String?

    private var passwordsMatch: Bool {
        !confirmPassword.isEmpty && password == confirmPassword
    }

    private var isFormValid: Bool {
        !email.isEmpty && password.count >= 8 && passwordsMatch
    }

    var body: some View {
        VStack(spacing: 0) {
            Spacer()

            VStack(spacing: 16) {
                Text("Create Account")
                    .font(.system(size: 28, weight: .bold))
                    .foregroundStyle(Theme.Colors.foreground)

                Text("Start your EPPP preparation")
                    .font(.subheadline)
                    .foregroundStyle(Theme.Colors.mutedForeground)
            }
            .padding(.bottom, 40)

            VStack(spacing: 16) {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Email")
                        .font(.caption)
                        .foregroundStyle(Theme.Colors.mutedForeground)
                    TextField("", text: $email, prompt: Text("you@example.com").foregroundStyle(Theme.Colors.dimForeground))
                        .textFieldStyle(.plain)
                        .foregroundStyle(Theme.Colors.foreground)
                        .textContentType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .keyboardType(.emailAddress)
                        .autocorrectionDisabled()
                        .padding(12)
                        .background(Theme.Colors.card)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(Theme.Colors.border, lineWidth: 1)
                        )
                }

                VStack(alignment: .leading, spacing: 6) {
                    Text("Password")
                        .font(.caption)
                        .foregroundStyle(Theme.Colors.mutedForeground)
                    SecureField("At least 8 characters", text: $password)
                        .textFieldStyle(.plain)
                        .textContentType(.newPassword)
                        .padding(12)
                        .background(Theme.Colors.card)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(Theme.Colors.border, lineWidth: 1)
                        )
                }

                VStack(alignment: .leading, spacing: 6) {
                    Text("Confirm Password")
                        .font(.caption)
                        .foregroundStyle(Theme.Colors.mutedForeground)
                    SecureField("Confirm password", text: $confirmPassword)
                        .textFieldStyle(.plain)
                        .textContentType(.newPassword)
                        .padding(12)
                        .background(Theme.Colors.card)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(Theme.Colors.border, lineWidth: 1)
                        )

                    if !confirmPassword.isEmpty && !passwordsMatch {
                        Text("Passwords don't match")
                            .font(.caption)
                            .foregroundStyle(Theme.Colors.destructive)
                    }
                }

                if let errorMessage {
                    Text(errorMessage)
                        .font(.caption)
                        .foregroundStyle(Theme.Colors.destructive)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }

                Button {
                    signUp()
                } label: {
                    Group {
                        if isLoading {
                            ProgressView()
                                .tint(.white)
                        } else {
                            Text("Create Account")
                                .fontWeight(.semibold)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 48)
                }
                .buttonStyle(PillButtonStyle())
                .disabled(isLoading || !isFormValid)
            }
            .padding(.horizontal, 24)

            Spacer()
        }
        .background(Theme.Colors.background.ignoresSafeArea())
        .navigationBarBackButtonHidden(false)
    }

    private func signUp() {
        isLoading = true
        errorMessage = nil

        Task {
            do {
                try await authService.signUp(email: email, password: password)
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoading = false
        }
    }
}

#Preview {
    NavigationStack {
        SignUpView()
            .environment(AuthService())
            .preferredColorScheme(.dark)
    }
}
