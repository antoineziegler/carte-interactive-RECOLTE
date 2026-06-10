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

