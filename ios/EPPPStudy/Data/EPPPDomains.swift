import Foundation

/// Static EPPP domain + topic catalog, ported 1:1 from `src/lib/eppp-data.ts`.
/// Keep in sync — if topics change on web, mirror the change here.
///
/// Topic names must match web exactly (case + punctuation) because they are
/// passed as the `topic` query param to `/topic-teacher` in the embedded
/// webview.
struct EPPPTopic: Identifiable, Hashable {
    let name: String
    var id: String { name }
}

struct EPPPDomain: Identifiable, Hashable {
    let id: String
    let name: String
    let description: String
    let topics: [EPPPTopic]
}

enum EPPPDomains {
    static let all: [EPPPDomain] = [
        EPPPDomain(
            id: "1",
            name: "1: Biopsychology",
            description: "Neuroscience & Pharmacology",
            topics: [
                EPPPTopic(name: "Cerebral Cortex"),
                EPPPTopic(name: "Hindbrain, Midbrain, and Forebrain"),
                EPPPTopic(name: "Stress and Emotion"),
                EPPPTopic(name: "Memory and Sleep"),
                EPPPTopic(name: "Neurons and Neurotransmitters"),
                EPPPTopic(name: "Neurological and Endocrine Disorders"),
                EPPPTopic(name: "Pharmacology: Antidepressants and Antipsychotics"),
                EPPPTopic(name: "Pharmacology: Other Drugs"),
                EPPPTopic(name: "Sensory Perception"),
            ]
        ),
        EPPPDomain(
            id: "2",
            name: "2: Learning and Memory",
            description: "Classical & Operant Conditioning",
            topics: [
                EPPPTopic(name: "Pavlov and Classical Conditioning"),
                EPPPTopic(name: "Classical Conditioning Interventions"),
                EPPPTopic(name: "Operant Conditioning Interventions"),
                EPPPTopic(name: "Memory"),
                EPPPTopic(name: "Skinner and Operant Conditioning"),
            ]
        ),
        EPPPDomain(
            id: "3-social",
            name: "3: Social Psychology",
            description: "Social Behavior and Cognition",
            topics: [
                EPPPTopic(name: "Connection"),
                EPPPTopic(name: "Attitudes"),
                EPPPTopic(name: "Persuasion"),
                EPPPTopic(name: "Helping and Hurting"),
                EPPPTopic(name: "Why People Do Things"),
                EPPPTopic(name: "Errors and Shortcuts"),
                EPPPTopic(name: "Group Influences"),
                EPPPTopic(name: "Influence"),
            ]
        ),
        EPPPDomain(
            id: "3-cultural",
            name: "3: Cultural Considerations",
            description: "Cross-Cultural Issues",
            topics: [
                EPPPTopic(name: "Cultural Identity"),
                EPPPTopic(name: "Cultural Concepts"),
            ]
        ),
        EPPPDomain(
            id: "4",
            name: "4: Development",
            description: "Human Development Across the Lifespan",
            topics: [
                EPPPTopic(name: "Cognitive Development"),
                EPPPTopic(name: "Heredity and Environment"),
                EPPPTopic(name: "Before Birth"),
                EPPPTopic(name: "Language Development"),
                EPPPTopic(name: "Body Growth"),
                EPPPTopic(name: "School and Family"),
                EPPPTopic(name: "Bonding and Attachment"),
                EPPPTopic(name: "Morality"),
                EPPPTopic(name: "Temperament and Personality"),
            ]
        ),
        EPPPDomain(
            id: "5-assessment",
            name: "5: Assessment",
            description: "Psychological Testing and Measurement",
            topics: [
                EPPPTopic(name: "Clinical Tests"),
                EPPPTopic(name: "Career Interests"),
                EPPPTopic(name: "MMPI"),
                EPPPTopic(name: "Cognitive Tests"),
                EPPPTopic(name: "Personality Tests"),
                EPPPTopic(name: "IQ Tests"),
            ]
        ),
        EPPPDomain(
            id: "5-diagnosis",
            name: "5: Diagnosis",
            description: "Clinical Diagnosis and Mental Disorders",
            topics: [
                EPPPTopic(name: "Anxiety and OCD"),
                EPPPTopic(name: "Mood"),
                EPPPTopic(name: "Acting Out"),
                EPPPTopic(name: "Eating, Sleep, and Elimination"),
                EPPPTopic(name: "Neurocognitive"),
                EPPPTopic(name: "Neurodevelopmental"),
                EPPPTopic(name: "Personality"),
                EPPPTopic(name: "Psychosis"),
                EPPPTopic(name: "Sex and Gender"),
                EPPPTopic(name: "Substance Misuse"),
                EPPPTopic(name: "Trauma, Dissociation, and Somatic"),
            ]
        ),
        EPPPDomain(
            id: "5-test",
            name: "5: Test Construction",
            description: "Test Development and Psychometrics",
            topics: [
                EPPPTopic(name: "Items and Reliability"),
                EPPPTopic(name: "Interpreting Scores"),
                EPPPTopic(name: "What Tests Measure"),
                EPPPTopic(name: "Can Tests Predict"),
            ]
        ),
        EPPPDomain(
            id: "6",
            name: "6: Clinical Interventions",
            description: "Clinical Psychology",
            topics: [
                EPPPTopic(name: "Brief Therapies"),
                EPPPTopic(name: "CBT"),
                EPPPTopic(name: "Family and Group"),
                EPPPTopic(name: "Prevention and Consultation"),
                EPPPTopic(name: "Psychodynamic and Humanistic"),
            ]
        ),
        EPPPDomain(
            id: "7",
            name: "7: Research and Stats",
            description: "Research Design and Data Analysis",
            topics: [
                EPPPTopic(name: "Correlation and Regression"),
                EPPPTopic(name: "Stats Tests"),
                EPPPTopic(name: "Inferential Stats"),
                EPPPTopic(name: "Internal and External Validity"),
                EPPPTopic(name: "Research Designs"),
                EPPPTopic(name: "Variables"),
            ]
        ),
        EPPPDomain(
            id: "8",
            name: "8: Ethics",
            description: "Professional Conduct and Regulation",
            topics: [
                EPPPTopic(name: "Standards 1 and 2"),
                EPPPTopic(name: "Standards 3 and 4"),
                EPPPTopic(name: "Standards 5 and 6"),
                EPPPTopic(name: "Standards 7 and 8"),
                EPPPTopic(name: "Standards 9 and 10"),
                EPPPTopic(name: "Practice Issues"),
            ]
        ),
        EPPPDomain(
            id: "3-5-6",
            name: "3, 5, 6: I-O Psychology",
            description: "Industrial-Organizational Psychology",
            topics: [
                EPPPTopic(name: "How Careers Develop"),
                EPPPTopic(name: "Do Hiring Tools Work"),
                EPPPTopic(name: "Hiring Methods"),
                EPPPTopic(name: "Evaluating Jobs"),
                EPPPTopic(name: "How Orgs Change"),
                EPPPTopic(name: "Workplace Decisions"),
                EPPPTopic(name: "Leadership"),
                EPPPTopic(name: "Management Theories"),
                EPPPTopic(name: "Work Satisfaction"),
                EPPPTopic(name: "Work Motivation"),
                EPPPTopic(name: "Training and Evaluation"),
            ]
        ),
    ]
}
