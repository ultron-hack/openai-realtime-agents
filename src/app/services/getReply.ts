import { Message } from "../types";

class ReplyBot {
  constructor(private model: string) {
    this.model = model || "gpt-4o-mini";
  }

  async reply(messages: Message[]) {
    try {
      try {
        const response = await fetch("/api/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: this.model,
            messages
          }),
        });

        if (!response.ok) {
          console.warn("Server returned an error:", response);
          return { error: "Failed to get deeper insights." };
        }

        const completion = await response.json();
        const text = completion.choices[0].message.content
        console.log("replyBot =>", { messages, text })
        return text;
      } catch (error) {
        console.error("Error calling o1-mini:", error);
        return { error: "Failed to process the reasoning request." };
      }

    } catch (error) {
      console.error("Error calling o1-mini:", error);
      return { error: "Failed to process the reasoning request." };
    }
  }
}

export const replyBot = new ReplyBot("o1-mini");