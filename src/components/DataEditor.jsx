import { useState } from 'react';
import { getPath } from '../data/schemas.js';

// Turns table rows (strings from inputs) into typed points and lists errors per row.
function validate(rows, columns) {
  const errors = {};
  const points = rows.map((row, i) => {
    const out = {};
    const rowErr = [];
    columns.forEach((c) => {
      const raw = String(row[c.key] ?? '').trim();
      if (raw === '') {
        if (c.required) rowErr.push(`${c.label} is required`);
        out[c.key] = null; // empty stays null — never filled in
        return;
      }
      if (c.type === 'number') {
        const n = Number(raw.replace(',', '.'));
        if (Number.isNaN(n)) rowErr.push(`${c.label} must be a number`);
        out[c.key] = Number.isNaN(n) ? null : n;
      } else {
        out[c.key] = raw;
      }
    });
    if (rowErr.length) errors[i] = rowErr;
    return out;
  });
  return { points, errors };
}

function toRows(points, columns) {
  return (points ?? []).map((p) => Object.fromEntries(columns.map((c) => [c.key, p[c.key] ?? ''])));
}

function parseCsv(text, columns) {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length < 2) return { error: 'The CSV needs a header row and at least one data row.' };
  const sep = lines[0].includes(';') && !lines[0].includes(',') ? ';' : ',';
  const header = lines[0].split(sep).map((h) => h.trim());
  const missing = columns.filter((c) => c.required && !header.includes(c.key)).map((c) => c.key);
  if (missing.length) return { error: `Missing required columns: ${missing.join(', ')}. Download the template to see the exact headers.` };
  const rows = lines.slice(1).map((line) => {
    const cells = line.split(sep);
    return Object.fromEntries(columns.map((c) => [c.key, (cells[header.indexOf(c.key)] ?? '').trim()]));
  });
  return { rows };
}

function downloadTemplate(table, paperPoints) {
  const header = table.columns.map((c) => c.key).join(',');
  const example = (paperPoints ?? []).slice(0, 2).map((p) => table.columns.map((c) => p[c.key] ?? '').join(','));
  const blob = new Blob([[header, ...example].join('\n')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `lithohub-template-${table.path.replace(/\./g, '-')}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function DataEditor({ schema, paperAsset, saved, onSave, onClose }) {
  const [tab, setTab] = useState(0);
  const [drafts, setDrafts] = useState(() =>
    Object.fromEntries(
      schema.map((t) => [t.path, toRows(saved?.tables?.[t.path] ?? getPath(paperAsset, t.path), t.columns)])
    )
  );
  const [csvText, setCsvText] = useState('');
  const [message, setMessage] = useState(null);

  if (schema.length === 0) {
    return (
      <div className="panel editor">
        <h2>Enter your data</h2>
        <p>This diagnosis is reported by the source paper, not calculated, so entering data would not change it.</p>
        <button className="btn ghost" onClick={onClose}>Close</button>
      </div>
    );
  }

  const table = schema[tab];
  const rows = drafts[table.path];
  const { errors } = validate(rows, table.columns);
  const allErrors = schema.reduce((n, t) => n + Object.keys(validate(drafts[t.path], t.columns).errors).length, 0);

  const setRows = (next) => setDrafts({ ...drafts, [table.path]: next });
  const setCell = (i, key, value) => setRows(rows.map((r, j) => (j === i ? { ...r, [key]: value } : r)));

  const importCsv = (text) => {
    const res = parseCsv(text, table.columns);
    if (res.error) return setMessage({ bad: true, text: res.error });
    setRows(res.rows);
    setMessage({ text: `Imported ${res.rows.length} rows into “${table.title}”. Check them, then save.` });
  };

  const save = () => {
    const tables = {};
    for (const t of schema) {
      const v = validate(drafts[t.path], t.columns);
      if (Object.keys(v.errors).length) {
        setTab(schema.indexOf(t));
        return setMessage({ bad: true, text: `Fix the highlighted rows in “${t.title}” before saving.` });
      }
      tables[t.path] = v.points;
    }
    onSave(tables);
    setMessage({ text: 'Saved. The diagnosis now runs on your data.' });
  };

  return (
    <div className="panel editor">
      <h2>Enter your data</h2>
      <div className="sub">
        Your data is stored in this browser only and is kept separate from the paper data. Empty cells stay empty — nothing is filled in for you.
      </div>

      <div className="seg" role="tablist">
        {schema.map((t, i) => (
          <button key={t.path} aria-pressed={i === tab} onClick={() => { setTab(i); setMessage(null); }}>
            {t.title}
          </button>
        ))}
      </div>

      <div style={{ overflowX: 'auto', marginTop: 12 }}>
        <table className="data">
          <thead>
            <tr>
              {table.columns.map((c) => (
                <th key={c.key}>{c.label}{c.required ? ' *' : ''}</th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={errors[i] ? 'bad' : ''}>
                {table.columns.map((c) => (
                  <td key={c.key}>
                    <input
                      aria-label={`${c.label}, row ${i + 1}`}
                      inputMode={c.type === 'number' ? 'decimal' : 'text'}
                      value={r[c.key]}
                      onChange={(e) => setCell(i, c.key, e.target.value)}
                    />
                  </td>
                ))}
                <td>
                  <button className="btn ghost" aria-label={`Delete row ${i + 1}`} onClick={() => setRows(rows.filter((_, j) => j !== i))}>×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {Object.entries(errors).map(([i, errs]) => (
          <div className="err" key={i}>Row {Number(i) + 1}: {errs.join('; ')}</div>
        ))}
      </div>

      <div className="bar">
        <button className="btn ghost" onClick={() => setRows([...rows, Object.fromEntries(table.columns.map((c) => [c.key, '']))])}>Add row</button>
        <button className="btn ghost" onClick={() => setRows(toRows(getPath(paperAsset, table.path), table.columns))}>Reset table to paper data</button>
        <button className="btn ghost" onClick={() => downloadTemplate(table, getPath(paperAsset, table.path))}>Download CSV template</button>
        <label className="btn ghost">
          Upload CSV
          <input
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) f.text().then(importCsv);
              e.target.value = '';
            }}
          />
        </label>
      </div>

      <details>
        <summary>Paste CSV instead</summary>
        <textarea
          aria-label="Paste CSV"
          placeholder={table.columns.map((c) => c.key).join(',')}
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
        />
        <button className="btn ghost" onClick={() => importCsv(csvText)} disabled={!csvText.trim()}>Import pasted CSV</button>
      </details>

      {message && <p className={message.bad ? 'err' : 'ok'}>{message.text}</p>}

      <div className="bar">
        <button className="btn primary" onClick={save} disabled={allErrors > 0}>Save and run diagnosis</button>
        <button className="btn ghost" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
