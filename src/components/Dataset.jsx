import { EvidenceTag } from './Severity.jsx';

const CONFIDENCE = {
  A: 'Verified', A1: 'Direct measurement', A2: 'Kinematic inference',
  B: 'Cross-validated / source-caveated', C: 'Placeholder / pending',
};

// One panel per dataset from fields.json: title, evidence tag, interpretation confidence,
// the dataset's own note, its content, and the source. Pending datasets get a dashed card.
export default function DatasetPanel({ title, ds, children, wide }) {
  if (!ds) return null;
  if (ds.evidence === 'pending') {
    return (
      <div className="panel pending" style={wide ? { gridColumn: '1 / -1' } : undefined}>
        <h2>{title}</h2>
        <div className="sub"><EvidenceTag type="pending" /></div>
        {ds.note && <p>{ds.note}</p>}
        {children}
        {ds.todo && (
          <>
            <p className="sub" style={{ marginBottom: 4 }}>What is needed:</p>
            <ol className="todo">{ds.todo.map((t) => <li key={t}>{t}</li>)}</ol>
          </>
        )}
        {ds.source && <p className="cite">Source: {ds.source}</p>}
      </div>
    );
  }
  return (
    <div className="panel" style={wide ? { gridColumn: '1 / -1' } : undefined}>
      <h2>{title}</h2>
      <div className="sub tags">
        {ds.evidence && <EvidenceTag type={ds.evidence} />}
        {ds.confidence && (
          <span className="tag" title="Interpretation confidence from the prototype">
            Confidence {ds.confidence}: {CONFIDENCE[ds.confidence] ?? ''}
          </span>
        )}
      </div>
      {children}
      {ds.note && <p className="caption">{ds.note}</p>}
      {ds.source && <p className="cite">Source: {ds.source}</p>}
    </div>
  );
}
