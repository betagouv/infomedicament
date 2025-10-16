"use client";

import { HTMLAttributes, useEffect, useState } from "react";
import { ToastContainer, toast } from 'react-toastify';
import RatingPage from "./RatingPage";
import styled from 'styled-components';
import { useIsDark } from "@codegouvfr/react-dsfr/useIsDark";

const RatingToasterContainer = styled.div<{ $isDark?: boolean }>`
  .Toastify__toast-container .Toastify__toast--default,
  .Toastify__toast-container .Toastify__toast-theme--dark,
  .Toastify__toast-container .Toastify__toast-theme--light {
    color: var(--text-default-grey);
    font-family: inherit;
    max-height: 100%;
  }
`;

interface RatingToasterProps extends HTMLAttributes<HTMLDivElement> {
  pageId: string;
}

function RatingToaster({
  pageId,
  ...props
}: RatingToasterProps) {

  const [readyToOpen, setReadyToOpen] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const { isDark } = useIsDark();

  //Hack for setting dark mode
  useEffect(() => {
    if(readyToOpen && !isOpen) {
      setIsOpen(true);
      const theme = isDark ? "dark" : "light";
      toast(<RatingPage pageId={pageId} />, {
        delay: 2000,
        style: {width: "490px"},
        theme: theme,
      });
    }
  }, [pageId, readyToOpen, isDark, isOpen, setIsOpen])

  useEffect(() => {
    if(!readyToOpen){
      setReadyToOpen(true);
    };
  }, [readyToOpen, setReadyToOpen]);

  return (
    <RatingToasterContainer>
      <ToastContainer
        position="bottom-right"
        autoClose={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss={false}
        draggable={false}
      />
    </RatingToasterContainer>
  );
};

export default RatingToaster;
