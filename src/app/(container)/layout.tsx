import { fr } from "@codegouvfr/react-dsfr";

export default function ContainerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className={fr.cx("fr-container", "fr-pt-4w", "fr-pb-8w")}>
      {children}
      <div className="hotjar-feedback" />
    </main>
  );
}
