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

// Mémorise la clé actuellement affichée dans le panneau, pour pouvoir
// fermer le panneau si on reclique sur le même élément de la légende
let cleLegendeOuverte = null;

function ouvrirPanneauLegende(cle) {
  const info = legendeInfos[cle];
  if (!info) return;

  cleLegendeOuverte = cle;

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
  cleLegendeOuverte = null;
}

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
        el.addEventListener('click', () => {
          const panel = document.getElementById('panneau-legende-info');
          const dejaOuvert = !panel.classList.contains('hidden') && cleLegendeOuverte === el.dataset.info;
          if (dejaOuvert) {
            fermerPanneauLegende();
          } else {
            ouvrirPanneauLegende(el.dataset.info);
          }
        });
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

