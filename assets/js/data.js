/* Données de la maquette — un seul fichier à mettre à jour.
   Tout ce qui n'est pas sur le site actuel est marqué tbc: true (à compléter). */

/* Calendrier : trié automatiquement entre passé et à venir. Dates ISO (heure de Paris). */
export const DATES = [
  { id: 'lancement', date: '2026-09-01', label: 'Septembre 2026', what: '1re édition de l’enquête nationale RPS', note: 'Lancement des réponses.' },
  { id: 'cloture', date: null, label: 'Clôture des réponses', what: 'Fin du recueil des réponses', note: 'Date à compléter par l’Observatoire.', tbc: true },
  { id: 'restitution', date: '2027-03-10', end: '2027-03-11', label: '10 et 11 mars 2027', what: 'Restitution des résultats au Stade de France', note: 'Accès VIP offert par Eluceo aux participants.' },
  { id: 'edition2', date: null, label: 'Édition suivante', what: 'Reconduction annuelle, avec un socle d’items stable', note: 'Date à compléter.', tbc: true },
];

export const RESTITUTION = '2027-03-10T00:00:00+01:00';

/* 1re étude : réponses recueillies fin 2019, publiée dans Social CSE n°110 (janv.-fév. 2021). */
export const SOURCE_1 = 'Source : Observatoire des CSE, 1re étude, plusieurs centaines de réponses recueillies fin 2019. Publiée dans Social CSE n°110, janvier-février 2021.';

export const OUVERTURE = {
  question: 'Depuis le passage de votre CE en CSE, considérez-vous que le dialogue social est devenu plus ouvert ?',
  cats: ['Oui', 'Non', 'Sans changement', 'Ne sait pas'],
  os: [5, 68, 23, 3],
  sansOs: [29, 29, 38, 5],
};

export const MISE_EN_PLACE = {
  titre: 'Mise en place du CSE (hors protocole préélectoral)',
  cats: ['A fait l’objet d’un accord (avec ou sans les DS)', 'Doit faire l’objet d’une négociation post-élections', 'A fait l’objet de négociations sans aboutir à un accord'],
  os: [89, 4, 7],
  sansOs: [80, 10, 10],
};

export const PERCEPTION = {
  titre: 'Le passage au CSE, selon les élus',
  items: [
    ['Une diminution des moyens des représentants du personnel', 19, 11],
    ['Une difficulté pour vous organiser et impliquer tous les élus du CSE', 16, 11],
    ['Un risque d’oublier les enjeux de santé au travail', 16, 15],
    ['Une exigence plus forte d’investissement en temps pour les élus', 14, 10],
    ['Une perte d’expertise au sein de la représentation du personnel', 13, 8],
    ['Une perte de proximité avec les salariés', 10, 2],
    ['Une évolution qui permet de repenser et réorganiser le dialogue social', 4, 16],
    ['Une information plus complète et une meilleure vision des enjeux', 3, 8],
    ['Une meilleure prise en compte des conditions de travail dans les projets économiques', 2, 8],
    ['Un renouvellement bénéfique des élus', 2, 6],
    ['Autre', 1, 5],
  ],
};

export const REUNIONS = {
  titre: 'Nombre de réunions depuis le passage au CSE',
  series: ['À la hausse', 'À la baisse', 'Ni l’un ni l’autre', 'Ne sait pas'],
  rows: [
    ['CSE unique', [18, 18, 63, 1]],
    ['CSE d’établissement', [13, 25, 57, 5]],
    ['Autres', [0, 14, 64, 21]],
  ],
};

export const SECTEURS = {
  titre: 'Présence syndicale selon le secteur d’activité',
  series: ['Plusieurs organisations syndicales représentatives', 'Une seule organisation', 'Aucune organisation syndicale'],
  rows: [
    ['Industries', [75, 20, 5]],
    ['Construction', [71, 29, 0]],
    ['Commerce', [71, 17, 11]],
    ['Services', [71, 19, 10]],
    ['Service public', [95, 5, 0]],
    ['Autres', [66, 17, 17]],
  ],
};

/* Images Grok et photos : ajouter ici chaque image livrée (nom sans extension → largeurs disponibles).
   Tant qu'une image manque, l'emplacement affiche un visuel provisoire dessiné en code. */
export const IMAGES = {
  'accueil-anonymat': { w: [560, 800, 1168], r: 1.4898, alt: "Foule en mouvement sur une grande place au crépuscule, en pose longue" },
  'accueil-atelier': { w: [560, 800, 1168], r: 1.4898, alt: "Table d’atelier vue du dessus, mains qui posent des post-it" },
  'accueil-donnees': { w: [400, 560, 784], r: 0.6712, alt: "Pile de rapports reliés, ouverte sur un graphique en barres" },
  'accueil-duree': { w: [400, 560, 784], r: 0.6712, alt: "Rectangle de soleil sur un mur clair et ombre d’une plante" },
  'accueil-fenetre': { w: [560, 800, 1168], r: 1.4898, alt: "Fenêtre à l’aube sur les toits d’une ville, carnet ouvert et tasse fumante" },
  'accueil-gradins': { w: [560, 800, 1168], r: 1.4898, alt: "Rangées de sièges vides de gradins à l’heure bleue" },
  'accueil-hero': { w: [560, 800, 1168], r: 1.4898, alt: "Salle de réunion vide au petit matin, rayons de lumière à travers les stores" },
  'accueil-hero-mobile': { w: [400, 560, 784], r: 0.6712, alt: "Coin de table de réunion, carnet ouvert et dossier corail dans la lumière du matin" },
  'accueil-objet': { w: [400, 560, 784], r: 0.6712, alt: "Main qui coche les cases d’un questionnaire imprimé" },
  'accueil-participer': { w: [400, 560, 784], r: 0.6712, alt: "Mains tenant un téléphone sur une table de café" },
  'accueil-qui': { w: [400, 560, 784], r: 0.843, alt: "Silhouettes de quatre salariés de différents métiers marchant dans un couloir lumineux" },
  'resultats-hero': { w: [560, 800, 1168], r: 1.4898, alt: "Résultats d’enquête imprimés vus du dessus, graphiques, surligneur et lunettes" },
  'resultats-hero-mobile': { w: [400, 560, 784], r: 0.6712, alt: "Pages de résultats d’enquête avec graphiques, surligneur corail" },
  'resultats-recevoir': { w: [560, 800, 1168], r: 1.4898, alt: "Enveloppe glissée sous une porte bleu nuit" },
  'resultats-temoignage': { w: [400, 560, 784], r: 0.6712, alt: "Tasse, carnet de notes et lunettes sur une table de réunion" },
  'rps-garanties': { w: [400, 560, 784], r: 0.6712, alt: "Carnet fermé par un élastique et enveloppe cachetée" },
  'rps-hero': { w: [560, 800, 1168], r: 1.4898, alt: "Représentant du personnel qui écrit dans un carnet à sa table de cuisine" },
  'rps-hero-mobile': { w: [400, 560, 784], r: 0.6712, alt: "Mains qui écrivent dans un carnet, café et badge sur la table" },
  'rps-inscription': { w: [400, 560, 784], r: 0.6712, alt: "Bureau calme au matin, ordinateur fermé, plante et carnet" },
  'rps-pourquoi': { w: [400, 560, 784], r: 0.6712, alt: "Bureau en fin de soirée, lampe allumée et manteau sur la chaise" },
  'rps-qui': { w: [560, 800, 1168], r: 1.4898, alt: "Petite réunion autour d’une table, vue de dos" },
  /* 'portrait-ronan-darchen': à fournir par le client */
};
export const IMG_PATH = 'assets/img/grok/';
