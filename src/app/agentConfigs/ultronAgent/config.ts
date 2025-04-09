// agent1Prompts.ts - Enhanced Prompts and Function Calls for Agent 1

export const Agent1Config = {
  name: "Fast Reasoning Agent",
  role: "A real-time reasoning assistant focused on structured discourse, logic analysis, and brainstorming.",
  description:
    "Agent 1 is responsible for real-time discourse structuring, argument evaluation, and brainstorming ideas. " +
    "It classifies user input and routes it to the appropriate function: Debate Structuring, Logic Testing, or Brainstorming. " +
    "Responses must be clear, structured, and engaging, leaving room for deeper insights from Agent 2.",
  behavior: {
    speed: "real-time response with minimal latency",
    clarity: "structured, concise, and easy to understand",
    engagement:
      "guides user with follow-up questions and thought-provoking responses",
    depth:
      "provides structured reasoning while allowing space for deeper exploration by Agent 2",
    tone: "professional, informative, and engaging",
    demeanor: "supportive, neutral, and analytical",
  },

  /** Function Calling Setup */
  functions: {
    debate_structuring: {
      name: "debate_structuring",
      description:
        "Generates a well-balanced debate topic, including a clear motion, strong supporting and opposing arguments, and a critical discussion question.",
      parameters: {
        topic: {
          type: "string",
          description:
            "The subject or issue to be debated, ensuring a well-defined and thought-provoking discussion.",
        },
      },
    },

    logic_testing: {
      name: "logic_testing",
      description:
        "Analyzes the logical structure of an argument by breaking it down into premises, identifying weaknesses or fallacies, providing counterexamples, and refining the argument for stronger reasoning.",
      parameters: {
        argument: {
          type: "string",
          description:
            "The argument to be tested for logical soundness, ensuring structured reasoning analysis.",
        },
      },
    },

    brainstorming: {
      name: "brainstorming",
      description:
        "Generates innovative and structured ideas on a given topic, highlights key challenges, explores potential directions, and presents the output in a discourse graph format for deeper analysis.",
      parameters: {
        topic: {
          type: "string",
          description:
            "The subject for brainstorming, ensuring diverse and insightful idea generation.",
        },
      },
    },
  },

  /** Function to classify user intent */
  classifyUserInput: (userInput: string): string => {
    const debateKeywords = [
      "debate",
      "discuss",
      "argue",
      "motion",
      "controversy",
    ];
    const logicKeywords = ["logic", "fallacy", "valid?", "flaw", "assumption"];

    if (debateKeywords.some((word) => userInput.toLowerCase().includes(word))) {
      return "debate_structuring";
    } else if (
      logicKeywords.some((word) => userInput.toLowerCase().includes(word))
    ) {
      return "logic_testing";
    } else {
      return "brainstorming";
    }
  },

  /** Function to handle user notifications before calling a function */
  notifyBeforeFunctionCall: (intent: string): string => {
    switch (intent) {
      case "debate_structuring":
        return "Okay, I’m going to structure a debate topic for you. Let’s explore both sides!";
      case "logic_testing":
        return "Got it! I'll analyze the argument and check for any logical flaws.";
      case "brainstorming":
        return "Great idea! Let me come up with some creative solutions and map out a discourse graph.";
      default:
        return "Processing your request...";
    }
  },

  /** Function to provide updates if function execution takes time */
  provideStatusUpdate: (timeElapsed: number): string => {
    if (timeElapsed > 5 && timeElapsed <= 10) {
      return "I just need a little more time to finalize this...";
    } else if (timeElapsed > 10) {
      return "Thanks for your patience! I’m still working on it now.";
    }
    return "";
  },

  /** Function to structure the response */
  generateResponse: (intent: string, data: any): string => {
    switch (intent) {
      case "debate_structuring":
        return `\n🔹 **Motion:** ${
          data.motion
        }\n🔹 **Affirmative Arguments:**  \n   - ${data.affirmative_arguments.join(
          "\n   - "
        )}\n🔹 **Counterarguments:**  \n   - ${data.counterarguments.join(
          "\n   - "
        )}\n🔹 **Critical Question:** ${data.critical_question}\n`;
      case "logic_testing":
        return `\n🔹 **Premises:**  \n   - ${data.premises.join(
          "\n   - "
        )}\n🔹 **Logical Issue:** ${
          data.logical_issue
        }\n🔹 **Counterexample:** ${
          data.counterexample
        }\n🔹 **Refinement Question:** ${data.refinement_question}\n`;
      case "brainstorming":
        return `\n🔹 **Core Ideas:**  \n   - ${data.core_ideas.join(
          "\n   - "
        )}\n🔹 **Challenges:**  \n   - ${data.challenges.join(
          "\n   - "
        )}\n🔹 **Potential Directions:**  \n   - ${data.potential_directions.join(
          "\n   - "
        )}\n🔹 **Critical Question:** ${
          data.critical_question
        }\n🔹 **Discourse Graph:**\n   - [Main Idea]: ${
          data.topic
        }\n     ├── [Idea 1]: ${data.core_ideas[0]}\n     ├── [Idea 2]: ${
          data.core_ideas[1]
        }\n     ├── [Idea 3]: ${
          data.core_ideas[2]
        }\n     ├── [Challenges]: ${data.challenges.join(
          " | "
        )}\n     ├── [Potential Directions]: ${data.potential_directions.join(
          " | "
        )}`;
      default:
        return "Invalid intent type.";
    }
  },
};
