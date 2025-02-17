import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { description } = req.body;

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        prompt: description,
        n: 1,
        size: '256x256'
      })
    });

    if (!response.ok) {
      console.error('Failed to fetch image:', response.statusText);
      return res.status(response.status).json({ error: response.statusText });
    }

    const data = await response.json();
    const imageUrl = data.data?.[0]?.url || null;
    res.status(200).json({ imageUrl });
  } catch (error) {
    console.error('Error fetching image:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}