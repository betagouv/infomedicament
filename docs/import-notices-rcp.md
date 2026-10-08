# Import des notices et RCP

Procédure pour envoyer de nouvelles notices / RCP vers S3 (dossier de staging),
puis les synchroniser et les importer en base via le projet **dataeng**.

> **Conventions de pattern** :
> - `N` — notices
> - `R` — RCP

## Vue d'ensemble

| Étape | Où | Objectif |
|-------|-----|----------|
| 1 | Local (rclone) | Envoyer les fichiers dans le dossier de staging S3 |
| 2 | Projet dataeng | Synchroniser depuis S3 |
| 3 | Projet dataeng | Importer en base locale |
| 4 | Scalingo | Importer en base distante |

---

## 1. Envoyer les fichiers vers le dossier de staging S3

Depuis le dossier contenant les fichiers, avec `rclone` :

```bash
# Notices
rclone copy notice/ infomedicament://info-medicaments/imports/notice/staging/ \
  --transfers 50 --checkers 50 --no-check-dest --s3-upload-concurrency 10 -v --stats 10s

# RCP
rclone copy rcp/ infomedicament://info-medicaments/imports/rcp/staging/ \
  --transfers 50 --checkers 50 --no-check-dest --s3-upload-concurrency 10 -v --stats 10s
```

Il faut aussi charger les images des notices sur le bucket :

```bash
rclone copy images/ infomedicament://info-medicaments/exports/images/ --transfers 50 --checkers 50 --no-check-dest --s3-upload-concurrency 10 -v --stats 10s
```

## 2. Synchroniser depuis S3 (projet dataeng)

Depuis le projet **dataeng** :

```bash
poetry run infomedicament-dataeng s3 --pattern N --staging
poetry run infomedicament-dataeng s3 --pattern R --staging
```

## 3. Importer en base locale (projet dataeng)

Toujours depuis le projet **dataeng** (remplacer `<AAAA-MM-JJ>` par la date
souhaitée) :

```bash
poetry run infomedicament-dataeng db-import --pattern N --since <AAAA-MM-JJ>
poetry run infomedicament-dataeng db-import --pattern R --since <AAAA-MM-JJ>
```

## 4. Importer en base Scalingo

```bash
# Notices
scalingo -a infomedicament-dataeng-staging --region osc-fr1 run \
  "python -m infomedicament_dataeng.cli db-import --pattern N --since <AAAA-MM-JJ>"

# RCP
scalingo -a infomedicament-dataeng-staging --region osc-fr1 run \
  "python -m infomedicament_dataeng.cli db-import --pattern R --since <AAAA-MM-JJ>"
```
