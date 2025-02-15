import axios from 'axios';
import * as fs from 'fs';
import * as FormData from 'form-data';

async function realtimeSpeechToText(audioFilePath: string): Promise<string> {
  // Update the URL to your realtime API endpoint for speech-to-text.
  const apiUrl = 'https://realtime.api/speech-to-text';
  const form = new FormData();
  form.append('file', fs.createReadStream(audioFilePath));

  const response = await axios.post(apiUrl, form, {
    headers: {
      ...form.getHeaders()
    }
  });
  
  return response.data.transcript || "";
}

async function runMiniReasoningModel(transcript: string): Promise<string> {
  // Update the URL to your reasoning API endpoint.
  const reasoningApiUrl = 'http://localhost:5001/reason';
  const payload = { input: transcript };

  const response = await axios.post(reasoningApiUrl, payload, {
    headers: { 'Content-Type': 'application/json' }
  });

  return response.data.output || "";
}

async function processAudioToReasoning(audioFilePath: string): Promise<string> {
  const transcript = await realtimeSpeechToText(audioFilePath);
  if (transcript) {
    return await runMiniReasoningModel(transcript);
  }
  return "No transcript generated.";
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.log("Usage: ts-node speech_to_reason.ts <audio_file_path>");
    process.exit(1);
  }
  const audioFile = args[0];
  
  try {
    const output = await processAudioToReasoning(audioFile);
    console.log("Reasoning model output:");
    console.log(output);
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
