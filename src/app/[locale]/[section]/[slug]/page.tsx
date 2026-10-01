import { RoutePage, routeMetadata, staticParams, type RouteParams } from "@/site/route";

export const dynamicParams = true;
export const revalidate = false;

export function generateStaticParams() {
  return staticParams(2);
}

export function generateMetadata({ params }: { params: RouteParams }) {
  return routeMetadata(params);
}

export default RoutePage;
