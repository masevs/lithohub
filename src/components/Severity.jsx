export const SEV_LABEL = {
  critical: 'Critical',
  warning: 'Warning',
  normal: 'Normal',
  nodata: 'No data',
  demo: 'Demo data',
  none: 'No diagnosis',
};

function Icon({ level }) {
  const p = { viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 2, 'aria-hidden': true };
  if (level === 'critical')
    return (<svg {...p}><path d="M5 1.5h6L14.5 5v6L11 14.5H5L1.5 11V5z" /><path d="M8 4.5v4M8 11v.5" /></svg>);
  if (level === 'warning')
    return (<svg {...p}><path d="M8 1.8 15 14H1z" /><path d="M8 6v3.5M8 11.5v.5" /></svg>);
  if (level === 'normal')
    return (<svg {...p}><circle cx="8" cy="8" r="6.5" /><path d="m5 8.2 2 2 4-4.2" /></svg>);
  if (level === 'demo')
    return (<svg {...p}><circle cx="8" cy="8" r="6.5" strokeDasharray="2.5 2" /></svg>);
  return (<svg {...p}><circle cx="8" cy="8" r="6.5" /><path d="M5 8h6" /></svg>);
}

export function SeverityBadge({ level, children, as = 'span', ...rest }) {
  const Tag = as;
  return (
    <Tag className={`sev ${level}`} {...rest}>
      <Icon level={level} />
      {children ?? SEV_LABEL[level]}
    </Tag>
  );
}

export const EVIDENCE_LABEL = {
  quoted: 'Quoted from paper',
  digitized: 'Digitized from figure',
  reconstructed: 'Reconstructed shape',
  illustrative: 'Illustrative — not real data',
  derived: 'Derived estimate',
  pending: 'Pending',
  'user-entered': 'Your data',
};

export function EvidenceTag({ type }) {
  return <span className={`tag ${type}`}>{EVIDENCE_LABEL[type] ?? type}</span>;
}

export const BASIS_LABEL = {
  diagnosed: 'Diagnosed by LithoHub from the data',
  reported: 'Reported by source — taken from the paper’s conclusion, not calculated',
};
