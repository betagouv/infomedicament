import { PresentationDetail } from "@/db/types";
import { AgregateCaraccomplrecipsDetails, AgregatePresentationDetails, AgregateRecipientDetails, Presentation } from "@/types/PresentationTypes";
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

function replacePluralSingular(textToReplace: string, nb: number, shortName?: boolean){
  let newText = "";
  if(nb > 1){
    newText = textToReplace.replaceAll("(s)", "s")
      .replaceAll("stylo prérempli", "stylos préremplis")
      .replaceAll("al(aux)", "aux")
  } else {
    newText = textToReplace.replaceAll("(s)", "")
      .replaceAll("al(aux)", "al")
  }
  if(shortName)
    newText = newText.replaceAll("thermoformée", "");
  return newText;
}

function totalDisplay(precipientDetails: AgregateRecipientDetails): string {
  if(precipientDetails.nbrrecipient && precipientDetails.qtecontenance && precipientDetails.unitecontenance)
    return `${precipientDetails.nbrrecipient * precipientDetails.qtecontenance} ${precipientDetails.unitecontenance.replaceAll("(s)", "s")}`;
  else return "";
}

function contenanceDisplay(recipientDetails: AgregateRecipientDetails): string {
  if(recipientDetails.qtecontenance && recipientDetails.unitecontenance){
    const qteContenance: number = (recipientDetails.qtecontenance !== 0 &&recipientDetails.qtecontenance)
      ? recipientDetails.qtecontenance
      : 0;    
    return `${qteContenance.toLocaleString('fr-FR')} ${replacePluralSingular(recipientDetails.unitecontenance, qteContenance)}`;
  }
  else return "";
}

function caracCompDisplay(caraccomplrecipDetails: AgregateCaraccomplrecipsDetails[], nbRecipient: number, shortName?: boolean): string {
  let detailsText: string = "";
  caraccomplrecipDetails.forEach((details: AgregateCaraccomplrecipsDetails) => {
    if(details.caraccomplrecip && 
      (!shortName || (shortName && details.caraccomplrecip.startsWith("avec")))
    )
      detailsText += ` ${replacePluralSingular(details.caraccomplrecip, nbRecipient)}`;
  })
  return detailsText;
}


function cleanPresentationsDetails(presDetails: PresentationDetail[]): AgregatePresentationDetails[]{
  const cleanPresDetails:AgregatePresentationDetails[] = [];
  presDetails.forEach((details) => {
    const index = cleanPresDetails.findIndex((cleanDetails) => cleanDetails.numelement === details.numelement);
    if(index === -1){
      //New element in the presentations
      cleanPresDetails.push({
        codecip13: details.codecip13,
        numelement: details.numelement,
        nomelement: details.nomelement,
        recipients: [{
          recipient: details.recipient,
          numrecipient: details.numrecipient,
          nbrrecipient: details.nbrrecipient,
          qtecontenance: details.qtecontenance,
          unitecontenance: details.unitecontenance,
          caraccomplrecips : [{
            caraccomplrecip: details.caraccomplrecip,
            numordreedit: details.numordreedit,
          }],
        }],
      });
    } else {
      //Maj content of the recipient 
      const indexRecipient = cleanPresDetails[index].recipients.findIndex((recipientDetails) => recipientDetails.numrecipient === details.numrecipient);
      if(indexRecipient === -1){
        //New recipient in the presentations
        cleanPresDetails[index].recipients.push({
          recipient: details.recipient,
          numrecipient: details.numrecipient,
          nbrrecipient: details.nbrrecipient,
          qtecontenance: details.qtecontenance,
          unitecontenance: details.unitecontenance,
          caraccomplrecips : [{
            caraccomplrecip: details.caraccomplrecip,
            numordreedit: details.numordreedit,
          }],
        })
      } else {
        //Maj content of the caraccomplrecip --> unique numordreedit
        cleanPresDetails[index].recipients[indexRecipient].caraccomplrecips.push({
          caraccomplrecip: details.caraccomplrecip,
          numordreedit: details.numordreedit,
        });
      }
    }
  });

  //Tri cleanPresDetails par numelement
  return cleanPresDetails
    .map((presDetails) => {
      presDetails.recipients = presDetails.recipients
        .map((presRecipient) => {
          presRecipient.caraccomplrecips = presRecipient.caraccomplrecips.sort((a,b) => 
            a.numordreedit && b.numordreedit ? a.numordreedit - b.numordreedit : a.numordreedit ? -1 : b.numordreedit ? 1 : 0
          )
          return presRecipient;
        })
        .sort((a, b) => 
          a.numrecipient && b.numrecipient ? a.numrecipient - b.numrecipient : b.numrecipient ? -1 : b.numrecipient ? 1 : 0,
        );
      return presDetails;
    })
    .sort((a,b) => 
      a.numelement && b.numelement ? a.numelement - b.numelement : a.numelement ? -1 : b.numelement ? 1 : 0,
    );
}

export function getPresentationName(
  presentation: Presentation,
  shortName?: boolean,
): string {
  if(presentation.details && presentation.details.length > 0){
    const allPresDetails: AgregatePresentationDetails[] = cleanPresentationsDetails(presentation.details);
    let allPresNames: string = "";

    allPresDetails.forEach((presDetails: AgregatePresentationDetails) => {
      if(presDetails.recipients.length === 0) return;
      let name = "";
      presDetails.recipients.forEach((recipientDetails: AgregateRecipientDetails) => {
        if(!recipientDetails.recipient) return;

        const nbRecipient: number = (recipientDetails.nbrrecipient !== 0 &&recipientDetails.nbrrecipient)
          ? recipientDetails.nbrrecipient
          : 1;

        const recipient: string = replacePluralSingular(recipientDetails.recipient, nbRecipient, shortName);
        const contenance: string = contenanceDisplay(recipientDetails);
        const caraccomplrecip: string = caracCompDisplay(recipientDetails.caraccomplrecips, nbRecipient, shortName);

      if(name !== "")
        name += " ";
        if (nbRecipient > 1) {
          if (recipientDetails.qtecontenance > 1 && recipientDetails.unitecontenance && !unitesMesures.includes(recipientDetails.unitecontenance)) {
            name += `${totalDisplay(recipientDetails)} - ${nbRecipient.toString()} ${recipient}${caraccomplrecip}${contenance && ` de ${contenance}`}`;
          } else {
            name += `${nbRecipient.toString()} ${recipient}${caraccomplrecip}${contenance && ` de ${contenance}`}`;
          }
        } else {
          if(!shortName) name += `1 ${recipient}${caraccomplrecip}${contenance && ` de ${contenance}`}`;
          else name += capitalize(`${recipient}${caraccomplrecip}${contenance && ` de ${contenance}`}`);
        }

      });
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

export function getPresentationPriceText(
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
    return "Prix libre - non remboursable"
  }
                        
}