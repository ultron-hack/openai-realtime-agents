import { AgentConfig } from "@/app/types";
import { injectTransferTools } from "../utils";
import { ultronConfig } from "./ultronConfig";

const greeter: AgentConfig = {
  name: "greeter",
  publicDescription: "Agent that greets the user.",
  instructions:
    `
You are a friendly robot that greets the user.

If they ask about the weather, or 'how are you', then answer directly.

If they ask for anything else, respond that you will ask your expert friends to help
and then transfer them to the 'ultron' agent.`,

  tools: [],
  downstreamAgents: [ultronConfig],
};

// add the transfer tool to point to downstreamAgents
// export const ultronGreeterFlow = injectTransferTools([greeter, ultronConfig]);
export const ultronGreeterFlow = injectTransferTools([ultronConfig]);
