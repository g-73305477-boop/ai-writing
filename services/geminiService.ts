
import { GoogleGenAI, Modality } from "@google/genai";

// Assume API_KEY is set in the environment
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Generates audio pronunciation for the given text.
 * @param text The text to pronounce.
 * @returns A base64 encoded string of the audio data.
 */
export const generatePronunciation = async (text: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return base64Audio;
    }
    return null;
  } catch (error) {
    console.error("Error generating pronunciation:", error);
    throw error;
  }
};

/**
 * Checks handwriting from an image against a specific word.
 * @param imageDataUrl The base64 data URL of the canvas image.
 * @param word The word to check against.
 * @returns A string indicating if the handwriting is correct or incorrect.
 */
export const checkHandwriting = async (imageDataUrl: string, word: string): Promise<string> => {
  try {
    // Gemini API expects only the base64 data, not the full data URL prefix
    const base64Data = imageDataUrl.split(',')[1];

    const imagePart = {
      inlineData: {
        mimeType: 'image/png',
        data: base64Data,
      },
    };
    
    const textPart = {
      text: `Does the handwriting in this image say the word "${word}"? Your answer must be a single word: either "Correct" or "Incorrect". Do not add any other explanation.`,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
    });
    
    return response.text.trim();

  } catch (error) {
    console.error("Error checking handwriting:", error);
    throw error;
  }
};
