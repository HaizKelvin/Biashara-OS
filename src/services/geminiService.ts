import { GoogleGenAI, Type } from "@google/genai";

// Lazy initialization as per guidelines
let aiClient: GoogleGenAI | null = null;

function getAI() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log("AI Init - Key defined:", !!apiKey);
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in the environment. Please check your AI Studio secrets.");
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
    
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: `User Question: ${prompt}\n\nCurrent Business Data Context:\n${JSON.stringify(businessData)}`,
      config: {
        systemInstruction: `${SYSTEM_INSTRUCTIONS}\n- If the user speaks in Kiswahili or Sheng, reply in natural Kiswahili/Sheng used in Kenyan business contexts.\n- Maintain the 3-section output format strictly.`
      }
    });

    if (!response.text) {
      throw new Error("AI returned empty content");
    }

    return response.text;
  } catch (error) {
    console.error("AI Error Detailed:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return `[BIASHARA-AI-ERROR]: ${msg}. Please refresh the page or ensure your AI Studio key is active.`;
  }
}

export async function getDailyInsights(businessData: any) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: `Analyze this business data and provide 3 short "Smart Insights":
      1. A sales prediction for tomorrow.
      2. An expense alert (if any).
      3. A growth tip.
      Data: ${JSON.stringify(businessData)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    if (!response.text) {
      throw new Error("No response text for insights");
    }

    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Insights Error Detailed:", error);
    return [
      `[BIASHARA-AI-ERROR]: ${error instanceof Error ? error.message : "Service unavailable"}`,
      "Stock up on popular items while we fix the AI.",
      "Check your debts in the Debts tab."
    ];
  }
}

export async function parseMpesaMessage(message: string) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: `Extract detailed M-Pesa transaction data from this text block.\nMessage Block: ${message}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              transactionId: { type: Type.STRING },
              amount: { type: Type.NUMBER },
              type: { type: Type.STRING },
              party: { type: Type.STRING }
            },
            required: ['transactionId', 'amount', 'type', 'party']
          }
        }
      }
    });

    if (!response.text) {
      throw new Error("No response text for M-Pesa parsing");
    }

    return JSON.parse(response.text);
  } catch (error) {
    console.error("M-Pesa Parsing Error Detailed:", error);
    return [];
  }
}
