# Pineapple WhatsApp Bot

Node.js WhatsApp bot with a web management panel, QR-based WhatsApp linking, configurable auto-replies, utility commands, and an optional OpenAI-powered `.ai` command.

## Deploy on Railway
1. Push this project to a GitHub repository you own or can write to.
2. Create a Railway service from that repository and use the included Dockerfile.
3. Add `OPENAI_API_KEY` in Railway Variables to enable `.ai`; optionally set `OPENAI_MODEL` (defaults to `gpt-4o-mini`). Never commit API keys or WhatsApp session files.
4. Configure persistent storage for `auth_info_baileys` before relying on long-term WhatsApp sessions.
5. Protect the management panel with authentication before exposing it publicly. The current panel is a starter and must be secured before production use.

## Commands
- `.help` — command menu
- `.ping` — latency check
- `.ai <question>` — AI response (requires `OPENAI_API_KEY`)
- `.weather <city>` — weather lookup
- `.calc <expression>` — arithmetic
- `.qrcode <text>` — QR code image
- `.sticker` / `.s` — sticker helper
- `.matrix` — harmless text animation

The previous credential-cracking and denial-of-service simulation commands have been removed.
