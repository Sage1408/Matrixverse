export async function GET() {
  try {
    const res = await fetch("https://nfs.faireconomy.media/ff_calendar_thisweek.json");
    const data = await res.json();
    const sorted = data.sort((a, b) => new Date(a.date) - new Date(b.date));
    return Response.json({ success: true, events: sorted });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
