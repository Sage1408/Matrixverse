import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request) {
  try {
    const body = await request.json();
    const { trade } = body;

    if (!trade) {
      return Response.json({ success: false, error: "No trade data provided" }, { status: 400 });
    }

    const prompt = `
You are an expert forex trading coach analyzing a trader's trade.

Here are the trade details:
- Pair: ${trade.pair}
- Direction: ${trade.direction}
- Entry Price: ${trade.entry_price}
- Stop Loss: ${trade.stop_loss}
- Take Profit: ${trade.take_profit}
- Lot Size: ${trade.lot_size}
- Profit/Loss: $${trade.pnl}
- Risk:Reward Ratio: ${trade.rr_ratio}R
- Strategy Used: ${trade.strategy || "Not specified"}
- Emotion Before Trade: ${trade.emotion_before || "Not specified"}
- Emotion After Trade: ${trade.emotion_after || "Not specified"}
- Notes: ${trade.notes || "None"}

Analyze this trade and respond with valid JSON only. No extra text before or after. Use this exact format:
{
  "score": <number 0-100>,
  "entry_quality": "<Good | Average | Poor> - <short explanation>",
  "rr_assessment": "<Good | Average | Poor> - <short explanation>",
  "risk_management": "<Good | Average | Poor> - <short explanation>",
  "emotional_flags": "<any emotional red flags detected or None detected>",
  "pattern_detected": "<any trading patterns detected or None detected>",
  "suggestions": [
    "<suggestion 1>",
    "<suggestion 2>",
    "<suggestion 3>"
  ],
  "summary": "<2 sentence overall summary of this trade>"
}
`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a professional forex trading coach. Always respond with valid JSON only. No markdown, no extra text.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
    });

    const content = completion.choices[0].message.content;
    const cleaned = content.replace(/```json|```/g, "").trim();
    const result = JSON.parse(cleaned);

    return Response.json({ success: true, analysis: result });

  } catch (error) {
    console.error("AI Analyze Error:", error.message);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}