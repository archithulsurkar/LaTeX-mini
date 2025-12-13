
import { Injectable } from '@angular/core';
import { GoogleGenAI, Type } from "@google/genai";

export interface Formula {
  description: string;
  latex: string;
  mathml: string;
}

export interface RemediationResult {
  originalText: string;
  formulas: Formula[];
}

@Injectable({ providedIn: 'root' })
export class GeminiService {
  private readonly ai: GoogleGenAI;

  constructor() {
    // IMPORTANT: The API key is sourced from environment variables.
    // Do not hardcode or expose keys in the frontend.
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API_KEY environment variable not set.");
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async remediateImage(base64Image: string, mimeType: string): Promise<RemediationResult> {
    const prompt = `Analyze the provided image of a document page. Your task is to extract two types of information:
1.  **Full Text Content**: Transcribe all the text from the image, maintaining the original paragraph structure as best as possible.
2.  **Formulas**: Identify all distinct mathematical or chemical formulas. For each formula, provide:
    a. A detailed text description explaining the formula and its components, suitable for a screen reader.
    b. The formula's representation in LaTeX.
    c. The formula's representation in MathML.

Respond in a single JSON object that strictly adheres to the provided schema. If no formulas are found, return an empty array for "formulas". If no text is found, return an empty string for "originalText".`;

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: mimeType,
      },
    };

    const textPart = { text: prompt };

    const schema = {
      type: Type.OBJECT,
      properties: {
        originalText: {
            type: Type.STRING,
            description: "The full transcribed text from the document image."
        },
        formulas: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              description: {
                type: Type.STRING,
                description: 'A detailed text description of the formula.',
              },
              latex: {
                type: Type.STRING,
                description: 'The LaTeX representation of the formula.',
              },
              mathml: {
                type: Type.STRING,
                description: 'The MathML representation of the formula.',
              },
            },
            required: ['description', 'latex', 'mathml'],
          },
        },
      },
      required: ['originalText', 'formulas'],
    };

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [textPart, imagePart] },
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema,
          temperature: 0.1,
        },
      });

      const jsonString = response.text.trim();
      const result = JSON.parse(jsonString);
      return result as RemediationResult;

    } catch (error) {
      console.error('Gemini API call failed:', error);
      throw new Error('The AI model could not process the request. Please check the console for details.');
    }
  }
}
