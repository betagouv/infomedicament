"use client";

import { HTMLAttributes, useEffect, useState } from "react";
import { ToastContainer, toast } from 'react-toastify';
import RatingPage from "./RatingPage";
import styled from 'styled-components';

const RatingToasterContainer = styled.div`
  .Toastify .Toastify__toast{
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

  const [isOpen, setIsOpen] = useState<boolean>(false);

  useEffect(() => {
    if(!isOpen){
      toast(<RatingPage pageId={pageId} />, {
        delay: 1000,
        style: {width: "490px"},
      });
      setIsOpen(true);
    };
  }, [isOpen, setIsOpen]);

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
