import axios from 'axios';
import * as fs from 'fs';
import FormData from 'form-data';

/**
 * Converts the audio file at the given path to text using the realtime speech API.
 */
async function realtimeSpeechToText(audioFilePath: string): Promise<string> {
  const apiUrl = 'https://realtime.api/speech-to-text'; // Update this endpoint as needed
  const form = new FormData();
  form.append('file', fs.createReadStream(audioFilePath));

  const response = await axios.post(apiUrl, form, {
    headers: { ...form.getHeaders() }
  });
  return response.data.transcript || "";
}

/**
 * Feeds the provided hypothesis to the reasoning API and returns the reasoning model's output.
 */
async function runMiniReasoningModel(hypothesis: string): Promise<string> {
  const reasoningApiUrl = 'http://localhost:5001/reason'; // Update with your reasoning API endpoint
  const payload = { input: hypothesis };

  const response = await axios.post(reasoningApiUrl, payload, {
    headers: { 'Content-Type': 'application/json' }
  });
  return response.data.output || "";
}

/**
 * Sends a waiting chat message back to the realtime API.
 * In a real-world scenario, this function would update the UI or send a chat update through your system.
 */
async function sendWaitingMessage(): Promise<void> {
  // Simulate sending a waiting message to the realtime API (e.g., posting a chatbot status update)
  const waitingMessage = {
    message: "Please wait, I am reasoning through your hypothesis...",
    timestamp: new Date().toISOString()
  };
  // For demonstration, we print to console.
  console.log("[Chat] System:", waitingMessage.message);
  // Optionally, use axios to POST this status to your realtime chat API.
  // await axios.post('http://localhost:5002/chat', waitingMessage);
}

/**
 * Main function to generate a hypothesis.
 * It extracts a hypothesis from the speech transcript (or prompts if not present),
 * shows a waiting message, then passes the hypothesis to the reasoning model,
 * and finally sends the result back to the realtime API.
 */
export async function generateHypothesis(audioFilePath: string): Promise<string> {
  // Convert the spoken audio to text.
  const transcript = await realtimeSpeechToText(audioFilePath);
  console.log("[Debug] Transcript:", transcript);

  // Determine if a hypothesis was provided.
  // Here we assume that if the transcript contains the word "hypothesis:" it is explicit.
  let hypothesis: string;
  const lowerTranscript = transcript.toLowerCase();
  if (lowerTranscript.includes("hypothesis:")) {
    hypothesis = transcript.substring(lowerTranscript.indexOf("hypothesis:") + "hypothesis:".length).trim();
  } else {
    // If no explicit hypothesis is detected, use the full transcript,
    // or trigger further prompting to the user (this can be customized).
    hypothesis = transcript;
  }

  // Send waiting/conversational chat message to simulate processing.
  await sendWaitingMessage();

  // Get reasoning model's output for this hypothesis.
  const reasoningOutput = await runMiniReasoningModel(hypothesis);

  // Optionally, send the reasoningOutput back to a realtime chat endpoint.
  console.log("[Chat] Reasoning Model Response:", reasoningOutput);
  // e.g., await axios.post('http://localhost:5002/chat', { message: reasoningOutput });

  return reasoningOutput;
}

/**
 * If executed from the command line, run the hypothesis generator with the given audio file path.
 */
async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.log("Usage: ts-node hypothesisGenerator.ts <audio_file_path>");
    process.exit(1);
  }
  const audioFile = args[0];
  try {
    const output = await generateHypothesis(audioFile);
    console.log("Final reasoning output:");
    console.log(output);
  } catch (error) {
    console.error("Error during hypothesis generation:", error);
  }
}

if (require.main === module) {
  main();
}