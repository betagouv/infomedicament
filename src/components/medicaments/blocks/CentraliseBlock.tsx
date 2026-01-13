"use client";

import { HTMLAttributes } from "react";
import Link from "next/link";

interface CentraliseBlockProps extends HTMLAttributes<HTMLDivElement> {
  pdfURL?: string,
}

function CentraliseBlock({
  pdfURL,
  ...props
}: CentraliseBlockProps ) {

  return (
    <div>
      Ce médicament a été autorisé par la Commission européenne.<br/>
      {pdfURL ? (
        <>
          Vous pouvez consulter la notice sur son site.<br/>
          <br/>
          <Link 
            target="_blank"
            href={pdfURL}
            rel="noopener noreferrer"
          >
            Vers le RCP et la notice
          </Link>
          <br/>
        </>
      ) : (
        <>
          <br/>
          Vous pouvez consulter la notice, le RCP et les données complètes sur le site de l’
          <Link 
            href="https://www.ema.europa.eu/en/search"
            target="_blank"
            rel="noopener noreferrer"
          >
              EMA
          </Link>{" "}(
          <Link 
            href="https://www.ema.europa.eu/en/search"
            target="_blank"
            rel="noopener noreferrer"
          >
            Agence européenne des médicaments
          </Link>).
          <br/>
        </>
      )}
    </div>
  );
};

export default CentraliseBlock;
