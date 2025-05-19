"use client";
import { DetailsNoticePartsEnum } from "@/types/NoticeTypes";
import { SideMenu, SideMenuProps } from "@codegouvfr/react-dsfr/SideMenu";
import { HTMLAttributes, useState } from "react";
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
    href: 'rcp-indications-therapeutiques',
    text: '4.1. Indications thérapeutiques'
  },
  {
    href: 'rcp-posologie-mode-administration',
    text: '4.2. Posologie et mode d’administration'
  },
  {
    href: 'rcp-contre-indications',
    text: '4.3. Contre-indications'
  },
  {
    href: 'rcp-precautions-emploi',
    text: '4.4. Mises en garde spéciales et précautions d’emploi'
  },
  {
    href: 'rcp-interactions',
    text: '4.5. Interactions avec d’autres médicaments et autres formes d’interactions'
  },
  {
    href: 'rcp-fertilite-grossesse-allaitement',
    text: '4.6. Fertilité, grossesse et allaitement'
  },
  {
    href: 'rcp-conduite',
    text: '4.7. Effets sur l’aptitude à conduire des véhicules et à utiliser des machines'
  },
  {
    href: 'rcp-effets-indesirables',
    text: '4.8. Effets indésirables'
  },
  {
    href: 'rcp-surdosage',
    text: '4.9. Surdosage'
  }
];
const RCPDonneesPharmaSubMenu: SubMenuType[] = [
  {
    href: 'rcp-pharmacologie-liste-excipients',
    text: '6.1. Liste des excipients'
  },
  {
    href: 'rcp-pharmacologie-incompatibilites',
    text: '6.2. Incompatibilités'
  },
  {
    href: 'rcp-pharmacologie-duree-conservation',
    text: '6.3. Durée de conservation'
  },
  {
    href: 'rcp-pharmacologie-precautions-conservation',
    text: '6.4. Précautions particulières de conservation'
  },
  {
    href: 'rcp-pharmacologie-emballage-exterieur',
    text: '6.5. Nature et contenu de l’emballage extérieur'
  },
  {
    href: 'rcp-pharmacologie-elimination-manipulation',
    text: '6.6. Précautions particulières d’élimination et de manipulation'
  }
];
const RCPPropPharmaSubMenu: SubMenuType[] = [
  {
    href: 'rcp-proprietes-pharmacodynamiques',
    text: '5.1. Propriétés pharmacodynamiques'
  },
  {
    href: 'rcp-proprietes-pharmacocinetiques',
    text: '5.2. Propriétés pharmacocinétiques'
  },
  {
    href: 'rcp-donnees-securite-preclinique',
    text: '5.3. Données de sécurité préclinique'
  }
];
const RCPMenu: SubMenuType[] = [
  {
    href: 'rcp-denomiation',
    text: '1. Dénomination'
  },
  {
    href: 'rcp-composition',
    text: '2. Composition'
  },
  {
    href: 'rcp-forme-pharmaceutique',
    text: '3. Forme pharmaceutique'
  },
  {
    href: 'rcp-indications-therapeutiques',
    text: '4. Données cliniques',
    children: RCPDonneesCliniSubMenu
  },
  {
    href: 'rcp-proprietes-pharmacodynamiques',
    text: '5. Propriétés pharmacologiques',
    children: RCPPropPharmaSubMenu
  },
  {
    href: 'rcp-pharmacologie-liste-excipients',
    text: '6. Données pharmacologiques',
    children: RCPDonneesPharmaSubMenu
  },
  {
    href: 'rcp-titulaire-amm',
    text: '7. Titulaire l’AMM'
  },
  {
     href: 'rcp-numeros-amm',
    text: '8. Numéro(s) de l’AMM'
  },
  {
    href: 'rcp-date-autorisation',
    text: '9. Date de première autorisation/de renouvellement de l’autorisation'
  },
  {
    href: 'rcp-date-mise-jour-texte',
    text: '10. Date de mise à jour du texte'
  },
  {
    href: 'rcp-dosimetrie',
    text: '11. Dosimétrie'
  },
  {
    href: 'rcp-preparation-radiopharmaceutiques',
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
  .fr-accordion .fr-collapse--expanded{
    padding-top: 0rem;
  }
  .fr-accordion .fr-collapse:not(.fr-collapse--expanded){
    color: red
  }
`;

interface DetailedSubMenuProps extends HTMLAttributes<HTMLDivElement> {
  updateVisiblePart: (visiblePart: DetailsNoticePartsEnum) => void;
}

function DetailedSubMenu(
  {updateVisiblePart, ...props}: DetailedSubMenuProps
) {

  const [currentSubMenu, setCurrentSubMenu] = useState<SubMenuType>(infosGeneralesMenu[0]);

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
        burgerMenuButtonText="Dans cette rubrique"
        items={[
          {
            expandedByDefault: true,
            linkProps: {
              href: '#informations-generales',
              onClick: () => menuOnClick(DetailsNoticePartsEnum.INFORMATIONS_GENERALES),
            },
            text: 'Informations générales',
            items: getSubMenu(infosGeneralesMenu),
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
            text: 'Document HAS',
            items: getSubMenu(documentHASMenu),
          }
        ]}
    />
    </Container>
  );
};

export default DetailedSubMenu;
