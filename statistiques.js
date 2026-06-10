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

