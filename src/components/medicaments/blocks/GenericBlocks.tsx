"use client";
import styled from 'styled-components';

export const TitulaireNomContainer = styled.p`
  font-weight: bold;
  text-decoration: underline;
  margin-bottom: 0px;
`;

export const TitulaireAddressContainer = styled.p`
  margin-bottom: 0px;
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
`;

/**
 * Styles semantic HTML produced by the new RCP/notice parsers like the
 * elements emitted by the legacy renderer in utils/notices.tsx.
 */
export const RcpNoticeHtmlContainer = styled(RcpNoticeContainer).attrs({
  className: "rcp-notice-html-content",
})`
  /* Document title: visually one level above the main sections. */
  h1 {
    color: var(--text-title-grey);
    font-size: 1.375rem !important;
    font-weight: 700 !important;
    line-height: 1.75rem !important;
    margin: 1.5rem 0;
  }

  /* Main sections previously rendered as h3.fr-h5. */
  h2 {
    color: var(--text-title-grey);
    font-size: 1.25rem !important;
    font-weight: 700 !important;
    line-height: 1.75rem !important;
    margin: 1.5rem 0;
  }

  /* Subsections previously rendered with the fr-h6 typography. */
  h3,
  h4,
  h5,
  h6 {
    color: var(--text-title-grey);
    font-size: 1.125rem !important;
    font-weight: 700 !important;
    line-height: 1.5rem !important;
    margin: 1.5rem 0;
  }

  p {
    margin-bottom: 1rem;
  }

  ul,
  ol {
    margin-left: 1rem;
  }

  li {
    margin-bottom: 0.5rem;
  }

  [data-document-role="holder-name"] {
    font-weight: bold;
    margin-bottom: 0;
    text-decoration: underline;
  }

  [data-document-role="holder-address"] {
    margin-bottom: 0;
  }

  [data-document-role="composition"] {
    display: block;
    font-size: 1rem;
    line-height: 1.5rem;
  }

  img {
    height: auto;
    max-width: 100%;
  }

  @media (min-width: 48em) {
    h1 {
      font-size: 1.5rem !important;
      line-height: 2rem !important;
    }

    h2 {
      font-size: 1.375rem !important;
      line-height: 1.75rem !important;
    }

    h3,
    h4,
    h5,
    h6 {
      font-size: 1.25rem !important;
      line-height: 1.75rem !important;
    }
  }
`;
