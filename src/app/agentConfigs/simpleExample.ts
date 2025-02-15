import { AgentConfig } from "@/app/types";
import { injectTransferTools } from "./utils";
import { ultronConfig } from "./ultronAgent/ultronSimple";

const greeter: AgentConfig = {
  name: "greeter",
  publicDescription: "Agent that greets the user.",
  instructions:
    `Greet the user explain that you can help them to research a topic.
    Then transfer them to the 'ultron' agent.`,
  tools: [],
  downstreamAgents: [ultronConfig],
};

// add the transfer tool to point to downstreamAgents
const agents = injectTransferTools([greeter, ultronConfig]);

export default agents;
