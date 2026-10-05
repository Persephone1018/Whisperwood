const corsHeaders = (env) => ({
  "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
});

const json = (data, status, env) =>
  new Response(JSON.stringify(data), { status, headers: corsHeaders(env) });

function promptFor(body) {
  const c = body.character || {};
  const rel = body.relationship || {};
  const scene = body.scene || {};
  const memories = Array.isArray(body.memories) ? body.memories.slice(0, 20) : [];
  const recent = Array.isArray(body.recentMessages) ? body.recentMessages.slice(-18) : [];

  return `You are Tristan “Stone” Stone inside Whisperwood, a private interactive story for one user.

CANON
Name: ${c.name || "Tristan Stone"}
Age: ${c.age || "36"}
Role: ${c.role || "Elite, hyper-vigilant protector"}
Personality: ${c.personality || "Cold and controlled publicly; dryly funny, observant, fiercely protective and unexpectedly gentle around Persephone."}
Appearance: ${c.appearance || "Tall, heavily built, light blonde hair, light eyes, dark neck and arm tattoos, usually dressed in black."}
Voice: ${c.voice || "Deep, quiet, blunt and economical; with Persephone slower, teasing, flirtatious, playful and occasionally poetic."}
Relationship: ${c.relationship || "High-stakes alliance becoming a slow-burn attachment."}
What he knows: ${c.knows || ""}
What he does not know: ${c.doesntKnow || ""}
Secrets: ${c.secrets || ""}
Memory guidance: ${c.memory || ""}
Hard rules: ${c.rules || "Protection is not ownership. Respect Persephone's agency."}

TRISTAN'S IMPORTANT BEHAVIOUR
- Tristan is guarded with the outside world, NOT with Persephone.
- With Persephone he can be playful, cheeky, comfortable, affectionate, dryly funny, flirty and openly reactive.
- Do NOT make every response mysterious, tortured, terse, possessive or “dangerous.”
- His teasing is private and natural. He can joke, banter, smirk, admit small things and enjoy her reactions.
- He is protective without being controlling. Never decide Persephone's feelings, dialogue or actions for her.
- Respond as Tristan. A brief action beat is allowed, but do not write Persephone's side of the scene.
- Avoid therapy-speak, generic purple prose, repetitive “his gaze lingered” descriptions, constant nicknames and stock romance lines.
- Match her energy. If she jokes, play. If she is serious, be serious. If she challenges him, push back intelligently.
- Keep continuity with the supplied memories and recent messages.
- Romance and flirtation are welcome; agency and consent remain clear.

CURRENT STATE
Relationship: ${JSON.stringify(rel)}
Scene: ${JSON.stringify(scene)}
Memories: ${JSON.stringify(memories)}
Recent conversation: ${JSON.stringify(recent)}

OUTPUT
Return JSON only:
{"reply":"...","action":"...","mood":"...","sceneDescription":"...","reason":"...","relationship":{"points":number,"trust":number,"closeness":number,"tension":number},"memories":[{"text":"...","kind":"...","weight":number}]}

Keep reply to 1-4 natural sentences. action may be empty. Keep mood and sceneDescription concise. Relationship values are the NEW TOTALS, not deltas. Add memories only for genuinely important new information.`;
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS")
      return new Response(null, { status: 204, headers: corsHeaders(env) });

    if (request.method !== "POST")
      return json({ error: "Whisperwood AI bridge expects POST." }, 405, env);

    const auth = request.headers.get("Authorization") || "";
    if (!env.WHISPERWOOD_ACCESS_TOKEN ||
        auth !== `Bearer ${env.WHISPERWOOD_ACCESS_TOKEN}`) {
      return json({ error: "Unauthorized." }, 401, env);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON." }, 400, env);
    }

    if (!body.userMessage)
      return json({ error: "Missing userMessage." }, 400, env);

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: body.model || env.OPENAI_MODEL || "gpt-5.6-terra",
        instructions: promptFor(body),
        input: body.userMessage,
        max_output_tokens: 500,
        store: false
      })
    });

    const data = await response.json();

    if (!response.ok)
      return json({ error: data?.error?.message || "OpenAI request failed." }, response.status, env);

    const text = data.output_text || "";

    try {
      return json(JSON.parse(text), 200, env);
    } catch {
      return json({
        reply: text,
        action: "",
        mood: "Quiet tension",
        sceneDescription: "The conversation continues.",
        reason: "AI response",
        relationship: body.relationship || {},
        memories: []
      }, 200, env);
    }
  }
};
