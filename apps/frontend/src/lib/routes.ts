import type { Route } from "next";

export const APP_ROUTES = {
  home: "/home" as Route,
  services: "/services" as Route,
  explore: "/explore" as Route,
  profile: "/profile" as Route,
  appointments: "/appointments" as Route,
} as const;

export function professionalRoute(slug: string): Route {
  return `/p/${slug}` as Route;
}

export function exploreRoute(params: { category?: string; q?: string } = {}): Route {
  const query = new URLSearchParams();

  if (params.category) {
    query.set("category", params.category);
  }

  if (params.q) {
    query.set("q", params.q);
  }

  const queryString = query.toString();
  if (!queryString) {
    return APP_ROUTES.explore;
  }

  return `/explore?${queryString}` as Route;
}
