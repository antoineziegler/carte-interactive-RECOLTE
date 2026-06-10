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

