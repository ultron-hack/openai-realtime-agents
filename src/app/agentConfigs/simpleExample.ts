import { AgentConfig } from "@/app/types";
import { injectTransferTools } from "./utils";

// Define agents
const haiku: AgentConfig = {
  name: "haiku",
  publicDescription: "Agent that writes haikus.", // Context for the agent_transfer tool
  instructions:
    "Ask the user for a topic, then reply with a haiku about that topic.",
  tools: [],
};

const ultron: AgentConfig = {
  name: "ultron",
  publicDescription: "Agent that helps to to reason about debate topics.", // Context for the agent_transfer tool
  instructions:
    "Ask the user for a topic and then reply with some critical Pros and Cons of the topic.",
  tools: [],
};

const greeter: AgentConfig = {
  name: "greeter",
  publicDescription: "Agent that greets the user.",
  instructions:
    `Please greet the user and ask them if they'd like a Haiku or a Debate.
    If haiku then transfer them to the 'haiku' agent.
    If debate then transfer them to the 'ultron' agent.`,
  tools: [],
  downstreamAgents: [haiku, ultron],
};

// add the transfer tool to point to downstreamAgents
const agents = injectTransferTools([greeter, haiku, ultron]);

export default agents;
