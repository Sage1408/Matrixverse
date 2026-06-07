import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req) {
  try {
    const { action, trades, query, userId } = await req.json();

    if (action === "chat") {
      return handleChat(trades, query);
    }
    if (action === "weekly") {
      return handleWeekly(trades);
    }
    return handleAnalyze(trades);
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

async function handleAnalyze(trades) {
  const prompt = `You are an expert trading coach. Analyze this trader's complete trade history and give deep insights.

Here are ALL their trades (${trades.length} total):
${JSON.stringify(trades, null, 2)}

Respond with valid JSON only. No extra text. Use this exact format:
{
  "score": <overall trading score 0-100>,
  "total_trades": ${trades.length},
  "win_rate": <calculated win rate as number 0-100>,
  "net_pnl": <total PnL as number>,
  "avg_rr": <average RR ratio as number>,
  "streak_best": <longest win streak>,
  "streak_current": <current win/loss streak>,
  "best_pair": "<pair with most profit>",
  "worst_pair": "<pair with most loss>",
  "emotional_patterns": "<key emotional patterns observed across trades>",
  "biggest_strength": "<what the trader does best>",
  "biggest_weakness": "<what needs most improvement>",
  "revenge_trading_detected": <true/false>,
  "overtrading_detected": <true/false>,
  "improvement_tip": "<one actionable tip to improve immediately>",
  "summary": "<3-4 sentence overall assessment>"
}`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: "You are a professional forex trading coach. Respond with valid JSON only. No markdown." },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,
  });

  const content = completion.choices[0].message.content;
  const cleaned = content.replace(/```json|```/g, "").trim();
  return Response.json({ success: true, analysis: JSON.parse(cleaned) });
}

async function handleChat(trades, query) {
  const prompt = `You are a knowledgeable trading coach answering a trader's question.

Trader's trade history (${trades.length} total):
${JSON.stringify(trades, null, 2)}

The trader asks: "${query}"

Give a helpful, specific answer based on their actual trade data. Reference specific trades or patterns when relevant. Be honest but encouraging. Keep the answer to 3-5 sentences.

Respond with JSON:
{
  "answer": "<your coaching response>",
  "suggested_focus": "<one thing they should work on>"
}`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: "You are a professional forex trading coach. Respond with valid JSON only." },
      { role: "user", content: prompt },
    ],
    temperature: 0.5,
  });

  const content = completion.choices[0].message.content;
  const cleaned = content.replace(/```json|```/g, "").trim();
  return Response.json({ success: true, ...JSON.parse(cleaned) });
}

async function handleWeekly(trades) {
  const thisWeek = trades.filter(t => {
    const d = new Date(t.traded_at);
    const now = new Date();
    const weekAgo = new Date(now - 7 * 86400000);
    return d >= weekAgo;
  });

  const prompt = `You are a trading coach generating a weekly performance report.

This week's trades (${thisWeek.length} total):
${JSON.stringify(thisWeek, null, 2)}

Respond with JSON only:
{
  "week_trades": ${thisWeek.length},
  "week_pnl": <total PnL this week>,
  "week_win_rate": <win rate 0-100>,
  "best_trade": "<best trade pair and PnL>",
  "worst_trade": "<worst trade pair and PnL>",
  "verdict": "<winning or losing week summary>",
  "focus_next_week": "<one specific thing to focus on next week>",
  "encouragement": "<one encouraging sentence>"
}`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: "You are a professional trading coach. Respond with valid JSON only." },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,
  });

  const content = completion.choices[0].message.content;
  const cleaned = content.replace(/```json|```/g, "").trim();
  return Response.json({ success: true, ...JSON.parse(cleaned) });
}
