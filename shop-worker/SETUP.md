# Shop Worker — Setup Guide

Complete these steps in order. Everything in **Step 9** is the only change needed to switch from test mode to live.

---

## Step 1 — Create a Stripe account (Canada) and get test keys

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com) and create an account.
2. When prompted for your country, choose **Canada**. This sets CAD as your default currency and configures Canadian payouts.
3. In the Dashboard, make sure the toggle in the top-right reads **Test mode**.
4. Go to **Developers → API keys**.
5. Copy the two keys — you will need them in Step 5:
   - **Publishable key** — starts with `pk_test_…` (not used by the Worker, but keep it handy)
   - **Secret key** — starts with `sk_test_…` → this is `STRIPE_SECRET_KEY`

---

## Step 2 — Create an R2 bucket and upload your files

1. Log in to the [Cloudflare dashboard](https://dash.cloudflare.com) and open **R2 Object Storage**.
2. Create a new bucket named exactly **`haig-tabs`** (matches `bucket_name` in `wrangler.toml`).
   - Leave **Default storage class** as Standard.
   - Do **not** enable public access — the bucket must stay private.
3. Upload your PDF and ZIP files. The R2 key (filename in the bucket) must match the `r2Key` field in the product catalog inside `src/index.js`:

   | Product    | R2 key             |
   |------------|--------------------|
   | afm-vol1   | `afm-vol1.pdf`     |
   | afm-vol2   | `afm-vol2.pdf`     |
   | solo       | `solo-guitar.pdf`  |
   | vg-1–5     | `vg-1.pdf` … `vg-5.pdf` |
   | vg-bundle  | `vg-bundle.zip`    |
   | pop-1–4    | `pop-1.pdf` … `pop-4.pdf` |
   | pop-bundle | `pop-bundle.zip`   |

---

## Step 3 — Set up Resend and verify your domain

1. Create a free account at [resend.com](https://resend.com).
2. Go to **Domains → Add Domain** and enter `haigbeylerian.com`.
3. Resend will show you a set of DNS records to add. These typically include:
   - **TXT** — a DKIM key at a subdomain like `resend._domainkey.haigbeylerian.com`
   - **TXT** — an SPF record update on the root domain
   - **MX** — (only needed if you want Resend to receive replies; optional for sending)
4. Add each record in the **Cloudflare DNS** dashboard for `haigbeylerian.com`.
   - Use **DNS only** (grey cloud), not proxied, for all Resend records.
5. Back in Resend, click **Verify** and wait for all records to show a green checkmark (usually under 5 minutes with Cloudflare).
6. Go to **API Keys → Create API Key** → give it a name like `haig-shop` → copy the key → this is `RESEND_API_KEY`.

> **From address:** The Worker sends from `tabs@haigbeylerian.com`. Resend requires you to have verified the domain (`haigbeylerian.com`) — you do not need to create that mailbox anywhere; it is purely a sender address. Replies will go to that address, so you may want to add a Cloudflare Email Routing rule forwarding `tabs@haigbeylerian.com` to your real inbox.

---

## Step 4 — Install dependencies

```bash
cd shop-worker
npm install
```

This installs `stripe` and `wrangler`.

---

## Step 5 — Set Worker secrets

Run each command and paste the value when prompted. **Never put these in `wrangler.toml`.**

```bash
# From inside shop-worker/
npx wrangler secret put STRIPE_SECRET_KEY
# paste: sk_test_…

npx wrangler secret put STRIPE_WEBHOOK_SECRET
# paste: (get this in Step 7 — come back here after deploying)

npx wrangler secret put RESEND_API_KEY
# paste: re_…

npx wrangler secret put DOWNLOAD_SIGNING_SECRET
# paste: any long random string, e.g. output of:
#   node -e "console.log(require('crypto').randomBytes(40).toString('hex'))"
```

`STRIPE_WEBHOOK_SECRET` starts with `whsec_`. You get it in Step 7 — set the other three now and come back for the last one.

---

## Step 6 — Deploy the Worker

```bash
cd shop-worker
npm run deploy
```

Wrangler will print the Worker URL (something like `https://haig-shop.<your-subdomain>.workers.dev`).

### Add the custom domain `shop.haigbeylerian.com`

1. In the Cloudflare dashboard, go to **Workers & Pages → haig-shop → Settings → Domains & Routes**.
2. Click **Add Custom Domain** and enter `shop.haigbeylerian.com`.
3. Cloudflare automatically creates the DNS record and provisions an SSL certificate. No manual DNS steps needed.

The Worker is now reachable at `https://shop.haigbeylerian.com`.

---

## Step 7 — Configure the Stripe webhook and get the signing secret

1. In the Stripe Dashboard (still in **Test mode**), go to **Developers → Webhooks → Add endpoint**.
2. Set the endpoint URL to:
   ```
   https://shop.haigbeylerian.com/webhook
   ```
3. Under **Events to listen to**, select:
   - `checkout.session.completed`
4. Click **Add endpoint**.
5. On the webhook detail page, reveal the **Signing secret** — it starts with `whsec_`.
6. Go back to your terminal and run:
   ```bash
   cd shop-worker
   npx wrangler secret put STRIPE_WEBHOOK_SECRET
   # paste: whsec_…
   ```

---

## Step 8 — Run a full end-to-end test purchase

1. Open [haigbeylerian.com](https://haigbeylerian.com) in a browser, navigate to **Tabs**, and click any product card.
2. You should be redirected to a Stripe Checkout page.
3. Use Stripe's test card:
   - **Card number:** `4242 4242 4242 4242`
   - **Expiry:** any future date (e.g. `12/34`)
   - **CVC:** any 3 digits
   - **Email:** a real inbox you can check
4. Complete the purchase. Stripe redirects you back to the site with `?purchase=success` — the banner should appear.
5. Within a few seconds, check the email you entered. You should receive the download link email from `tabs@haigbeylerian.com`.
6. Click the link — the file should download from `shop.haigbeylerian.com/download?token=…`.
7. In the Stripe Dashboard under **Developers → Webhooks**, confirm the `checkout.session.completed` event shows a green `200` response.

**Test a cancelled payment:** click a card, then click **Back** on the Stripe page. You should land back on the site with the "no charge was made" banner.

**Test an expired link:** In `src/index.js`, temporarily change `86400` (line with `+ 86400`) to `1`, redeploy, buy again, wait 2 seconds, then click the link — you should see the expiry page. Revert the change and redeploy when done.

---

## Step 9 — Switch to live keys (one step)

> Do this only after the full test run passes.

1. In the Stripe Dashboard, flip the toggle from **Test mode** to **Live mode**.
2. Get your **live secret key** (`sk_live_…`) from **Developers → API keys**.
3. Create a new live webhook endpoint at `https://shop.haigbeylerian.com/webhook` (same as Step 7, but in live mode) and copy its `whsec_live_…` signing secret.
4. Run:
   ```bash
   cd shop-worker
   npx wrangler secret put STRIPE_SECRET_KEY
   # paste: sk_live_…

   npx wrangler secret put STRIPE_WEBHOOK_SECRET
   # paste: whsec_live_…
   ```

That is the entire change. `RESEND_API_KEY` and `DOWNLOAD_SIGNING_SECRET` stay the same. The Worker redeploys automatically when secrets are updated on the next request — no `npm run deploy` needed.

---

## Tax note

You flagged this already, but for completeness: selling digital goods directly makes you the seller of record. As a Canadian supplier under the $30 000 CAD small-supplier GST/HST threshold, you are not required to register for or collect GST/HST. Nothing in this codebase assumes tax collection — prices are charged as-is with no tax line. If you cross the threshold in the future, you would add a `tax_id_collection` or `automatic_tax` option to the Stripe Checkout session config.
