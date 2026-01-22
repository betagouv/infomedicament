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

Pour démarrer facilement un environnement de développement avec un service MySQL et un service PostgreSQL,vous pouvez utiliser la configuration Dev Containers fournie.

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