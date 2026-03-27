import SwiftUI

struct NextActionCard: View {
    let action: NextAction

    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: iconName)
                .font(.title3)
                .foregroundStyle(.white)
                .frame(width: 44, height: 44)
                .background(Color(.systemGray5))
                .clipShape(RoundedRectangle(cornerRadius: 10))

            VStack(alignment: .leading, spacing: 3) {
                Text(action.title)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.white)
                Text(action.subtitle)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.caption.weight(.semibold))
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color(.systemGray6))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private var iconName: String {
        switch action.type {
        case .continueLesson: return "book"
        case .reviewWeakArea: return "exclamationmark.triangle"
        case .takeExam: return "pencil.and.list.clipboard"
        case .quickStudy: return "bolt"
        }
    }
}

#Preview {
    VStack(spacing: 12) {
        NextActionCard(action: NextAction(
            type: .continueLesson,
            title: "Continue: Brain Regions",
            subtitle: "Biological Bases - 60% complete",
            destination: .lesson(slug: "brain-regions")
        ))
        NextActionCard(action: NextAction(
            type: .reviewWeakArea,
            title: "Review Treatment & Intervention",
            subtitle: "Your weakest area at 35%",
            destination: .domain("Treatment & Intervention")
        ))
        NextActionCard(action: NextAction(
            type: .quickStudy,
            title: "Quick Study",
            subtitle: "5 practice questions across all domains",
            destination: .quickStudy
        ))
    }
    .padding()
    .preferredColorScheme(.dark)
}
