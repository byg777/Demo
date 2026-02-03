import { GoogleGenAI } from "@google/genai";
import { Language } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const getSystemInstruction = (targetLang: Language): string => {
  return `You are a professional, world-class translator. 
  Your task is to accurately translate the provided text into ${targetLang}. 
  Maintain the original tone, nuance, formatting, and style of the source text. 
  If the input is technical, use appropriate terminology. 
  Do not include any explanations, just the translated text.`;
};

export const translateText = async (
  text: string,
  sourceLang: Language,
  targetLang: Language
): Promise<string> => {
  if (!text.trim()) return "";

  try {
    const modelId = 'gemini-3-flash-preview';
    
    // Construct a clear prompt based on language selection
    let prompt = "";
    if (sourceLang === Language.AUTO) {
      prompt = `Translate the following text to ${targetLang}:\n\n${text}`;
    } else {
      prompt = `Translate the following text from ${sourceLang} to ${targetLang}:\n\n${text}`;
    }

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction: getSystemInstruction(targetLang),
        temperature: 0.3, // Lower temperature for more deterministic translations
      },
    });

    return response.text || "";
  } catch (error) {
    console.error("Translation error:", error);
    throw new Error("Failed to translate text. Please try again.");
  }
};