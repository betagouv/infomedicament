import { fr } from "@codegouvfr/react-dsfr";
import ContentContainer from "./ContentContainer";
import styles from "./PageLoadingFallback.module.css";

export default function PageLoadingFallback() {
  return (
    <ContentContainer>
      <div className={styles.skeleton} role="status" aria-live="polite">
        <span className={fr.cx("fr-sr-only")}>Chargement de la page…</span>
        <div className={styles.lines} aria-hidden="true">
          <div className={`${styles.line} ${styles.heading}`} />
          <div className={styles.line} />
          <div className={styles.line} />
          <div className={styles.line} />
          <div className={`${styles.line} ${styles.short}`} />
        </div>
      </div>
    </ContentContainer>
  );
}
