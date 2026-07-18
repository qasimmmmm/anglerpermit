import type { Metadata } from "next";
import { StatePageTemplate } from "@/components/StatePageTemplate";
import { config } from "@/data/states/south-carolina";

export const metadata: Metadata = {
  title: `${config.stateName} Fishing License`,
  description: `Apply for a ${config.stateName} fishing license online with AnglerPermit — we purchase it for you from the official ${config.officialAgencyName} portal.`,
};

export default function Page() {
  return <StatePageTemplate config={config} />;
}
