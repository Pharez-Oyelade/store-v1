export interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
}

export interface ShowcaseFeature {
  id: string;
  title: string;
  shortTitle: string;
  tagline: string;
  description: string;
  iconName: "ShoppingBag" | "TrendingUp" | "Package" | "Search" | "AlertCircle";
  badge: string;
  conversation: ChatMessage[];
}

export const showcaseFeatures: ShowcaseFeature[] = [
  {
    id: "record-sales",
    title: "Record sales as they happen",
    shortTitle: "Record Sales",
    tagline: "Instant order intake without opening a laptop",
    description:
      "Sold items in your DM or shop? Just text the details to Vendra. It identifies the products, deducts inventory, and creates an order draft instantly.",
    iconName: "ShoppingBag",
    badge: "Order Intake",
    conversation: [
      {
        id: "rs-1",
        sender: "user",
        text: "I just sold 2 Ankara midi skirts and 1 Silk bubu to Chioma for ₦75,000",
        timestamp: "10:32 AM",
      },
      {
        id: "rs-2",
        sender: "bot",
        text: "Got it! I found matching products in your catalogue:\n\n🛍️ *2× Ankara Midi Skirt* (₦30,000)\n👗 *1× Emerald Silk Bubu* (₦45,000)\n👤 Customer: *Chioma Adeleke* (+234 812...)\n💰 Total: *₦75,000*\n\nShould I record this as fully paid?",
        timestamp: "10:32 AM",
      },
      {
        id: "rs-3",
        sender: "user",
        text: "Yes, paid via bank transfer",
        timestamp: "10:33 AM",
      },
      {
        id: "rs-4",
        sender: "bot",
        text: "✅ *Order #VEN-842 recorded!*\n\n• Stock updated (Ankara Skirt: 3 left, Silk Bubu: 5 left)\n• Customer balance: ₦0.00\n\n📄 Digital receipt generated: *vendra.ng/r/842*",
        timestamp: "10:33 AM",
      },
    ],
  },
  {
    id: "check-revenue",
    title: "Instant revenue & sales insights",
    shortTitle: "Revenue Insights",
    tagline: "Know your daily and monthly numbers in real-time",
    description:
      "Ask your assistant how your store performed today, this week, or this month. Get instant totals, bestsellers, and growth trends without running manual reports.",
    iconName: "TrendingUp",
    badge: "Live Analytics",
    conversation: [
      {
        id: "cr-1",
        sender: "user",
        text: "How much did we make this month so far?",
        timestamp: "02:14 PM",
      },
      {
        id: "cr-2",
        sender: "bot",
        text: "📊 *September Revenue Summary*\n\n💰 Total Sales: *₦1,420,000*\n📦 Completed Orders: *48*\n📈 Growth: *+18.4%* vs last month\n\n🏆 *Top 2 Performers:*\n1. Adire Silk Shift Dress (18 sold)\n2. Ann's Love Bubu (14 sold)\n\nOutstanding collectable debt: *₦65,000*",
        timestamp: "02:14 PM",
      },
      {
        id: "cr-3",
        sender: "user",
        text: "What about yesterday alone?",
        timestamp: "02:15 PM",
      },
      {
        id: "cr-4",
        sender: "bot",
        text: "Yesterday you closed *₦185,000* across 5 orders! 🚀 Highest single order was ₦62,000 to Dr. Folake.",
        timestamp: "02:15 PM",
      },
    ],
  },
  {
    id: "track-stock",
    title: "Check stock & inventory alerts",
    shortTitle: "Stock Control",
    tagline: "Prevent overselling with automatic low-stock radar",
    description:
      "Check available sizes and colours before responding to a customer. Receive proactive alerts when hot-selling items are running out.",
    iconName: "Package",
    badge: "Smart Inventory",
    conversation: [
      {
        id: "ts-1",
        sender: "user",
        text: "Do we still have the Velvet Kaftan in Wine Red Size XL?",
        timestamp: "11:05 AM",
      },
      {
        id: "ts-2",
        sender: "bot",
        text: "🔍 Checking stock for *Velvet Kaftan*:\n\n• Wine Red (Size M): 4 in stock\n• Wine Red (Size L): 2 in stock\n• Wine Red (Size XL): *1 left in store*\n\n⚠️ Low stock warning on XL! Want me to reserve it for a customer?",
        timestamp: "11:05 AM",
      },
      {
        id: "ts-3",
        sender: "user",
        text: "Set Wine Red XL to out of stock for now",
        timestamp: "11:06 AM",
      },
      {
        id: "ts-4",
        sender: "bot",
        text: "👌 Updated! *Velvet Kaftan (Wine Red, XL)* is now marked as *Sold Out* on your public storefront.",
        timestamp: "11:06 AM",
      },
    ],
  },
  {
    id: "lookup-orders",
    title: "Look up orders & measurements",
    shortTitle: "Customer CRM",
    tagline: "Customer history and tailoring specs at your fingertips",
    description:
      "When a returning customer messages you, quickly verify their past purchases, pending deliveries, and saved bespoke body measurements.",
    iconName: "Search",
    badge: "Client History",
    conversation: [
      {
        id: "lo-1",
        sender: "user",
        text: "What did Mrs. Alabi order last month and what's her bust measurement?",
        timestamp: "04:40 PM",
      },
      {
        id: "lo-2",
        sender: "bot",
        text: "👤 *Customer: Mrs. Kemi Alabi*\n📞 +234 803 291 0021\n\n📋 *Recent Orders:*\n• Order #791: 2-Piece Linen Co-ord (₦38,000) — Delivered ✅\n\n📏 *Saved Body Profile:*\n• Bust: 40\"\n• Waist: 34\"\n• Hips: 44\"\n• Dress Length: 58\"\n\nNo active unpaid balance.",
        timestamp: "04:40 PM",
      },
    ],
  },
  {
    id: "check-debts",
    title: "Track outstanding customer debts",
    shortTitle: "Debt Radar",
    tagline: "Clear visibility into deposits, balances, and credit sales",
    description:
      "Keep friendly relationships without losing money. See who owes for fabric or part payments with one simple prompt.",
    iconName: "AlertCircle",
    badge: "Debt Tracking",
    conversation: [
      {
        id: "cd-1",
        sender: "user",
        text: "Give me a quick list of all customers who still owe balance",
        timestamp: "09:12 AM",
      },
      {
        id: "cd-2",
        sender: "bot",
        text: "💳 *Outstanding Balances (3 Customers)*\n\n1. *Amaka Obi* — ₦25,000 (Agbada Set balance)\n2. *Blessing E.* — ₦18,500 (Fitting pending)\n3. *Tolu Davies* — ₦8,000 (Alteration fee)\n\n📌 Total uncollected: *₦51,500*\n\nReply *\"Remind Amaka\"* to send a payment link via WhatsApp.",
        timestamp: "09:12 AM",
      },
      {
        id: "cd-3",
        sender: "user",
        text: "Send reminder to Amaka",
        timestamp: "09:13 AM",
      },
      {
        id: "cd-4",
        sender: "bot",
        text: "✉️ Friendly reminder sent to Amaka with Paystack payment link for ₦25,000. I'll notify you as soon as she pays!",
        timestamp: "09:13 AM",
      },
    ],
  },
];
