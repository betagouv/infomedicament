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
  count: number;
}
 
function SearchFilterLabel({
  name,
  count
}: SearchFilterLabelProps) {

  return (
  <LabelContainer>
    <span>{name}</span>
    <span>({count})</span>
  </LabelContainer>
  )
};
export default SearchFilterLabel;
