import { GoogleGenAI } from "@google/genai";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const SYSTEM_INSTRUCTION = `You are the Vendra WhatsApp Assistant — a smart, friendly, street-smart business assistant for Nigerian fashion vendors.

ROLE: You help vendors run their store directly from WhatsApp. You record sales, manage inventory, look up customer info, and query business analytics.

PERSONALITY & TONE:
- Professional, warm, and distinctly Nigerian commercial tone ("Sharp sharp!", "Got you!", "Done deal!").
- Keep messages short, clean, and scannable — this is WhatsApp.
- Use emojis smartly for visual hierarchy (👗, 👤, 💰, 📋, 📊, ⚠️, ✅).

WHATSAPP FORMATTING RULES (STRICT):
1. Never use markdown headers (no #, ##, ###) or markdown tables — WhatsApp renders them as ugly raw text.
2. Use *bold* for product names, customer names, prices, and field labels.
3. Use bullet points (•) for lists and options.
4. Leave clean empty lines between sections so messages breathe.
5. When asking follow-up questions, present them clearly:
   • *Color:* Yellow or Green?
   • *Payment:* Paid in full, deposit, or unpaid?
6. When presenting an order draft for confirmation, format it like a clean digital receipt:
   📋 *Order Summary:*
   • *Item:* 1x Ann's Love Bubu (Yellow) — ₦80,000
   • *Customer:* Pharez Oyelade (08137742724)
   • *Payment:* Paid in full (₦80,000)
   • *Stock remaining:* 4
   
   Reply *CONFIRM* to log this in your store, or *CANCEL*.

CRITICAL BUSINESS RULES:
1. NEVER execute a database write directly. Always call create_order_draft or adjust_stock first, then wait for the vendor's explicit affirmation.
2. When details are missing (customer name, phone, color/size variant), ask for them conversationally. Don't invent details.
3. If multiple products or customers match, present numbered options:
   1. Amaka Eze (0812345678)
   2. Amaka Okafor (0809876543)
4. Fashion terms: bubu, agbada, asoebi, adire, senator, ankara, ready-to-wear, bespoke. Understand shorthand: "15k" = ₦15,000.
5. Currency: Always format as ₦ with commas (e.g., ₦80,000).
6. Read queries (revenue, debt, stock, order lookup): Respond immediately with formatted data — no confirmation needed.
7. NEVER invent, fabricate, or guess product names, customer orders, or item details. When asked what a customer ordered or about specific orders, ALWAYS call lookup_orders to fetch the exact database records.`;

const tools = [{
  functionDeclarations: [
    {
      name: "lookup_orders",
      description: "Search and retrieve past or current orders for a specific customer (by name or phone) or by order ID. Returns exact items, variants, prices, status, balance owed, and dates.",
      parameters: {
        type: "OBJECT",
        properties: {
          customerQuery: { type: "STRING", description: "Customer name or phone number fragment" },
          orderId: { type: "STRING", description: "Optional order ID or 6-character code" },
          status: { type: "STRING", description: "Optional status filter: pending, confirmed, dispatched, completed, cancelled" }
        }
      }
    },
    {
      name: "search_catalog",
      description: "Search the vendor's product catalog for items matching a name, color, style or category",
      parameters: {
        type: "OBJECT",
        properties: {
          query: { type: "STRING" },
          category: { type: "STRING" }
        },
        required: ["query"]
      }
    },
    {
      name: "lookup_customer",
      description: "Search the vendor's customer list by name or phone number",
      parameters: {
        type: "OBJECT",
        properties: {
          query: { type: "STRING", description: "name or phone fragment" }
        },
        required: ["query"]
      }
    },
    {
      name: "create_order_draft",
      description: "Create a draft order for vendor confirmation. The order will NOT be saved until the vendor explicitly confirms.",
      parameters: {
        type: "OBJECT",
        properties: {
          items: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                productName: { type: "STRING" },
                variantLabel: { type: "STRING" },
                quantity: { type: "NUMBER" },
                price: { type: "NUMBER" }
              },
              required: ["productName", "variantLabel", "quantity", "price"]
            }
          },
          customerName: { type: "STRING" },
          customerPhone: { type: "STRING" },
          paymentStatus: { type: "STRING", enum: ["paid", "partial", "unpaid"] },
          depositPaid: { type: "NUMBER" },
          sendReceipt: { type: "BOOLEAN" },
          notes: { type: "STRING" }
        },
        required: ["items", "customerName", "customerPhone", "paymentStatus"]
      }
    },
    {
      name: "adjust_stock",
      description: "Propose adjusting stock levels for a product variant. Requires vendor confirmation.",
      parameters: {
        type: "OBJECT",
        properties: {
          productName: { type: "STRING" },
          variantLabel: { type: "STRING" },
          quantityChange: { type: "NUMBER", description: "positive to add, negative to remove" }
        },
        required: ["productName", "variantLabel", "quantityChange"]
      }
    },
    {
      name: "get_revenue_summary",
      description: "Get the vendor's revenue summary for today, this week, or this month",
      parameters: {
        type: "OBJECT",
        properties: {
          timeframe: { type: "STRING", enum: ["today", "week", "month"] }
        },
        required: ["timeframe"]
      }
    },
    {
      name: "get_debt_summary",
      description: "Get list of all customers who owe money with order details",
      parameters: {
        type: "OBJECT",
        properties: {}
      }
    },
    {
      name: "check_stock",
      description: "Check current stock levels for a product or variant",
      parameters: {
        type: "OBJECT",
        properties: {
          query: { type: "STRING", description: "product name or variant to check" }
        },
        required: ["query"]
      }
    }
  ]
}];

/**
 * Process conversational turns and return Gemini AI response and function calls.
 * @param {Array<{role: string, parts: Array<{text: string}>}>} dialogHistory 
 * @param {object} vendorContext - The vendor context object containing { vendorId, businessName, senderPhone }
 * @returns {Promise<{text: string, functionCalls: Array<{name: string, args: object}>}>}
 */
export async function processWithGemini(dialogHistory, vendorContext) {
  try {
    const response = await genai.models.generateContent({
      model: "gemini-flash-lite-latest",
      contents: dialogHistory,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: tools
      }
    });

    const candidate = response.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    
    let text = "";
    const functionCalls = [];

    for (const part of parts) {
      if (part.text) {
        text += part.text;
      }
      if (part.functionCall) {
        functionCalls.push({
          name: part.functionCall.name,
          args: part.functionCall.args
        });
      }
    }

    return { text, functionCalls, rawContent: candidate?.content };
  } catch (error) {
    console.error("Error processing with Gemini:", error);
    return {
      text: "I'm having a moment 😅 Please try again or rephrase what you need.",
      functionCalls: []
    };
  }
}
