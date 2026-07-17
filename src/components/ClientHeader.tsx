"use client";

import { Header } from "@codegouvfr/react-dsfr/Header";
import Image from "next/image";
import { AutocompleteSearchInput } from "@/components/search/autocomplete/AutocompleteSearch";
import { useRouter } from "next/navigation";
import { useIsDark } from "@codegouvfr/react-dsfr/useIsDark";
import { useTracking } from "@/services/tracking";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";

export default function ClientHeader({
  atcs,
  hasSearch = true,
  searchInitial = "",
}: {
  atcs: { code: string; label: string }[];
  hasSearch?: boolean;
  searchInitial?: string;
}) {
  const router = useRouter();
  const { isDark } = useIsDark();
  useTracking();

  return (
    <Header
      brandTop={
        <>
          RÉPUBLIQUE
          <br />
          FRANÇAISE
        </>
      }
      homeLinkProps={{
        href: "/",
        title: "Accueil",
      }}
      serviceTitle={
        <Image
          src={isDark ? "/img/logo_white.svg" : "/img/logo.svg"}
          alt="Info Médicament"
          width={285}
          height={33}
          style={{ maxWidth: "100%", height: "auto" }}
        />
      }
      serviceTagline="La référence officielle sur les données des médicaments"
      quickAccessItems={[
        {
          iconId: 'fr-icon-arrow-left-right-fill',
          linkProps: {
            href: "/interactions",
            prefetch: false,
            className: cx("fr-hidden-md")
          },
          text: "Interactions entre médicaments",
        },
        {
          iconId: 'fr-icon-speak-fill',
          linkProps: {
            href: "https://signalement.social-sante.gouv.fr/",
            target: "_blank",
            rel: "noopener external",
            className: cx("fr-hidden-md")
          },
          text: "Signaler un effet indésirable"
        },
      ]}
      navigation={[
        { text: "Accueil", linkProps: { href: "/", prefetch: false } },
        {
          text: "Classes de médicament",
          menuLinks: atcs.map((atc) => ({
            linkProps: { href: `/atc/${atc.code}`, prefetch: false },
            text: atc.label,
          })),
        },
        {
          text: "Listes",
          menuLinks: [
            {
              text: "Tous les médicaments",
              linkProps: { href: "/medicaments/A", prefetch: false },
            },
            {
              text: "Toutes les substances actives",
              linkProps: { href: "/substances/(", prefetch: false },
            },
            {
              text: "Toutes les indications",
              linkProps: { href: "/indications/A", prefetch: false },
            },
            {
              text: "Tous les groupes génériques",
              linkProps: { href: "/generiques/A", prefetch: false },
            },
          ],
        },
        {
          text: "Interactions",
          linkProps: { href: "/interactions", prefetch: false },
        },
        {
          text: "Articles",
          linkProps: { href: "/articles", prefetch: false },
        },
        {
          text: "Glossaire",
          linkProps: { href: "/glossaire/A", prefetch: false },
        },
        {
          text: "Signaler un effet indésirable",
          linkProps: {
            href: "https://signalement.social-sante.gouv.fr/",
            target: "_blank",
            rel: "noopener external"
          },
        },
      ]}
      renderSearchInput={
        hasSearch
          ? (props) => (
              <AutocompleteSearchInput
                name="s"
                {...props}
                placeholder="Que cherchez-vous ?"
                initialValue={searchInitial}
              />
            )
          : undefined
      }
      onSearchButtonClick={
        hasSearch
          ? (search: string) =>
              router.push(`/rechercher?s=${encodeURIComponent(search)}`)
          : undefined
      }
    />
  );
}
