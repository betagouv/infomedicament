"use client";

import Link from "next/link";

function CentraliseBlock() {
  return (
    <div>
      Ce médicament a été autorisé par la Commission européenne.<br/>
      <br/>
      Vous pouvez consulter la notice, le RCP et les données complètes sur le site de l’
      <Link
        href="https://www.ema.europa.eu/en/search"
        target="_blank"
        rel="noopener noreferrer"
      >
        EMA (Agence européenne des médicaments)
      </Link>.
      <br/>
    </div>
  );
}

export default CentraliseBlock;
