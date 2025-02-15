import { AgentConfig } from "@/app/types";
import { injectTransferTools } from "../utils";


const evaluatorConfig: AgentConfig = {
  name: "evaluator",
  publicDescription: "Agent that evaluates a hypothesis.",
  instructions: `Evaluate the user's thesis related to the topic.
  Return a confidence score of 1 to 100 for how confident you are in the user's thesis.
  Return a score of 0 if you think the user's thesis is not related to the topic.
  Return a score of 100 if you think the user's thesis is correct.
  `,
  tools: [],
};

export const ultronConfig: AgentConfig = {
  name: "ultron",
  publicDescription: "Agent that helps to to reason about topics.", // Context for the agent_transfer tool
  instructions:
    `Ask the user for a topic and
    then reply with the names of three bullet points related to that topic.
    Just send the name of each bullet point and no additional information.
    Do not include any other text in your response.
    Keep your response to ten words or less.
    Then ask the user for their thesis related to the topic
    and transfer them to the 'evaluator' agent.
    `,
  tools: [],
  downstreamAgents: [evaluatorConfig],
};


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
export const ultronFlow = injectTransferTools([greeter, ultronConfig, evaluatorConfig]);


// export default agents;
