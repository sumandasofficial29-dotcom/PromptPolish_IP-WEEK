const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

export async function callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY not found in environment variables. Please add it to your .env file.");
  }

  const fetch = (await import("node-fetch")).default;
  const response = await fetch(GROQ_ENDPOINT, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.4
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error: ${err}`);
  }

  const data = await response.json() as any;
  return data.choices[0].message.content.trim();
}