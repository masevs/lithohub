import { SeverityBadge } from './Severity.jsx';

export default function AlertBar({ title, counts, usingUserData, go }) {
  return (
    <header className="alertbar">
      <div className="title">{title}</div>
      {usingUserData && <span className="userflag">Some wells use your data</span>}
      {['critical', 'warning', 'nodata'].map((lvl) =>
        counts[lvl] ? (
          <SeverityBadge
            key={lvl}
            as="button"
            level={lvl}
            onClick={() => go({ view: 'alerts', filter: lvl })}
            title="Show these wells in Alerts"
          >
            {counts[lvl]} {lvl === 'nodata' ? 'no data' : lvl}
          </SeverityBadge>
        ) : null
      )}
      {!counts.critical && !counts.warning && <SeverityBadge level="normal">No active alerts</SeverityBadge>}
    </header>
  );
}
