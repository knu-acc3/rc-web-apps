"use client";

import NextLink from "next/link";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useContext, type ComponentProps, type FocusEvent, type MouseEvent } from "react";

/**
 * next/link without viewport prefetching: pages list hundreds of links, and prefetching every
 * visible one costs megabytes. The target is prefetched on hover or keyboard focus instead.
 */
export default function Link({ onMouseEnter, onFocus, prefetch, ...props }: ComponentProps<typeof NextLink>) {
  // The router context is null outside the app router (e.g. a component rendered alone in a test).
  const router = useContext(AppRouterContext);
  const warm = () => {
    if (router && typeof props.href === "string") router.prefetch(props.href);
  };
  return (
    <NextLink
      {...props}
      prefetch={prefetch ?? false}
      onMouseEnter={(e: MouseEvent<HTMLAnchorElement>) => {
        warm();
        onMouseEnter?.(e);
      }}
      onFocus={(e: FocusEvent<HTMLAnchorElement>) => {
        warm();
        onFocus?.(e);
      }}
    />
  );
}
