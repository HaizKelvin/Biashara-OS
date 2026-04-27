import { GoogleGenAI } from "@google/genai";

// Lazy initialization as per guidelines
let aiClient: GoogleGenAI | null = null;

function getAI() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in the environment.");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

export async function getAIAdvisory(prompt: string, businessData: any) {
  try {
    const ai = getAI();
    
    const context = `
      You are "Biashara AI", a business consultant for Kenyan SMEs. 
      The user is a small business owner in Kenya (e.g., salon, kiosk, shop, workshop).
      Current Business Data: ${JSON.stringify(businessData)}
      
      Instructions:
      - Be professional, encouraging, and use simple language.
      - Support both English and Kiswahili fluently. 
      - If the user speaks in Kiswahili or Sheng, reply in natural Kiswahili/Sheng used in Kenyan business contexts.
      - Use Kenyan context (KES currency, M-Pesa mentions).
      - Provide actionable advice on profit, expenses, and growth.
      - IMPORTANT: Keep responses extremely concise (max 2-3 sentences).
      - IMPORTANT: Do NOT use asterisks (**) for bolding or any markdown formatting. Use plain text only.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: context + "\n\nUser Question: " + prompt,
    });

    return response.text;
  } catch (error) {
    console.error("AI Error:", error);
    return "I'm having trouble analyzing the data right now. Please try again in a moment.";
  }
}

export async function getDailyInsights(businessData: any) {
  try {
    const ai = getAI();
    const context = `
      Analyze this business data and provide 3 short "Smart Insights":
      1. A sales prediction for tomorrow.
      2. An expense alert (if any).
      3. A growth tip.
      
      Return ONLY a JSON array of 3 strings. No markdown, no extra text.
      Data: ${JSON.stringify(businessData)}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: context,
    });

    const text = response.text || "[]";
    const jsonStr = text.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("AI Insights Error:", error);
    return [
      "Keep tracking your sales to unlock AI insights.",
      "Consider stocking up on your best-selling items.",
      "Check your pending debts for faster cashflow."
    ];
  }
}
