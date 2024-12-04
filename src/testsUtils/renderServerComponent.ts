// from https://gist.github.com/sroebert/a04ca6e0232a4a60bc50d7f164f101f6
import type { ReactElement, ReactNode } from "react";
import React, { Children, cloneElement, isValidElement } from "react";
import { render } from "@testing-library/react";

function setFakeReactDispatcher<T>(action: () => T): T {
  /**
   * We use some internals from React to avoid a lot of warnings in our tests when faking
   * to render server components. If the structure of React changes, this function should still work,
   * but the tests will again print warnings.
   *
   * If this is the case, this function can also simply be removed and all tests should still function.
   */

  if (!("__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED" in React)) {
    return action();
  }

  const secret = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
  if (
    !secret ||
    typeof secret !== "object" ||
    !("ReactCurrentDispatcher" in secret)
  ) {
    return action();
  }

  const currentDispatcher = secret.ReactCurrentDispatcher;
  if (
    !currentDispatcher ||
    typeof currentDispatcher !== "object" ||
    !("current" in currentDispatcher)
  ) {
    return action();
  }

  const previousDispatcher = currentDispatcher.current;
  try {
    currentDispatcher.current = new Proxy(
      {},
      {
        get() {
          throw new Error("This is a client component");
        },
      },
    );
  } catch {
    return action();
  }

  const result = action();

  currentDispatcher.current = previousDispatcher;

  return result;
}

async function evaluateServerComponent(
  node: ReactElement,
): Promise<ReactElement<any>> {
  if (node && node.type?.constructor?.name === "AsyncFunction") {
    // Handle async server nodes by calling await.

    // @ts-expect-error
    const evaluatedNode: ReactElement = await node.type({ ...node.props });
    return evaluateServerComponent(evaluatedNode);
  }

  if (node && node.type?.constructor?.name === "Function") {
    try {
      return setFakeReactDispatcher(() => {
        // @ts-expect-error
        const evaluatedNode: ReactElement = node.type({ ...node.props });
        return evaluateServerComponent(evaluatedNode);
      });
    } catch {
      // If evaluating fails with a function node, it might be because of using client side hooks.
      // In that case, simply return the node, it will be handled by the react testing library render function.
      return node;
    }
  }

  return node;
}

async function evaluateServerComponentAndChildren(node: ReactElement) {
  const evaluatedNode = await evaluateServerComponent(node);

  if (!evaluatedNode?.props.children) {
    return evaluatedNode;
  }

  const children = Children.toArray(evaluatedNode.props.children);
  for (let i = 0; i < children.length; i += 1) {
    const child = children[i];
    if (!isValidElement(child)) {
      continue;
    }

    children[i] = await evaluateServerComponentAndChildren(child);
  }

  return cloneElement(evaluatedNode, {}, ...children);
}

// Follow <https://github.com/testing-library/react-testing-library/issues/1209>
// for the latest updates on React Testing Library support for React Server
// Components (RSC)
export async function renderServerComponent(
  nodeOrPromise: ReactNode | Promise<ReactNode>,
) {
  const node = await nodeOrPromise;

  if (isValidElement(node)) {
    const evaluatedNode = await evaluateServerComponentAndChildren(node);
    return render(evaluatedNode);
  }

  return render(node);
}
