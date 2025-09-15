import { NextRequest, NextResponse } from "next/server";
import { SimpleRating } from "@/types/RatingTypes";
import axios from "axios";

export async function POST(req: NextRequest) {
  try {
    const data: SimpleRating = await req.json();
    const gristData = {
      "records": [
        {
          "fields": {
            "Identifiant_de_la_page": data.pageId,
            "Note_globale": data.rating,
          }
        },
      ]
    };

    const result = await axios.post(    
      `https://grist.numerique.gouv.fr/api/docs/${process.env.GRIST_DOC_ID}/tables/Avis/records`, 
      gristData,
      {
        headers: {
          "Authorization": `Bearer ${process.env.GRIST_API_KEY}`,
          Accept: "application/json",
        },
      },
    );

    const id: number = (result.data.records && result.data.records.length > 0 && result.data.records[0] && result.data.records[0].id !== undefined) ? result.data.records[0].id : -1;
    return NextResponse.json(id);
  } catch(e) {
    return NextResponse.json(
      { error: "Impossible de sauvegarder" },
      { status: 500 },
    );
  }
};

export async function PATCH(req: NextRequest) {
  try {
    const data = await req.json();
    const gristData = {
      "records": [
        {
          "id": data.id,
          "fields": {
            "Question_1": data.advancedRating.question1,
            "Question_2": data.advancedRating.question2,
          }
        },
      ]
    };
    console.log(gristData);

    const result = await axios.patch(    
      `https://grist.numerique.gouv.fr/api/docs/${process.env.GRIST_DOC_ID}/tables/Avis/records`, 
      gristData,
      {
        headers: {
          "Authorization": `Bearer ${process.env.GRIST_API_KEY}`,
          Accept: "application/json",
        },
      },
    );

    const success: boolean = result.statusText === "OK" ? true : false;
    return NextResponse.json(success);
  } catch(e) {
    return NextResponse.json(
      { error: "Impossible de sauvegarder" },
      { status: 500 },
    );
  }
};
