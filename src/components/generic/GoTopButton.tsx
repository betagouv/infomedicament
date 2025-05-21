"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import { useState } from "react";

function GoTopButton() {

  const [isVisible, setIsVisible] = useState<boolean>(true);

  //$(window).on("load resize", checkPosition)
  //var phonebox = $(".phonebox");

  /*function checkPosition() {
    if(window.outerWidth < 768) {
      window.scroll({
        if ($(window).scrollTop() > 100) {
          $(phonebox).show();
        } else {
          $(phonebox).hide();
        }
      });
    }
  }*/

  return (
    <>
    {isVisible ? (
        <Button
          iconId="fr-icon-arrow-up-line"
          title="Haut de page"
          className="go-top-button"
          linkProps={{
            href: '#'
          }}
        />
      ) : ("")
    }
    </>
  );
};

export default GoTopButton;
