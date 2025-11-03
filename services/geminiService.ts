// This is the endpoint for our secure backend function on Netlify.
const API_ENDPOINT = '/.netlify/functions/gemini';

/**
 * Generates audio pronunciation by calling our backend function.
 * @param text The text to pronounce.
 * @returns A base64 encoded string of the audio data.
 */
export const generatePronunciation = async (text: string): Promise<string | null> => {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'generatePronunciation', payload: { word: text } }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.audioData || null;

  } catch (error) {
    console.error("Error generating pronunciation:", error);
    throw error;
  }
};

/**
 * Checks handwriting by calling our backend function.
 * @param imageDataUrl The base64 data URL of the canvas image.
 * @param word The word to check against.
 * @returns A string indicating if the handwriting is correct or incorrect.
 */
export const checkHandwriting = async (imageDataUrl: string, word: string): Promise<string> => {
  try {
    const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'checkHandwriting', payload: { imageDataUrl, word } }),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result.text || '';

  } catch (error) {
    console.error("Error checking handwriting:", error);
    throw error;
  }
};
