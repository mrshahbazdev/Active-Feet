import { GoogleGenAI, Type, Schema } from "@google/genai";
import { InventoryItem } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Schema for generating item details
const itemDetailsSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    description: {
      type: Type.STRING,
      description: "A short, professional marketing description for the product (max 2 sentences).",
    },
    category: {
      type: Type.STRING,
      description: "A suggested general category for this product (e.g., Electronics, Office, Home).",
    },
    suggestedMinStock: {
      type: Type.INTEGER,
      description: "A recommended minimum stock level based on typical item turnover.",
    },
  },
  required: ["description", "category", "suggestedMinStock"],
};

export const generateItemDetails = async (itemName: string) => {
  if (!apiKey) return null;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate inventory details for a product named "${itemName}".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: itemDetailsSchema,
        systemInstruction: "You are an expert inventory manager assistant. Provide realistic and helpful default data.",
      },
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
    return null;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const analyzeInventory = async (items: InventoryItem[]) => {
  if (!apiKey) return "API Key is missing.";

  // Simplify data for the prompt to save tokens
  const summary = items.map(i => ({
    name: i.name,
    qty: i.quantity,
    min: i.minStockLevel,
    price: i.price,
    cat: i.category
  }));

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze this inventory list and provide 3 key actionable insights in bullet points. Focus on stock health, value distribution, or potential restocking needs. Data: ${JSON.stringify(summary)}`,
      config: {
        systemInstruction: "You are an analytical inventory consultant. Be concise, professional, and direct. Output Markdown.",
      },
    });

    return response.text || "No insights generated.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Failed to analyze inventory.";
  }
};
