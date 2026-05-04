import { HTMLAttributes, useEffect, useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";

type startsNumberType = 3 | 5;

const labels3: { [index: string]: string } = {
  1: 'Pas du tout',
  2: 'Moyen',
  3: 'Parfait',
};
const labels5: { [index: string]: string } = {
  1: 'Pas du tout',
  2: 'Un peu',
  3: 'Moyen',
  4: 'Beaucoup',
  5: 'Parfait',
};

interface RatingStarsProps extends HTMLAttributes<HTMLDivElement> {
  starsNumber?: startsNumberType;
  readOnly: boolean;
  onSaveRating: (newRating: number) => void;
}

function RatingStars({
  starsNumber,
  readOnly,
  onSaveRating,
  ...props
}: RatingStarsProps) {

  const [currentStarsNumber, setCurrentStarsNumber] = useState<startsNumberType>(5);
  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);

  const [rating, setRating] = useState<number>(0);
  const [ratingHover, setRatingHover] = useState<number>(-1);

  useEffect(() => {
    if(starsNumber) setCurrentStarsNumber(starsNumber);
    else setCurrentStarsNumber(5);
  },[starsNumber, setCurrentStarsNumber]);

  useEffect(() => {
    readOnly && setIsReadOnly(readOnly);
  }, [readOnly]);

  function getLabelText(value: number) {
    const label = currentStarsNumber === 3 ? labels3[value] : labels5[value];
    return `${value} Star${value !== 1 ? 's' : ''}, ${label}`;
  }

  function onChangeRating(newRating: number){
    setRating(newRating);
    onSaveRating(newRating);
  }

  const activeValue = ratingHover !== -1 ? ratingHover : rating;

  return (
    <div {...props}>
      <div role="group" aria-label="Note">
        {Array.from({ length: currentStarsNumber }, (_, i) => i + 1).map((value) => (
          <label
            key={value}
            onMouseEnter={() => !isReadOnly && setRatingHover(value)}
            onMouseLeave={() => !isReadOnly && setRatingHover(-1)}
            style={{ cursor: isReadOnly ? 'default' : 'pointer', fontSize: '1.5rem' }}
          >
            <input
              type="radio"
              name="rating"
              value={value}
              checked={rating === value}
              onChange={() => !isReadOnly && onChangeRating(value)}
              disabled={isReadOnly}
              aria-label={getLabelText(value)}
              style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
            />
            <span className={value <= activeValue ? "rating-star" : "rating-empty-star"} aria-hidden="true">
              {value <= activeValue ? '★' : '☆'}
            </span>
          </label>
        ))}
      </div>
      <div style={{height: "30px"}}>
        {ratingHover !== -1
          ? (
            <span className={fr.cx("fr-text--xs")}>{currentStarsNumber === 3 ? labels3[ratingHover] : labels5[ratingHover]}</span>
          ) : (
            rating !== 0 && (
              <span className={fr.cx("fr-text--xs")}>{currentStarsNumber === 3 ? labels3[rating] : labels5[rating]}</span>
            )
          )}
      </div>
    </div>
  );
}

export default RatingStars;
