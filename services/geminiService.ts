
import { GoogleGenAI, Type } from "@google/genai"; // Import the Google AI SDK and data type helpers
import { UserRole, ValidationResponse } from "../types"; // Import our custom data types
import { ROLE_FOCUS } from "../constants"; // Import our role-based focus instructions

// Create a new instance of the Google AI engine using the API key from the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// The main function that asks the AI to check a search query and find relevant links
export const validateAndSearch = async (query: string, role: UserRole): Promise<ValidationResponse> => {
  // Determine which focus instructions to use based on the user's selected role
  const focusArea = ROLE_FOCUS[role as keyof typeof ROLE_FOCUS] || '';
  
  // Call the Gemini model to generate a structured content response
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview', // Using the "Flash" model for speed and efficiency
    // The prompt: we tell the AI who the user is, what they are looking for, and exactly what links we want
    contents: `Is the search query "${query}" relevant for someone in the role of a ${role}? 
               Their priority focus is: ${focusArea}. 
               If it is relevant, provide 15 helpful links. 
               Normally, prioritize .edu, .gov, or .org domains.
               IMPORTANT: If the user is specifically searching for "videos", "lectures", or "YouTube" content, 
               INCLUDE relevant youtube.com links that are educational or professional.
               For every result, include a high-quality thumbnail URL. Use realistic Unsplash URLs for articles 
               and standard YouTube thumbnail patterns (e.g., img.youtube.com/vi/ID/maxresdefault.jpg) for videos if you can infer them, 
               otherwise use high-quality placeholder images from Unsplash relevant to the topic.`,
    config: {
      // We force the AI to respond in JSON format so our code can easily read it
      responseMimeType: "application/json",
      // We define a strict schema (rules) for the JSON to ensure it matches our TypeScript interface
      responseSchema: {
        type: Type.OBJECT, // The AI must return a single JSON object
        properties: {
          isValid: { type: Type.BOOLEAN }, // Must include a true/false for relevance
          reason: { type: Type.STRING }, // Must include a text explanation
          suggestedLinks: { // Must include an array (list) of links
            type: Type.ARRAY,
            items: { // Each item in the list must have a title, url, snippet, and optional thumbnailUrl
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                url: { type: Type.STRING },
                snippet: { type: Type.STRING },
                thumbnailUrl: { type: Type.STRING, description: "A preview image URL for the content." }
              },
              required: ["title", "url", "snippet"]
            }
          }
        },
        // These fields are mandatory; the AI cannot omit them
        required: ["isValid", "reason", "suggestedLinks"]
      }
    }
  });

  // Extract the text part of the AI's response and turn it into a JavaScript object
  const resultText = response.text;
  return JSON.parse(resultText);
};
