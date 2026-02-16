"use client";

import { Header } from "@codegouvfr/react-dsfr/Header";
import Image from "next/image";
import { AutocompleteSearchInput } from "@/components/AutocompleteSearch";
import { useRouter } from "next/navigation";
import { useIsDark } from "@codegouvfr/react-dsfr/useIsDark";
import { useTracking } from "@/services/tracking";
import { ATC1 } from "@/types/ATCTypes";

export default function ClientHeader({
  atcs,
  hasSearch = true,
  searchInitial = "",
}: {
  atcs: ATC1[];
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
      navigation={[
        { text: "Accueil", linkProps: { href: "/" } },
        {
          text: "Parcourir par classe de médicament",
          menuLinks: atcs.map((atc) => ({
            linkProps: { href: `/atc/${atc.code}` },
            text: atc.label,
          })),
        },
        {
          text: "Listes par ordre alphabétique",
          menuLinks: [
            {
              text: "Tous les médicaments",
              linkProps: { href: "/medicaments/A" },
            },
            {
              text: "Toutes les substances actives",
              linkProps: { href: "/substances/(" },
            },
            {
              text: "Toutes les pathologies",
              linkProps: { href: "/pathologies/A" },
            },
            {
              text: "Tous les groupes génériques",
              linkProps: { href: "/generiques/A" },
            },
          ],
        },
        {
          text: "Articles",
          linkProps: { href: "/articles" },
        },
        {
          text: "Glossaire",
          linkProps: { href: "/glossaire/A" },
        },
        {
          text: "À propos",
          linkProps: { href: "/a-propos" },
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
          ? (search: string) => router.push(`/rechercher?s=${search}`)
          : undefined
      }
    />
  );
}
