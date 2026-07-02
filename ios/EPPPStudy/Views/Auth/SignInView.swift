import SwiftUI

struct SignInView: View {
    @Environment(AuthService.self) private var authService

    @State private var email = ""
    @State private var password = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var showSignUp = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                Spacer()

                // Logo and title
                VStack(spacing: 12) {
                    if let logo = UIImage(named: "BunnyLogo") {
                        Image(uiImage: logo)
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .frame(width: 120, height: 120)
                    } else {
                        Image(systemName: "pawprint.fill")
                            .font(.system(size: 56))
                            .foregroundStyle(Theme.Colors.sage)
                    }

                    Text("thePsychology.ai")
                        .font(.custom("HelveticaNeue-Bold", size: 28))
                        .foregroundStyle(Theme.Colors.foreground)

                    Text("EPPP Prep")
                        .font(.custom("HelveticaNeue", size: 14))
                        .foregroundStyle(Theme.Colors.mutedForeground)
                }
                .padding(.bottom, 48)

                // Form
                VStack(spacing: 16) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Email")
                            .font(.caption)
                            .foregroundStyle(Theme.Colors.mutedForeground)
                        TextField("you@example.com", text: $email)
                            .textFieldStyle(.plain)
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
                        SecureField("Password", text: $password)
                            .textFieldStyle(.plain)
                            .textContentType(.password)
                            .padding(12)
                            .background(Theme.Colors.card)
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(Theme.Colors.border, lineWidth: 1)
                            )
                    }

                    if let errorMessage {
                        Text(errorMessage)
                            .font(.caption)
                            .foregroundStyle(Theme.Colors.destructive)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }

                    Button {
                        signIn()
                    } label: {
                        Group {
                            if isLoading {
                                ProgressView()
                                    .tint(.white)
                            } else {
                                Text("Sign In")
                                    .fontWeight(.semibold)
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 48)
                    }
                    .buttonStyle(PillButtonStyle())
                    .disabled(isLoading || email.isEmpty || password.isEmpty)
                }
                .padding(.horizontal, 24)

                Spacer()

                // Sign up link
                HStack(spacing: 4) {
                    Text("Don't have an account?")
                        .foregroundStyle(Theme.Colors.mutedForeground)
                    Button("Create one") {
                        showSignUp = true
                    }
                    .foregroundStyle(Theme.Colors.link)
                    .fontWeight(.medium)
                }
                .font(.subheadline)
                .padding(.bottom, 32)
            }
            .background(Theme.Colors.background.ignoresSafeArea())
            .navigationDestination(isPresented: $showSignUp) {
                SignUpView()
            }
        }
    }

    private func signIn() {
        isLoading = true
        errorMessage = nil

        Task {
            do {
                try await authService.signIn(email: email, password: password)
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoading = false
        }
    }
}

#Preview {
    SignInView()
        .environment(AuthService())
        .preferredColorScheme(.dark)
}
