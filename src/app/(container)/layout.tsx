import { fr } from "@codegouvfr/react-dsfr";
import React from "react";

export default function ContainerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main>
      {children}
      <div className="hotjar-feedback" />
    </main>
  );
}
