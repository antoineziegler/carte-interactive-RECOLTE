/* ===== INITIALISATION DE LA CARTE ===== */

// Création de la carte Leaflet avec vue sur Strasbourg
const map = L.map('map', {
  zoomControl: false,
  attributionControl: false,
  preferCanvas: true, // OPTIMISATION: Utiliser Canvas pour de meilleures performances
  zoomAnimation: true,
  fadeAnimation: true,
  markerZoomAnimation: true
}).setView([48.5734, 7.7521], 12);

// Ajout du contrôle de zoom personnalisé
const zoomControl = L.control.zoom({
  position: 'topright'
}).addTo(map);

// Fonds de carte optimisés
const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
  maxZoom: 22, 
  attribution: '© OpenStreetMap',
  updateWhenIdle: false, // OPTIMISATION: Mise à jour continue
  keepBuffer: 2 // OPTIMISATION: Garder plus de tuiles en mémoire
});

const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { 
  maxZoom: 22, 
  attribution: '© Esri',
  updateWhenIdle: false
});

const cartoDB = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { 
  maxZoom: 22, 
  attribution: '© CartoDB | <a href="https://leafletjs.com">Leaflet</a>',
  updateWhenIdle: false
}).addTo(map);

// Couches de données géographiques
const limitesEMS = L.geoJSON(null, { 
  style: { 
    color: "#6b7280", 
    weight: 2, 
    opacity: 0.8,
    fillOpacity: 0.1
  } 
});

// Couche des pièges Barber
let piegesCluster = null;
const piegesBarber = L.geoJSON(null, {
  pointToLayer: function(feature, latlng) {
    return L.circleMarker(latlng, {
      radius: 7,
      fillColor: "#7c3aed",
      color: "#4c1d95",
      weight: 2,
      fillOpacity: 0.85
    });
  },
  onEachFeature: function(feature, layer) {
    const props = feature.properties;

    const especesLabels = {
      araignees: 'Araignées', carabes: 'Carabes', charancons: 'Charançons',
      cicadelles: 'Cicadelles', cloportes: 'Cloportes', coccinelle: 'Coccinelles',
      elaterides: 'Élatérides', escargots: 'Escargots', fourmis: 'Fourmis',
      gendarmes: 'Gendarmes', larvcoleop: 'Larves Coléoptères', larvlepid: 'Larves Lépidoptères',
      larvdipte: 'Larves Diptères', limaces: 'Limaces', myrchilo: 'Myriapodes chilopodes',
      myrdiplo: 'Myriapodes diplopodes', opilions: 'Opilions', orthoptere: 'Orthoptères',
      perc_oreil: 'Perce-oreilles', punaises: 'Punaises', scarabees: 'Scarabées',
      staphylins: 'Staphylins', vers_terre: 'Vers de terre'
    };

    const chartId = `chart-${props.qtf_id || Math.random().toString(36).substr(2,9)}`;

    const popupContent = `
      <div style="font-family: Inter, sans-serif; min-width: 260px;">
        <h4 style="margin: 0 0 0.5rem 0; color: #7c3aed; font-size: 1.1rem;">
          🪲 Piège Barber
        </h4>
        <p style="margin: 0.25rem 0; font-weight: 500; color: #374151;">
          <strong>${props.site_nom || 'Site inconnu'}</strong>
        </p>
        <p style="margin: 0.25rem 0; color: #6b7280; font-size: 0.875rem;">
          Date de pose : <strong>${props.date_pose_piege || '—'}</strong>
        </p>
        <p style="margin: 0.25rem 0; color: #6b7280; font-size: 0.875rem;">
          Type de milieu : <strong>${props.type_milieu || '—'}</strong>
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0.5rem 0;">
        <p style="margin: 0.25rem 0; color: #6b7280; font-size: 0.875rem;">
          Abondance : <strong>${props.abondance ?? '—'}</strong> &nbsp;|&nbsp;
          Diversité : <strong>${props.diversite ?? '—'}</strong>
        </p>
        <p style="margin: 0.25rem 0; color: #6b7280; font-size: 0.875rem;">
          Shannon : <strong>${props.shannon != null ? Number(props.shannon).toFixed(2) : '—'}</strong> &nbsp;|&nbsp;
          Piélou : <strong>${props.pielou != null ? Number(props.pielou).toFixed(2) : '—'}</strong>
        </p>
        <canvas id="${chartId}" width="240" height="240" style="margin-top: 0.5rem;"></canvas>
      </div>
    `;

    layer.bindPopup(popupContent, { className: 'custom-popup', autoPan: false, maxWidth: 300 });

    layer.on('popupopen', function() {
      afficherGraphiqueGuildes(props.site_nom || 'Inconnu', props);
      const canvas = document.getElementById(chartId);
      if (!canvas) return;

      const donnees = Object.entries(especesLabels)
        .map(([key, label]) => ({ label, value: props[key] || 0 }))
        .filter(d => d.value > 0)
        .sort((a, b) => b.value - a.value);

      if (donnees.length === 0) {
        canvas.style.display = 'none';
        return;
      }

      const couleurs = [
        '#7c3aed','#06b6d4','#10b981','#f97316','#ef4444',
        '#f59e0b','#3b82f6','#ec4899','#84cc16','#6366f1',
        '#14b8a6','#fb923c','#a855f7','#22d3ee','#4ade80'
      ];

      new Chart(canvas, {
        type: 'pie',
        data: {
          labels: donnees.map(d => d.label),
          datasets: [{
            data: donnees.map(d => d.value),
            backgroundColor: couleurs.slice(0, donnees.length),
            borderWidth: 1,
            borderColor: '#fff'
          }]
        },
        options: {
          plugins: {
            legend: {
              position: 'bottom',
              labels: { font: { size: 10 }, boxWidth: 12, padding: 6 }
            },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                  const pct = ((ctx.raw / total) * 100).toFixed(1);
                  return ` ${ctx.label} : ${ctx.raw} (${pct}%)`;
                }
              }
            }
          }
        }
      });
    });

    layer.on('click', function() {
      const px = map.project(layer.getLatLng());
      px.y -= 180;
      map.panTo(map.unproject(px), { animate: false });
    });

    let hoverTimeout;
    layer.on('mouseover', function() {
      clearTimeout(hoverTimeout);
      hoverTimeout = setTimeout(() => layer.setStyle({ radius: 10, fillOpacity: 1 }), 50);
    });
    layer.on('mouseout', function() {
      clearTimeout(hoverTimeout);
      layer.setStyle({ radius: 7, fillOpacity: 0.85 });
    });
  }
});

// Couche des Potagers Urbains Collectifs (PUC)
const puc = L.geoJSON(null, {
  style: {
    color: "#0f766e",
    weight: 2,
    opacity: 0.9,
    fillColor: "#2dd4bf",
    fillOpacity: 0.45
  },
  onEachFeature: function(feature, layer) {
    const props = feature.properties;
    const superficie = props["SUPERFICIE M2"] ? props["SUPERFICIE M2"] + ' m²' : '—';
    const popupContent = `
      <div style="font-family: Inter, sans-serif; min-width: 200px;">
        <h4 style="margin: 0 0 0.5rem 0; color: #0f766e; font-size: 1.1rem;">
          🥦 Potager Urbain Collectif
        </h4>
        <p style="margin: 0.25rem 0; font-weight: 500; color: #374151;">
          <strong>${props.Nom_du_poin || 'Sans nom'}</strong>
        </p>
        <p style="margin: 0.25rem 0; color: #6b7280; font-size: 0.875rem;">
          Superficie : <strong>${superficie}</strong>
        </p>
      </div>
    `;
    layer.bindPopup(popupContent, { className: 'custom-popup', autoPan: false });
    layer.on('mouseover', function() { layer.setStyle({ fillOpacity: 0.75, weight: 3 }); });
    layer.on('mouseout', function() { layer.setStyle({ fillOpacity: 0.45, weight: 2 }); });
  }
});

// Couche des jardins partagés
const jardinsPartages = L.geoJSON(null, {
  style: {
    color: "#16a34a",
    weight: 2,
    opacity: 0.9,
    fillColor: "#22c55e",
    fillOpacity: 0.45
  },
  onEachFeature: function(feature, layer) {
    const props = feature.properties;
    const superficie = props.M2 ? props.M2 + ' m²' : '—';
    const popupContent = `
      <div style="font-family: Inter, sans-serif; min-width: 200px;">
        <h4 style="margin: 0 0 0.5rem 0; color: #16a34a; font-size: 1.1rem;">
          🌱 Jardin partagé
        </h4>
        <p style="margin: 0.25rem 0; font-weight: 500; color: #374151;">
          <strong>${props.Nom_du_poin || 'Sans nom'}</strong>
        </p>
        <p style="margin: 0.25rem 0; color: #6b7280; font-size: 0.875rem;">
          Superficie : <strong>${superficie}</strong>
        </p>
      </div>
    `;
    layer.bindPopup(popupContent, { className: 'custom-popup', autoPan: false });
    layer.on('mouseover', function() { layer.setStyle({ fillOpacity: 0.75, weight: 3 }); });
    layer.on('mouseout', function() { layer.setStyle({ fillOpacity: 0.45, weight: 2 }); });
  }
});

// Couche des Cités Fertiles
const citesFertiles = L.geoJSON(null, {
  style: {
    color: "#ec4899",
    weight: 2,
    opacity: 0.9,
    fillColor: "#f9a8d4",
    fillOpacity: 0.45
  },
  onEachFeature: function(feature, layer) {
    const props = feature.properties;
    const superficie = props["SUPERFICIE M2"] ? props["SUPERFICIE M2"] + ' m²' : '—';
    const popupContent = `
      <div style="font-family: Inter, sans-serif; min-width: 200px;">
        <h4 style="margin: 0 0 0.5rem 0; color: #ec4899; font-size: 1.1rem;">
          🌸 Cité Fertile
        </h4>
        <p style="margin: 0.25rem 0; font-weight: 500; color: #374151;">
          <strong>${props.NOM || 'Sans nom'}</strong>
        </p>
        <p style="margin: 0.25rem 0; color: #6b7280; font-size: 0.875rem;">
          Superficie : <strong>${superficie}</strong>
        </p>
      </div>
    `;
    layer.bindPopup(popupContent, { className: 'custom-popup', autoPan: false });
    layer.on('mouseover', function() { layer.setStyle({ fillOpacity: 0.75, weight: 3 }); });
    layer.on('mouseout', function() { layer.setStyle({ fillOpacity: 0.45, weight: 2 }); });
  }
});

// Couche des massifs nourriciers
const massifsNourriciers = L.geoJSON(null, {
  style: {
    color: "#7c3aed",
    weight: 2,
    opacity: 0.9,
    fillColor: "#a78bfa",
    fillOpacity: 0.45
  },
  onEachFeature: function(feature, layer) {
    const props = feature.properties;
    const superficie = props["SUPERFICIE (m2)"] ? props["SUPERFICIE (m2)"] + ' m²' : '—';
    const popupContent = `
      <div style="font-family: Inter, sans-serif; min-width: 200px;">
        <h4 style="margin: 0 0 0.5rem 0; color: #7c3aed; font-size: 1.1rem;">
          🫐 Massif nourricier
        </h4>
        <p style="margin: 0.25rem 0; font-weight: 500; color: #374151;">
          <strong>${props.NOM || 'Sans nom'}</strong>
        </p>
        <p style="margin: 0.25rem 0; color: #6b7280; font-size: 0.875rem;">
          Superficie : <strong>${superficie}</strong>
        </p>
      </div>
    `;
    layer.bindPopup(popupContent, { className: 'custom-popup', autoPan: false });
    layer.on('mouseover', function() { layer.setStyle({ fillOpacity: 0.75, weight: 3 }); });
    layer.on('mouseout', function() { layer.setStyle({ fillOpacity: 0.45, weight: 2 }); });
  }
});

// Couche production agricole professionnelle
const productionAgricole = L.geoJSON(null, {
  pointToLayer: function(feature, latlng) {
    return L.circleMarker(latlng, {
      radius: 5,
      fillColor: "#e4e131",
      color: "#109927",
      weight: 2,
      opacity: 1,
      fillOpacity: 0.85
    });
  },
  onEachFeature: function(feature, layer) {
    const props = feature.properties;
    const description = props.description ? `<p style="margin: 0.25rem 0; color: #6b7280; font-size: 0.8rem;">${props.description}</p>` : '';
    const popupContent = `
      <div style="font-family: Inter, sans-serif; min-width: 200px;">
        <h4 style="margin: 0 0 0.5rem 0; color: #f3dc10; font-size: 1.1rem;">
          🌾 Production agricole
        </h4>
        <p style="margin: 0.25rem 0; font-weight: 500; color: #374151;">
          <strong>${props.name || 'Sans nom'}</strong>
        </p>
        ${description}
        ${props["Superficie(m²)"] ? `<p style="margin: 0.25rem 0; color: #6b7280; font-size: 0.875rem;">Superficie : <strong>${props["Superficie(m²)"]} m²</strong></p>` : ''}
      </div>
    `;
    layer.bindPopup(popupContent, { className: 'custom-popup', autoPan: false });
    layer.on('mouseover', function() { layer.setStyle({ fillOpacity: 1, radius: 9 }); });
    layer.on('mouseout', function() { layer.setStyle({ fillOpacity: 0.85, radius: 4 }); });
  }
});

// Couche des initiatives jardinesques émergentes
const initiativesEmergentes = L.geoJSON(null, {
  pointToLayer: function(feature, latlng) {
    return L.circleMarker(latlng, {
      radius: 5,
      fillColor: "#fbbf24",
      color: "#d97706",
      weight: 2,
      opacity: 1,
      fillOpacity: 0.85
    });
  },
  onEachFeature: function(feature, layer) {
    const props = feature.properties;
    const superficie = props["Superficie(m²)"] ? props["Superficie(m²)"] + ' m²' : '—';
    const description = props.description ? `<p style="margin: 0.25rem 0; color: #6b7280; font-size: 0.8rem;">${props.description}</p>` : '';
    const popupContent = `
      <div style="font-family: Inter, sans-serif; min-width: 200px;">
        <h4 style="margin: 0 0 0.5rem 0; color: #fbbf24; font-size: 1.1rem;">
          🌻 Initiative jardinesques
        </h4>
        <p style="margin: 0.25rem 0; font-weight: 500; color: #374151;">
          <strong>${props.name || 'Sans nom'}</strong>
        </p>
        ${description}
        ${props["Superficie(m²)"] ? `<p style="margin: 0.25rem 0; color: #6b7280; font-size: 0.875rem;">Superficie : <strong>${props["Superficie(m²)"]} m²</strong></p>` : ''}
      </div>
    `;
    layer.bindPopup(popupContent, { className: 'custom-popup', autoPan: false });
    layer.on('mouseover', function() { layer.setStyle({ fillOpacity: 1, radius: 9 }); });
    layer.on('mouseout', function() { layer.setStyle({ fillOpacity: 0.85, radius: 4 }); });
  }
});

// Couche des jardins productifs
const jardinsProductifs = L.geoJSON(null, {
  style: {
    color: "#ea580c",
    weight: 2,
    opacity: 0.9,
    fillColor: "#f97316",
    fillOpacity: 0.45
  },
  onEachFeature: function(feature, layer) {
    const props = feature.properties;
    const superficie = props["SUPERFICIE M2"] ? Math.round(props["SUPERFICIE M2"]) + ' m²' : '—';

    layer.on('mouseover', function() {
      layer.setStyle({ fillOpacity: 0.75, weight: 3 });
    });
    layer.on('mouseout', function() {
      layer.setStyle({ fillOpacity: 0.45, weight: 2 });
    });
    layer.on('click', function() {
      afficherStatsJardinProductif(props.NOM || 'Jardin productif', superficie);
    });
  }
});

// Couche des espaces potentiellements cultivables
const espacesPotentiellementsCultivables = L.geoJSON(null, {
  style: function(feature) {
    const estRouge = feature.properties.couleur === 'rouge';
    return {
      color: estRouge ? "#e63946" : "#22d69d",
      weight: 2,
      fillColor: estRouge ? "#ff8a8a" : "#99d99d",
      fillOpacity: 0.45
    };
  },
  onEachFeature: function(feature, layer) {
    const props = feature.properties;
    const superficie = props["M2"] ? Math.round(props["M2"]) + ' m²' : '—';
    
    layer.bindPopup(`
      <div style="font-family: Inter, sans-serif; min-width: 200px;">
      <h4 style="margin: 0 0 0.5rem 0; color: #22d69d; font-size: 1.1rem;">
  🌿 Espace potentiellement cultivable
      </h4>
      <p style="margin: 0.25rem 0; font-weight: 500; color: #374151;">
        <strong>${props.NOM || 'Sans nom'}</strong>
      </p>
      <p style="margin: 0.25rem 0; color: #6b7280; font-size: 0.875rem;">
        Superficie : <strong>${superficie}</strong>
      </p>
    </div>
`, { className: 'custom-popup', autoPan: false });
  layer.on('mouseover', function() { layer.setStyle({ fillOpacity: 0.75, weight: 3}); });
  layer.on('mouseout', function() { layer.setStyle({ fillOpacity: 0.45, weight: 2}); });
  }
});




const jardinsPrivesMeinau = L.geoJSON(null, {
  style: {
    color: "#475569",
    weight: 1,
    opacity: 0.8,
    fillColor: "#94a3b8",
    fillOpacity: 0.35
  },
  onEachFeature: function(feature, layer) {
    const props = feature.properties;
    const superficie = props["SUPERFICIE (M2)"] ? props["SUPERFICIE (M2)"].toFixed(1) + ' m²' : '—';
    layer.bindPopup(`
      <div style="font-family: Inter, sans-serif; min-width: 180px;">
        <h4 style="margin: 0 0 0.5rem 0; color: #475569; font-size: 1rem;">🏠 Jardin particulier privé</h4>
        <p style="margin: 0.25rem 0; color: #6b7280; font-size: 0.875rem;">
          Surface : <strong>${superficie}</strong>
        </p>
      </div>
    `, { className: 'custom-popup', autoPan: false });
    layer.on('mouseover', function() { layer.setStyle({ fillOpacity: 0.6, weight: 2 }); });
    layer.on('mouseout', function() { layer.setStyle({ fillOpacity: 0.35, weight: 1 }); });
  }
});

let jardinsPrivesMeinauCharges = false;

async function chargerJardinsPrivesMeinau() {
  if (jardinsPrivesMeinauCharges) return;
  try {
    const response = await fetch('data/jardins_particuliers_privés/JARDINS_PRIVES_PARTICULIERS-MEINAU.geojson');
    const data = await response.json();
    jardinsPrivesMeinau.addData(data);
    jardinsPrivesMeinauCharges = true;
  } catch(e) {
    console.warn('Erreur chargement jardins Meinau:', e);
  }
}

// Variable pour le contrôleur de couches
let controleCouches;

// Cache pour les données
const dataCache = new Map();

/* ===== GESTION OPTIMISÉE DES COUCHES ===== */

function mettreAjourCouches() {
  if (controleCouches) {
    map.removeControl(controleCouches);
  }

  const fondsCarte = {
    "🗺️ OpenStreetMap": osm,
    "🛰️ Satellite": satellite,
    "🗺️ CartoDB": cartoDB
  };

  controleCouches = L.control.layers(fondsCarte, null, {
    collapsed: false,
    position: 'topright'
  });
  controleCouches.addTo(map);

  // Inverser l'ordre d'affichage : sélecteur de couches au-dessus, zoom en dessous
  const conteneurCouches = controleCouches.getContainer();
  const conteneurZoom = zoomControl.getContainer();
  if (conteneurCouches && conteneurZoom && conteneurCouches.parentNode === conteneurZoom.parentNode) {
    conteneurZoom.parentNode.insertBefore(conteneurCouches, conteneurZoom);
  }
}


function updateHistoricalDisplay(year) {
  // OPTIMISATION: Utiliser requestAnimationFrame pour éviter les blocages
  requestAnimationFrame(() => {
    Object.values(layersHistoriques).forEach(layer => {
      if (map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });

    const targetLayer = layersHistoriques[year];
    if (targetLayer && !map.hasLayer(targetLayer)) {
      targetLayer.addTo(map);
      
      // Animation optimisée
      let layerCount = 0;
      targetLayer.eachLayer(function(layer) {
        layerCount++;
        layer.setStyle({ fillOpacity: 0 });
        setTimeout(() => {
          layer.setStyle({ fillOpacity: 0.4 });
        }, layerCount * 20); // Réduire les délais
      });
    }

  });
}

/* ===== CHARGEMENT OPTIMISÉ DES DONNÉES ===== */

// OPTIMISATION: Fonction de chargement avec Promise.all pour le parallélisme
async function loadAllData() {
  try {
    updateLoadingProgress(0, 100, 0);
    
    // Charger les données en parallèle
    const [limitesData, piegesBarberData, jardinsPartagesData, pucData, citesFertilesData, massifsData, initiativesData, productionAgricoleData, fridolinData, lombricData, landsbergData, chouData, massifData, hohbergData, espacesPotentiellementsCultivablesData] = await Promise.all([
      fetch('data/limites_ems_4326.geojson').then(r => r.json()).catch(() => null),
      fetch('data/pieges_barbers/BD_JARDIBIODIV.geojson').then(r => r.json()).catch(() => null),
      fetch('data/jardins_partagés/jardins_partagés.geojson').then(r => r.json()).catch(() => null),
      fetch('data/PUC/Potager Urbain Collectif.geojson').then(r => r.json()).catch(() => null),
      fetch('data/Cités_Fertiles/Cités_Fertiles_2025.geojson').then(r => r.json()).catch(() => null),
      fetch('data/massifs_nourriciers/MASSIFS_NOURRICIERS.geojson').then(r => r.json()).catch(() => null),
      fetch('data/Initiatives_jardinesques/Initiatives_jardinesques.geojson').then(r => r.json()).catch(() => null),
      fetch('data/production_agricole_professionnelle/production_agricole_professionnelle.geojson').then(r => r.json()).catch(() => null),
      fetch('data/jardins_productifs/Jardin_productif_Fridolin_2025.geojson').then(r => r.json()).catch(() => null),
      fetch('data/jardins_productifs/Jardin_productif_Le_Lombric_Hardi_2025.geojson').then(r => r.json()).catch(() => null),
      fetch('data/jardins_productifs/Jardin_productif_Landsberg_2025.geojson').then(r => r.json()).catch(() => null),
      fetch('data/jardins_productifs/Jardin_productif_Le_Chou_De_Bruxelles_2025.geojson').then(r => r.json()).catch(() => null),
      fetch('data/jardins_productifs/Jardin_productif_Massif_Nourricier_Esplanade_2025.geojson').then(r => r.json()).catch(() => null),
      fetch('data/jardins_productifs/Jardin_productif_Ferme_du_Hohberg_2025.geojson').then(r => r.json()).catch(() => null),
      fetch('data/espaces_cultivables/ESPACES_POTENTIELLEMENTS_CULTIVABLES.geojson').then(r => r.json()).catch(() => null),
    ]);

    updateLoadingProgress(30, 100, 0);

    // Traiter les limites EMS
    if (limitesData) {
      limitesEMS.addData(limitesData);
      mettreAjourCouches();
    }

    updateLoadingProgress(60, 100, 0);

    // Traiter les pièges Barber
    if (piegesBarberData) {
      donneesPiegesBarber = piegesBarberData;
      piegesBarber.addData(piegesBarberData);
      piegesCluster = L.markerClusterGroup({
        maxClusterRadius: 60,
        disableClusteringAtZoom: 16,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        iconCreateFunction: function(cluster) {
          return L.divIcon({
            html: `<div style="background:#7c3aed;color:#fff;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;border:2px solid #4c1d95;box-shadow:0 2px 6px rgba(0,0,0,0.3);">${cluster.getChildCount()}</div>`,
            className: '',
            iconSize: [34, 34]
          });
        }
      });
      piegesCluster.addLayer(piegesBarber);
      piegesCluster.addTo(map);
      mettreAjourCouches();

      // Générer les boutons de filtre par année
      const anneesPieges = [...new Set(
        piegesBarberData.features
          .map(f => f.properties.date_pose_piege)
          .filter(d => d)
          .map(d => d.split('/')[2])
      )].sort();

      const filtreDiv = document.getElementById('filtre-pieges');
      if (filtreDiv && anneesPieges.length > 0) {
        const btnStyle = (actif) => `padding:0.25rem 0.75rem; border-radius:20px; border:2px solid #7c3aed; background:${actif ? '#7c3aed' : 'transparent'}; color:${actif ? '#fff' : '#7c3aed'}; cursor:pointer; font-size:0.8rem; font-weight:600; transition:all 0.2s;`;

        const tousBtn = document.createElement('button');
        tousBtn.textContent = 'Tous';
        tousBtn.style.cssText = btnStyle(true);
        tousBtn.dataset.annee = 'tous';
        filtreDiv.appendChild(tousBtn);

        anneesPieges.forEach(annee => {
          const btn = document.createElement('button');
          btn.textContent = annee;
          btn.style.cssText = btnStyle(false);
          btn.dataset.annee = annee;
          filtreDiv.appendChild(btn);
        });

        filtreDiv.addEventListener('click', function(e) {
          const btn = e.target.closest('button');
          if (!btn) return;
          const annee = btn.dataset.annee;

          // Mettre à jour les styles des boutons
          filtreDiv.querySelectorAll('button').forEach(b => b.style.cssText = btnStyle(false));
          btn.style.cssText = btnStyle(true);

          // Filtrer les pièges
          piegesCluster.clearLayers();
          const filtered = L.geoJSON(null, piegesBarber.options);
          if (annee === 'tous') {
            filtered.addData(piegesBarberData);
          } else {
            const features = piegesBarberData.features.filter(f =>
              f.properties.date_pose_piege && f.properties.date_pose_piege.split('/')[2] === annee
            );
            filtered.addData({ type: 'FeatureCollection', features });
          }
          piegesCluster.addLayer(filtered);
        });
      }
    }

    // Traiter les PUC
    if (pucData) {
      puc.addData(pucData);
      puc.addTo(map);
      mettreAjourCouches();
    }

    // Traiter les Cités Fertiles
    if (citesFertilesData) {
      citesFertiles.addData(citesFertilesData);
      citesFertiles.addTo(map);
      mettreAjourCouches();
    }

    // Traiter la production agricole professionnelle
    if (productionAgricoleData) {
      productionAgricole.addData(productionAgricoleData);
      productionAgricole.addTo(map);
      mettreAjourCouches();
    }

    // Traiter les massifs nourriciers
    if (massifsData) {
      massifsNourriciers.addData(massifsData);
      massifsNourriciers.addTo(map);
      mettreAjourCouches();
    }

    // Traiter les initiatives émergentes
    if (initiativesData) {
      initiativesEmergentes.addData(initiativesData);
      initiativesEmergentes.addTo(map);
      mettreAjourCouches();
    }

    // Traiter les jardins partagés
    if (jardinsPartagesData) {
      jardinsPartages.addData(jardinsPartagesData);
      jardinsPartages.addTo(map);
      mettreAjourCouches();
    }

    // Traiter les jardins productifs
    if (fridolinData) {
      fridolinData.features.forEach(f => { f.properties.NOM = "JARDIN FRIDOLIN"; });
      jardinsProductifs.addData(fridolinData);
    }
    if (lombricData) {
      lombricData.features.forEach(f => {
        f.properties.NOM = "LE LOMBRIC HARDI";
        f.properties["SUPERFICIE M2"] = f.properties["Superficie m2"];
      });
      jardinsProductifs.addData(lombricData);
    }
    if (landsbergData) {
      landsbergData.features.forEach(f => {
        f.properties.NOM = "LANDSBERG";
      });
      jardinsProductifs.addData(landsbergData);
    }
    if (chouData) {
      chouData.features.forEach(f => {
        f.properties.NOM = "LE CHOU DE BRUXELLES";
      });
      jardinsProductifs.addData(chouData);
    }
    if (massifData) {
      massifData.features.forEach(f => {
        f.properties.NOM = "MASSIF NOURRICIER ESPLANADE";
        f.properties["SUPERFICIE M2"] = f.properties["SURFACE"];
      });
      jardinsProductifs.addData(massifData);
    }
    if (hohbergData) {
      hohbergData.features.forEach(f => {
        f.properties.NOM = "FERME DU HOHBERG";
        f.properties["SUPERFICIE M2"] = f.properties["SURPERFICIE M2"];
      });
      jardinsProductifs.addData(hohbergData);
    }
    if (fridolinData || lombricData || landsbergData || chouData || massifData || hohbergData) {
      jardinsProductifs.addTo(map);
      mettreAjourCouches();
      populerListeJardinsProductifs();
    }
    
    if (espacesPotentiellementsCultivablesData) {
     espacesPotentiellementsCultivables.addData(espacesPotentiellementsCultivablesData);
     mettreAjourCouches();
    }



    updateLoadingProgress(80, 100, 0);

    // Charger les données historiques
    await loadHistoricalData();

    updateLoadingProgress(100, 100, 0);
    
    // Finaliser le chargement
    setTimeout(() => {
      const loadingOverlay = document.getElementById('chargementCarte');
      if (loadingOverlay) {
        loadingOverlay.style.opacity = '0';
        setTimeout(async () => {
          loadingOverlay.style.display = 'none';
          isDataLoaded = true;
          await chargerTotalJardins();
          statsCache = null;
          updateStats();
        }, 500);
      }
    }, 200);

  } catch (error) {
    console.error('Erreur lors du chargement:', error);
  }
}

// OPTIMISATION: Chargement des données historiques optimisé
async function loadHistoricalData() {
  const historicalPromises = Object.entries(couchesHistoriques).map(async ([annee, url]) => {
    try {
      const response = await fetch(url);
      const gj = await response.json();
      
      const layer = L.geoJSON(gj, {
        style: {
          color: getColorForYear(annee),
          weight: 2,
          fillOpacity: 0.4,
          opacity: 0.8
        },
        onEachFeature: (feature, layer) => {
          const props = feature.properties;
          
          let popupContent = `
            <div style="font-family: Inter, sans-serif; min-width: 220px;">
              <h4 style="margin: 0 0 0.5rem 0; color: ${getColorForYear(annee)}; font-size: 1.1rem;">
                <i data-lucide="home"></i> Jardin familial (${annee})
              </h4>
          `;
          
          if (annee !== '2026') {
            popupContent += `
              ${props.nom ? `<p style="margin: 0.25rem 0; font-weight: 500; color: #374151;">
                <i data-lucide="tag"></i> <strong>Nom:</strong> ${props.nom}
              </p>` : ''}
              ${props.SURFACE_M2 ? `<p style="margin: 0.25rem 0; color: #6b7280;">
                <i data-lucide="square"></i> <strong>Surface:</strong> ${props.SURFACE_M2} m²
              </p>` : ''}
              ${props.SURFACE_HA ? `<p style="margin: 0.25rem 0; color: #6b7280;">
                <i data-lucide="maximize"></i> <strong>Surface:</strong> ${props.SURFACE_HA} ha
              </p>` : ''}
              ${props.PERIMETRE ? `<p style="margin: 0.25rem 0; color: #6b7280;">
                <i data-lucide="move"></i> <strong>Périmètre:</strong> ${props.PERIMETRE} m
              </p>` : ''}
            `;
          } else {
            popupContent += `
              ${props.NOM ? `<p style="margin: 0.25rem 0; font-weight: 500; color: #374151;">
                <i data-lucide="tag"></i> <strong>Nom:</strong> ${props.NOM}
              </p>` : ''}
              ${props.TPE_ENTITE ? `<p style="margin: 0.25rem 0; color: #6b7280;">
                <i data-lucide="building"></i> <strong>Type:</strong> ${props.TPE_ENTITE}
              </p>` : ''}
              ${props['SUPERFICIE M2'] ? `<p style="margin: 0.25rem 0; color: #6b7280;">
                <i data-lucide="square"></i> <strong>Superficie:</strong> ${Math.round(props['SUPERFICIE M2'])} m²
              </p>` : ''}
            `;
          }
          
          popupContent += `
              <p style="margin: 0.5rem 0 0 0; padding: 0.5rem; background: rgba(16, 185, 129, 0.1); border-radius: 6px; font-size: 0.75rem; color: #059669;">
                <i data-lucide="clock"></i> Données historiques ${annee}
              </p>
            </div>
          `;

          layer.bindPopup(popupContent, {
            className: 'custom-popup historical-popup',
            autoPan: false
          });

          // Événements optimisés
          let hoverTimeout;
          layer.on('mouseover', function(e) {
            clearTimeout(hoverTimeout);
            hoverTimeout = setTimeout(() => {
              e.target.setStyle({ fillOpacity: 0.7, weight: 3 });
            }, 50);
          });

          layer.on('mouseout', function(e) {
            clearTimeout(hoverTimeout);
            e.target.setStyle({ fillOpacity: 0.4, weight: 2 });
          });
        }
      });

      layersHistoriques[annee] = layer;
      statsEvol[annee] = gj.features.length;

      if (annee === "2026") {
        layer.addTo(map);
      }

      return { annee, success: true };
    } catch (error) {
      console.error(`Erreur chargement ${annee}:`, error);
      return { annee, success: false };
    }
  });

  await Promise.all(historicalPromises);
  
  // Finaliser les données historiques
  mettreAjourCouches();
  afficherEvolutionJardins();
  
  // Initialiser les icônes après un délai
  setTimeout(() => lucide.createIcons(), 100);
}

