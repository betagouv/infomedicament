"use client";

import { HTMLAttributes, useCallback, useEffect, useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import styled from 'styled-components';
import axios from "axios";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Link from "next/link";
import RatingStars from "./RatingStars";
import RatingAdvanced from "./RatingAdvanced";
import { AdvancedRating, SimpleRating } from "@/types/RatingTypes";

const RatingPageContainer = styled.div`
  width: 100%;

  .rating-empty-star{
    font-size: 3rem;
    color: #faaf00;
  }
  .rating-star{
    font-size: 3rem;
  }
`;

const GlobalRatingContainer = styled.div`
  text-align: center;
  display: flex;
  flex-direction: column;
`;

const AlertContainer = styled.div`
  display: flex;
  justify-content: center;
  .fr-alert{
    width: 400px;
    max-width: 80%;
  }
`;

const RatingAdvancedContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;

  .fr-fieldset__legend {
    font-weight: bold !important;
  }
  .fr-fieldset__content label{
    font-size: 0.875rem;
  }
`;

interface RatingPageProps extends HTMLAttributes<HTMLDivElement> {
  pageId: string;
}

function RatingPage({
  pageId,
  ...props
}: RatingPageProps) {

  const [ratingError, setRatingError] = useState<boolean>(false);
  const [dbRatingId, setDbRatingId] = useState<number>(-1);
  const [ratingReadOnly, setRatingReadOnly] = useState<boolean>(false);

  const [isAdvanced, setIsAdvanced] = useState<boolean>(false);
  const [advancedRatingSuccess, setAdvancedRatingSuccess] = useState<boolean>(false);
  const [advancedRatingError, setAdvancedRatingError] = useState<boolean>(false);

  const addRating = useCallback(
    async (rating: number) => {
      const simpleRating: SimpleRating = {
        rating: rating,
        pageId: pageId,
      }
      try {
        const result = await axios.post(
          '/rating', 
          simpleRating,
        );
        if (result && result.status === 200 && result.data !== -1) {
          setDbRatingId(result.data);
          setRatingError(false);
        } else {
          setRatingError(true);
          setRatingReadOnly(false);
        }
      } catch(e) {
        setRatingError(true);
        setRatingReadOnly(false);
      }
    },
    [setDbRatingId, setRatingError]
  );

  function onSaveRating(rating: number): void{
    setRatingReadOnly(true);
    addRating(rating);
  }

  const updateRating = useCallback(
    async (advancedRating: AdvancedRating) => {
      const data = {
        advancedRating: advancedRating,
        id: dbRatingId,
      }
      try {
        const result = await axios.patch(
          '/rating', 
          data,
        );
        if (result && result.status === 200 && result.data === true) {
          setAdvancedRatingSuccess(true);
          setAdvancedRatingError(false);
        } else {
          setAdvancedRatingSuccess(false);
          setAdvancedRatingError(true);
        }
      } catch(e) {
        setAdvancedRatingSuccess(false);
        setAdvancedRatingError(true);
      }
    },
    [dbRatingId]
  );

  function onSaveAdvancedRating(advancedRating: AdvancedRating): void{
    updateRating(advancedRating);
  }

  return (
    <RatingPageContainer className={fr.cx("fr-mb-2w")}>
      <GlobalRatingContainer>
        <div className={fr.cx("fr-mb-2w")}>
          <span className={fr.cx("fr-text--lg")}><b>Cette page vous a-t-elle été utile ?</b></span>
        </div>
        <RatingStars 
          className={fr.cx("fr-mb-2w")} 
          onSaveRating={onSaveRating}
          readOnly={ratingReadOnly}
        />
        {(dbRatingId !== -1 && !ratingError) && (
          <>
            <AlertContainer className={fr.cx("fr-mb-6w")}>
              <Alert
                description="Merci pour votre avis"
                severity="success"
                title=""
              />
            </AlertContainer>
            {!isAdvanced && (
              <Link
                href=""
                onClick={() => setIsAdvanced(true)}
                className={fr.cx(
                  "fr-link",
                  "fr-link--icon-left",
                  "fr-icon-arrow-right-line",
                )}
              >
                Je fais une remarque sur cette page
              </Link>
            )}
          </>
        )}
        {ratingError && (
          <AlertContainer className={fr.cx("fr-mt-2w")}>
            <Alert
              description="Votre réponse n'a pas pu être enregistrée, merci de ré-essayer."
              severity="error"
              title=""
            />
          </AlertContainer>
        )}
      </GlobalRatingContainer>
      {isAdvanced && (
        <RatingAdvancedContainer>
          <RatingAdvanced 
            onSaveAdvancedRating={onSaveAdvancedRating}
            readOnly={advancedRatingSuccess && !advancedRatingError}
          />
          {(advancedRatingSuccess && !advancedRatingError) && (
            <AlertContainer className={fr.cx("fr-mt-2w")}>
              <Alert
                description="Merci pour vos remarques"
                severity="success"
                title=""
              />
            </AlertContainer>
          )}
          {(!advancedRatingSuccess && advancedRatingError) && (
            <AlertContainer className={fr.cx("fr-mt-2w")}>
              <Alert
                description="Votre réponse n'a pas pu être enregistrée, merci de ré-essayer."
                severity="error"
                title=""
              />
            </AlertContainer>
          )}
        </RatingAdvancedContainer>
      )}
    </RatingPageContainer>
  );
};

export default RatingPage;
