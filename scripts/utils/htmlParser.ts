/**
 * Nettoie le HTML en supprimant les balises <a name="...">...</a>
 * tout en conservant leur contenu.
 */
export function getCleanHTML(htmlToClean: string): string {
  let cleanHTML: string = htmlToClean;
  let indexAEmpty: number = cleanHTML.indexOf("<a name=");
  while (indexAEmpty !== -1) {
    var indexAEmptyEnd: number = cleanHTML.indexOf(">", indexAEmpty);
    if (indexAEmptyEnd === -1) break;
    var indexAEmptyClose: number = cleanHTML.indexOf("</a>", indexAEmptyEnd);
    if (indexAEmptyClose === -1) break;
    const newCleanHTML =
      cleanHTML.slice(0, indexAEmpty) +
      cleanHTML.slice(indexAEmptyEnd + 1, indexAEmptyClose) +
      cleanHTML.slice(indexAEmptyClose + 4);
    cleanHTML = newCleanHTML;
    indexAEmpty = cleanHTML.indexOf("<a name=");
  }
  return cleanHTML;
}
