import { AgentConfig, IPersonality } from "@/app/types";
import { injectTransferTools } from "../utils";
import FormData from "form-data";

// Global flag for speaking status.
let isAgentSpeaking = false;

// Instead of calling realtimeSpeechToText directly, use this wrapper that calls your server API.
async function realtimeSpeechToTextAPI(audioFilePath: string): Promise<string> {
  try {
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
  } catch (error) {
    console.error("Network error:", error);
    return "";
  }
}

// Helper: send a waiting message to simulate conversational chat.
async function sendWaitingMessage(): Promise<void> {
  const waitingMessage = "Please wait, I'm reasoning through your hypothesis...";
  console.log("[Chat] System:", waitingMessage);
}
import _ from "lodash";
import { getPersona, personaList, setPersona } from "@/app/state/atoms";


// Helper to get a random personality.
const getRandomPersonality = (): IPersonality =>
  personaList[Math.floor(Math.random() * personaList.length)];

// Helper to get a random personality excluding a specified ID.
const getRandomPersonalityExcluding = (excludeId: string): IPersonality => {
  let candidate = getRandomPersonality();
  // To prevent the unlikely event that the same personality is chosen repeatedly.
  while (candidate.id === excludeId && personaList.length > 1) {
    candidate = getRandomPersonality();
  }
  return candidate;
};

export const ultronConfig: AgentConfig = {
  name: "Ultron",
  publicDescription: "Agent that helps to reason about topics with different personalities.",
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
Keep your initial response under 400 characters. You say "Hey Hey Hey, how can I help you today?" to start the conversation.
After the hypothesis is created, call the function 'deepReasoning' with the hypothesis as the topic.
The agent is not to stray from this objective.`,
  tools: [
    {
      type: "function",
      name: "selectPersonality",
      description: "Select a random personality for the conversation",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    },
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
          },
          personality: {
            type: "string",
            description: "The current personality ID being used"
          }
        },
        required: ["topic", "personality"]
      }
    }
  ],
  toolLogic: {
    selectPersonality: async () => {
      // Use the helper to get a random personality.
      const randomPersonality = getRandomPersonality();
      const randomPersona = _.sample(personaList)
      // TODO: Modify the shown person on the screen.
      if (randomPersona) {
        setPersona(randomPersona)
      }
      return { result: randomPersona };
    },
    deepReasoning: async ({ topic, history, personality, context }) => {
      // Normalize context for case-insensitive checking.
      const normalizedContext = context ? context.toLowerCase() : "";
      
      // If this is right after the initial greeting ("hey hey hey") then choose a new personality.
      if (!personality || normalizedContext.includes("hey hey hey")) {
        const newPersonality = personality 
          ? getRandomPersonalityExcluding(personality)
          : getRandomPersonality();
        personality = newPersonality.id;
      }
      
      // Use the updated personality for the rest of the response.
      const selectedPersonality = personaList.find(p => p.id === personality) || getRandomPersonality();
      
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
    
      let voiceDirective = "";
      if (normalizedContext.includes("hey hey hey")) {
        voiceDirective = "\n\n[Voice Directive: " +
          `Speak as a ${selectedPersonality.name} (${selectedPersonality.traits}). ` +
          "Keep your answer friendly, strictly on topic, and under 400 characters as per the instructions.]";
      }
    
      const messages: { role: string; content: string }[] = [
        {
          role: "user",
          content: `As an expert with unique insights, please consider:
Topic/Hypothesis: ${hypothesis}
${history ? `Additional Context: ${history}` : ""}${voiceDirective}
Respond in a friendly, human-like manner (under 400 characters).`
        }
      ];
    
      while (isAgentSpeaking) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      isAgentSpeaking = true;
      try {
        try {
          const response = await fetch("/api/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model: "o1-mini", messages })
          });
          if (!response.ok) {
            console.warn("Server returned an error:", response);
            throw new Error("Failed to get deeper insights.");
          }
          const completion = await response.json();
          console.warn("Server returned an error:", response.statusText);
        } catch (error) {
          console.error("Network error:", error);
          throw new Error("Failed to process the reasoning request.");
        }
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
        const text = completion.choices[0].message.content
        const output = `${selectedPersonality?.emoji} [${selectedPersonality?.name}] ${text}`
        console.log("result", output)
        return output;
      } catch (error) {
        console.error("Error calling o1-mini:", error);
        if (error instanceof Error) {
          return { error: error.message };
        } else {
          return { error: String(error) };
        }
      } finally {
        isAgentSpeaking = false;
      }
    }
  }
};

export const ultronFlow = injectTransferTools([ultronConfig]);