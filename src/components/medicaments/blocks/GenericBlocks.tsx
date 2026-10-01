"use client";
import styled from 'styled-components';

export const RcpNoticeHtmlContainer = styled.div.attrs({
  className: "rcp-notice-html-content",
})`
  word-break: break-word;

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

  &.document-html--definitions [data-definition] {
    background-image: var(--underline-img), var(--underline-img);
    background-position: var(--underline-x) 100%, var(--underline-x) calc(100% - var(--underline-thickness));
    background-repeat: no-repeat, no-repeat;
    background-size: var(--underline-hover-width) calc(var(--underline-thickness) * 2), var(--underline-idle-width) var(--underline-thickness);
    cursor: pointer;
    transition: background-size 0s;
  }

  &.document-html--definitions [data-definition]:hover,
  &.document-html--definitions [data-definition]:active {
    --underline-hover-width: var(--underline-max-width);
  }

  &.document-html--definitions [data-definition]:focus-visible {
    border-radius: 2px;
    outline: 2px solid var(--border-action-high-blue-france);
    outline-offset: 2px;
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
