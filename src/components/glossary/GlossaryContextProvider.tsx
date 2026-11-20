"use client";

import {
  createContext,
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Definition } from "@/types/GlossaireTypes";
import DefinitionModal from "./DefinitionModal";

export const GlossaryContext = createContext<{
  openDefinition: (definition: Definition, trigger: HTMLElement) => void;
}>({ openDefinition: () => {} });

export default function GlossaryContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [selection, setSelection] = useState<{ definition: Definition }>();
  const triggerRef = useRef<HTMLElement | null>(null);
  const openDefinition = useCallback(
    (definition: Definition, trigger: HTMLElement) => {
      triggerRef.current = trigger;
      setSelection({ definition });
    },
    [],
  );
  const onClose = useCallback(() => {
    // Keep the last content mounted while DSFR fades the dialog out.
    if (triggerRef.current?.isConnected) triggerRef.current.focus();
    triggerRef.current = null;
  }, []);
  const value = useMemo(() => ({ openDefinition }), [openDefinition]);

  return (
    <GlossaryContext.Provider value={value}>
      {children}
      <DefinitionModal selection={selection} onClose={onClose} />
    </GlossaryContext.Provider>
  );
}
