
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  }

  /**
   * Edits an image based on a text prompt using Gemini 2.5 Flash Image
   */
  async editImage(base64Image: string, prompt: string): Promise<{ editedImage: string; description: string }> {
    try {
      // Create a fresh instance to ensure the latest config/key
      const api = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      // Extract correct mime type from data URL if present (e.g., data:image/jpeg;base64,...)
      // Default to png if not found
      const mimeMatch = base64Image.match(/^data:(image\/[a-z]+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
      const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');

      const response = await api.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: mimeType,
              },
            },
            {
              text: `Apply the following edit to the image: ${prompt}. Return the edited image as part of the response.`,
            },
          ],
        },
      });

      let editedImage = '';
      let description = '';

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          editedImage = `data:image/png;base64,${part.inlineData.data}`;
        } else if (part.text) {
          description += part.text;
        }
      }

      if (!editedImage) {
        throw new Error("No image was returned by the AI. Please try a different prompt.");
      }

      return { editedImage, description };
    } catch (error: any) {
      console.error("Gemini Edit Error:", error);
      throw new Error(error.message || "Failed to process image with AI.");
    }
  }
}

export const geminiService = new GeminiService();
