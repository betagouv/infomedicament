import { HTMLAttributes, useEffect, useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import RatingStars from "./RatingStars";
import Button from "@codegouvfr/react-dsfr/Button";
import { AdvancedRating } from "@/types/RatingTypes";

interface RatingAdvancedProps extends HTMLAttributes<HTMLDivElement> {
  onSaveAdvancedRating: (advancedRating: AdvancedRating) => void;
  readOnly: boolean;
}

function RatingAdvanced({
  onSaveAdvancedRating,
  readOnly,
  ...props
}: RatingAdvancedProps) {
  const [ratingQ1, setRatingQ1] = useState<number>(0);
  const [ratingQ2, setRatingQ2] = useState<number>(0);

  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);

  useEffect(() => {
    readOnly && setIsReadOnly(readOnly);
  }, [readOnly])

  function onSaveRatingQ1(newRating: number): void{
    setRatingQ1(newRating);
  }
  function onSaveRatingQ2(newRating: number): void{
    setRatingQ2(newRating);
  }

  function onClickSave(){
    const newRating:AdvancedRating = {
      question1: ratingQ1,
      question2: ratingQ2,
    }
    onSaveAdvancedRating(newRating);
  }

  return (
    <div>
      <div className={fr.cx("fr-mb-2w")}>
        <span className={fr.cx("fr-text--lg")}><b>Vos remarques pour améliorer la page</b></span>
      </div>
      <div>
        <span className={fr.cx("fr-text--md")}><b>La page est-elle facile à comprendre ?</b></span>
        <RatingStars 
          starsNumber={3}
          onSaveRating={onSaveRatingQ1}
          readOnly={isReadOnly}
        />
      </div>
      <div>
        <span className={fr.cx("fr-text--md")}><b>L'information a-t-elle été utile ?</b></span>
        <RatingStars 
          starsNumber={3}
          readOnly={isReadOnly}
          onSaveRating={onSaveRatingQ2}
        />
      </div>
      {!isReadOnly && (
        <div>
          <Button onClick={onClickSave} >
            Envoyer vos remarques
          </Button>
        </div>
      )}
    </div>
  )  
};

export default RatingAdvanced;