import { AllAgentConfigsType } from "@/app/types";
import frontDeskAuthentication from "./frontDeskAuthentication";
import customerServiceRetail from "./customerServiceRetail";
import simpleExample from "./simpleExample";

import { ultronFlow } from "./ultronAgent/ultronSimple";

export const allAgentSets: AllAgentConfigsType = {
  ultronFlow,
  // frontDeskAuthentication,
  // customerServiceRetail,
  // simpleExample,
};

export const defaultAgentSetKey = "ultronFlow";
