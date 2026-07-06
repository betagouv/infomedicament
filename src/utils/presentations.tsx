import { PresentationComm, PresentationStat } from "@/db/pdbmMySQL/types";
import { PresentationDetail } from "@/db/types";
import { AggregateCaraccomplrecipsDetails, AggregateDispositifDetails, AggregatePresentationDetails, AggregateRecipientDetails, Presentation, PresentationRecipientsDetails } from "@/types/PresentationTypes";
import { capitalize } from "tsafe";

const unitesMesures = [
  "cm2",
  "g",
  "GBq",
  "GBq/ml",
  "kg",
  "l",
  "MBq",
  "MBq/ml",
  "mg",
  "microgrammes",
  "ml",
  "UI",
];

export function replacePluralSingular(textToReplace: string, nb: number, shortName?: boolean){
  let newText = "";
  if(nb > 1){
    newText = textToReplace.replaceAll("(s)", "s")
      .replaceAll("stylo prérempli", "stylos préremplis")
      .replaceAll("al(aux)", "aux")
      .replaceAll("(x)", "x")
  } else {
    newText = textToReplace.replaceAll("(s)", "")
      .replaceAll("al(aux)", "al")
      .replaceAll("(x)", "")
  }
  if(shortName)
    newText = newText.replaceAll("thermoformée", "");
  return newText;
}

export function totalDisplay(recipientDetails: AggregateRecipientDetails): string {
  if(recipientDetails.nbrrecipient && recipientDetails.qtecontenance && recipientDetails.qtecontenance > 1 && recipientDetails.unitecontenance && !unitesMesures.includes(recipientDetails.unitecontenance)) {
    const total: number = recipientDetails.nbrrecipient * recipientDetails.qtecontenance;
    return `${total} ${replacePluralSingular(recipientDetails.unitecontenance, total)}`;
  }
  else return "";
}

export function contenanceDisplay(recipientDetails: AggregateRecipientDetails): string {
  if(recipientDetails.qtecontenance && recipientDetails.unitecontenance){  
    return `${recipientDetails.qtecontenance.toLocaleString('fr-FR')} ${replacePluralSingular(recipientDetails.unitecontenance, recipientDetails.qtecontenance)}`;
  }
  else return "";
}

export function caracCompDisplay(caraccomplrecipDetails: AggregateCaraccomplrecipsDetails[], nbRecipient: number, shortName?: boolean): string {
  let detailsText: string = "";
  caraccomplrecipDetails.forEach((details: AggregateCaraccomplrecipsDetails) => {
    if(details.caraccomplrecip && 
      (!shortName || (shortName && details.caraccomplrecip.startsWith("avec")))
    )
      detailsText += ` ${replacePluralSingular(details.caraccomplrecip, nbRecipient)}`;
  })
  return detailsText;
}

export function dispositifDisplay(dispositifDetails: AggregateDispositifDetails[]): string {
  let detailsText: string = "";
  dispositifDetails.forEach((details: AggregateDispositifDetails) => {
    if(details.numdispositif) {
      //Singular all the time
      detailsText += ` ${replacePluralSingular(details.dispositif, 0)}`;
    }
  })
  return detailsText;
}

function isCaraccomplrecipDetails(details: PresentationDetail): boolean {
  if(details.caraccomplrecip) {
    const find = details.nom_presentation.toLowerCase().trim().indexOf(details.caraccomplrecip.toLowerCase().trim());
    if(find !== -1){
      return true;
    }
  }
  return false;
}

function cleanRecipientDetails(details: PresentationDetail): AggregateRecipientDetails {
  return {
      recipient: details.recipient,
      numrecipient: details.numrecipient,
      nbrrecipient: details.nbrrecipient,
      qtecontenance: details.qtecontenance,
      unitecontenance: details.unitecontenance,
      caraccomplrecips : isCaraccomplrecipDetails(details)
        ? [{
          caraccomplrecip: details.caraccomplrecip,
          numordreedit: details.numordreedit,
        }]
        : [],
    };
}

function sortCleanPresentationsDetails(cleanPresDetails: AggregatePresentationDetails[]): AggregatePresentationDetails[] {
  return cleanPresDetails
    .map((presDetails) => {
      //Sort recipients details
      presDetails.recipients = presDetails.recipients
        .map((presRecipient) => {
          //Sort caraccomplrecips
          presRecipient.caraccomplrecips = presRecipient.caraccomplrecips
            .filter((detailA: AggregateCaraccomplrecipsDetails, indexA: number) => {
              //Only one of each caraccomplrecips
              const findIndex = presRecipient.caraccomplrecips.findIndex(
                (detailB, indexB) => indexA !== indexB && detailB.caraccomplrecip.toLowerCase().trim() === detailA.caraccomplrecip.toLowerCase().trim()
              );
              if(findIndex === -1 && detailA.caraccomplrecip.toLowerCase().trim() === "pvc"){
                //if PVC-Aluminium is in the list and also PVC : PVC-Aluminium win
                const findIndexPVC = presRecipient.caraccomplrecips.findIndex((detailB) => detailB.caraccomplrecip.toLowerCase().trim() === "pvc-aluminium");
                if(findIndexPVC !== -1)
                  return false;
              }
              if(findIndex === -1 
                || (findIndex !== -1 && presRecipient.caraccomplrecips[findIndex].numordreedit > detailA.numordreedit)) return true;
              return false;
            })
            .sort((a,b) => 
              a.numordreedit && b.numordreedit ? a.numordreedit - b.numordreedit : a.numordreedit ? -1 : b.numordreedit ? 1 : 0
            )
          return presRecipient;
        })
        .sort((a, b) => 
          a.numrecipient && b.numrecipient ? a.numrecipient - b.numrecipient : a.numrecipient ? -1 : b.numrecipient ? 1 : 0,
        );
      //Sort dispositifs
      presDetails.dispositifs = presDetails.dispositifs
        .filter((detailA: AggregateDispositifDetails, index: number) => {
          //Only one of each dispositifs
          const findIndex = presDetails.dispositifs.findIndex(
            (detailB) => detailB.dispositif.toLowerCase().trim() === detailA.dispositif.toLowerCase().trim()
          );
          if(findIndex === index || findIndex === -1 
            || (findIndex !== -1 && presDetails.dispositifs[findIndex].numdispositif > detailA.numdispositif)) return true;
          return false;
        })
        .sort((a,b) => 
          a.numdispositif && b.numdispositif ? a.numdispositif - b.numdispositif : a.numdispositif ? -1 : b.numdispositif ? 1 : 0
        );
      return presDetails;
    });
}

export function cleanPresentationsDetails(presDetails: PresentationDetail[]): AggregatePresentationDetails[]{
  const cleanPresDetails:AggregatePresentationDetails[] = [];
  presDetails.forEach((details: PresentationDetail) => {
    const index = cleanPresDetails.findIndex((cleanDetails) => cleanDetails.codecip13 === details.codecip13);
    if(index === -1){
      //New element in the presentations
      cleanPresDetails.push({
        codecip13: details.codecip13,
        recipients: [
          cleanRecipientDetails(details),
        ],
        dispositifs: details.numdispositif
          ? [{
            dispositif: details.dispositif,
            numdispositif: details.numdispositif,
          }] : [],
      });
    } else {
      //Maj content of the recipient 
      const indexRecipient = cleanPresDetails[index].recipients.findIndex((recipientDetails) => recipientDetails.numrecipient === details.numrecipient);
      if(indexRecipient === -1){
        //New recipient in the presentations
        cleanPresDetails[index].recipients.push(
          cleanRecipientDetails(details)
        )
      } else {
        if(isCaraccomplrecipDetails(details)) {
          //Maj content of the caraccomplrecip
          cleanPresDetails[index].recipients[indexRecipient].caraccomplrecips.push({
            caraccomplrecip: details.caraccomplrecip,
            numordreedit: details.numordreedit,
          });
        }
      }
      //Maj content of the dispositif
      if(details.numdispositif) {
        const indexDispositif = cleanPresDetails[index].dispositifs.findIndex((dispositifDetails) => dispositifDetails.numdispositif === details.numdispositif);
        if(indexDispositif === -1){
          //New recipient in the presentations
          cleanPresDetails[index].dispositifs.push({
            dispositif: details.dispositif,
            numdispositif: details.numdispositif,
          })
        }
      }
    }
  });
  return sortCleanPresentationsDetails(cleanPresDetails);
}

export function getPresentationName(
  presentation: Presentation,
  shortName?: boolean,
): string {
  if(presentation.details && presentation.details.length > 0){
    const allPresDetails: AggregatePresentationDetails[] = cleanPresentationsDetails(presentation.details);
    let allPresNames: string = "";
    allPresDetails.forEach((presDetails: AggregatePresentationDetails) => {
      if(presDetails.recipients.length === 0) return;
      let name = "";
      presDetails.recipients.forEach((recipientDetails: AggregateRecipientDetails) => {
        if(!recipientDetails.recipient) return;

        const nbRecipient: number = (recipientDetails.nbrrecipient !== 0 &&recipientDetails.nbrrecipient)
          ? recipientDetails.nbrrecipient
          : 1;

        const recipient: string = replacePluralSingular(recipientDetails.recipient, nbRecipient, shortName);
        const contenance: string = contenanceDisplay(recipientDetails);
        const caraccomplrecip: string = caracCompDisplay(recipientDetails.caraccomplrecips, nbRecipient, shortName);

        if(name !== "")
          name += " - ";
        if (nbRecipient > 1) {
          const total: string = totalDisplay(recipientDetails);
          if (total !== "") 
            name += `${total} - `;
          name += `${nbRecipient.toString()} ${recipient}${caraccomplrecip}${contenance && ` de ${contenance}`}`;
        } else {
          if(!shortName) name += `1 ${recipient}${caraccomplrecip}${contenance && ` de ${contenance}`}`;
          else name += capitalize(`${recipient}${caraccomplrecip}${contenance && ` de ${contenance}`}`);
        }

      });
      const dispositif: string = dispositifDisplay(presDetails.dispositifs);
      if(!shortName && dispositif)
        name += `${dispositif}`;
      
      if(allPresNames !== "")
        allPresNames += " - ";
      allPresNames += name;
      
    });
    if(allPresNames !== "")
      return allPresNames;
  }

  const index = presentation.PresNom01.indexOf("stylo prérempli");
  if(index !== -1){
    if(index === 0){
      return capitalize(presentation.PresNom01);
    }
    const qt = presentation.PresNom01.substring(0, index).trim();
    if(!isNaN(Number(qt)) && Number(qt) > 1 && Number(presentation.PresNum) <= 1){
      return presentation.PresNom01.replaceAll("stylo prérempli", "stylos préremplis");
    }
  }

  return presentation.PresNom01;
}

export function getAggregatePresentationRecipientsTexts(
  presentationDetails: AggregatePresentationDetails,
): PresentationRecipientsDetails[] {
  const details: PresentationRecipientsDetails[]= [];

  if(presentationDetails.recipients.length === 0) return [];
  presentationDetails.recipients.forEach((recipientDetails: AggregateRecipientDetails) => {
    if(!recipientDetails.recipient) return;
    const nbRecipient: number = (recipientDetails.nbrrecipient !== 0 &&recipientDetails.nbrrecipient)
      ? recipientDetails.nbrrecipient
      : 1;

    const recipient: string = replacePluralSingular(recipientDetails.recipient, nbRecipient);
    const contenance: string = contenanceDisplay(recipientDetails);

    const detail: PresentationRecipientsDetails = {
      contenance: contenance,
      recipient: nbRecipient > 1 ? `${nbRecipient.toString()} ${recipient}` : recipient,
    }
    details.push(detail);
  });
  return details;
}

export function getPresentationFullPriceText(
  presentation: Presentation
): string {
  if(presentation.PPF && presentation.TauxPriseEnCharge) {
    const price: string = Intl.NumberFormat(
      "fr-FR", {
        style: "currency",
        currency: "EUR",
      }).format(presentation.PPF);
    return `Prix ${price} - remboursé à ${presentation.TauxPriseEnCharge}`;               
  } else {
    return "Prix libre - non remboursable";
  }                 
}

export function getPresentationTauxPriseEnChargeText(
  presentation: Presentation
): string {
  if(presentation.TauxPriseEnCharge) {
    return `remboursé à ${presentation.TauxPriseEnCharge}`;
  } else {
    return "non remboursable";
  }                 
}

export function getPresentationPriceText(
  presentation: Presentation
): string {
  if(presentation.PPF) {
    const price: string = Intl.NumberFormat(
      "fr-FR", {
        style: "currency",
        currency: "EUR",
      }).format(presentation.PPF);
    return price;
  } else {
    return "Prix libre";
  }                 
}

export function isAbrogee(presentation: Presentation): boolean {
  if(presentation.StatId && Number(presentation.StatId) === PresentationStat.Abrogation)
    return true;
  return false;
}

export function isArret(presentation: Presentation): boolean {
  if(presentation.CommId && Number(presentation.CommId) === PresentationComm.Arrêt)
    return true;
  return false;
}

export function isNotAuthorized(presentation: Presentation): boolean {
  if(presentation.CommId && Number(presentation.CommId) === PresentationComm["Plus d'autorisation"])
    return true;
  return false;
}

export function isAgree(presentation: Presentation): boolean {
  if(presentation.AgreColl && presentation.AgreColl === 1)
    return true;
  return false;
}

export function isListeSus(presentation: Presentation): boolean {
  if(presentation.retro && presentation.retro.ListSus === "oui")
    return true;
  return false;
}

export function isListeRetrocession(presentation: Presentation): boolean {
  if(presentation.retro && presentation.retro.Retro === "oui")
    return true;
  return false;
}

export function isIVG(presentation: Presentation): boolean {
  if(presentation.retro && presentation.retro.IVG === "oui")
    return true;
  return false;
}

export function isReimbursable(presentations: Presentation[]): boolean {
  const index = presentations.findIndex((pres) => pres.TauxPriseEnCharge);
  if(index === -1) return false;
  return true;
}