import { FicheInfos } from "@/types/FicheInfoTypes";

export function displayInfosImportantes(ficheInfos?: FicheInfos): boolean {
  return !!ficheInfos?.listeInformationsImportantes?.length;
}

export function formatDateNotif(dateNotif: string | undefined): string {
  if (!dateNotif) return "";

  const date = new Date(dateNotif);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("fr-FR");
}

export function formatNoticeDateNotif(dateNotif: string | undefined): string {
  const formattedDate = formatDateNotif(dateNotif);
  if (!formattedDate) return "";

  return `Notice mise à jour le ${formattedDate}`;
}
