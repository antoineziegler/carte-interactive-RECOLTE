/* ===== VARIABLES GLOBALES ===== */

// Configuration des couches historiques
const couchesHistoriques = {
  "1956": "data/jardins_familiaux/jardins_familiaux_1956_4326.geojson",
  "1978": "data/jardins_familiaux/jardins_familiaux_1978_4326.geojson",
  "2026": "data/jardins_familiaux/jardins_familiaux_2026_4326.geojson"
};

// Stockage des couches Leaflet et statistiques
const layersHistoriques = {};
const statsEvol = {};

// Configuration EmailJS (formulaire de contact) — un seul jeu de clés utilisé partout
const EMAIL_CONFIG = {
  serviceID: 'service_d1fa99a',
  templateID: 'template_z7j0xu6',
  publicKey: 'igc9S3ZD0rOjTXx7k'
};

// Variables pour l'état de l'application
let panneauOuvert = true;
let currentFilter = 'all';
let isDataLoaded = false;
let loadingProgress = 0;

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



// Correspondance nom jardin → métadonnées
const statsJardinsProductifs = {
  "JARDIN FRIDOLIN": {
    fichier: "data/stats_jardins_productifs/STATS_2025/stats_Fridolin_2025.xlsx",
    date: "2025",
    totalKg: 113,
    superficieCultivee: 300,
    partSuperficieCultivee: "31%",
    rendement: "0.376 kg/m²",
    graphe: "data/stats_jardins_productifs/GRAPH/2025/GRAPH_FRIDOLIN.png",
    historique: [
      { date: "2024",
        fichier: "data/stats_jardins_productifs/STATS_2024/stats_Fridolin_2024.xlsx",
        totalKg: 308.8,
        superficieCultivee: 300,
        partSuperficieCultivee: "31%",
        rendement: "0.972 kg/m²",
        graphe: "data/stats_jardins_productifs/GRAPH/2024/GRAPH_FRIDOLIN.png"},

      { date:"2023",
        fichier: "data/stats_jardins_productifs/STATS_2023/stats_Fridolin_2023.xlsx",
        totalKg: 433,
        superficieCultivee: 300,
        partSuperficieCultivee: "31%",
        rendement: "1.44 kg/m²",
        graphe: "data/stats_jardins_productifs/GRAPH/2023/GRAPH_FRIDOLIN.png"},

      { date: "2022",
        fichier: "data/stats_jardins_productifs/STATS_2022/stats_Fridolin_2022.xlsx",
        totalKg: 258,
        superficieCultivee: 300,
        partSuperficieCultivee: "31%",
        rendement: "0.86 kg/m²",
        graphe: "data/stats_jardins_productifs/GRAPH/2022/GRAPH_FRIDOLIN.png"
      }
    ]
  },
  "LE LOMBRIC HARDI": {
    fichier: "data/stats_jardins_productifs/STATS_2021/stats_Hombric_Hardi_2021.xlsx",
    date: "2021",
    totalKg: 72.9,
    superficieCultivee: 42,
    partSuperficieCultivee: "3%",
    rendement: "1.736 kg/m²",
    graphe: "data/stats_jardins_productifs/GRAPH/2021/GRAPH_HOMBRIC_HARDI.png",
    historique: []
  },
  "LANDSBERG": {
    fichier: "data/stats_jardins_productifs/STATS_2025/stats_Landsberg_2025.xlsx",
    date: "2025",
    totalKg: 82,
    superficieCultivee: 50,
    partSuperficieCultivee: "10.1%",
    rendement: "1.6 kg/m²",
    graphe: "data/stats_jardins_productifs/GRAPH/2025/GRAPH_LANDSBERG.png",
    historique: [
      { date: "2024",
        fichier: "data/stats_jardins_productifs/STATS_2024/stats_Landsberg_2024.xlsx",
        totalKg: 41.6,
       superficieCultivee: 50,
       partSuperficieCultivee: "10.1%",
      rendement: "0.82 kg/m²",
       graphe: "data/stats_jardins_productifs/GRAPH/2024/GRAPH_LANDSBERG.png"
      }
    ]
  },
  "DOMINIQUE": {
    fichier: "data/stats_jardins_productifs/STATS_2025/stats_Dominique_2025.xlsx",
    date: "2025",
    totalKg: 156,
    superficieCultivee: 30,
    partSuperficieCultivee: "9.8%",
    rendement: "5.2 kg/m²",
    graphe: "data/stats_jardins_productifs/GRAPH/2025/GRAPH_DOMINIQUE.png",
    historique: [
      { date: "2024", 
        fichier: "data/stats_jardins_productifs/STATS_2024/stats_Dominique_2024.xlsx",
        totalKg: 158,
        superficieCultivee: 30,
        partSuperficieCultivee: "9.8%",
        rendement: "5.26 kg/m²",
        graphe: "data/stats_jardins_productifs/GRAPH/2024/GRAPH_DOMINIQUE.png" },
      
      { date :"2023",
        fichier: "data/stats_jardins_productifs/STATS_2023/stats_Dominique_2023.xlsx",
        totalKg : 136,
        superficieCultivee: 30,
        partSuperficieCultivee: "9.8%",
        rendement: "4.53 kg/m²",
        graphe: "data/stats_jardins_productifs/GRAPH/2023/GRAPH_DOMINIQUE.png"},

      { date: "2022",
        fichier: "data/stats_jardins_productifs/STATS_2022/stats_Dominique_2022.xlsx",
        totalKg: 80.5,
        superficieCultivee: 30,
        partSuperficieCultivee: "9.8%",
        rendement: "2.68 kg/m²",
        graphe: "data/stats_jardins_productifs/GRAPH/2022/GRAPH_DOMINIQUE.png" 
      }
       ]
  
  },
  "LE CHOU DE BRUXELLES": {
    fichier: "data/stats_jardins_productifs/STATS_2025/stats_Chou_De_Bruxelles_2025.xlsx",
    date: "2025",
    totalKg: 169.5,
    superficieCultivee: 350,
    partSuperficieCultivee: "51%",
    rendement: "0.5 kg/m²",
    graphe: "data/stats_jardins_productifs/GRAPH/2025/GRAPH_LE_CHOU_DE_BRUXELLES.png",
    historique: []
  },
  "MASSIF NOURRICIER ESPLANADE": {
    fichier: "data/stats_jardins_productifs/STATS_2025/stats_Massif_Nourricier_Esplanade_2025.xlsx",
    date: "2025",
    totalKg: 103.7,
    superficieCultivee: 242,
    partSuperficieCultivee: "77,5%",
    rendement: "0.423 kg/m²",
    graphe: "data/stats_jardins_productifs/GRAPH/2025/GRAPH_MASSIF_NOURRICIER_ESPLANADE.png",
    historique: []
  },
  "FERME DU HOHBERG": {
    fichier: "data/stats_jardins_productifs/STATS_2025/stats_Ferme_Du_Hohberg_2025.xlsx",
    date: "2025",
    totalKg: 152,
    superficieCultivee: 1500,
    partSuperficieCultivee: "37,5%",
    rendement: "0.1 kg/m²",
    graphe: "data/stats_jardins_productifs/GRAPH/2025/GRAPH_FERME_DU_HOHBERG.png",
    historique: []
  },
  "CÉLINE & BEN": {
    fichier: "data/stats_jardins_productifs/STATS_2025/stats_Céline&Ben_2025.xlsx",
    date: "2025",
    totalKg: 50,
    superficieCultivee: "24,4",
    partSuperficieCultivee: "10,6%",
    rendement: "2 kg/m²",
    graphe: "data/stats_jardins_productifs/GRAPH/2025/GRAPH_CELINE&BEN.png",
    historique: []
  },
  "APOLLINE": {
    fichier: "data/stats_jardins_productifs/STATS_2025/stats_Apolline_2025.xlsx",
    date: "2025",
    totalKg: 36.3,
    superficieCultivee: "24,3 m²",
    partSuperficieCultivee: null,
    rendement: "1.5 kg/m²",
    graphe: "data/stats_jardins_productifs/GRAPH/2025/GRAPH_APOLLINE.png",
    historique: []
  },
  "RAPHAËL": {
    fichier: "data/stats_jardins_productifs/STATS_2025/stats_Raphaël_2025.xlsx",
    date: "2025",
    totalKg: 54.2,
    superficieCultivee: null,
    partSuperficieCultivee: null,
    rendement: null,
    graphe: "data/stats_jardins_productifs/GRAPH/2025/GRAPH_RAPHAEL.png",
    historique: []
  }
};

function populerListeJardinsProductifs() {
  const ul = document.getElementById('liste-jardins-productifs');
  if (!ul) return;

  ul.innerHTML = '';
  const jardins = [];

  jardinsProductifs.eachLayer(function(layer) {
    const props = layer.feature.properties;
    const nom = props.NOM;
    const superficie = props["SUPERFICIE M2"] ? Math.round(props["SUPERFICIE M2"]) + ' m²' : '—';
    if (nom && !jardins.find(j => j.nom === nom)) {
      jardins.push({ nom, superficie });
    }
  });

  // Jardins sans GeoJSON (stats uniquement)
  const jardinsManuel = [
    { nom: "APOLLINE", superficie: "non-renseigné" },
    { nom: "RAPHAËL", superficie: "non-renseigné" },
    { nom: "CÉLINE & BEN", superficie: "230 m²" },
    { nom: "DOMINIQUE", superficie: "306 m²" }
  ];
  jardinsManuel.forEach(j => {
    if (!jardins.find(jj => jj.nom === j.nom)) {
      jardins.push({ nom: j.nom, superficie: j.superficie || '—', sansGeojson: true });
    }
  });

  jardins.sort((a, b) => a.nom.localeCompare(b.nom));

  jardins.forEach(({ nom, superficie, sansGeojson }) => {
    const li = document.createElement('li');
    li.className = 'garden-item';
    li.style.cursor = 'pointer';
    const meta = statsJardinsProductifs[nom];
    const superficieCultivee = meta && meta.superficieCultivee !== null ? `${meta.superficieCultivee} m²` : '—';
    li.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <div style="width: 12px; height: 12px; background: #f97316; border: 2px solid #ea580c; border-radius: 2px; flex-shrink: 0;"></div>
        <div>
          <div style="font-weight: 500; font-size: 0.85rem; color: var(--text-primary);">${nom}</div>
          <div style="font-size: 0.75rem; color: var(--text-secondary);">Superficie totale : ${superficie}</div>
          <div style="font-size: 0.75rem; color: var(--text-secondary);">Superficie cultivée : ${superficieCultivee}</div>
        </div>
      </div>
    `;
    li.addEventListener('click', () => {
      afficherStatsJardinProductif(nom, superficie);
      if (!sansGeojson) {
        jardinsProductifs.eachLayer(function(layer) {
          if (layer.feature.properties.NOM === nom) {
            map.setView(layer.getBounds().getCenter(), 19);
          }
        });
      }
    });
    ul.appendChild(li);
  });
}

async function afficherStatsJardinProductif(nom, superficie, anneeSelectionnee = null) {
  const panel = document.getElementById('panneau-stats');
  const title = document.getElementById('panneau-stats-titre');
  const body = document.getElementById('panneau-stats-corps');

  const meta = statsJardinsProductifs[nom];

  panel.classList.remove('hidden');
  lucide.createIcons();
  setTimeout(() => map.invalidateSize(), 320);

  if (!meta) {
    title.textContent = nom;
    body.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.85rem;">Aucune donnée disponible.</p>';
    return;
  }

  // Construire la liste de toutes les années disponibles (récente → ancienne)
  const toutesLesAnnees = [
    { date: meta.date, fichier: meta.fichier, totalKg: meta.totalKg, graphe: meta.graphe,
      superficieCultivee: meta.superficieCultivee, partSuperficieCultivee: meta.partSuperficieCultivee, rendement: meta.rendement },
    ...(meta.historique || [])
  ].sort((a, b) => b.date - a.date);

  const annee = anneeSelectionnee || meta.date;
  const donnees = toutesLesAnnees.find(a => a.date === annee) || toutesLesAnnees[0];

  title.textContent = `${nom} — ${donnees.date}`;
  body.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.85rem;">Chargement...</p>';

  try {
    // Sélecteur d'années (uniquement si plusieurs années disponibles)
    let selectorHTML = '';
    if (toutesLesAnnees.length > 1) {
      selectorHTML = `<div style="display:flex; gap:0.4rem; flex-wrap:wrap; margin-bottom:1rem;">
        ${toutesLesAnnees.map(a => `
          <button onclick="afficherStatsJardinProductif('${nom}', '${superficie}', '${a.date}')"
            style="padding:0.25rem 0.75rem; border-radius:20px; border:2px solid #ea580c;
                   background:${a.date === donnees.date ? '#ea580c' : 'transparent'};
                   color:${a.date === donnees.date ? '#fff' : '#ea580c'};
                   cursor:pointer; font-size:0.8rem; font-weight:600; transition: all 0.2s;">
            ${a.date}
          </button>`).join('')}
      </div>`;
    }

    const response = await fetch(donnees.fichier);
    const buffer = await response.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    const lignesDonnees = rows.filter(r => r[0] && r[1] !== '' && typeof r[1] === 'number');

    const totalHTML = donnees.totalKg !== null && donnees.totalKg !== undefined ? `
      <div class="stats-total" style="margin-bottom: 1rem;">
        <strong>Production totale :</strong>
        <span style="color: #ea580c; font-weight: 600; margin-left: 0.4rem;">${donnees.totalKg} kg</span>
      </div>` : '';

    let tableHTML = `
      <table class="stats-table">
        <thead><tr><th>Variété</th><th>Production (g)</th></tr></thead>
        <tbody>`;
    lignesDonnees.forEach(r => {
      tableHTML += `<tr><td>${r[0]}</td><td>${Number(r[1]).toLocaleString('fr-FR')} g</td></tr>`;
    });
    tableHTML += '</tbody></table>';
    tableHTML += `<p style="margin-top: 0.75rem; font-size: 0.75rem; color: var(--text-secondary);">Superficie totale : ${superficie}</p>`;
    if (donnees.superficieCultivee != null) {
      tableHTML += `<p style="font-size: 0.75rem; color: var(--text-secondary);">Superficie cultivée : ${donnees.superficieCultivee} m²</p>`;
    }
    if (donnees.partSuperficieCultivee != null) {
      tableHTML += `<p style="font-size: 0.75rem; color: var(--text-secondary);">Part de la superficie cultivée : ${donnees.partSuperficieCultivee}</p>`;
    }
    if (donnees.rendement != null) {
      tableHTML += `<p style="font-size: 0.75rem; color: var(--text-secondary);">Rendement : ${donnees.rendement}</p>`;
    }

    const grapheHTML = donnees.graphe ? `
      <div style="margin-top: 1rem;">
        <img src="${donnees.graphe}" alt="Graphique ${nom}"
          style="width: 100%; border-radius: 8px; border: 1px solid var(--border-color); cursor: zoom-in;"
          onclick="ouvrirLightbox(this.src)" />
        <p style="font-size: 0.72rem; color: var(--text-secondary); text-align: center; margin-top: 0.25rem;">Cliquez pour agrandir</p>
      </div>` : '';

    body.innerHTML = selectorHTML + totalHTML + tableHTML + grapheHTML;

  } catch (e) {
    body.innerHTML = '<p style="color: #ef4444; font-size: 0.85rem;">Erreur lors du chargement du fichier.</p>';
    console.error(e);
  }
}

// Variable pour le contrôleur de couches
let controleCouches;

/* ===== FONCTIONS UTILITAIRES OPTIMISÉES ===== */


// OPTIMISATION: Fonction de progression de chargement
function updateLoadingProgress(processed, total, elapsed) {
  const progress = Math.round((processed / total) * 100);
  if (progress !== loadingProgress) {
    loadingProgress = progress;
    const loadingElement = document.getElementById('chargementCarte');
    if (loadingElement) {
      loadingElement.innerHTML = `
        <div style="text-align: center;">
          <div class="spinner-chargement"></div>
          <p style="margin-top: 1rem; color: var(--text-secondary);">
            Chargement de la carte... ${progress}%
          </p>
          <div style="width: 200px; height: 4px; background: #e5e7eb; border-radius: 2px; margin: 1rem auto;">
            <div style="width: ${progress}%; height: 100%; background: #10b981; border-radius: 2px; transition: width 0.3s ease;"></div>
          </div>
        </div>
      `;
    }
  }
}

// OPTIMISATION: Animation des compteurs avec requestAnimationFrame
function animateCounter(element, start, end, duration = 1000) {
  const startTime = performance.now();
  const range = end - start;
  
  function updateCounter(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Utiliser une fonction d'easing pour une animation plus fluide
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    const current = start + (range * easeProgress);
    
    element.textContent = Math.round(current);
    
    if (progress < 1) {
      requestAnimationFrame(updateCounter);
    }
  }
  
  requestAnimationFrame(updateCounter);
}

// OPTIMISATION: Mise à jour des statistiques avec cache
let statsCache = null;
let totalJardinsGlobal = null;
let totalSuperficieGlobal = null;

async function chargerTotalJardins() {
  try {
    const response = await fetch('data/stats_jardin_globale/SURFACE_TOTALE_ET_NOMBRE_JARDINS.xlsx');
    const buffer = await response.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetNames = workbook.SheetNames;

    // Feuille 8 (index 7) → nombre de jardins
    const sheetNombre = workbook.Sheets[sheetNames[7]];
    if (sheetNombre) {
      const rows = XLSX.utils.sheet_to_json(sheetNombre, { header: 1, defval: '' });
      for (let i = rows.length - 1; i >= 0; i--) {
        if (typeof rows[i][1] === 'number' && rows[i][1] > 0) {
          totalJardinsGlobal = rows[i][1];
          break;
        }
      }
    }

    // Feuille 7 (index 6) → superficie totale (cellule B11)
    const sheetSuperficie = workbook.Sheets[sheetNames[6]];
    if (sheetSuperficie && sheetSuperficie['B11']) {
      totalSuperficieGlobal = sheetSuperficie['B11'].v;
    }
  } catch (e) {
    console.warn('Impossible de charger les stats globales:', e);
  }
}

function calculerRendementMoyen() {
  const valeurs = Object.values(statsJardinsProductifs)
    .map(m => m.rendement)
    .filter(r => r !== null)
    .map(r => parseFloat(r.replace(',', '.')))
    .filter(r => !isNaN(r));
  if (valeurs.length === 0) return 0;
  return (valeurs.reduce((a, b) => a + b, 0) / valeurs.length).toFixed(2);
}

function updateStats() {
  if (!statsCache) {
    statsCache = {
      total: totalJardinsGlobal !== null ? totalJardinsGlobal : (statsEvol["2026"] || 0) + (piegesBarber.getLayers().length || 0),
      family: statsEvol["2026"] || 0,
      barber: piegesBarber.getLayers().length || 0,
      superficie: totalSuperficieGlobal || 0,
      rendementMoyen: calculerRendementMoyen()
    };
  }

  requestAnimationFrame(() => {
    animateCounter(document.getElementById('totalGardens'), 0, statsCache.total);
    animateCounter(document.getElementById('familyGardens'), 0, statsCache.family);
    animateCounter(document.getElementById('barberTraps'), 0, statsCache.barber);
    animateCounter(document.getElementById('totalArea'), 0, statsCache.superficie);
    const avgEl = document.getElementById('avgYield');
    if (avgEl) avgEl.textContent = statsCache.rendementMoyen;
  });
}


function basculerPanneau() {
  const sidebar = document.getElementById('sidebar');
  const ressources = document.getElementById('sidebar-ressources');

  // Fermer les ressources et projection si ouvertes
  ressources.style.display = 'none';
  ressources.classList.add('hidden');
  const projection = document.getElementById('sidebar-projection');
  projection.style.display = 'none';
  projection.classList.add('hidden');

  panneauOuvert = !panneauOuvert;
  sidebar.classList.toggle('collapsed');
  setTimeout(() => map.invalidateSize(), 320);
}

function basculerRessources() {
  const sidebar = document.getElementById('sidebar');
  const ressources = document.getElementById('sidebar-ressources');
  const projection = document.getElementById('sidebar-projection');
  const isOpen = ressources.style.display === 'flex';

  projection.style.display = 'none';
  projection.classList.add('hidden');

  if (isOpen) {
    ressources.style.display = 'none';
    ressources.classList.add('hidden');
  } else {
    if (!sidebar.classList.contains('collapsed')) {
      panneauOuvert = false;
      sidebar.classList.add('collapsed');
    }
    ressources.style.display = 'flex';
    ressources.classList.remove('hidden');
    lucide.createIcons();
  }
  setTimeout(() => map.invalidateSize(), 320);
}

function basculerProjection() {
  const sidebar = document.getElementById('sidebar');
  const ressources = document.getElementById('sidebar-ressources');
  const projection = document.getElementById('sidebar-projection');
  const isOpen = projection.style.display === 'flex';

  ressources.style.display = 'none';
  ressources.classList.add('hidden');

  if (isOpen) {
    projection.style.display = 'none';
    projection.classList.add('hidden');
  } else {
    if (!sidebar.classList.contains('collapsed')) {
      panneauOuvert = false;
      sidebar.classList.add('collapsed');
    }
    projection.style.display = 'flex';
    projection.classList.remove('hidden');
    lucide.createIcons();
  }
  setTimeout(() => map.invalidateSize(), 320);
}


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

/* ===== FONCTIONS DE STYLE ET COULEURS ===== */

function getColorForYear(annee) {
  const colors = {
    "1956": "#ef4444",
    "1978": "#f97316",
    "2026": "#3b82f6"
  };
  return colors[annee] || "#6b7280";
}

const superficiesHistoriques = {
  "1956": "253 ha",
  "1978": "240.7 ha",
  "2026": "206.4 ha"
};

function afficherEvolutionJardins() {
  const ul = document.getElementById('liste-evolution');
  if (!ul) return;
  
  ul.innerHTML = '';
  const annees = Object.keys(statsEvol).sort();
  
  // Utiliser DocumentFragment pour optimiser
  const fragment = document.createDocumentFragment();
  
  annees.forEach((annee, index) => {
    const li = document.createElement('li');
    li.className = 'garden-item';
    li.style.animationDelay = `${index * 0.1}s`;
    li.innerHTML = `
      <div style="display: flex; flex-direction: column; width: 100%;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <div style="width: 12px; height: 12px; background: ${getColorForYear(annee)}; border-radius: 50%;"></div>
          <span><strong>${annee}</strong> : ${statsEvol[annee]} collectifs de jardins</span>
        </div>
        <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem;">Superficie : ${superficiesHistoriques[annee] || '— ha'}</div>
      </div>
    `;
    
    li.addEventListener('click', () => {
      updateHistoricalDisplay(annee);
    });
    
    fragment.appendChild(li);
  });
  
  ul.appendChild(fragment);
  lucide.createIcons();
}


/* ===== GESTIONNAIRES D'ÉVÉNEMENTS OPTIMISÉS ===== */

// OPTIMISATION: Utiliser la délégation d'événements et le debouncing
document.addEventListener('DOMContentLoaded', function() {
  // Initialiser EmailJS
  initEmailJS();

  // Initialiser les gestionnaires avec debouncing
  const debouncedHandlers = {
    sidebar: debounce(basculerPanneau, 300),
    search: debounce(showSearchModal, 300),
    contact: debounce(showContactForm, 300),
    export: debounce(exportGardenData, 1000)
  };

  // Gestionnaires optimisés
  document.getElementById('sidebarToggle').addEventListener('click', debouncedHandlers.sidebar);
  document.getElementById('projectionBtn').addEventListener('click', basculerProjection);
  document.getElementById('ressourcesBtn').addEventListener('click', basculerRessources);
  document.getElementById('searchBtn').addEventListener('click', debouncedHandlers.search);
  document.getElementById('contactBtn').addEventListener('click', debouncedHandlers.contact);
  document.getElementById('exportBtn').addEventListener('click', debouncedHandlers.export);

  // Recherche
  document.getElementById('recherche-fermer').addEventListener('click', fermerRecherche);
  document.getElementById('champ-recherche').addEventListener('input', function() {
    clearTimeout(timerRecherche);
    timerRecherche = setTimeout(() => lancerRecherche(this.value), 300);
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') fermerRecherche();
  });

  // Fermeture du panneau stats
  document.getElementById('panneau-stats-fermer').addEventListener('click', function() {
    document.getElementById('panneau-stats').classList.add('hidden');
    setTimeout(() => map.invalidateSize(), 320);
  });

  // Bouton toggle légende
  document.getElementById('basculeLegende').addEventListener('click', function() {
    const panel = document.querySelector('.legende');
    if (panel) {
      panel.classList.toggle('legende-cachee');
    }
  });

  // Délégation d'événements pour les filtres
  document.addEventListener('click', function(e) {
    if (e.target.matches('.filter-chip[data-filter]')) {
      document.querySelectorAll('.filter-chip[data-filter]').forEach(c => c.classList.remove('active'));
      e.target.classList.add('active');
      currentFilter = e.target.dataset.filter;
      applyFilters();
    }
  });

  // Initialiser les icônes et démarrer le chargement
  lucide.createIcons();
  initParticles();
  
  // Démarrer le chargement des données
  loadAllData();
  chargerGuildes();

  // Bouton guildes
  document.getElementById('panneau-guildes-fermer').addEventListener('click', () => {
    document.getElementById('panneau-guildes').classList.add('hidden');
    setTimeout(() => map.invalidateSize(), 320);
  });
});

// OPTIMISATION: Fonction utilitaire de debouncing
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}


/* ===== FONCTIONS SIMPLIFIÉES POUR LES MODALS ===== */

function showSearchModal() {
  const modal = document.getElementById('modal-recherche');
  modal.classList.remove('hidden');
  document.getElementById('champ-recherche').focus();
}

function fermerRecherche() {
  document.getElementById('modal-recherche').classList.add('hidden');
  document.getElementById('champ-recherche').value = '';
  document.getElementById('resultats-recherche').innerHTML = '';
}

function rechercherJardins(query) {
  const q = query.toLowerCase().trim();
  const resultats = [];

  // Jardins productifs
  jardinsProductifs.eachLayer(layer => {
    const nom = layer.feature.properties.NOM || '';
    if (nom.toLowerCase().includes(q)) {
      resultats.push({
        type: 'productif', label: nom,
        sub: 'Jardin productif',
        icone: '🌿', couleur: '#f97316',
        action: () => {
          map.setView(layer.getBounds().getCenter(), 19);
          fermerRecherche();
        }
      });
    }
  });

  // Jardins partagés
  jardinsPartages.eachLayer(layer => {
    const nom = layer.feature.properties.Nom_du_poin || '';
    if (nom.toLowerCase().includes(q)) {
      resultats.push({
        type: 'partage', label: nom,
        sub: 'Jardin partagé',
        icone: '🌱', couleur: '#22c55e',
        action: () => {
          map.fitBounds(layer.getBounds(), { padding: [80, 80] });
          fermerRecherche();
        }
      });
    }
  });

  // PUC
  puc.eachLayer(layer => {
    const nom = layer.feature.properties.Nom_du_poin || '';
    if (nom.toLowerCase().includes(q)) {
      resultats.push({
        type: 'puc', label: nom,
        sub: 'Potager Urbain Collectif',
        icone: '🥦', couleur: '#06b6d4',
        action: () => {
          map.fitBounds(layer.getBounds(), { padding: [80, 80] });
          fermerRecherche();
        }
      });
    }
  });

  // Production agricole professionnelle
  productionAgricole.eachLayer(layer => {
    const nom = layer.feature.properties.name || '';
    if (nom.toLowerCase().includes(q)) {
      resultats.push({
        type: 'production-agricole', label: nom,
        sub: 'Production agricole professionnelle',
        icone: '🌾', couleur: '#be185d',
        action: () => {
          map.setView(layer.getLatLng(), 17);
          layer.openPopup();
          fermerRecherche();
        }
      });
    }
  });

  // Massifs nourriciers
  massifsNourriciers.eachLayer(layer => {
    const nom = layer.feature.properties.NOM || '';
    if (nom.toLowerCase().includes(q)) {
      resultats.push({
        type: 'massif', label: nom,
        sub: 'Massif nourricier',
        icone: '🌾', couleur: '#0f766e',
        action: () => {
          map.fitBounds(layer.getBounds(), { padding: [80, 80] });
          fermerRecherche();
        }
      });
    }
  });

  // Initiatives jardinesques
  initiativesEmergentes.eachLayer(layer => {
    const nom = layer.feature.properties.name || '';
    if (nom.toLowerCase().includes(q)) {
      resultats.push({
        type: 'initiative', label: nom,
        sub: 'Initiative jardinesques',
        icone: '🌻', couleur: '#d97706',
        action: () => {
          map.setView(layer.getLatLng(), 17);
          layer.openPopup();
          fermerRecherche();
        }
      });
    }
  });

  // Cités Fertiles
  citesFertiles.eachLayer(layer => {
    const nom = layer.feature.properties.NOM || '';
    if (nom.toLowerCase().includes(q)) {
      resultats.push({
        type: 'cite-fertile', label: nom,
        sub: 'Cité Fertile',
        icone: '🌸', couleur: '#7c3aed',
        action: () => {
          map.fitBounds(layer.getBounds(), { padding: [80, 80] });
          fermerRecherche();
        }
      });
    }
  });

  // Jardins familiaux (depuis statsEvol / layersHistoriques)
  Object.entries(layersHistoriques).forEach(([annee, couche]) => {
    couche.eachLayer(layer => {
      const nom = layer.feature.properties.NOM || layer.feature.properties.nom || '';
      if (nom && nom.toLowerCase().includes(q)) {
        resultats.push({
          type: 'familial', label: nom,
          sub: `Jardin familial ${annee}`,
          icone: '🏡', couleur: '#3b82f6',
          action: () => {
            map.fitBounds(layer.getBounds(), { padding: [80, 80] });
            fermerRecherche();
          }
        });
      }
    });
  });

  // Jardins sans GeoJSON (Apolline, Raphaël…)
  Object.keys(statsJardinsProductifs).forEach(nom => {
    if (nom.toLowerCase().includes(q) && !resultats.find(r => r.label === nom)) {
      resultats.push({
        type: 'productif', label: nom,
        sub: 'Jardin productif (stats uniquement)',
        icone: '🌿', couleur: '#f97316',
        action: () => {
          afficherStatsJardinProductif(nom, '—');
          fermerRecherche();
        }
      });
    }
  });

  return resultats;
}

let timerRecherche = null;
async function lancerRecherche(query) {
  const resultsDiv = document.getElementById('resultats-recherche');
  if (!query || query.trim().length < 2) {
    resultsDiv.innerHTML = '';
    return;
  }

  resultsDiv.innerHTML = '<div class="recherche-vide">Recherche...</div>';

  const jardins = rechercherJardins(query);

  // Recherche adresse via Nominatim
  let adresses = [];
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=4&countrycodes=fr&viewbox=7.6,48.4,7.9,48.7&bounded=0`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'fr' } });
    const data = await res.json();
    adresses = data.map(r => ({
      label: r.display_name.split(',').slice(0, 2).join(','),
      sub: r.display_name.split(',').slice(2, 4).join(',').trim(),
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon)
    }));
  } catch (e) {}

  let html = '';

  if (jardins.length > 0) {
    html += '<div class="titre-section-recherche">Jardins</div>';
    jardins.forEach(r => {
      html += `
        <div class="element-resultat-recherche" data-idx="${jardins.indexOf(r)}" data-type="jardin">
          <div class="icone-resultat-recherche" style="background: ${r.couleur}22;">${r.icone}</div>
          <div>
            <div class="texte-resultat-recherche">${r.label}</div>
            <div class="sous-texte-resultat">${r.sub}</div>
          </div>
        </div>`;
    });
  }

  if (adresses.length > 0) {
    html += '<div class="titre-section-recherche">Adresses</div>';
    adresses.forEach((a, i) => {
      html += `
        <div class="element-resultat-recherche" data-idx="${i}" data-type="adresse">
          <div class="icone-resultat-recherche" style="background: #6b728022;">📍</div>
          <div>
            <div class="texte-resultat-recherche">${a.label}</div>
            <div class="sous-texte-resultat">${a.sub}</div>
          </div>
        </div>`;
    });
  }

  if (!html) {
    html = '<div class="recherche-vide">Aucun résultat trouvé.</div>';
  }

  resultsDiv.innerHTML = html;

  // Clics sur les jardins
  resultsDiv.querySelectorAll('[data-type="jardin"]').forEach(el => {
    el.addEventListener('click', () => jardins[+el.dataset.idx].action());
  });

  // Clics sur les adresses
  resultsDiv.querySelectorAll('[data-type="adresse"]').forEach(el => {
    el.addEventListener('click', () => {
      const a = adresses[+el.dataset.idx];
      map.setView([a.lat, a.lon], 17);
      fermerRecherche();
    });
  });
}

// Fonction pour afficher le formulaire de contact avec EmailJS
function showContactForm() {
  const contactModal = document.createElement('div');
  contactModal.className = 'modal-overlay';
  contactModal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3><i data-lucide="mail"></i> Contact - Projet Récolte</h3>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="modal-body">
        <div class="contact-intro">
          <p><strong>Vous êtes intéressé(e) par l'auto-production alimentaire et notre projet de suivi des récoltes vous intéresse ?</strong></p>
          <p>Nous collectons des données sur les jardins privés et publics pour mieux comprendre l'agriculture urbaine à Strasbourg. Rejoignez-nous pour :</p>
          <ul>
            <li>🌱 Rejoindre un réseau de jardiniers</li>
            <li>📊 Partager les données de votre jardin</li>
            <li>💡 Proposer des améliorations</li>
            <li>❓ Poser des questions sur le projet</li>
          </ul>
        </div>
        
        <form id="contactForm">
          <div class="form-row">
            <div class="form-group">
              <label for="contactName">Nom Prénom *</label>
              <input type="text" id="contactName" name="name" required>
            </div>
            <div class="form-group">
              <label for="contactEmail">Email *</label>
              <input type="email" id="contactEmail" name="email" required>
            </div>
          </div>
          
          <div class="form-group">
            <label for="contactPhone">Téléphone (optionnel)</label>
            <input type="tel" id="contactPhone" name="phone">
          </div>
          
          <div class="form-group">
            <label for="contactSubject">Sujet de votre demande *</label>
            <select id="contactSubject" name="subject" required>
              <option value="">Sélectionnez un sujet</option>
              <option value="data-sharing">🌱 Partager mes données de récolte</option>
              <option value="join-network">🤝 Rejoindre le réseau de jardiniers</option>
              <option value="garden-registration">📝 Enregistrer mon jardin</option>
              <option value="collaboration">💼 Proposition de collaboration</option>
              <option value="technical-issue">🔧 Problème technique</option>
              <option value="general-info">ℹ️ Demande d'information générale</option>
              <option value="suggestion">💡 Suggestion d'amélioration</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="gardenInfo">Informations sur votre jardin (optionnel)</label>
            <textarea id="gardenInfo" name="gardenInfo" rows="2" placeholder="Superficie, localisation, types de cultures..."></textarea>
          </div>
          
          <div class="form-group">
            <label for="contactMessage">Votre message *</label>
            <textarea id="contactMessage" name="message" rows="4" required placeholder="Décrivez votre demande ou partagez vos questions..."></textarea>
          </div>
          
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" id="newsletter" name="newsletter">
              <span class="checkmark"></span>
              Je souhaite recevoir des informations sur les jardins de Strasbourg
            </label>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
              <i data-lucide="x"></i>
              Annuler
            </button>
            <button type="submit" class="btn btn-primary">
              <i data-lucide="send"></i>
              Envoyer le message
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.appendChild(contactModal);
  
  // ✅ GESTIONNAIRE DE SOUMISSION AVEC EMAILJS
  document.getElementById('contactForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Afficher le loader pendant l'envoi
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalBtnContent = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i data-lucide="loader"></i> Envoi en cours...';
    submitBtn.disabled = true;
    lucide.createIcons();
    
    // Récupérer les données du formulaire
    const formData = new FormData(this);
    const contactData = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone') || 'Non renseigné',
      subject: formData.get('subject'),
      gardenInfo: formData.get('gardenInfo') || 'Aucune information fournie',
      message: formData.get('message'),
      newsletter: formData.get('newsletter') ? 'Oui' : 'Non',
      timestamp: new Date().toLocaleString('fr-FR')
    };

    // Préparer les données pour EmailJS
    const emailParams = {
      from_name: contactData.name,
      from_email: contactData.email,
      phone: contactData.phone,
      subject: contactData.subject,
      garden_info: contactData.gardenInfo,
      message: contactData.message,
      newsletter: contactData.newsletter,
      timestamp: contactData.timestamp,
      formatted_subject: `[Jardins Strasbourg] ${contactData.subject.replace(/[🌱🤝📝💼🔧ℹ️💡]/g, '').trim()}`
    };

    // ✅ ENVOI AVEC EMAILJS
    if (typeof emailjs !== 'undefined') {
      emailjs.send(
        EMAIL_CONFIG.serviceID,
        EMAIL_CONFIG.templateID,
        emailParams,
        EMAIL_CONFIG.publicKey
      )
      .then(function(response) {
        console.log('✅ Email envoyé avec succès !', response.status, response.text);
        contactModal.remove();
        
        // Sauvegarder localement (optionnel)
        try {
          const existingContacts = JSON.parse(localStorage.getItem('jardins_contacts') || '[]');
          existingContacts.push(contactData);
          localStorage.setItem('jardins_contacts', JSON.stringify(existingContacts));
        } catch (error) {
          console.warn('⚠️ Impossible de sauvegarder localement');
        }
      })
      .catch(function(error) {
        console.error('❌ Erreur lors de l\'envoi :', error);
        
        // Restaurer le bouton
        submitBtn.innerHTML = originalBtnContent;
        submitBtn.disabled = false;
        lucide.createIcons();
      });
    } else {
      // Fallback si EmailJS n'est pas disponible
      console.error('❌ EmailJS non disponible');
      
      // Sauvegarder quand même les données
      console.log('Données de contact (fallback):', contactData);
      contactModal.remove();
      
      submitBtn.innerHTML = originalBtnContent;
      submitBtn.disabled = false;
    }
  });
  
  // Réinitialiser les icônes Lucide dans le modal
  lucide.createIcons();
}

function initEmailJS() {
  if (typeof emailjs !== 'undefined') {
    emailjs.init(EMAIL_CONFIG.publicKey);
    console.log('✅ EmailJS initialisé avec succès');
  } else {
    console.error('❌ EmailJS non trouvé - vérifiez que le script est chargé');
  }
}

async function exportGardenData() {
  const btn = document.getElementById('exportBtn');
  btn.disabled = true;
  btn.innerHTML = '<i data-lucide="loader"></i> Export...';
  lucide.createIcons();

  const zip = new JSZip();

  // --- Fichiers GeoJSON ---
  const geojsonFiles = [
    { path: 'data/jardins_familiaux/jardins_familiaux_1956_4326.geojson', dest: 'geojson/jardins_familiaux_1956.geojson' },
    { path: 'data/jardins_familiaux/jardins_familiaux_1978_4326.geojson', dest: 'geojson/jardins_familiaux_1978.geojson' },
    { path: 'data/jardins_familiaux/jardins_familiaux_2026_4326.geojson', dest: 'geojson/jardins_familiaux_2026.geojson' },
    { path: 'data/jardins_partagés/jardins_partagés.geojson',             dest: 'geojson/jardins_partages.geojson' },
    { path: 'data/PUC/Potager Urbain Collectif.geojson',                  dest: 'geojson/potagers_urbains_collectifs.geojson' },
    { path: 'data/pieges_barbers/BD_JARDIBIODIV.geojson',                 dest: 'geojson/pieges_barber.geojson' },
    { path: 'data/limites_ems_4326.geojson',                              dest: 'geojson/limites_ems.geojson' },
    { path: 'data/jardins_productifs/Jardin_productif_Fridolin_2025.geojson',              dest: 'geojson/jardins_productifs/Fridolin.geojson' },
    { path: 'data/jardins_productifs/Jardin_productif_Le_Lombric_Hardi_2025.geojson',      dest: 'geojson/jardins_productifs/Lombric_Hardi.geojson' },
    { path: 'data/jardins_productifs/Jardin_productif_Landsberg_2025.geojson',             dest: 'geojson/jardins_productifs/Landsberg.geojson' },
    { path: 'data/jardins_productifs/Jardin_productif_Dominique_2025.geojson',             dest: 'geojson/jardins_productifs/Dominique.geojson' },
    { path: 'data/jardins_productifs/Jardin_productif_Le_Chou_De_Bruxelles_2025.geojson', dest: 'geojson/jardins_productifs/Chou_De_Bruxelles.geojson' },
    { path: 'data/jardins_productifs/Jardin_productif_Massif_Nourricier_Esplanade_2025.geojson', dest: 'geojson/jardins_productifs/Massif_Nourricier.geojson' },
    { path: 'data/jardins_productifs/Jardin_productif_Ferme_du_Hohberg_2025.geojson',     dest: 'geojson/jardins_productifs/Ferme_Hohberg.geojson' },
    { path: 'data/jardins_productifs/Jardin_productif_Céline&Ben_2025.geojson',           dest: 'geojson/jardins_productifs/Celine_Ben.geojson' },
  ];

  // --- Fichiers XLSX ---
  const xlsxFiles = Object.entries(statsJardinsProductifs).map(([nom, meta]) => ({
    path: meta.fichier,
    dest: 'stats_jardins_productifs/' + meta.fichier.split('/').pop()
  }));

  const tousLesFichiers = [...geojsonFiles, ...xlsxFiles];

  await Promise.all(tousLesFichiers.map(async ({ path, dest }) => {
    try {
      const res = await fetch(path);
      if (!res.ok) return;
      const blob = await res.blob();
      zip.file(dest, blob);
    } catch (e) {}
  }));

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = `jardins-strasbourg-${new Date().toISOString().split('T')[0]}.zip`;
  link.click();
  URL.revokeObjectURL(url);

  btn.disabled = false;
  btn.innerHTML = '<i data-lucide="download"></i> Exporter';
  lucide.createIcons();
}

function applyFilters() {
  requestAnimationFrame(() => {
    switch(currentFilter) {
      case 'recent':
        // Affiche uniquement les jardins familiaux les plus récents (2026)
        if (layersHistoriques["2026"] && !map.hasLayer(layersHistoriques["2026"])) {
          map.addLayer(layersHistoriques["2026"]);
        }
        ["1956", "1978"].forEach(annee => {
          if (layersHistoriques[annee] && map.hasLayer(layersHistoriques[annee])) {
            map.removeLayer(layersHistoriques[annee]);
          }
        });
        break;
    }
  });
}

/* ===== EFFETS VISUELS OPTIMISÉS ===== */

function initParticles() {
  const particlesContainer = document.getElementById('particles');
  if (!particlesContainer) return;
  
  // Réduire le nombre de particules pour les performances
  let particleCount = 0;
  const maxParticles = 20;
  
  function createParticle() {
    if (particleCount >= maxParticles) return;
    
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDuration = (Math.random() * 10 + 15) + 's';
    particle.style.opacity = Math.random() * 0.2;
    
    particlesContainer.appendChild(particle);
    particleCount++;

    setTimeout(() => {
      if (particle.parentNode) {
        particle.parentNode.removeChild(particle);
        particleCount--;
      }
    }, 20000);
  }

  // Créer moins de particules, moins fréquemment
  setInterval(createParticle, 5000);
}

// ===== PANNEAU INFO LÉGENDE =====
const legendeInfos = {
  "jardins-familiaux": {
    icone: "🏡",
    titre: "Jardins familiaux",
    blocs: [
      {
        titre: "Évolution historique",
        texte: "La carte représente l'évolution des jardins familiaux de 1956 à 2026 au sein de l'Eurométropole de Strasbourg. On y observe un recul notable de ces espaces, avec une perte de 46,7 ha, soit 18,5 % de la superficie initialement allouée.",
      },
      {
        titre: "Description",
        texte: "Les jardins familiaux sont attribués à des particuliers par la Ville de Strasbourg. Ils permettent aux habitants de jardiner et de produire fruits et légumes pour leur consommation personnelle.",
      },
      {
        titre: "Réglementation",
        texte: "Toute parcelle doit être plantée au minimum sur ⅔ de sa surface en potager."
      },
    ],
    stats: [
      { label: "Années disponibles", valeur: "1956, 1978, 2026" },
      { label: "Gestionnaire", valeur: "Ville de Strasbourg" }
    ]
  },
  "pieges-barber": {
    icone: "🪲",
    titre: "Pièges Barber",
    blocs: [
      {
        titre: "Description",
        texte: "Les pièges Barber sont des dispositifs entomologiques enterrés permettant de capturer les invertébrés du sol. Ils servent à évaluer la biodiversité et la santé écologique des jardins."
      },
      {
        titre: "Méthodologie",
        texte: "Chaque piège est relevé selon un protocole défini. Les données collectées (abondance, diversité, indice de Shannon, de Piélou) permettent de comparer les milieux entre eux."
      },
      
    ],
    stats: [
      { label: "Indicateurs", valeur: "Abondance, Diversité, Shannon, Piélou" }
    ],
    explication: [
      { titre: "Indices écologiques", texte: "L'indice de Shannon mesure la diversité des espèces : plus il est élevé, plus le milieu est diversifié.<br><br>L'indice de Piélou (ou équitabilité) indique si les espèces sont présentes en proportions équilibrées ou déséquilibrées. Un indice proche de 1 signifie que toutes les espèces sont aussi abondantes les unes que les autres." }
    ]
  },
  "puc": {
    icone: "🥦",
    titre: "Potagers Urbains Collectifs",
    blocs: [
      {
        titre: "Description",
        texte: "Les Potagers Urbains Collectifs (PUC) sont des espaces de jardinage partagés, ouverts à tous les habitants d'un quartier. Ils favorisent le lien social et la production alimentaire locale."
      }
    ],
    stats: [
      { label: "Gestionnaire", valeur: "Ville de Strasbourg" }
    ]
  },
  "jardins-partages": {
    icone: "🌱",
    titre: "Jardins partagés",
    blocs: [
      {
        titre: "Description",
        texte: "Les jardins partagés sont des espaces collectifs gérés par des associations ou des groupes d'habitants. Ils contribuent à la végétalisation de la ville, à la production alimentaire locale et au renforcement du tissu social."
      },
      {
        titre: "Annuaire",
        texte: "<a href='https://drive.google.com/file/d/1OnhoOa6IO23g4KwvJ_QQ6h56OKU2cv3b/view' target='_blank'>Consulter l'annuaire des jardins partagés</a>"
      }
    ],
    stats: [
      { label: "Statut", valeur: "Association / Collectif" }
    ]
  },
  "cites-fertiles": {
    icone: "🌸",
    titre: "Cités Fertiles",
    blocs: [
      {
        titre: "Description",
        texte: "Les Cités Fertiles sont des projets de production alimentaire intégrés dans des quartiers résidentiels, visant à végétaliser les espaces urbains en lieux nourriciers."
      }
    ],
    stats: [
      { label: "Statut", valeur: "Associatif / Collectif" }
    ]
  },
  "massifs-nourriciers": {
    icone: "🫐",
    titre: "Massifs nourriciers",
    blocs: [
      {
        titre: "Description",
        texte: "Les massifs nourriciers sont des espaces végétalisés, intégrés dans l'espace public. Arbres fruitiers, plantes aromatiques et légumes y cohabitent pour soutenir la biodiversité et l'alimentation locale."
      }
    ],
    stats: [
      { label: "Statut", valeur: "Association / Collectif" }
    ]
  },
  "production-agricole": {
    icone: "🌾",
    titre: "Production agricole professionnelle",
    blocs: [
      {
        titre: "Description",
        texte: "Sites de production agricole professionnelle présents sur le territoire de l'Eurométropole de Strasbourg : fermes urbaines, maraîchers et autres exploitations agricoles à vocation professionnelle."
      }
    ],
    stats: [
      { label: "Année", valeur: "2025" }
    ]
  },
  "initiatives-jardinesques": {
    icone: "🌻",
    titre: "Initiatives jardinesques",
    blocs: [
      {
        titre: "Description",
        texte: "Ces initiatives regroupent des projets émergents et expérimentaux liés au jardinage urbain à Strasbourg : jardins en développement, pédagogique, site decompostages partagés, et autres projets innovants portés par des associations ou des particuliers."
      }
    ],
    stats: [
      { label: "Statut", valeur: "Projets émergents" }
    ]
  },
  "jardins-productifs": {
    icone: "🌿",
    titre: "Jardins productifs",
    blocs: [
      {
        titre: "Description",
        texte: "Les jardins productifs sont des parcelles privées ou associatives dont les récoltes sont suivies et quantifiées. Leurs données de production (variétés, poids, rendement) sont analysées dans le cadre du projet Récolte."
      }
    ],
    stats: [
      { label: "Année", valeur: "2025" }
    ]
  },
  "espaces-cultivables": {
    icone: "🌿",
    titre: "Espaces potentiellement cultivables",
    blocs: [
      {
        titre: "Description",
        texte: "Ces espaces appartenant aux collectivités locales de l'EMS, sont des zones identifiées comme potentiellement exploitables pour des usages jardiniers en milieu " +
               "urbain, dans le cadre du projet Récolte. Pour des raisons écologiques les espaces forestiers n'ont pas été comptabilisés."
      }
    ],

    explication: [
      { titre: "Facilement mobilisables", texte: "Ces espaces, facile d'accès en mobilités douces, répertorient un certain nombre de parcs, squares, ronds-points, abords de complexes sportifs, berges et espaces verts hospitaliers." },
      { titre: "Accès à aménager", texte: "Ces espaces, situés à proximité de grands axes routiers et ferroviaires (à l'instar des jardins familiaux), necessiteraient des aménagements d'accès afin de valoriser, ces interstices urbains et péri-urbains actuellement délaissés." }
    ],
  

    source: "Projet Récolte"
  },
  "limites-ems": {
    icone: "🏛️",
    titre: "Limites administratives EMS",
    blocs: [
      {
        titre: "Description",
        texte: "Périmètre de l'Eurométropole de Strasbourg (EMS), regroupant 33 communes."
      }
    ],
    stats: [
      { label: "Communes", valeur: "33" },
      { label: "Source", valeur: "EMS / OpenData" }
    ]
  }
};

function ouvrirPanneauLegende(cle) {
  const info = legendeInfos[cle];
  if (!info) return;

  const panel = document.getElementById('panneau-legende-info');
  document.getElementById('legende-info-icone').textContent = info.icone;
  document.getElementById('panneau-legende-titre').textContent = info.titre;

  const body = document.getElementById('panneau-legende-corps');
  body.innerHTML = '';

  info.blocs.forEach(bloc => {
    const div = document.createElement('div');
    div.className = 'bloc-info-legende';
    div.innerHTML = `<strong>${bloc.titre}</strong>${bloc.texte}`;
    body.appendChild(div);
  });

  if (info.stats && info.stats.length > 0) {
    const statsDiv = document.createElement('div');
    statsDiv.className = 'bloc-info-legende';
    statsDiv.innerHTML = info.stats.map(s =>
      `<div class="stat-info-legende"><span>${s.label}</span><span>${s.valeur}</span></div>`
    ).join('');
    body.appendChild(statsDiv);
  }

  if (info.explication) {
    info.explication.forEach(exp => {
      const expDiv = document.createElement('div');
      expDiv.className = 'bloc-info-legende';
      expDiv.innerHTML = `<strong>${exp.titre}</strong>${exp.texte}`;
      body.appendChild(expDiv);
    });
  }

  if (info.source) {
    const sourceDiv = document.createElement('div');
    sourceDiv.className = 'bloc-info-legende';
    sourceDiv.innerHTML = `<div class="stat-info-legende"><span>Source</span><span>${info.source}</span></div>`;
    body.appendChild(sourceDiv);
  }

  panel.classList.remove('hidden');
  lucide.createIcons();
}

function fermerPanneauLegende() {
  document.getElementById('panneau-legende-info').classList.add('hidden');
}

// ===== GUILDES TROPHIQUES =====

const csvVersGeojson = {
  'Araignée': 'araignees', 'Carabe': 'carabes', 'Charançon': 'charancons',
  'Cicadelle': 'cicadelles', 'Cloporte': 'cloportes', 'Coccinelle': 'coccinelle',
  'Elatéride': 'elaterides', 'Escargot': 'escargots', 'Fourmis': 'fourmis',
  'Gendarme': 'gendarmes', 'Larvcoleop': 'larvcoleop', 'Larvlepid': 'larvlepid',
  'Larvdipte': 'larvdipte', 'Limace': 'limaces', 'Myrchilo': 'myrchilo',
  'Myrdiplo': 'myrdiplo', 'Opilion': 'opilions', 'Orthoptere': 'orthoptere',
  'Perce-oreille': 'perc_oreil', 'Punaise': 'punaises', 'Scarabée': 'scarabees',
  'Staphylin': 'staphylins', 'Vers de terre': 'vers_terre'
};

let correspondanceGuildes = {};
let instanceGraphiqueGuildes = null;
let donneesPiegesBarber = null;

async function chargerGuildes() {
  try {
    const text = await fetch('data/pieges_barbers/TABLE_CORRESPONDANCE_ESPECES_GUILDES.csv').then(r => r.text());
    const lignes = text.trim().split('\n').slice(1);
    lignes.forEach(ligne => {
      const [espece, guilde] = ligne.split(';').map(s => s.trim());
      const cleGeojson = csvVersGeojson[espece];
      if (cleGeojson && guilde) correspondanceGuildes[cleGeojson] = guilde;
    });
  } catch(e) {
    console.warn('Impossible de charger le fichier guildes:', e);
  }
}

function afficherGraphiqueGuildes(siteNom, piegeProps) {
  if (!donneesPiegesBarber || Object.keys(correspondanceGuildes).length === 0) return;

  // Ouvrir la sidebar si elle est fermée
  const sidebar = document.getElementById('sidebar');
  if (sidebar.classList.contains('collapsed')) {
    panneauOuvert = true;
    sidebar.classList.remove('collapsed');
  }

  // Fermer la sidebar ressources si ouverte
  const ressources = document.getElementById('sidebar-ressources');
  ressources.style.display = 'none';
  ressources.classList.add('hidden');

  // Faire défiler la sidebar jusqu'à la section pièges Barber
  const section = document.getElementById('filtre-pieges').closest('.sidebar-section');
  if (sidebar && section) {
    setTimeout(() => sidebar.scrollTo({ top: section.offsetTop - 32, behavior: 'smooth' }), 320);
  }

  const panel = document.getElementById('panneau-guildes');
  panel.querySelector('h3').textContent = `Guildes — ${siteNom}`;
  panel.classList.remove('hidden');
  setTimeout(() => map.invalidateSize(), 320);

  const couleurs = { 'Prédateur': '#283F3B', 'Détritivore': '#556f44', 'Phytophage': '#95BF74', 'Omnivore': '#659B5E' };
  const guildes = ['Prédateur', 'Détritivore', 'Omnivore', 'Phytophage'];

  const totaux = {};
  const source = piegeProps ? [{ properties: piegeProps }] : donneesPiegesBarber.features.filter(f => (f.properties.site_nom || 'Inconnu') === siteNom);
  source.forEach(f => {
    Object.keys(correspondanceGuildes).forEach(espece => {
      const guilde = correspondanceGuildes[espece];
      totaux[guilde] = (totaux[guilde] || 0) + (f.properties[espece] || 0);
    });
  });

  const labels = guildes.filter(g => totaux[g] > 0);
  const data = labels.map(g => totaux[g]);
  const total = data.reduce((a, b) => a + b, 0);

  const canvas = document.getElementById('guildesChart');
  if (instanceGraphiqueGuildes) instanceGraphiqueGuildes.destroy();
  setTimeout(() => {
    instanceGraphiqueGuildes = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: [siteNom],
        datasets: labels.map(g => ({
          label: g,
          data: [Math.round((totaux[g] || 0) / total * 100)],
          backgroundColor: couleurs[g] || '#94a3b8',
          borderWidth: 1,
          borderColor: '#fff'
        }))
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        scales: {
          x: { stacked: true, max: 100, ticks: { callback: v => v + '%' } },
          y: { stacked: true, display: false }
        },
        plugins: {
          legend: { position: 'bottom' },
          tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label} : ${ctx.raw}%` } }
        }
      }
    });
  }, 350);
}

function ouvrirLightbox(src) {
  const lb = document.getElementById('lightbox');
  document.getElementById('lightbox-img').src = src;
  lb.classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('lightbox').addEventListener('click', () => {
    document.getElementById('lightbox').classList.add('hidden');
  });
});

function creerLegende() {
  const legend = L.control({ position: 'bottomright' });
  
  legend.onAdd = function(map) {
    const div = L.DomUtil.create('div', 'legende');
    div.innerHTML = `
      <h4>
            <i data-lucide="map"></i>
            Légende
          </h4>
          
          
          <!-- 1. Évolution historique jardins familiaux -->
          <div class="legende-section">
            <strong class="legende-element clickable" data-info="jardins-familiaux">Évolution historique</strong>
            <div class="legende-element clickable" data-info="jardins-familiaux">
              <input type="checkbox" id="toggle-jardins-familiaux-1956" style="margin-right: 0.4rem; cursor: pointer; vertical-align: middle;">
              <div class="legende-symbole" style="background-color: #ef4444; opacity: 0.4;"></div>
              <span class="legende-texte">Jardins familiaux 1956</span>
            </div>
            <div class="legende-element clickable" data-info="jardins-familiaux">
              <input type="checkbox" id="toggle-jardins-familiaux-1978" style="margin-right: 0.4rem; cursor: pointer; vertical-align: middle;">
              <div class="legende-symbole" style="background-color: #f97316; opacity: 0.4;"></div>
              <span class="legende-texte">Jardins familiaux 1978</span>
            </div>
            <div class="legende-element clickable" data-info="jardins-familiaux">
              <input type="checkbox" id="toggle-jardins-familiaux-2026" style="margin-right: 0.4rem; cursor: pointer; vertical-align: middle;">
              <div class="legende-symbole" style="background-color: #3b82f6; opacity: 0.4;"></div>
              <span class="legende-texte">Jardins familiaux 2026</span>
            </div>
          </div>

          <!-- 2. Agriculture urbaine -->
          <div class="legende-section">
            <strong class="legende-element">Agriculture urbaine</strong>
            <div class="legende-element clickable" data-info="jardins-partages">
              <input type="checkbox" id="toggle-jardins-partages" style="margin-right: 0.4rem; cursor: pointer; vertical-align: middle;">
              <div class="legende-symbole" style="background-color: #22c55e; opacity: 0.6; border: 2px solid #16a34a;"></div>
              <span class="legende-texte">Jardins partagés</span>
            </div>
            <div class="legende-element clickable" data-info="puc">
              <input type="checkbox" id="toggle-puc" style="margin-right: 0.4rem; cursor: pointer; vertical-align: middle;">
              <div class="legende-symbole" style="background-color: #2dd4bf; opacity: 0.6; border: 2px solid #0f766e;"></div>
              <span class="legende-texte">Potagers Urbains Collectifs</span>
            </div>
            <div class="legende-element clickable" data-info="massifs-nourriciers">
              <input type="checkbox" id="toggle-massifs-nourriciers" style="margin-right: 0.4rem; cursor: pointer; vertical-align: middle;">
              <div class="legende-symbole" style="background-color: #a78bfa; opacity: 0.45; border: 2px solid #7c3aed;"></div>
              <span class="legende-texte">Massifs nourriciers</span>
            </div>
            <div class="legende-element clickable" data-info="cites-fertiles">
              <input type="checkbox" id="toggle-cites-fertiles" style="margin-right: 0.4rem; cursor: pointer; vertical-align: middle;">
              <div class="legende-symbole" style="background-color: #f9a8d4; opacity: 0.45; border: 2px solid #ec4899;"></div>
              <span class="legende-texte">Cités Fertiles</span>
            </div>
            <div class="legende-element clickable" data-info="jardins-productifs">
              <input type="checkbox" id="toggle-jardins-productifs" style="margin-right: 0.4rem; cursor: pointer; vertical-align: middle;">
              <div class="legende-symbole" style="background-color: #f97316; opacity: 0.45; border: 2px solid #ea580c;"></div>
              <span class="legende-texte">Jardins productifs</span>
            </div>
            <div class="legende-element clickable" data-info="production-agricole">
              <input type="checkbox" id="toggle-production-agricole" style="margin-right: 0.4rem; cursor: pointer; vertical-align: middle;">
              <div class="legende-symbole circle" style="background-color: #e4e131; border: 2px solid #109927;"></div>
              <span class="legende-texte">Production agricole</span>
            </div>
            <div class="legende-element clickable" data-info="initiatives-jardinesques">
              <input type="checkbox" id="toggle-initiatives-jardinesques" style="margin-right: 0.4rem; cursor: pointer; vertical-align: middle;">
              <div class="legende-symbole circle" style="background-color: #fbbf24; border: 2px solid #d97706;"></div>
              <span class="legende-texte">Initiatives jardinesques</span>
            </div>
          </div>

          <!-- 3. Autres couches -->
          <div class="legende-section">
            <strong class="legende-element">🏛️ Autres couches</strong>
            <div class="legende-element clickable" data-info="pieges-barber">
              <input type="checkbox" id="toggle-pieges-barber" style="margin-right: 0.4rem; cursor: pointer; vertical-align: middle;">
              <div class="legende-symbole circle" style="background-color: #7c3aed; opacity: 0.6; border: 2px solid #4c1d95;"></div>
              <span class="legende-texte">Pièges Barber (invertébrés)</span>
            </div>

            <div class="legende-element clickable" data-info="espaces-cultivables">
              <input type="checkbox" id="toggle-espaces-potentiellement-cultivables" style="margin-right: 0.4rem; cursor: pointer; vertical-align: middle;">
              <span class="legende-texte">Espaces potentiellement cultivables</span>
            </div>
            <div class="legende-element clickable" data-info="espaces-cultivables">
              <div class="legende-symbole" style="background-color: #99d99d; opacity: 0.45; border: 2px solid #22d69d;"></div>
              <span class="legende-texte">Facilement mobilisable</span>
            </div>
            <div class="legende-element clickable" data-info="espaces-cultivables">
              <div class="legende-symbole" style="background-color: #ff8a8a; opacity: 0.45; border: 2px solid #e63946;"></div>
              <span class="legende-texte">Accès à aménager</span>
            </div>

            <div class="legende-element clickable" data-info="limites-ems">
              <input type="checkbox" id="toggle-limites-ems" style="margin-right: 0.4rem; cursor: pointer; vertical-align: middle;">
              <div class="legende-symbole line" style="background-color: #6b7280;"></div>
              <span class="legende-texte">Limites administratives EMS</span>
            </div>
          </div>

          <div style="margin-top: 1rem; padding: 0.75rem; background: rgba(16, 185, 129, 0.1); border-radius: 8px; border-left: 3px solid #10b981;">
            <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: #059669; font-weight: 500;">
              <i data-lucide="lightbulb"></i>
              <span>Cliquez sur un élément pour plus d'informations</span>
            </div>
          </div>
        `;
    
    L.DomEvent.disableClickPropagation(div);
    L.DomEvent.disableScrollPropagation(div);
    setTimeout(() => {
      lucide.createIcons();
      div.querySelectorAll('[data-info]').forEach(el => {
        el.addEventListener('click', () => ouvrirPanneauLegende(el.dataset.info));
      });

      // Cases à cocher de la légende — afficher/masquer une couche sans ouvrir le panneau d'info
      const couchesAvecCaseACocher = [
        { id: 'toggle-jardins-productifs', couche: jardinsProductifs },
        { id: 'toggle-jardins-partages', couche: jardinsPartages },
        { id: 'toggle-puc', couche: puc },
        { id: 'toggle-massifs-nourriciers', couche: massifsNourriciers },
        { id: 'toggle-cites-fertiles', couche: citesFertiles },
        { id: 'toggle-pieges-barber', couche: piegesCluster || piegesBarber },
        { id: 'toggle-production-agricole', couche: productionAgricole },
        { id: 'toggle-initiatives-jardinesques', couche: initiativesEmergentes },
        { id: 'toggle-espaces-potentiellement-cultivables', couche: espacesPotentiellementsCultivables },
        { id: 'toggle-limites-ems', couche: limitesEMS }
      ];

      couchesAvecCaseACocher.forEach(({ id, couche }) => {
        const toggle = div.querySelector(`#${id}`);
        if (toggle) {
          toggle.checked = map.hasLayer(couche);
          toggle.addEventListener('click', e => e.stopPropagation());
          toggle.addEventListener('change', function() {
            if (this.checked) {
              couche.addTo(map);
            } else {
              map.removeLayer(couche);
            }
          });
        }
      });

      // Cases à cocher pour l'évolution historique des jardins familiaux
      // (couches stockées dans layersHistoriques, créées de façon asynchrone :
      // on récupère donc la couche par son année à chaque utilisation, plutôt
      // qu'une seule fois à l'avance comme pour couchesAvecCaseACocher)
      ['1956', '1978', '2026'].forEach(annee => {
        const toggle = div.querySelector(`#toggle-jardins-familiaux-${annee}`);
        if (toggle) {
          toggle.checked = map.hasLayer(layersHistoriques[annee]);
          toggle.addEventListener('click', e => e.stopPropagation());
          toggle.addEventListener('change', function() {
            const couche = layersHistoriques[annee];
            if (!couche) return;
            if (this.checked) {
              couche.addTo(map);
            } else {
              map.removeLayer(couche);
            }
          });
        }
      });
    }, 100);
    return div;
  };

  legend.addTo(map);

  document.getElementById('panneau-legende-fermer').addEventListener('click', fermerPanneauLegende);
}

/* ===== ÉVÉNEMENTS DE LA CARTE OPTIMISÉS ===== */


/* ===== STYLES CSS SUPPLÉMENTAIRES POUR LES NOUVELLES FONCTIONNALITÉS ===== */

// Ajouter ces styles pour les nouvelles fonctionnalités améliorées
const enhancementStyles = document.createElement('style');
enhancementStyles.textContent = `
  .stat-card-mini {
    background: var(--bg-glass);
    padding: 0.75rem;
    border-radius: 8px;
    text-align: center;
    border: 1px solid var(--border-color);
    transition: all 0.3s ease;
    animation: slideInUp 0.6s ease-out;
  }
  
  .stat-card-mini:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-medium);
  }
  
  .stat-number-mini {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--primary-color);
    display: block;
  }
  
  .stat-label-mini {
    font-size: 0.75rem;
    color: var(--text-secondary);
    margin-top: 0.25rem;
  }
  
  .top-variety-item {
    transition: all 0.3s ease;
  }
  
  .top-variety-item:hover {
    background: var(--bg-glass);
    border-radius: 6px;
    padding: 0.5rem 0.75rem !important;
    transform: translateX(4px);
  }
  
  .trends-analysis {
    animation: slideInUp 0.6s ease-out;
  }
  
  .garden-header {
    animation: fadeInScale 0.8s ease-out;
  }
  
  .stats-summary {
    animation: slideInLeft 0.6s ease-out;
  }
  
  .top-varieties {
    animation: slideInRight 0.6s ease-out;
  }
  
  .chart-container {
    animation: fadeInUp 0.8s ease-out;
  }
  
  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  @keyframes slideInLeft {
    from {
      opacity: 0;
      transform: translateX(-30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  /* Styles pour l'export en cours */
  .export-progress {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--bg-secondary);
    padding: 2rem;
    border-radius: 16px;
    box-shadow: var(--shadow-large);
    z-index: 3000;
    min-width: 300px;
    text-align: center;
  }
  
  .export-progress .spinner-chargement {
    margin: 0 auto 1rem;
  }
  
  /* Amélioration des tooltips Chart.js */
  .chartjs-tooltip {
    background: var(--bg-secondary) !important;
    border: 1px solid var(--border-color) !important;
    border-radius: 8px !important;
    box-shadow: var(--shadow-medium) !important;
    color: var(--text-primary) !important;
    font-family: 'Inter', sans-serif !important;
  }
  
  /* Styles pour les graphiques en mode sombre */
  [data-theme="dark"] .chartjs-tooltip {
    background: var(--dark-bg-secondary) !important;
    border-color: var(--dark-border-color) !important;
    color: var(--dark-text-primary) !important;
  }
  
`;

document.head.appendChild(enhancementStyles);

/* ===== INITIALISATION FINALE OPTIMISÉE ===== */

// Créer la légende après le chargement
setTimeout(() => {
  creerLegende();
  
  // Attribution personnalisée
  L.control.attribution({
    position: 'bottomleft',
    prefix: "Carte interactive RECOLTE"
  }).addTo(map);
  
}, 1000);

// Styles supplémentaires optimisés pour la compatibilité
const optimizedStyles = document.createElement('style');
optimizedStyles.textContent = `
  .custom-cluster {
    background: linear-gradient(135deg, #10b981, #059669);
    border: 2px solid white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    color: white;
    transition: transform 0.2s ease;
  }
  
  .custom-cluster:hover {
    transform: scale(1.05);
  }
  
  .location-marker {
    background: #ef4444;
    border: 2px solid white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center; 
    color: white;
    animation: pulse 1s infinite;
  }
  
  .garden-item {
    animation: slideInLeft 0.3s ease-out backwards;
  }
  
  .particle {
    position: absolute;
    width: 3px;
    height: 3px;
    background: #10b981;
    border-radius: 50%;
    opacity: 0.2;
    animation: float 20s infinite linear;
  }
  
  @keyframes float {
    0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
    10% { opacity: 0.2; }
    90% { opacity: 0.2; }
    100% { transform: translateY(-100px) rotate(360deg); opacity: 0; }
  }
  
  @keyframes pulse {
    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
    70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
  }
`;

document.head.appendChild(optimizedStyles);

/* ===== FONCTION D'INITIALISATION DES AMÉLIORATIONS ===== */

// Fonction pour initialiser toutes les nouvelles fonctionnalités
function initEnhancements() {
  console.log('🚀 Initialisation des améliorations...');
  
  // Vérifier que toutes les dépendances sont présentes
  if (typeof XLSX === 'undefined') {
    console.warn('⚠️ XLSX non trouvé - fonction d\'export désactivée');
  } else {
    console.log('✅ XLSX disponible - export Excel activé');
  }
  
  if (typeof Chart === 'undefined') {
    console.warn('⚠️ Chart.js non trouvé - graphiques désactivés');
  } else {
    console.log('✅ Chart.js disponible - graphiques activés');
  }
  
  // Initialiser le cache de données
  if (!window.dataCache) {
    window.dataCache = new Map();
    console.log('✅ Cache de données initialisé');
  }
  
  // Améliorer les graphiques Chart.js globalement
  if (typeof Chart !== 'undefined') {
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.font.size = 11;
    Chart.defaults.color = 'var(--text-secondary)';
    Chart.defaults.borderColor = 'var(--border-color)';
    Chart.defaults.backgroundColor = 'var(--bg-glass)';
  }
  
  console.log('🚀 Améliorations initialisées avec succès');
  console.log('✅ Export de données Excel ajouté');
  console.log('✅ Statistiques enrichies ajoutées'); 
  console.log('✅ Pourcentages dans les graphiques ajoutés');
  console.log('✅ Animations et transitions améliorées');
  console.log('✅ Cache intelligent pour les performances');
}

/* ===== FONCTIONS UTILITAIRES SUPPLÉMENTAIRES ===== */

// Fonction pour formater les nombres avec séparateurs
function formatNumber(num) {
  return new Intl.NumberFormat('fr-FR').format(num);
}

// Fonction pour formater les pourcentages
function formatPercentage(num) {
  return new Intl.NumberFormat('fr-FR', { 
    style: 'percent', 
    minimumFractionDigits: 1,
    maximumFractionDigits: 1 
  }).format(num / 100);
}

// Fonction pour formater les dates
function formatDate(date) {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date));
}

// Fonction pour sauvegarder les préférences utilisateur
function saveUserPreferences() {
  const prefs = {
    panneauOuvert: panneauOuvert,
    lastVisit: new Date().toISOString()
  };
  localStorage.setItem('userPreferences', JSON.stringify(prefs));
}

// Fonction pour charger les préférences utilisateur
function loadUserPreferences() {
  try {
    const prefs = JSON.parse(localStorage.getItem('userPreferences') || '{}');
    if (prefs.panneauOuvert !== undefined) {
      panneauOuvert = prefs.panneauOuvert;
    }
  } catch (error) {
    console.warn('⚠️ Erreur lors du chargement des préférences:', error);
  }
}

// Fonction de nettoyage pour libérer la mémoire
function cleanup() {
  // Nettoyer le cache de données si trop volumineux
  if (dataCache.size > 50) {
    const oldestEntries = Array.from(dataCache.keys()).slice(0, 20);
    oldestEntries.forEach(key => dataCache.delete(key));
    console.log('🧹 Cache nettoyé - anciennes entrées supprimées');
  }
  
  // Nettoyer les toasts du pool
  while (toastPool.length > 10) {
    toastPool.pop();
  }
}

// Fonction pour afficher les statistiques de performance
function showPerformanceStats() {
  const stats = {
    cacheSize: dataCache.size,
    memoryUsage: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + ' MB' : 'Non disponible',
    tempsChargement: performance.now(),
    timestamp: new Date().toLocaleString('fr-FR')
  };
  
  console.table(stats);
  return stats;
}

/* ===== GESTIONNAIRE D'ERREURS GLOBAL ===== */

// Gestionnaire d'erreurs global pour capturer les erreurs inattendues
window.addEventListener('error', function(event) {
  console.error('❌ Erreur JavaScript:', event.error);
});

// Gestionnaire pour les promesses rejetées
window.addEventListener('unhandledrejection', function(event) {
  console.error('❌ Promesse rejetée:', event.reason);
});

/* ===== ÉVÉNEMENTS DE VISIBILITÉ DE LA PAGE ===== */

// Optimiser les performances quand la page n'est pas visible
document.addEventListener('visibilitychange', function() {
  if (document.hidden) {
    console.log('⏸️ Page masquée - animations en pause');
  } else {
    console.log('▶️ Page visible - animations reprises');
  }
});

/* ===== SAUVEGARDE AUTOMATIQUE DES PRÉFÉRENCES ===== */

// Sauvegarder les préférences à intervalles réguliers
setInterval(() => {
  saveUserPreferences();
}, 60000); // Toutes les minutes

// Sauvegarder avant de quitter la page
window.addEventListener('beforeunload', function() {
  saveUserPreferences();
  cleanup();
});

/* ===== INITIALISATION FINALE ===== */

// Charger les préférences utilisateur au démarrage
loadUserPreferences();

// Initialiser les améliorations
initEnhancements();

// Nettoyage périodique
setInterval(cleanup, 300000); // Toutes les 5 minutes

// Logs de démarrage
console.log('🌿 Carte interactive des jardins de Strasbourg');
console.log('🚀 Version optimisée avec fonctionnalités avancées chargée');
console.log('📊 Fonctionnalités: export Excel, statistiques enrichies, graphiques avec pourcentages');
console.log('⚡ Optimisations: cache intelligent, debouncing, requestAnimationFrame');
console.log('🎨 Interface: thème adaptatif, animations fluides, responsive design');
console.log('');
console.log('💡 Aide:');
console.log('- Cliquez sur un jardin privé (orange) pour voir les statistiques détaillées');
console.log('- Utilisez le bouton "Exporter" pour télécharger les données Excel');
console.log('- Les graphiques montrent désormais les pourcentages ET les quantités');
console.log('- Tapez showPerformanceStats() pour voir les statistiques de performance');
console.log('');