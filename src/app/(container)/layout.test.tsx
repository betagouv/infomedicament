import {
  Children,
  isValidElement,
  Suspense,
  type ReactElement,
  type ReactNode,
} from "react";
import { beforeEach, expect, it, vi } from "vitest";
import ContainerLayout from "./layout";
import GreetingModal from "@/components/GreetingModal";
import { getNoticeRcpLastUpdated } from "@/db/utils/specialities";

vi.mock("@/db/utils/specialities", () => ({
  getNoticeRcpLastUpdated: vi.fn(),
}));
vi.mock("@/components/InfoMedicamentHeader", () => ({ default: () => null }));
vi.mock("@/components/GreetingModal", () => ({ default: () => null }));

beforeEach(() => vi.clearAllMocks());

function suspenseBoundaries(
  node: ReactNode,
): ReactElement<{ children: ReactElement; fallback: ReactNode }>[] {
  if (!isValidElement<{ children?: ReactNode }>(node)) return [];
  return [
    ...(node.type === Suspense
      ? [node as ReactElement<{ children: ReactElement; fallback: ReactNode }>]
      : []),
    ...Children.toArray(node.props.children).flatMap(suspenseBoundaries),
  ];
}

it("renders the shared layout without waiting for the welcome modal's database lookup", async () => {
  vi.mocked(getNoticeRcpLastUpdated).mockImplementation(
    () => new Promise(() => {}),
  );
  const shell = ContainerLayout({ children: <p>Search form</p> });
  expect(isValidElement(shell)).toBe(true);
  expect(getNoticeRcpLastUpdated).not.toHaveBeenCalled();
});

it("loads the welcome modal date inside its own Suspense boundary", async () => {
  const date = new Date("2026-09-01T00:00:00Z");
  vi.mocked(getNoticeRcpLastUpdated).mockResolvedValue(date);
  const shell = ContainerLayout({ children: <p>Search form</p> });
  const boundary = suspenseBoundaries(shell as ReactNode).find(
    (node) =>
      typeof node.props.children.type === "function" &&
      node.props.children.type.name === "GreetingWithData",
  );
  expect(boundary).toBeDefined();
  expect(boundary!.props.fallback).toBeNull();
  const loadGreeting = boundary!.props.children.type as () => Promise<
    ReactElement<{ dataLastUpdated: Date | null }>
  >;
  const greeting = await loadGreeting();
  expect(greeting.type).toBe(GreetingModal);
  expect(greeting.props.dataLastUpdated).toBe(date);
});
