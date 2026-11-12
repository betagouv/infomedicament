"use client";

import { HTMLAttributes, useEffect, useEffectEvent } from "react";
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
    max-width: 490px;
    width: 490px;
    @media (max-width: 48em) {
      max-width: 100% !important;
      width: 100% !important;

    }
  }
`;

interface RatingToasterProps extends HTMLAttributes<HTMLDivElement> {
  pageId: string;
}

function RatingToaster({
  pageId,
  ...props
}: RatingToasterProps) {

  const { isDark } = useIsDark();
  const showRating = useEffectEvent((toastId: string) => {
    toast(<RatingPage pageId={pageId} />, {
      toastId,
      theme: isDark ? "dark" : "light",
    });
  });

  useEffect(() => {
    const toastId = `rating:${pageId}`;
    const timeout = window.setTimeout(() => showRating(toastId), 10000);
    return () => {
      window.clearTimeout(timeout);
      toast.dismiss(toastId);
    };
  }, [pageId]);

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
