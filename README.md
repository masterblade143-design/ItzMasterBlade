# Anonymous inbox: setup (about 10 minutes, free)

Your site stays on GitHub Pages. This small backend runs on Cloudflare (free plan, no card needed)
and stores messages in its own database. No Firebase, no email.

## Setup
You need Node.js installed and a free Cloudflare account. Run these inside this folder.

1. **Log in:** `npx wrangler login`
2. **Create the database:** `npx wrangler d1 create profile-inbox`
   Copy the `database_id` it prints into `wrangler.toml`.
3. **Create the tables:** `npx wrangler d1 execute profile-inbox --remote --file=schema.sql`
4. **Set your site's address** in `wrangler.toml` → `ALLOWED_ORIGIN`
   (example: `https://yourname.github.io`, no path, no trailing slash).
5. **Set your private password (admin token).** Make a long random one first:
   `node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"`
   then run `npx wrangler secret put ADMIN_TOKEN` and paste it. Save it in a password manager.
6. **Deploy:** `npx wrangler deploy`
   It prints your Worker URL, like `https://profile-inbox.yourname.workers.dev`.
7. **Connect the form:** in `index.html`, find `CONTACT_API` (near the bottom) and paste the Worker URL.
   Push to GitHub.

## Reading your messages
Open `https://YOUR-WORKER-URL/admin` and enter your admin token. You can read and delete messages.
Without the token the page shows nothing. The token is only kept in that tab and is cleared when you close it.

## What is and isn't stored
- Stored per message: the text, the topic and the time. Nothing else.
- Not stored: IP address, browser, device, cookies.
- Spam limit (5 messages per hour per visitor): uses a salted one-way hash that expires within an hour and is never
  linked to a message. Cloudflare, like any host, still sees connections in its own infrastructure.
- Protection built in: bot trap field, length limits, per-visitor rate limit, wrong-password lockout, only your site's
  origin may post, admin page shows messages as plain text (no HTML), strict security headers.

## Good to know
- The origin check stops other websites from posting through visitors' browsers. Someone using a script can still
  post directly, which is what the rate limit and bot trap are for.
- To rotate your password, run step 5 again with a new value.
- To delete everything: `npx wrangler d1 execute profile-inbox --remote --command "DELETE FROM messages"`
