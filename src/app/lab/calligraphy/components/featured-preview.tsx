interface FeaturedPreviewProps {
  text: string
  fontFamily: string
  model: string | null
}

export function FeaturedPreview({ text, fontFamily, model }: FeaturedPreviewProps) {
  return (
    <div className="cs-featured-sticky">
      <div className="cs-section-heading">
        <p className="cs-section-label">Featured Preview</p>
        <p className="cs-model-badge">{model ? `Translated with ${model}` : 'No translation yet'}</p>
      </div>

      <article className="cs-featured-card">
        <p className="cs-preview-label">Chinese output</p>
        <div
          className="cs-featured-preview"
          style={{ fontFamily: `"${fontFamily}", serif` }}
        >
          {text}
        </div>
      </article>
    </div>
  )
}
