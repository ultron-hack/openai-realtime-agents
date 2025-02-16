import type { NextApiRequest, NextApiResponse } from "next";
import * as fs from "fs";
import FormData from "form-data";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // Assumes audio file is sent as a file field "file" (use appropriate middleware for parsing multipart form data)
  // Note: In practice, you might want to use a package like 'multer' with Next.js API routes.
  // For demo purposes, we'll assume a file path is sent in the request body.
  const { audioFilePath } = req.body;
  if (!audioFilePath || !fs.existsSync(audioFilePath)) {
    res.status(400).json({ error: "Invalid audio file path" });
    return;
  }

  const sttApiUrl = "https://realtime.api/speech-to-text"; // Update this endpoint
  const formData = new FormData();
  formData.append("file", fs.createReadStream(audioFilePath));

  try {
    const response = await fetch(sttApiUrl, {
      method: "POST",
      body: formData as unknown as BodyInit,
    });
  
    if (!response.ok) {
      res.status(500).json({ error: "Speech-to-text API error" });
      return;
    }
  
    const json = await response.json();
    res.status(200).json({ transcript: json.transcript || "" });
  } catch (error) {
    res.status(500).json({ error: "Error processing request" });
  }
}