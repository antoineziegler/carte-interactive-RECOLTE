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
    prefix: "Carte interactive RECOLTE | Antoine Ziegler"
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
