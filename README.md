# Whisperwood v8 — Tristan AI

This is the AI layer for the existing Whisperwood v7 app. It deliberately does NOT replace your existing app files.

## 1. Add the browser file

Upload `ai.js` to the root of the Whisperwood GitHub repository.

Then open `index.html` and find:

```html
<script src="app.js"></script>
```

Immediately after it, add:

```html
<script src="ai.js"></script>
```

Commit the change.

## 2. Deploy the backend

The `backend/worker.js` file is a Cloudflare Worker. It keeps your OpenAI API key off GitHub Pages.

Create a Cloudflare Worker and paste in `backend/worker.js`.

Set these Worker secrets/variables:

- `OPENAI_API_KEY` = your OpenAI API key
- `WHISPERWOOD_ACCESS_TOKEN` = a long random password you create
- `OPENAI_MODEL` = `gpt-5.6-terra` (optional)
- `ALLOWED_ORIGIN` = `https://persephone1018.github.io` (recommended)

Do NOT put the OpenAI key into Whisperwood or into GitHub.

## 3. Connect Whisperwood

Open Whisperwood → Settings.

A new “Tristan AI” section will appear.

Enter:
- Backend URL = your Cloudflare Worker HTTPS URL
- Private access token = the exact same `WHISPERWOOD_ACCESS_TOKEN`
- Model = `gpt-5.6-terra`

Tap “Save Tristan AI connection”.

## What v8 changes

When the bridge is configured, the old keyword/canned-response engine is bypassed.

Each message sends Tristan's:
- character dossier
- current relationship state
- current scene
- recent conversation
- selected memories

The AI is instructed that:
- Tristan is guarded with everyone else, but NOT with Persephone.
- He can be playful, cheeky, teasing, affectionate and flirtatious with her.
- He should match her energy instead of sounding like a mysterious one-line romance robot.
- He must not control Persephone's dialogue, emotions or choices.
- Relationship changes and useful memories can be returned to Whisperwood and saved locally.

If the AI bridge is not configured, the existing v7 scripted behaviour remains as a fallback.

## Important

Your OpenAI API key must stay on the backend. OpenAI recommends never deploying an API key in browser/mobile client code and routing requests through your own backend.
