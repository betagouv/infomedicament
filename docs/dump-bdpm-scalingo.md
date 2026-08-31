# Import d'un dump BDPM et export vers Scalingo

Procédure pour importer un dump BDPM local dans le container MySQL de
développement, y ajouter les clés primaires (requises par Scalingo), puis le
pousser vers Scalingo.

> **Rappel** : les données médicaments (PDBM / BDPM) sont stockées dans la base
> **MySQL** (`pdbm_bdd`).

> 💡 **Raccourci** : les étapes 1 à 3 et 5 sont automatisées par le script
> [`.devcontainer/scripts/import_pbdm_dump.sh`](../.devcontainer/scripts/import_pbdm_dump.sh),
> à lancer depuis le devcontainer :
>
> ```bash
> .devcontainer/scripts/import_pbdm_dump.sh --input ~/Downloads/pdbm.sql
> ```
>
> Il importe le dump, ajoute les clés primaires, exporte
> `~/Downloads/pdbm_with_pk.sql` (option `--output` pour changer le chemin) et
> régénère les données dérivées. Seule l'**étape 4 (import sur Scalingo)** reste
> manuelle. Les étapes ci-dessous détaillent ce que fait le script, utile pour
> le lancer à la main ou déboguer.

## Vue d'ensemble

| Étape | Objectif |
|-------|----------|
| 1 | Importer le dump BDPM en local |
| 2 | Ajouter les clés primaires (requises par Scalingo) |
| 3 | Exporter la base locale |
| 4 | Importer sur Scalingo |
| 5 | Régénérer les données dérivées |

---

## 1. Importer le dump en local

```bash
docker exec -i infomedicament_devcontainer-db-mysql-1 \
  mysql -uroot -pmysql pdbm_bdd < ~/Downloads/pdbm.sql
```

> ⚠️ **Erreur à ignorer** — une erreur peut apparaître à la fin de l'import,
> elle est sans conséquence :
>
> ```
> ERROR 1146 (42S02) at line 937: Table 'pdbm_bdd.ParamApplication' doesn't exist
> ```

## 2. Ajouter les clés primaires (requises par Scalingo)

```bash
# Désactiver temporairement le mode strict (pour les dates '0000-00-00')
docker exec -i infomedicament_devcontainer-db-mysql-1 \
  mysql -uroot -pmysql -e "SET GLOBAL sql_mode='';"

# Lancer le script d'ajout des clés primaires
npx tsx bin/pdbm.ts

# Réactiver le mode strict
docker exec -i infomedicament_devcontainer-db-mysql-1 \
  mysql -uroot -pmysql -e "SET GLOBAL sql_mode='STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';"
```

## 3. Exporter la base locale

```bash
docker exec infomedicament_devcontainer-db-mysql-1 \
  mysqldump -uroot -pmysql --set-gtid-purged=OFF --single-transaction pdbm_bdd \
  > ~/Downloads/pdbm_with_pk.sql
```

## 4. Importer sur Scalingo

**Terminal 1** — ouvrir le tunnel :

```bash
# Staging
scalingo -a infomedicament-staging --region osc-fr1 db-tunnel SCALINGO_MYSQL_URL

# Production
scalingo -a infomedicament-prod --region osc-secnum-fr1 db-tunnel SCALINGO_MYSQL_URL
```

**Terminal 2** — récupérer les identifiants :

```bash
# Staging
scalingo -a infomedicament-staging --region osc-fr1 env | grep MYSQL

# Production
scalingo -a infomedicament-prod --region osc-secnum-fr1 env | grep MYSQL
```

**Terminal 2** — importer (remplacer `<user>`, `<password>`, `<database>` par
les valeurs de `SCALINGO_MYSQL_URL`) :

```bash
mysql -h 127.0.0.1 -P 10000 -u <user> -p<password> pdbm_bdd < ~/Downloads/pdbm_with_pk.sql
```

## 5. Régénérer les données dérivées

Ensuite, exécuter dans un **one-off container** :

```bash
# Re-produire les tables "resume_*"
for x in indications substances specialites atc1 atc2 generiques medicaments; do
  node .next/standalone/scripts/updateResumeData.js $x;
done

# Re-produire le moteur de recherche
node .next/standalone/scripts/seedSearchIndex.js

# Re-produire les métadonnées
node .next/standalone/scripts/populateSpecMetadataTable.js
```



Puis, à réaliser également :
- re-produire la classification pédiatrique (dans le projet *data-eng*, e.g. `poetry run infomedicament-dataeng classify-pediatric --s3 --since 2
026-07-20 -o predictions_260720.csv`, puis update dans le document Grist, puis executer le script de synchronisation avec Grist)
