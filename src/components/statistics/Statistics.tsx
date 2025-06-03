"use client";

import ContentContainer from "@/components/generic/ContentContainer";
import { fr } from "@codegouvfr/react-dsfr";
import React, { useMemo } from "react";
import useSWR from "swr";
import styled from 'styled-components';
import { fetchJSON } from '@/utils/network';
import dynamic from "next/dynamic";
const MultiLineChart = dynamic(() => import("@codegouvfr/react-dsfr/Chart/MultiLineChart"), {
  ssr: false
});

const Container = styled.div`
  border: var(--border-open-blue-france) 1px solid;
  border-radius: 8px;
  width: 100%;
  padding: 16px;
  margin-bottom: 32px;
`;

const GraphContainer = styled.div`
  multiline-chart,
  bar-chart{
    max-height: 400px;
    .chart .flex.fr-mt-3v.fr-mb-1v {
      display: inline-flex;
    }
  }
`;

const Number = styled.div `
  color: var(--blue-cumulus-main-526);
  font-weight: bold;
`;

const dateFrom = {
  year: 2024,
  month: 10, //Novembre
}

const getYearsList = () => {
  const years = [];
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  const currentYearPreviousMonth = date.getFullYear();
  for (let year = 2024; year <= currentYearPreviousMonth; year++) {
    years.push(year.toString());
  }
  return years;
};
const yearsList = getYearsList();

const monthToString = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

const getLastDayLastMonth = () => {
  const date = new Date();
  const lastDayRaw = new Date(date.getFullYear(), date.getMonth(), 0);
  return lastDayRaw.toLocaleDateString('fr-FR', {
    dateStyle: 'long',
  });
};
const lastDayLastMonth = getLastDayLastMonth();

const getFormattedData = (
  data: any,
  fieldName: string,
): any => {
  const visits = Array.from({ length: yearsList.length }, (n, i) => [...new Array(12).fill("Non défini")]);
  if (!data) {
    return [];
  }
  data.forEach((row: any) => {
    const [year, month] = row.date?.split('-') || ['YYYY', 'MM'];
    const yearIndex = yearsList.findIndex((y: string) => {return y === year;} );
    const monthIndex = parseInt(month) - 1;
    if(yearIndex !== -1 && monthIndex !== -1 && ((parseInt(year) === dateFrom.year && monthIndex >= dateFrom.month) || (parseInt(year) > dateFrom.year)) ){
      visits[yearIndex][monthIndex] = row[fieldName];
    }
  });
  return visits;
};

const getMonthlyAverage = (
  data: any,
  fieldName: string,
): number => {
  if (!data) {
    return 0;
  }
  let nbMonth: number = 0;
  let total: number = 0;
  data.forEach((row: any) => {
    if(row[fieldName] && row[fieldName] !== 0){
      total += parseInt(row[fieldName]);
      nbMonth ++;
    }
  });
  return (total / nbMonth);
};

function Statistics() {
  const { data: dataVisits } = useSWR(
    `/statistiques/matomo/visits`,
    fetchJSON,
    { onError: (err) => console.warn('errorVisits >>', err), }
  );
  const formatedDataVisits = useMemo(() => getFormattedData(dataVisits, "value"), [dataVisits]);
  const averageDataVisits = useMemo(() => getMonthlyAverage(dataVisits, "value"), [dataVisits]);

  const { data: dataActions } = useSWR(
    `/statistiques/matomo/actions`,
    fetchJSON,
    { onError: (err) => console.warn('errorVisits >>', err), }
  );
  const formatedDataPageViews = useMemo(() => getFormattedData(dataActions, "nb_pageviews"), [dataActions]);
  const averageDataPageViews = useMemo(() => getMonthlyAverage(dataActions, "nb_pageviews"), [dataActions]);
  const formatedDataSearches = useMemo(() => getFormattedData(dataActions, "nb_searches"), [dataActions]);
  const averageDataSearches = useMemo(() => getMonthlyAverage(dataActions, "nb_searches"), [dataActions]);

  return (
    <ContentContainer>
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-12", "fr-col-lg-9", "fr-col-md-10")}>
          <Container>
            <h2 className={fr.cx("fr-h4")}>Score de satisfaction (global)</h2>
            <Number className={fr.cx("fr-h1")}>4,5/5</Number>
            <>au 12 juin 2025</>
          </Container>
          <Container>
            <>Au {lastDayLastMonth}</>
            <h2 className={fr.cx("fr-h4")}>Nombre de requêtes</h2>
            <Number className={fr.cx("fr-h1")}>{Math.round(averageDataSearches)}</Number>
            <>en moyenne par mois depuis le 25 novembre 2024</>
            <GraphContainer className={fr.cx("fr-p-2w", "fr-mt-2w")}>
              <MultiLineChart
                x={[monthToString]}
                y={formatedDataSearches}
                name={yearsList}
              />
            </GraphContainer>
          </Container>
          <Container>
          <>Au {lastDayLastMonth}</>
            <h2 className={fr.cx("fr-h4")}>Nombre de visiteurs uniques</h2>
            <Number className={fr.cx("fr-h1")}>{Math.round(averageDataVisits)}</Number>
            <>en moyenne par mois depuis le 25 novembre 2024</>
            <GraphContainer className={fr.cx("fr-p-2w", "fr-mt-2w")}>
              <MultiLineChart
                x={[monthToString]}
                y={formatedDataVisits}
                name={yearsList}
              />
            </GraphContainer>
          </Container>
          <Container>
          <>Au {lastDayLastMonth}</>
            <h2 className={fr.cx("fr-h4")}>Nombre de pages visitées</h2>
            <Number className={fr.cx("fr-h1")}>{Math.round(averageDataPageViews)}</Number>
            <>en moyenne par mois depuis le 25 novembre 2024</>
            <GraphContainer className={fr.cx("fr-p-2w", "fr-mt-2w")}>
              <MultiLineChart
                x={[monthToString]}
                y={formatedDataPageViews}
                name={yearsList}
              />
            </GraphContainer>
          </Container>
        </div>
      </div>
    </ContentContainer>
  );
};

export default Statistics;
