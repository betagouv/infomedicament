"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import styled from "styled-components";
import { fr } from "@codegouvfr/react-dsfr";
import Pagination from "@codegouvfr/react-dsfr/Pagination";
import Button from "@codegouvfr/react-dsfr/Button";
import Alert from "@codegouvfr/react-dsfr/Alert";
import DataBlockSpecResult from "@/components/data/DataBlockSpecResult";
import SearchFilterBlock from "./blocks/SearchFilterBlock";
import type { AdvancedSearchPage } from "@/db/utils/advancedSearch";
import {
  ADVANCED_PAGE_SIZE,
  advancedResultParams,
  type AdvancedResultOptions,
  type AdvancedSearchCriteria,
} from "@/utils/advancedSearch";

const ExportActions = styled.div`
  @media (min-width: 48em) {
    text-align: right;
  }
`;

export default function AdvancedSearchResults({
  data,
  criteria,
  options,
}: {
  data: AdvancedSearchPage;
  criteria: AdvancedSearchCriteria;
  options: AdvancedResultOptions;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const currentOptions = { ...options, page: data.page };
  const href = (next: AdvancedResultOptions) =>
    `/rechercher?${advancedResultParams(criteria, next)}#resultats`;
  const navigate = (next: AdvancedResultOptions) =>
    startTransition(() => router.push(href(next), { scroll: false }));
  const toggle = (
    key: "substances" | "atcs" | "indications",
    id: string,
    checked: boolean,
  ) => {
    const values = new Set(options[key]);
    if (checked) values.add(id);
    else values.delete(id);
    navigate({ ...currentOptions, page: 1, [key]: [...values] });
  };
  const pages = Math.ceil(data.total / ADVANCED_PAGE_SIZE);
  const filtered =
    options.substances.length +
      options.atcs.length +
      options.indications.length >
    0;

  return (
    <section id="resultats" aria-busy={pending} className={fr.cx("fr-mt-3w")}>
      <div
        className={fr.cx(
          "fr-grid-row",
          "fr-grid-row--middle",
          "fr-grid-row--gutters",
          "fr-mb-2w",
        )}
      >
        <div className={fr.cx("fr-col-12", "fr-col-md-7")}>
          <h1 className={fr.cx("fr-h5", "fr-mb-1w")}>
            {data.total.toLocaleString("fr-FR")} résultat
            {data.total > 1 ? "s" : ""}
          </h1>
          {data.total > 0 && (
            <p className={fr.cx("fr-mb-0")} role="status">
              Résultats {(data.page - 1) * ADVANCED_PAGE_SIZE + 1}–
              {Math.min(data.page * ADVANCED_PAGE_SIZE, data.total)}
            </p>
          )}
        </div>
        <ExportActions className={fr.cx("fr-col-12", "fr-col-md-5")}>
          {data.total > 0 && (
            <Button
              iconId="fr-icon-download-line"
              priority="secondary"
              linkProps={{
                href: `/rechercher/advanced/export?${advancedResultParams(criteria, currentOptions)}`,
                prefetch: false,
                download: true,
              }}
            >
              Exporter tous les résultats en CSV
            </Button>
          )}
        </ExportActions>
      </div>
      {pending && <p role="status">Recherche en cours…</p>}
      <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
        <aside
          className={fr.cx("fr-col-12", "fr-col-md-3")}
          aria-label="Filtres des résultats"
        >
          <h2 className={fr.cx("fr-h6")}>Filtrer les résultats</h2>
          <p className={fr.cx("fr-text--xs")}>
            Filtres appliqués à l’ensemble des résultats et à l’export.
          </p>
          {filtered && (
            <Button
              size="small"
              priority="tertiary no outline"
              onClick={() =>
                navigate({
                  ...currentOptions,
                  page: 1,
                  substances: [],
                  atcs: [],
                  indications: [],
                })
              }
            >
              Effacer les filtres des résultats
            </Button>
          )}
          <fieldset
            disabled={pending}
            style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
          >
            <legend className={fr.cx("fr-sr-only")}>
              Filtres des résultats
            </legend>
            <SearchFilterBlock
              title="Substance active"
              filtersList={data.facets.substances}
              onClickFilter={(filter, checked) =>
                toggle("substances", filter.id, checked)
              }
            />
            <SearchFilterBlock
              title="Classe de médicament"
              filtersList={data.facets.atcs}
              onClickFilter={(filter, checked) => {
                const selected = new Set(options.atcs);
                for (const child of filter.children ?? []) {
                  if (checked) selected.add(child.id);
                  else selected.delete(child.id);
                }
                navigate({ ...currentOptions, page: 1, atcs: [...selected] });
              }}
              onClickChildFilter={(_parent, child, checked) =>
                toggle("atcs", child.id, checked)
              }
            />
            <SearchFilterBlock
              title="Indication"
              filtersList={data.facets.indications}
              onClickFilter={(filter, checked) =>
                toggle("indications", filter.id, checked)
              }
            />
          </fieldset>
        </aside>
        <div className={fr.cx("fr-col-12", "fr-col-md-9")}>
          <div className={fr.cx("fr-mb-2w")} style={{ textAlign: "right" }}>
            Trier par <strong>ordre alphabétique</strong>
            <Button
              iconId={
                options.descending
                  ? "fr-icon-arrow-up-line"
                  : "fr-icon-arrow-down-line"
              }
              onClick={() =>
                navigate({
                  ...currentOptions,
                  page: 1,
                  descending: !options.descending,
                })
              }
              priority="tertiary no outline"
              title={`Trier par ordre ${options.descending ? "croissant" : "décroissant"}`}
              size="small"
              disabled={pending}
            />
          </div>
          {data.results.map((result) => (
            <DataBlockSpecResult
              key={result.specId}
              specialite={result}
              subsFilters={[]}
              atcsFilters={[]}
              indicationsFilters={[]}
            />
          ))}
          {data.total === 0 && (
            <Alert
              severity="info"
              title="Aucun résultat"
              description="Aucune spécialité ne correspond à ces critères. Essayez de modifier ou de retirer certains filtres."
            />
          )}
          {pages > 1 && (
            <Pagination
              key={data.page}
              count={pages}
              defaultPage={data.page}
              className={fr.cx("fr-my-3w")}
              getPageLinkProps={(page) => ({
                href: href({ ...currentOptions, page }),
                prefetch: false,
              })}
            />
          )}
        </div>
      </div>
    </section>
  );
}
