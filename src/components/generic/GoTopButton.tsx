"use client";

import Button from "@codegouvfr/react-dsfr/Button";

function GoTopButton() {

  return (
    <Button
      iconId="fr-icon-arrow-up-line"
      title="Haut de page"
      className="go-top-button"
      linkProps={{
        href: '#'
      }}
    />
  );
};

export default GoTopButton;
