/* Whisperwood v8 — Tristan AI bridge
   Add <script src="ai.js"></script> AFTER app.js in index.html.
*/
(function () {
  const SETTINGS_KEY = "whisperwood-ai-settings";

  function getSettings() {
    try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; }
    catch (_) { return {}; }
  }
  function saveSettings(s) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  }

  function ensureSettingsUI() {
    const card = document.querySelector("#settings .settings-card");
    if (!card || document.getElementById("tristanAISettings")) return;

    const wrap = document.createElement("div");
    wrap.id = "tristanAISettings";
    wrap.innerHTML = `
      <div class="setting-heading" style="margin-top:18px">Tristan AI</div>
      <label style="display:grid;gap:6px;color:#d9d0c1;font-size:11px;margin:9px 0">
        <span>Backend URL</span>
        <input id="aiEndpoint" type="url" placeholder="https://your-worker.example.workers.dev"
          style="background:#121916;color:var(--cream);border:1px solid var(--line);border-radius:12px;padding:10px 11px;outline:none">
      </label>
      <label style="display:grid;gap:6px;color:#d9d0c1;font-size:11px;margin:9px 0">
        <span>Private access token</span>
        <input id="aiToken" type="password" placeholder="Your Whisperwood access token" autocomplete="off"
          style="background:#121916;color:var(--cream);border:1px solid var(--line);border-radius:12px;padding:10px 11px;outline:none">
      </label>
      <label style="display:grid;gap:6px;color:#d9d0c1;font-size:11px;margin:9px 0">
        <span>Model</span>
        <input id="aiModel" type="text" value="gpt-5.6-terra"
          style="background:#121916;color:var(--cream);border:1px solid var(--line);border-radius:12px;padding:10px 11px;outline:none">
      </label>
      <div id="aiStatus" style="font-size:10px;color:#aaa29a;padding:5px 0 10px">AI not connected yet.</div>
      <button class="secondary" id="saveAISettings">Save Tristan AI connection</button>
    `;
    card.insertBefore(wrap, card.firstElementChild);

    const s = getSettings();
    document.getElementById("aiEndpoint").value = s.endpoint || "";
    document.getElementById("aiToken").value = s.token || "";
    document.getElementById("aiModel").value = s.model || "gpt-5.6-terra";
    updateStatus();

    document.getElementById("saveAISettings").onclick = function () {
      saveSettings({
        endpoint: document.getElementById("aiEndpoint").value.trim(),
        token: document.getElementById("aiToken").value.trim(),
        model: document.getElementById("aiModel").value.trim() || "gpt-5.6-terra"
      });
      updateStatus();
      if (typeof toast === "function") toast("Tristan AI connection saved ✦");
    };
  }

  function updateStatus() {
    const s = getSettings();
    const e = document.getElementById("aiStatus");
    if (!e) return;
    e.textContent = s.endpoint && s.token ? "✦ AI connection ready — Tristan is backed by an AI." : "AI not connected yet.";
    e.style.color = s.endpoint && s.token ? "var(--rose2)" : "var(--muted)";
  }

  function buildRequest(input) {
    const s = getSettings();
    const recent = state.messages.slice(-18).map(m => ({
      role: m.type === "me" ? "user" : "assistant",
      type: m.type,
      text: m.text
    }));
    return {
      model: s.model || "gpt-5.6-terra",
      character: state.character,
      protagonist: "Persephone",
      relationship: state.relationship,
      scene: state.scene,
      memories: state.memories.slice(0, 20),
      recentMessages: recent,
      userMessage: input
    };
  }

  async function askTristan(input) {
    const s = getSettings();
    if (!s.endpoint || !s.token) throw new Error("Connect Tristan AI in Settings first.");
    const response = await fetch(s.endpoint.replace(/\/$/, ""), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + s.token
      },
      body: JSON.stringify(buildRequest(input))
    });
    let data = {};
    try { data = await response.json(); } catch (_) {}
    if (!response.ok) throw new Error(data.error || ("AI bridge returned HTTP " + response.status));
    if (!data.reply) throw new Error("AI bridge returned no reply.");
    return data;
  }

  function applyAI(data) {
    const r = data.relationship || {};
    ["points", "trust", "closeness", "tension"].forEach(k => {
      if (Number.isFinite(r[k])) state.relationship[k] = Math.max(0, Math.min(100, r[k]));
    });
    if (typeof stageFor === "function") state.relationship.stage = stageFor(state.relationship.points).id;
    if (data.mood) state.scene.mood = String(data.mood).slice(0, 60);
    if (data.sceneDescription) state.scene.description = String(data.sceneDescription).slice(0, 220);
    if (data.reason) state.relationship.lastChange = String(data.reason).slice(0, 180);
    if (Array.isArray(data.memories) && typeof addMemory === "function") {
      data.memories.slice(0, 3).forEach(m => {
        if (m && m.text) addMemory(state, String(m.text).slice(0, 240), m.kind || "AI memory", m.weight || 2);
      });
    }
  }

  function installAIChat() {
    if (window.__whisperwoodAIInstalled) return;
    window.__whisperwoodAIInstalled = true;

    const originalSend = window.sendMessage || (typeof sendMessage === "function" ? sendMessage : null);
    if (!originalSend) return;

    window.sendMessage = async function () {
      const box = document.getElementById("message");
      const input = box && box.value.trim();
      const cfg = getSettings();

      if (!input || state.busy) return;

      /* If the AI bridge isn't configured, preserve the original v7 behaviour. */
      if (!cfg.endpoint || !cfg.token) {
        return originalSend();
      }

      state.busy = true;
      appendMessage("me", input);
      if (typeof markFlags === "function") markFlags(input);
      if (typeof addMemory === "function") addMemory(state, `Persephone said: “${input.slice(0, 160)}”`, "Conversation memory", 1);
      save();
      renderAll();
      box.value = "";

      try {
        if (state.settings.typingPause) {
          await new Promise(r => setTimeout(r, 450 + Math.random() * 650));
        }

        const data = await askTristan(input);

        if (data.action) appendMessage("action", String(data.action));
        appendMessage("them", String(data.reply));
        applyAI(data);

        if (state.settings.events && Math.random() < 0.18 && typeof chooseEvent === "function") {
          const ev = chooseEvent();
          if (ev) fireEvent(ev);
        }
      } catch (err) {
        appendMessage("action", "*The connection to Tristan flickers for a moment.*");
        appendMessage("them", "I'm still here. The connection just isn't cooperating.");
        if (typeof toast === "function") toast(err.message || "AI connection failed.");
      }

      state.busy = false;
      save();
      renderAll();
    };

    /* Rebind the actual controls after app.js has attached its v7 handlers. */
    const sendButton = document.getElementById("send");
    if (sendButton) sendButton.onclick = () => window.sendMessage();

    const messageBox = document.getElementById("message");
    if (messageBox) {
      messageBox.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          window.sendMessage();
        }
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    ensureSettingsUI();
    installAIChat();
  });
})();
