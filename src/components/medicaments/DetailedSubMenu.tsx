"use client";
import { DetailsNoticePartsEnum } from "@/types/NoticeTypes";
import { SideMenu, SideMenuProps } from "@codegouvfr/react-dsfr/SideMenu";
import { HTMLAttributes, useEffect, useState } from "react";
import styled from 'styled-components';

type SubMenuType = {
  href: string;
  text: string;
  children?: SubMenuType[];
};

const infosGeneralesMenu: SubMenuType[] = [
  {
    href: 'informations-generales',
    text: 'Résumé',
  },
  {
    href: 'informations-importantes',
    text: 'Informations importantes',
  },
  {
    href: 'informations-indications',
    text: 'Indications',
  },
  {
    href: 'informations-composition',
    text: 'Composition',
  },
  {
    href: 'informations-presentations',
    text: 'Présentations',
  }
];
const RCPDonneesCliniSubMenu: SubMenuType[] = [
  {
    href: 'RcpIndicTherap',
    text: '4.1. Indications thérapeutiques'
  },
  {
    href: 'RcpPosoAdmin',
    text: '4.2. Posologie et mode d’administration'
  },
  {
    href: 'RcpContreindications',
    text: '4.3. Contre-indications'
  },
  {
    href: 'RcpMisesEnGarde',
    text: '4.4. Mises en garde spéciales et précautions d’emploi'
  },
  {
    href: 'RcpInteractionsMed',
    text: '4.5. Interactions avec d’autres médicaments et autres formes d’interactions'
  },
  {
    href: 'RcpFertGrossAllait',
    text: '4.6. Fertilité, grossesse et allaitement'
  },
  {
    href: 'RcpConduite',
    text: '4.7. Effets sur l’aptitude à conduire des véhicules et à utiliser des machines'
  },
  {
    href: 'RcpEffetsIndesirables',
    text: '4.8. Effets indésirables'
  },
  {
    href: 'RcpSurdosage',
    text: '4.9. Surdosage'
  }
];
const RCPDonneesPharmaSubMenu: SubMenuType[] = [
  {
    href: 'RcpListeExcipients',
    text: '6.1. Liste des excipients'
  },
  {
    href: 'RcpIncompatibilites',
    text: '6.2. Incompatibilités'
  },
  {
    href: 'RcpDureeConservation',
    text: '6.3. Durée de conservation'
  },
  {
    href: 'RcpPrecConservation',
    text: '6.4. Précautions particulières de conservation'
  },
  {
    href: 'RcpEmballage',
    text: '6.5. Nature et contenu de l’emballage extérieur'
  },
  {
    href: 'RcpPrecEmpl',
    text: '6.6. Précautions particulières d’élimination et de manipulation'
  }
];
const RCPPropPharmaSubMenu: SubMenuType[] = [
  {
    href: 'RcpPropPharmacodynamiques',
    text: '5.1. Propriétés pharmacodynamiques'
  },
  {
    href: 'RcpPropPharmacocinetiques',
    text: '5.2. Propriétés pharmacocinétiques'
  },
  {
    href: 'RcpSecuritePreclinique',
    text: '5.3. Données de sécurité préclinique'
  }
];
const RCPMenu: SubMenuType[] = [
  {
    href: 'RcpDenomination',
    text: '1. Dénomination'
  },
  {
    href: 'RcpCompoQualiQuanti',
    text: '2. Composition'
  },
  {
    href: 'RcpFormePharm',
    text: '3. Forme pharmaceutique'
  },
  {
    href: 'RcpDonneesCliniques',
    text: '4. Données cliniques',
    children: RCPDonneesCliniSubMenu
  },
  {
    href: 'RcpPropPharmacologiques',
    text: '5. Propriétés pharmacologiques',
    children: RCPPropPharmaSubMenu
  },
  {
    href: 'RcpDonneesPharmaceutiques',
    text: '6. Données pharmacologiques',
    children: RCPDonneesPharmaSubMenu
  },
  {
    href: 'RcpTitulaireAmm',
    text: '7. Titulaire l’AMM'
  },
  {
     href: 'RcpNumAutor',
    text: '8. Numéro(s) de l’AMM'
  },
  {
    href: 'RcpPremiereAutorisation',
    text: '9. Date de première autorisation/de renouvellement de l’autorisation'
  },
  {
    href: 'RcpDateRevision',
    text: '10. Date de mise à jour du texte'
  },
  {
    href: 'RcpDosimetrie',
    text: '11. Dosimétrie'
  },
  {
    href: 'RcpInstPrepRadioph',
    text: '12. Instructions pour la préparation des radiopharmaceutiques'
  }
];
const documentHASMenu: SubMenuType[] = [
  {
    href: 'document-has-bon-usage',
    text: 'Documents de bon usage'
  },
  {
    href: 'document-has-smr',
    text: 'Service médical rendu (SMR)'
  },
  {
    href: 'document-has-asmr',
    text: 'Amélioration du service médical rendu (ASMR)'
  }
];

const Container = styled.div `
  display: contents;
  
  .fr-accordion .fr-collapse--expanded{
    padding-top: 0rem;
  }
  .fr-accordion .fr-collapse:not(.fr-collapse--expanded){
    color: red
  }
  .fr-sidemenu {
    width: 100%;
    padding-right: 0px;
  }
`;

interface DetailedSubMenuProps extends HTMLAttributes<HTMLDivElement> {
  updateVisiblePart: (visiblePart: DetailsNoticePartsEnum) => void;
  isMarr?: boolean;
}

function DetailedSubMenu({
  updateVisiblePart,
  isMarr,
  ...props
}: DetailedSubMenuProps
) {

  const [currentSubMenu, setCurrentSubMenu] = useState<SubMenuType>(infosGeneralesMenu[0]);
  const [currentInfosGeneralesMenu, setCurrentInfosGeneralesMenu] = useState<SubMenuType[]>(infosGeneralesMenu);

  useEffect(() => {
    if(isMarr){
      const menu = Array.from(infosGeneralesMenu);
      menu.push(
        {
          href: 'informations-marr',
          text: 'Mesures additionnelles de réduction du risque (MARR)',
        }
      );
      setCurrentInfosGeneralesMenu(menu);
    } else 
      setCurrentInfosGeneralesMenu(infosGeneralesMenu);
  }, [isMarr, infosGeneralesMenu, setCurrentInfosGeneralesMenu]);

  function menuOnClick(noticePart: DetailsNoticePartsEnum) {
    updateVisiblePart(noticePart);
    if(noticePart === DetailsNoticePartsEnum.INFORMATIONS_GENERALES){
      setCurrentSubMenu(infosGeneralesMenu[0]);
    } else if(noticePart === DetailsNoticePartsEnum.RCP){
      setCurrentSubMenu(RCPMenu[0]);
    } else {
      setCurrentSubMenu(documentHASMenu[0]);
    }
  }

  function getSubMenu(subMenuList: SubMenuType[]): SideMenuProps.Item[] {
    return subMenuList.map((subMenu) => {
      const subMenuItem: SideMenuProps.Item = {
        linkProps: {
          href: `#${subMenu.href}`,
          onClick: () => {subMenu.children ? setCurrentSubMenu(subMenu.children[0]) : setCurrentSubMenu(subMenu)},
        },
        text: subMenu.text,
        isActive: currentSubMenu === subMenu,
      };
      if(subMenu.children){
        (subMenuItem as SideMenuProps.Item.SubMenu).items = getSubMenu(subMenu.children);
      }
      return subMenuItem;
    });
  }

  return (
    <Container {...props}>
      <SideMenu
        align="left"
        burgerMenuButtonText="Version détaillée"
        sticky
        className="detailed-side-menu"
        items={[
          {
            expandedByDefault: true,
            linkProps: {
              href: '#informations-generales',
              onClick: () => menuOnClick(DetailsNoticePartsEnum.INFORMATIONS_GENERALES),
            },
            text: 'Informations générales',
            items: getSubMenu(currentInfosGeneralesMenu),
          },
          {
            linkProps: {
              href: '#rcp-denomiation',
              onClick: () => menuOnClick(DetailsNoticePartsEnum.RCP),
            },
            text: 'Résumé des caractéristiques du produit (RCP)',
            items: getSubMenu(RCPMenu),
          },
          {
            linkProps: {
              href: '#document-has-bon-usage',
              onClick: () => menuOnClick(DetailsNoticePartsEnum.HAS),
            },
            text: 'Documents HAS (Bon usage, SMR, ASMR)',
            items: getSubMenu(documentHASMenu),
          }
        ]}
      />
    </Container>
  );
};

export default DetailedSubMenu;
