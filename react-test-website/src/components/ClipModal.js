export function ClipModal({ activeClip, activeClipPresentation, onClose }) {
  if (!activeClip || !activeClipPresentation) {
    return null;
  }

  return (
    <div className="clip-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="clip-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`${activeClip.reelName || "Clip"} preview`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="clip-modal-header">
          <div>
            <div className="clip-modal-label">Clip preview</div>
            <div className="clip-modal-title">
              {activeClip.reelName || "Untitled reel"}
            </div>
            <div className="clip-modal-meta">
              {activeClip.name || "Unknown contributor"}
            </div>
          </div>

          <button
            type="button"
            className="clip-modal-close"
            onClick={onClose}
            aria-label="Close clip preview"
          >
            ✕
          </button>
        </div>

        <div className="clip-modal-body">
          {activeClipPresentation.type === "video" ? (
            <video
              className="clip-player"
              src={activeClipPresentation.src}
              controls
              autoPlay
              playsInline
            />
          ) : (
            <iframe
              className="clip-player"
              src={activeClipPresentation.src}
              title={`${activeClip.reelName || "Clip"} preview`}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          )}
        </div>
      </div>
    </div>
  );
}
