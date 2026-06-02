import { SOURCES, MEDICAL_DISCLAIMER } from '../lib/sources';

interface Props {
  onClose: () => void;
}

// Pantalla "Fuentes y ciencia": citas + links funcionales a las fuentes de la
// información de salud/hábitos que da el Coach (App Store Guideline 1.4.1).
export function SourcesModal({ onClose }: Props) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal sources-modal" onClick={e => e.stopPropagation()}>
        <div className="sources-head">
          <h2 className="sources-title">📚 Fuentes y ciencia</h2>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <p className="sources-disclaimer">{MEDICAL_DISCLAIMER}</p>

        <p className="sources-intro">
          Los consejos del Coach se basan en investigación. Acá están las fuentes, con sus enlaces:
        </p>

        <div className="sources-list">
          {SOURCES.map((s, i) => (
            <div className="source-item" key={i}>
              <div className="source-topic">{s.topic}</div>
              <div className="source-citation">{s.citation}</div>
              <a className="source-link" href={s.url} target="_blank" rel="noopener noreferrer">
                Ver fuente ↗
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
