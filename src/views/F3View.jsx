// Feature 3 — Superheat & thermal dynamics (rebuilt from the F3 prototype).
// Field facts and context come from fields.json → kamojang.features.f3.
// The per-pad rule engine runs as a diagnosis (src/diagnostics/superheat.js) on assets.json.
import DatasetPanel from '../components/Dataset.jsx';

export function F3Facts({ field }) {
  const f3 = field.data.f3;
  if (!f3?.fieldFacts) return null;
  return (
    <DatasetPanel title={`Field data — ${f3.fieldFacts.area}`} ds={f3.fieldFacts}>
      <div className="stats">
        {f3.fieldFacts.facts.map((x) => (
          <div className="stat" key={x.value}><div className="v">{x.value}</div><div className="k">{x.text}</div></div>
        ))}
      </div>
    </DatasetPanel>
  );
}

export function F3Context({ field }) {
  const f3 = field.data.f3;
  if (!f3) return null;
  return (
    <div className="grid2">
      {f3.corrosionContext && (
        <DatasetPanel title="Corrosion-risk context (HCl/HF fields)" ds={f3.corrosionContext}>
          <p className="caption">{f3.corrosionContext.thresholdsSourceNote}</p>
        </DatasetPanel>
      )}
      {f3.rejectedRule && (
        <DatasetPanel title="Rejected rule (audit record)" ds={f3.rejectedRule}>
          <p>{f3.rejectedRule.text}</p>
        </DatasetPanel>
      )}
      {f3.mitigation && (
        <DatasetPanel title="Mitigation — borrowed strategy" ds={f3.mitigation}>
          <p>{f3.mitigation.text}</p>
        </DatasetPanel>
      )}
      {f3.openItems && (
        <div className="panel">
          <h2>Open audit items</h2>
          <ol className="todo">{f3.openItems.items.map((x) => <li key={x}>{x}</li>)}</ol>
        </div>
      )}
    </div>
  );
}
