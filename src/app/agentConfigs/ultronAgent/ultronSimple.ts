import { AgentConfig } from "@/app/types";
import { injectTransferTools } from "../utils";
import FormData from "form-data";

// Global flag for speaking status.
let isAgentSpeaking = false;

// Instead of calling realtimeSpeechToText directly, use this wrapper that calls your server API.
async function realtimeSpeechToTextAPI(audioFilePath: string): Promise<string> {
  const response = await fetch("/api/stt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ audioFilePath }),
  });
  if (!response.ok) {
    console.warn("Speech-to-text API error:", response.statusText);
    return "";
  }
  const data = await response.json();
  return data.transcript;
}

// Helper: send a waiting message to simulate conversational chat.
async function sendWaitingMessage(): Promise<void> {
  const waitingMessage = "Please wait, I'm reasoning through your hypothesis...";
  console.log("[Chat] System:", waitingMessage);
  // Optionally, you can POST this waiting message to your realtime chat endpoint.
  // await fetch('http://your-chat-endpoint/api/messages', { method: 'POST', body: JSON.stringify({ message: waitingMessage }) });
}

export const ultronConfig: AgentConfig = {
  name: "Ultron",
  publicDescription: "Agent that helps to reason about topics.",
  instructions:
    `**Instructions:**
Read the following transcribed text of a scientific brainstorming session.
Identify statements that propose a potential scientific hypothesis. A hypothesis is a testable statement that proposes a relationship between variables or an explanation for an observation. Look for sentences that:
  • Express a potential cause-and-effect relationship.
  • Propose a mechanism or explanation for a phenomenon.
  • Suggest a correlation or association between factors.
  • Are phrased as questions that can be investigated scientifically.
Extract these potential hypotheses as concise bullet points.
If no clear hypotheses are found, state "No potential hypotheses identified in this text." And help the user build a hypothesis by asking leading questions.
Keep your initial response under 400 characters. You say "Hey Hey Hey, how can I help you today?" to start the conversation. After the hypothesis is created call the function 'deepReasoning' with the hypothesis as the topic.
The agent is not to stray from this objective.`,
  tools: [
    {
      type: "function",
      name: "deepReasoning",
      description: "Get deeper insights about a topic using the o1-mini model. If the topic starts with 'audio:', the value is treated as an audio file path.",
      parameters: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            description: "The topic to analyze (or, if prefixed with 'audio:', the file path to the audio recording)"
          },
          history: {
            type: "string",
            description: "The conversation history so far including your full response"
          }
        },
        required: ["topic"]
      }
    }
  ],
  toolLogic: {
    deepReasoning: async ({ topic, context }) => {
      let hypothesis = topic;

      if (topic.toLowerCase().startsWith("audio:")) {
        const audioFilePath = topic.slice("audio:".length).trim();
        const transcript = await realtimeSpeechToTextAPI(audioFilePath);
        console.log("[Debug] Transcript:", transcript);

        if (transcript.toLowerCase().includes("hypothesis:")) {
          hypothesis = transcript.substring(
            transcript.toLowerCase().indexOf("hypothesis:") + "hypothesis:".length
          ).trim();
        } else {
          hypothesis = transcript;
        }
        await sendWaitingMessage();
      }

      // Update the voice directive to match the instructions.
      const voiceDirective = (context && context.includes("Hey hey hey"))
        ? "\n\n[Voice Directive: Please respond using the 'echo' voice. Keep your answer friendly, strictly on topic, and under 400 characters as per the instructions.]"
        : "";

      const messages = [
        {
          role: "user",
          content: `As an expert with unique insights, please consider:
Topic/Hypothesis: ${hypothesis}
${context ? `Additional Context: ${context}` : ""}${voiceDirective}
Respond in a friendly, human-like manner (under 400 characters).`
        }
      ];

      // Ensure only one agent speaks at a time.
      while (isAgentSpeaking) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      isAgentSpeaking = true;
      try {
        const response = await fetch("/api/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            model: "o1-mini", 
            messages 
          }),
        });

        if (!response.ok) {
          console.warn("Server returned an error:", response);
          return { error: "Failed to get deeper insights." };
        }

        const completion = await response.json();
        return { result: completion.choices[0].message.content };
      } catch (error) {
        console.error("Error calling o1-mini:", error);
        return { error: "Failed to process the reasoning request." };
      } finally {
        isAgentSpeaking = false;
      }
    }
  },
};

// add the transfer tool to point to downstreamAgents
export const ultronFlow = injectTransferTools([ultronConfig]);