# Recherche de citations dans une notice

Cette recherche fournit de courtes citations officielles, sans réponse médicale
rédigée par le modèle. Elle porte uniquement sur la notice de la spécialité consultée.

## Contexte lu et citations affichées

Le contexte lu par le modèle est distinct du contenu immédiatement affiché :

- `src/lib/noticePassages.ts` prépare des sections complètes, avec les titres,
  introductions des parents, sous-sections, tableaux, listes et notes.
- Le catalogue de toutes ces sections est transmis au modèle. Il doit examiner
  les conditions d'application et les restrictions ailleurs dans la notice.
- Chaque section contient également des citations identifiées, préparées côté
  serveur : phrases complètes, éléments de listes avec leur introduction,
  tableaux complets et séquences numérotées indivisibles.
- Les puces liées par une reprise (« Cette dose… », « Dans ce cas… », etc.) sont
  aussi proposées en un bloc connecté, avec leur introduction une seule fois.
  Le modèle reçoit ce bloc plutôt que ses fragments dépendants. Les identifiants
  historiques restent valides et les fragments déjà présents dans un bloc
  sélectionné sont dédupliqués sans retirer de contenu médical.
- Les phrases sont segmentées en français. Le découpage conserve le texte source,
  les entités et la mise en forme dans les balises, sans reformulation.
- Les titres locaux sont associés à chaque citation, y compris quand elle est
  contenue dans une grande section parente. Les titres ANSM historiques sont
  normalisés en titres HTML pour conserver cette information de portée.

Une citation immédiatement visible doit être compréhensible avec les autres
citations visibles et leurs titres. Une condition médicale indispensable ne doit
pas être laissée uniquement dans la source repliée. Cette règle figure dans le
prompt ; sa bonne application sémantique reste à évaluer.

## Sélection et validation

Le modèle ne renvoie que des identifiants de passages et de citations :

```json
{"status":"supported","selections":[{"passage_id":"passage-2","quote_ids":["passage-2-quote-3"]}]}
```

```json
{"status":"insufficient_evidence","selections":[]}
```

Le serveur vérifie le schéma et l'appartenance de chaque citation au passage
indiqué. Une réponse incomplète, un identifiant inconnu, une citation issue d'un
autre passage ou un champ de texte généré fait rejeter toute la sélection.
Le HTML affiché est toujours résolu depuis la source, jamais recopié par le modèle.

L'objectif est de sélectionner UN bloc principal de 30 à 60 mots, avec au besoin
une seule citation complémentaire indispensable à son interprétation. Les autres
indications et situations particulières ne sont pas ajoutées par défaut pour une
question courte et générale. Les limites absolues sont
2 passages distincts, 2 citations au total et 90 mots de texte cité. Il n'y a pas
de plafond supplémentaire par passage. Les doublons identiques sont retirés et
l'ordre de la source est conservé. Les limites d'affichage sont contrôlées après
la validation de tous les identifiants et la déduplication, pas dans le schéma
Zod : un dépassement n'est pas une réponse mal formée.
Si l'ensemble dépasse le budget, le serveur s'abstient normalement (HTTP 200,
`insufficient_evidence`) : il ne coupe pas une
citation et ne supprime pas arbitrairement un avertissement sélectionné.

Avant cette abstention, une sélection valide mais trop longue déclenche UNE
nouvelle tentative. Le modèle reçoit la sélection précédente et un retour
`display_budget_exceeded`. Il doit sélectionner un ensemble plus ciblé sans
retirer les conditions indispensables. La seconde sélection est validée contre
la même notice ; si elle dépasse encore le budget, la recherche s'abstient.
Les identifiants invalides et les erreurs techniques ne déclenchent pas cette
tentative. Aucun texte sélectionné n'est tronqué pour satisfaire le budget.

Les citations sont assainies côté serveur. Les ancres et attributs interactifs
sont retirés des copies afin de ne pas perturber la navigation dans la notice.

## API et interface

`GET /medicaments/[slug]/notice-search?q=...` renvoie :

- `supported` : `sourceVersion` (SHA-256 du HTML) et `passages`. Chaque passage
  comprend les courtes `quotes` sélectionnées, son contexte complet dans `html`,
  les titres et la cible de navigation.
- `insufficient_evidence` : aucune réponse suffisamment précise et courte n'a
  pu être identifiée dans les limites de cette recherche.
- `unavailable` : aucune notice exploitable n'est disponible.
- `error` (HTTP 502) : la sélection n'a pas pu aboutir.

Une question vide est refusée (HTTP 400). Aucun champ `answer` généré n'est accepté.
Les sélections sont mises en cache avec le HTML exact, la question, le modèle et
`NOTICE_SELECTION_VERSION`. Cette version doit évoluer avec le prompt ou le découpage.

L'interface affiche les citations et leurs titres. Chaque référence
« Source [n] — Voir dans la notice » est un lien d'ancre vers la rubrique existante
dans la notice complète. Le navigateur met à jour le fragment de l'URL et la
rubrique est surlignée. Une ancre stable basée sur `data-block-id` est ajoutée aux
blocs sans ancre ou dont l'ancre historique est dupliquée. Les premières ancres
historiques restent disponibles pour les raccourcis existants. Sans cible
identifiable, le lien rejoint le début de la notice. Le contexte complet n'est pas recopié ni déplié dans le bloc de résultats.
Les citations ne sont pas tronquées visuellement.

Une courte phrase organise chaque groupe de citations de même rubrique :
« Dans la rubrique « [titre exact] », la notice indique : ». Sans titre, elle
devient « La notice indique : ». Ces introductions sont des modèles de phrase
prédéfinis, renseignés avec les titres vérifiés de la source, sans conclusion
médicale générée ni interprétation pour le patient. Les doses, conditions et
restrictions restent dans les citations. Le contrat du modèle n'accepte toujours
aucun champ libre de réponse ou de résumé médical.

Les raccourcis vers une rubrique connue restent une navigation directe. Une
nouvelle recherche, la fermeture, un raccourci ou un changement de spécialité
annule la requête précédente et empêche une réponse ancienne de remplacer les
résultats courants.

## Garanties et limites

Le code garantit la provenance des citations, leurs frontières structurelles et
le budget d'affichage. La pertinence, l'applicabilité et la suffisance des citations
visibles restent appréciées par le modèle. Une citation authentique peut encore
être mal choisie ; les liens de source ne constituent pas une preuve de pertinence.

Le catalogue contient des chevauchements entre sections parentes et enfants,
ainsi que les unités citables ; cela augmente la taille des requêtes. Les tableaux
complexes restent indivisibles et peuvent nécessiter une abstention. Aucune dose
n'est calculée ni choisie par supposition. Le modèle ne lit pas les images.

Les tests logiciels vérifient la conservation du contexte, l'extraction exacte,
les frontières de citation, la validation, le budget, le rendu replié et les
requêtes concurrentes avec un modèle simulé. Ils ne mesurent pas la qualité du
modèle réel. Le jeu d'évaluation français, la validation pharmaceutique et un
éventuel second modèle vérificateur restent des étapes ultérieures.

Le cas de régression CIS 64720167 / « Combien en prendre ? » conserve la notice
locale et une sélection réelle du modèle. Cette sélection contenait des citations
de posologie mais dépassait le budget, notamment à cause de sections parentes
chevauchantes : elle produisait une fausse impression d'absence d'information.
Le test vérifie la tentative de sélection plus courte, sans appel réseau réel.
La régression de longueur vérifie également que la dose et sa répétition sont
disponibles dans un seul bloc, sans ajouter la prévention de l'asthme d'effort ni
les instructions propres aux crises sévères. Un retest local du modèle a produit
ce bloc seul (44 mots), contre 152 mots répartis en six citations auparavant.
