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

Pour démarrer
facilement un environnement de développement
avec un service MySQL et un service PostgreSQL,
vous pouvez utiliser la configuration Dev Containers fournie.

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

La base MySQL doit être restaurée depuis le dump.

Les images sont stockées dans la base de données
PostgreSQL, de l'application et peuvent
être chargée avec et doivent être copiées
avec [le module `seed` de Kysely](https://sillon.incubateur.net/docs/database-for-everything/file-storage/).

```bash
LEAFLET_IMAGES=/path/to/folder kysely seed run
```