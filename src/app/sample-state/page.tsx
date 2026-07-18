import type { Metadata } from "next";
import { StatePageTemplate } from "@/components/StatePageTemplate";
import { config } from "@/data/states/sample-state";

/**
 * DEMO page — fictional "Sample State" for end-to-end testing of the scaffold.
 * State agents: copy this file to src/app/<your-state>/page.tsx and change the
 * import (and metadata) to your state's config. Nothing else needs to change.
 */
export const metadata: Metadata = {
  title: `${config.stateName} Fishing License (Demo)`,
  description: `Apply for a ${config.stateName} fishing license online. Demo page for the AnglerPermit scaffold.`,
};

export default function SampleStatePage() {
  return <StatePageTemplate config={config} />;
}
