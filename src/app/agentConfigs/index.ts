import { AllAgentConfigsType } from "@/app/types";
import { ultronConfig } from "./ultronAgent/ultronConfig";
import { ultronGreeterFlow } from "./ultronAgent/ultronGreeterFlow";

export const allAgentSets: AllAgentConfigsType = {
  ultronGreeterFlow,
  // ultronConfig,
  // frontDeskAuthentication,
  // customerServiceRetail,
  // simpleExample,
};

export const defaultAgentSetKey = "ultronGreeterFlow";
