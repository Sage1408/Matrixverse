const countryToCurrency = {
  "USD": "USD", "EUR": "EUR", "GBP": "GBP", "JPY": "JPY",
  "CHF": "CHF", "CAD": "CAD", "AUD": "AUD", "NZD": "NZD",
  "CNY": "CNY", "NOK": "NOK", "SEK": "SEK",
  "All": "All",
};

const majorPairs = {
  "USD": ["EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF", "USD/CAD", "AUD/USD", "NZD/USD"],
  "EUR": ["EUR/USD", "EUR/GBP", "EUR/JPY", "EUR/CHF"],
  "GBP": ["GBP/USD", "EUR/GBP", "GBP/JPY", "GBP/CHF"],
  "JPY": ["USD/JPY", "EUR/JPY", "GBP/JPY", "AUD/JPY", "CHF/JPY"],
  "CHF": ["USD/CHF", "EUR/CHF", "GBP/CHF"],
  "CAD": ["USD/CAD", "EUR/CAD", "GBP/CAD"],
  "AUD": ["AUD/USD", "AUD/JPY", "AUD/NZD", "AUD/CAD"],
  "NZD": ["NZD/USD", "AUD/NZD", "NZD/JPY"],
};

export async function GET() {
  try {
    const res = await fetch("https://nfs.faireconomy.media/ff_calendar_thisweek.json");
    const raw = await res.json();

    const events = raw.map(e => {
      const currency = countryToCurrency[e.country] || e.country;
      return {
        date: e.date,
        currency,
        pairs: majorPairs[currency] || [],
        title: e.title,
        impact: e.impact === "Holiday" ? "low" : (e.impact || "low"),
        actual: e.actual || null,
        forecast: e.forecast || null,
        previous: e.previous || null,
      };
    });

    const sorted = events.sort((a, b) => new Date(a.date) - new Date(b.date));
    return Response.json({ success: true, events: sorted });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
