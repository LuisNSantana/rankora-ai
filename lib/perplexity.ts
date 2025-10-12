// Simple Perplexity API client for business insights enrichment


export async function queryPerplexity({ query, apiKey }: { query: string; apiKey: string }) {
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "pplx-70b-online",
      messages: [
        { role: "system", content: "You are a business analyst assistant. Answer concisely and with actionable insights." },
        { role: "user", content: query },
      ],
      max_tokens: 512,
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error("Perplexity API error");
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}
