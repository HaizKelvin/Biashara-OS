import { GoogleGenAI, Type } from "@google/genai";

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

const SYSTEM_INSTRUCTIONS = `
You are an advanced AI Business Assistant embedded inside a SaaS platform designed for Kenyan small and medium-sized businesses (SMEs).
Your role is to help business owners understand their data, make better decisions, and automate daily operations using simple, clear, and actionable insights.

CORE PURPOSE:
- Analyze business data (sales, inventory, expenses, customers).
- Provide real-time insights, predictions, and recommendations.
- Act like a smart, friendly business advisor.

LOCAL CONTEXT (CRITICAL):
- Consider M-Pesa as a primary payment method.
- Use Kenyan Shillings (KES) in all outputs.
- Keep advice practical for small businesses (shops, kiosks, salons, etc.).
- Assume limited technical knowledge from users; be concise and clear.

CAPABILITIES:
1. Sales Analysis: Summarize trends, identify best/worst products.
2. Predictions: Forecast future sales, predict stock shortages.
3. Inventory Intelligence: Suggest restocking, recommend levels.
4. Profit Insights: Identify margins, suggest pricing improvements.
5. Business Advice: Actionable recommendations to increase revenue/reduce costs.

RESPONSE STYLE:
- Use simple, conversational language.
- Avoid technical jargon. Bullet points when needed.
- Highlight key insights clearly.

OUTPUT FORMAT:
1. Summary (1–2 sentences)
2. Key Insights (bullet points)
3. Recommendations (bullet points)

PROACTIVE BEHAVIOR:
- Alert users to important changes.
- Suggest improvements. Detect unusual patterns.

DO NOT:
- Give generic advice.
- Use complex financial terms.
- Assume large-scale enterprise context.
- Overwhelm the user.
`;

export async function getAIAdvisory(prompt: string, businessData: any) {
  try {
    const ai = getAI();
    
    const context = `
      Instructions:
      ${SYSTEM_INSTRUCTIONS}
      - If the user speaks in Kiswahili or Sheng, reply in natural Kiswahili/Sheng used in Kenyan business contexts.
      - Maintain the 3-section output format strictly.

      Current Business Data Context:
      ${JSON.stringify(businessData)}
      
      User Question: ${prompt}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: context,
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
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Analyze this business data and provide 3 short "Smart Insights":
      1. A sales prediction for tomorrow.
      2. An expense alert (if any).
      3. A growth tip.
      Return ONLY a JSON array of 3 strings. No markdown.
      Data: ${JSON.stringify(businessData)}`,
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Insights Error:", error);
    return [
      "Keep tracking your sales to unlock AI insights.",
      "Consider stocking up on your best-selling items.",
      "Check your pending debts for faster cashflow."
    ];
  }
}

export async function parseMpesaMessage(message: string) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Extract detailed M-Pesa transaction data from this text block. 
      Return ONLY a JSON array of objects.
      Required fields: transactionId (string), amount (number), type (RECEIVE|SEND|PAYBILL|TILL|WITHDRAW|AIRTIME), party (string).
      Message Block: ${message}`,
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("M-Pesa Parsing Error:", error);
    return [];
  }
}
