import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useModel } from '../data/model.js';
import { SEV_LABEL } from './Severity.jsx';

const ORDER = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6'];

export default function MapView({ fieldStatus, go }) {
  const { fields, demo } = useModel();
  const [showDemo, setShowDemo] = useState(false);
  const el = useRef(null);
  const map = useRef(null);
  const layer = useRef(null);

  useEffect(() => {
    map.current = L.map(el.current, { zoomControl: true, scrollWheelZoom: true }).setView([-1.8, 113], 5);

    // Base maps that need no API key. Keep the attributions — the providers require them.
    const baseMaps = {
      Map: L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }),
      Terrain: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; OpenStreetMap contributors, SRTM | Style &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
        subdomains: 'abc',
        maxZoom: 17,
      }),
      Satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics',
        maxZoom: 18,
      }),
    };
    baseMaps.Map.addTo(map.current);
    L.control.layers(baseMaps, null, { position: 'topright' }).addTo(map.current);

    layer.current = L.layerGroup().addTo(map.current);
    return () => map.current.remove();
  }, []);

  useEffect(() => {
    layer.current.clearLayers();
    fields.forEach((f) => {
      const level = fieldStatus[f.id];
      const icon = L.divIcon({
        className: '',
        html: `<div class="mk-wrap"><div class="mk ${level}"></div><div class="mk-label">${f.name}</div></div>`,
        iconSize: [80, 46],
        iconAnchor: [40, 11],
      });
      L.marker([f.lat, f.lng], { icon, keyboard: true, title: `${f.name} — ${SEV_LABEL[level]}` })
        .addTo(layer.current)
        .on('click', () => go({ view: 'field', fieldId: f.id, featureId: ORDER.find((id) => f.features[id]) }));
    });
    if (showDemo) {
      demo.forEach((a) => {
        const icon = L.divIcon({
          className: '',
          html: `<div class="mk-wrap"><div class="mk demo"></div><div class="mk-label mk-demo">${a.name}</div></div>`,
          iconSize: [80, 46],
          iconAnchor: [40, 11],
        });
        L.marker([a.latitude, a.longitude], { icon, title: `${a.name} — v1 demo asset with synthetic data, not diagnosed in v2` }).addTo(layer.current);
      });
    }
  }, [fields, demo, showDemo, fieldStatus, go]);

  return (
    <div className="map-wrap">
      <div className="map" ref={el} role="application" aria-label="Map of Indonesian geothermal fields" />
      <div className="legend">
        <h3>Field status</h3>
        {['critical', 'warning', 'normal', 'nodata'].map((l) => (
          <div className="row" key={l}><span className={`dot ${l}`} /> {SEV_LABEL[l]}</div>
        ))}
        <div className="row"><span className="dot none" style={{ background: 'var(--lava)' }} /> Visualization only</div>
        <div className="row"><span className="dot demo" /> Demo data only</div>
        <div className="note">Color = worst diagnosis among the field’s wells, from paper data or your data. Demo data never colors a field.</div>
        {demo.length > 0 && (
          <label className="row" style={{ marginTop: 8 }}>
            <input type="checkbox" checked={showDemo} onChange={(e) => setShowDemo(e.target.checked)} />
            Show {demo.length} v1 demo {demo.length === 1 ? "asset" : "assets"} (synthetic data)
          </label>
        )}
      </div>
    </div>
  );
}
