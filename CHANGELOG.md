## v0.4.0 - 2026-07-23

### 🚀 Features
- feat(ui) : chips de filtre, scrollbar, proposition de covoiturage et chargement des types

### 🐛 Fixes
- fix(build) : corriger la syntaxe du fichier de config
- fix(build) : compatibilité Vite 8
- fix(build) : supprimer l'option esbuild incompatible avec Vite 8
- fix(tests) : supprimer le test des catégories supprimées
- fix : corriger le flux OIDC, les validations métier et l'affichage de la page d'accueil

### 🔧 Others
- ci : ajouter les tests dans la pipeline et préparer la containerisation

---

## v0.3.0 - 2026-06-28

### 🚀 Features
- feat(auth) : authentification OIDC via Keycloak (flow PKCE, page d'accueil)
- feat(admin) : fonctionnalité de covoiturage
- feat(covoiturage) : formulaire pour rejoindre un covoiturage lors d'une inscription à une activité
- feat(covoiturage) : modifier/annuler un covoiturage
- feat(covoiturage) : proposer/rejoindre un covoiturage lors de l'inscription à une activité
- feat(covoiturage) : covoiturage lors de la création d'une activité
- feat(profil) : changement mot de passe utilisateur
- feat(AccueilPageAdmin) : remplacer les données mochées par les données issues de la base de donnée
- feat(activités) : page admin gestion des activités
- feat(back-office): page d'accueil du back-office
- feat(activité): inscription/désinscription à une activité (#15)

### 🐛 Fixes
- fix(ci) : aligner la version de package.json sur le dernier tag (0.2.0)
- fix(covoiturage) : aligner les identités covoit sur l'UUID Keycloak

### 🔧 Others
- refactor(profil) : déléguer le changement de mot de passe à Keycloak

---

## v0.2.0 - 2026-04-12

### 🚀 Features
- feat(activité): inscription/désinscription à une activité (#15) (#16)

---

## v0.1.0 - 2026-04-06

### 🚀 Features
- feat(activite): suppression d'une activite
- feat(activite): formulaire de modification d'une activite
- feat(activite): page planning personnel des activités + page explorer les activités
- feat(activite): consultation des activités organisées
- feat(activite): formulaire d'ajout d'une activite

### 🐛 Fixes
- fix(ci): correction des scripts de generation du changelog et des versions

---

## v0.0.1 - 2026-03-28

### 🚀 Features & Fixes
- feat(front) : initialisation projet front et mise en place de la CI (#1) (#2)
- Initial commit

## v0.0.2 - 2026-03-28

### 🚀 Features & Fixes
- Merge branch 'main' into develop
- feat(accueil) : Kan-164 UI écran d accueil (#6)
- feat(profil) : Kan-163 UI écran profil d'un utilisateur (#5)
- feat(connexion): mise en place de la page connexion  utilisateur (#4)
- feat(inscription) : Kan-159 UI écran inscription utilisateur (#3)
- feat(front) : initialisation projet front et mise en place de la CI (#1)

## v0.0.3 - 2026-04-05

### 🚀 Features & Fixes
- feat(activite): page planning personnel des activités + page explorer les activités
- activités disponibles
- feat(activite): consultation des activités organisées
- amélioration du planning avec séparation activités organisées, inscrites et toutes
- planning des activités de l'utilisateur
- feat(activite): formulaire d'ajout d'une activite

