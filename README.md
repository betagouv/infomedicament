# Info Medicament

Code source du service numérique [Info Medicament](https://beta.gouv.fr/startups/infomedicament.html).

## Développement

Le projet est basé sur [Next.js](https://nextjs.org/)
et utilise le [DSFR](https://www.systeme-de-design.gouv.fr/)
via [react-dsfr](https://github.com/codegouvfr/react-dsfr).

Deux bases de données sont utilisées :

- PostgreSQL pour toutes les données propres au projet Info Médicament;
- MySQL pour héberger une copie de la base de données publique des médicaments originale de l'ANSM.
  Ces données sont utilisés à l'identique et la base MySQL n'est pas modifiée.

Un fichier `.env.local` est attendu par la configuration Dev Containers, et
permet aussi de configurer explicitement l'environnement local. Vous pouvez
partir du modèle fourni :

```bash
cp .env.local.model .env.local
```

Les variables principales sont :

- `DATABASE_URL` : l'URL PostgreSQL utilisée par l'application;
- `PDBM_URL` : l'URL MySQL de la copie locale de la BDPM.

`DATABASE_URL` doit être définie si vous lancez l'application hors Dev Container.
Dans le Dev Container, l'application sait aussi utiliser les identifiants
PostgreSQL par défaut du service `db-postgres`.

`PDBM_URL` est optionnelle avec la configuration Dev Containers fournie : si elle
n'est pas définie, l'application utilise les identifiants MySQL par défaut du
conteneur (`root` / `mysql`) sur la base `pdbm_bdd`. Vous pouvez tout de même la
définir explicitement si vous utilisez votre propre service MySQL.

### Dev Containers

Le projet inclut une configuration Dev Containers dans `.devcontainer/`. Elle
démarre un environnement de développement avec l'application Next.js, PostgreSQL,
MySQL et OpenSearch, puis lance `npm install` à la création du conteneur.

Cette configuration est pratique pour avoir les mêmes services locaux que le
reste de l'équipe, mais elle n'est pas obligatoire : vous pouvez aussi utiliser
votre installation habituelle de Node.js et pointer `DATABASE_URL` et `PDBM_URL`
vers vos propres bases locales.

## Installation

### Lancer le serveur NextJS

```bash
npm install
npm run dev
```

### Lancer les tests

_NB: certains tests d'intégration nécessitent un accès aux bases de données en local._

```
npm test
```

### Charger les données issue de la BDPM

Info Médicament fonctionne avec les données
de la base de données publique des médicaments.
Celles-ci sont transmises sous la forme d'un dump
`.sql` et d'un dossier contenant les images.

Ces données sont stockées par MySQL, et doivent être restaurée
depuis le dump transmis par l'ANSM. La base de données MySQL
ne doit pas être modifiée, et doit rester un simple clone
de la base de données publique des médicaments.

### Données spécifiques à l'application

Info Médicament utilise une base de données PostgreSQL
pour stocker les données spécifiques à l'application :

- les images des notices (pour éviter d'avoir à les stocker dans un système de fichiers)
- les index de recherche plein texte

Vous devez d'abord jouer les migrations pour créer les tables,
puis charger les données. La base MySQL doit être accessible préalablement.

```bash
# Créer les tables
kysele migrate:latest

# Charger les images et les index de recherche
# Le chemin vers le dossier contenant les images des notices doit être spécifié
# avec la variable d'environnement LEAFLET_IMAGES
LEAFLET_IMAGES=/path/to/folder kysely seed run
```

## Déploiement

L'application est déployée sur Scalingo.

### Review Apps

Chaque pull request déploie automatiquement une review app sur Scalingo.

### Staging

Scalingo est paramétré pour déployer automatiquement la branche `staging` de GitHub sur https://staging.infomedicament.incubateur.net/

### Production

Scalingo est paramétré pour déployer automatiquement la branche `production` de GitHub sur https://infomedicament.beta.gouv.fr

La branche "production" est protégée et nécessite de faire une pull request pour pouvoir être mise à jour.

## Tests

On utilise différents types de tests.

- des tests unitaires (*.test.ts)
- des tests d'integration (*.integration.test.ts) qui nécessitent d'avoir une copie locale des données de staging
- des tests d'UI (snapshots) (*.ui.test.tsx) qui stockent l'état attendu de certaines pages et nous prévient en cas de régressions

Chacuns de ces types de tests peuvent être exécutés séparemments (voir les commandes dédiées dans le package.json)
