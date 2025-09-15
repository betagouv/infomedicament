import { HTMLAttributes, useEffect, useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { AdvancedRating } from "@/types/RatingTypes";

const question1Options: string[] = [
  'Oui, immédiatement et clairement',
  'Oui, mais après quelques recherches',
  'Non, pas vraiment',
  'Non, pas du tout',
];
const question2Options: string[] = [
  'Mieux informé·e et rassuré·e',
  'J\'ai encore des doutes',
  'Pas plus avancé·e',
  'Je ne sais pas encore',
];

interface RatingAdvancedProps extends HTMLAttributes<HTMLDivElement> {
  onSaveAdvancedRating: (advancedRating: AdvancedRating) => void;
  readOnly: boolean;
}

function RatingAdvanced({
  onSaveAdvancedRating,
  readOnly,
  ...props
}: RatingAdvancedProps) {
  const [question1, setQuestion1] = useState<string>("");
  const [question2, setQuestion2] = useState<string>("");

  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);

  useEffect(() => {
    readOnly && setIsReadOnly(readOnly);
  }, [readOnly])

  function onClickSave(){
    const newRating:AdvancedRating = {
      question1: question1,
      question2: question2,
    }
    onSaveAdvancedRating(newRating);
  }

  return (
    <div style={{width: "100%"}}>
      <div className={fr.cx("fr-mb-2w")}>
        <span className={fr.cx("fr-text--lg")}><b>Vos remarques pour améliorer la page</b></span>
      </div>
      <div>
        <RadioButtons 
            legend="Avez-vous trouvé l’information que vous cherchiez ?" 
            small
            options={question1Options.map((option: string) => ({
              label: option,
              nativeInputProps: {
                  checked: question1 === option,
                  onChange: ()=> setQuestion1(option)
              }
            }))
          }
        />
      </div>
      <div>
        <RadioButtons 
            legend="Après votre visite sur InfoMédicament, vous vous sentez :"
            small 
            options={question2Options.map((option: string) => ({
              label: option,
              nativeInputProps: {
                  checked: question2 === option,
                  onChange: ()=> setQuestion2(option)
              }
            }))
          }
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