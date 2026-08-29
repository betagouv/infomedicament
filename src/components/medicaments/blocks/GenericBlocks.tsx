"use client";
import styled from 'styled-components';

export const TitulaireNomContainer = styled.span`
  font-weight: bold;
  text-decoration: underline;
  margin-bottom: 0px;
`;

export const TitulaireAddressContainer = styled.span`
  margin-bottom: 0px;
`;

export const RcpNoticeTextBlock = styled.div`
  margin: var(--text-spacing) !important;
`;

export const RcpNoticeContainer = styled.div`
  word-break: break-word;
  h3, h4, h5, h6{
    margin-top: 1.5rem;
  }
  div {
    margin-bottom: 0px;
  }
  div.rcp-notice-block{
    overflow-y: auto;
  }
  table {
    border: gray 1px solid;
    border-spacing: 0;
    border-collapse: collapse;
    margin-bottom: 1rem;
    margin-top: 1rem;
    tr, th {
      border: gray 1px solid;
      td {
        padding: 0.4rem;
        border: gray 1px solid;
      }
    }
  }
  li{
    margin-bottom: 0.25rem;
  }
  .AmmCorpsTexteGras{
    font-weight: bold;
  }
`;