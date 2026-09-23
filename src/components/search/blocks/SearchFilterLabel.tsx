"use client";
 
import { HTMLAttributes } from "react";
import styled from "styled-components";

const LabelContainer = styled.div`
  display: inline-flex;
  justify-content: space-between;
  width: 100%;
`;

interface SearchFilterLabelProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  secondaryName?: string;
  count: number;
}

function SearchFilterLabel({
  name,
  secondaryName,
  count
}: SearchFilterLabelProps) {

  return (
  <LabelContainer>
    <span>
      {name}
      {secondaryName && <em>{' '}({secondaryName})</em>}
    </span>
    <span>({count})</span>
  </LabelContainer>
  )
};
export default SearchFilterLabel;
