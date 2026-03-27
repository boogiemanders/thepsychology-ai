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
                    .foregroundStyle(.white)

                Text("Start your EPPP preparation")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            .padding(.bottom, 40)

            VStack(spacing: 16) {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Email")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    TextField("you@example.com", text: $email)
                        .textFieldStyle(.plain)
                        .textContentType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .keyboardType(.emailAddress)
                        .autocorrectionDisabled()
                        .padding(12)
                        .background(Color(.systemGray6))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                }

                VStack(alignment: .leading, spacing: 6) {
                    Text("Password")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    SecureField("At least 8 characters", text: $password)
                        .textFieldStyle(.plain)
                        .textContentType(.newPassword)
                        .padding(12)
                        .background(Color(.systemGray6))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                }

                VStack(alignment: .leading, spacing: 6) {
                    Text("Confirm Password")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    SecureField("Confirm password", text: $confirmPassword)
                        .textFieldStyle(.plain)
                        .textContentType(.newPassword)
                        .padding(12)
                        .background(Color(.systemGray6))
                        .clipShape(RoundedRectangle(cornerRadius: 8))

                    if !confirmPassword.isEmpty && !passwordsMatch {
                        Text("Passwords don't match")
                            .font(.caption)
                            .foregroundStyle(.red)
                    }
                }

                if let errorMessage {
                    Text(errorMessage)
                        .font(.caption)
                        .foregroundStyle(.red)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }

                Button {
                    signUp()
                } label: {
                    Group {
                        if isLoading {
                            ProgressView()
                                .tint(.black)
                        } else {
                            Text("Create Account")
                                .fontWeight(.semibold)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 48)
                }
                .buttonStyle(.borderedProminent)
                .tint(.white)
                .foregroundStyle(.black)
                .clipShape(RoundedRectangle(cornerRadius: 8))
                .disabled(isLoading || !isFormValid)
            }
            .padding(.horizontal, 24)

            Spacer()
        }
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
