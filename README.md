# Info Medicament

Code source du service numérique [Info Medicament](https://beta.gouv.fr/startups/infomedicament.html).

## Développement

Le projet est basé sur [Next.js](https://nextjs.org/)
et utilise le [DSFR](https://www.systeme-de-design.gouv.fr/)
via [react-dsfr](https://github.com/codegouvfr/react-dsfr).

Deux bases de données sont utilisées :
* PostgreSQL pour toutes les données propres au projet Info Médicament;
* MySQL pour héberger une copie de la base de données publique des médicaments originale de l'ANSM.
Ces données sont utilisés à l'identique et la base MySQL n'est pas modifiée.

Pour démarrer facilement un environnement de développement avec un service MySQL et un service PostgreSQL,vous pouvez utiliser la configuration Dev Containers fournie.

## Installation

```bash
### Lancer le serveur NextJS

```bash
npm install
npm run dev
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
* les images des notices (pour éviter d'avoir à les stocker dans un système de fichiers)
* les index de recherche plein texte

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