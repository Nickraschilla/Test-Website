import { useEffect, useState } from "react";

export function ClipModal({ activeClip, activeClipPresentation, onClose }) {
  const [driveFallback, setDriveFallback] = useState(false);

  useEffect(() => {
    setDriveFallback(false);
  }, [activeClipPresentation?.src, activeClipPresentation?.fallbackSrc, activeClip?.clipUrl]);

  if (!activeClip || !activeClipPresentation) {
    return null;
  }

  const renderDriveEmbed =
    activeClipPresentation.type === "drive" && driveFallback;

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
              className="clip-player clip-player-video"
              src={activeClipPresentation.src}
              controls
              autoPlay
              playsInline
            />
          ) : activeClipPresentation.type === "drive" && !renderDriveEmbed ? (
            <video
              className="clip-player clip-player-video"
              src={activeClipPresentation.src}
              controls
              autoPlay
              playsInline
              onError={() => setDriveFallback(true)}
            />
          ) : (
            <iframe
              className="clip-player clip-player-embed"
              src={
                activeClipPresentation.type === "drive"
                  ? activeClipPresentation.fallbackSrc
                  : activeClipPresentation.src
              }
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
