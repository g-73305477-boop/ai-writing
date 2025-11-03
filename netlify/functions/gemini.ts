import { GoogleGenAI, Modality } from "@google/genai";

// This is a Netlify Function, which runs on the server.
// The API key is securely accessed from environment variables here.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// This is the main handler for our function.
export const handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { action, payload } = JSON.parse(event.body);
    let result;

    if (action === 'generatePronunciation') {
      const { word } = payload;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say: ${word}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
        },
      });
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      result = { audioData: base64Audio };

    } else if (action === 'checkHandwriting') {
      const { imageDataUrl, word } = payload;
      const base64Data = imageDataUrl.split(',')[1];
      
      const imagePart = { inlineData: { mimeType: 'image/png', data: base64Data } };
      const textPart = { text: `You are an AI teacher helping a student practice their writing. The student was asked to write the word "${word}". Look at the image and evaluate their handwriting. Respond with a single word: "Correct" if it is legible and clearly "${word}", and "Incorrect" otherwise. Do not add any other explanation.` };

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
      });
      result = { text: response.text.trim() };

    } else {
      return { statusCode: 400, body: 'Invalid action' };
    }

    // Return a successful response to the frontend
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Allow requests from any origin (your Netlify site)
      },
      body: JSON.stringify(result),
    };

  } catch (error) {
    console.error('Error in Netlify function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'An internal error occurred.' }),
    };
  }
};
