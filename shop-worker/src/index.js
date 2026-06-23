import Stripe from 'stripe';

// ── Product catalog ──────────────────────────────────────────────────────────
// amount is in cents CAD. Update placeholder names before going live.

const PRODUCTS = {
  'afm-vol1': {
    name:     'Armenian Folk Music for Guitar',
    amount:   3000,
    r2Key:    'Haig Beylerian - Armenian Folk Music for Guitar vol 1.pdf',
    filename: 'Haig Beylerian - Armenian Folk Music for Guitar vol 1.pdf',
  },
  'afm-vol2': {
    name:     'Armenian Folk Music for Guitar, Vol. 2',
    amount:   3000,
    r2Key:    'Haig Beylerian - Armenian Folk Music for Guitar vol 2.pdf',
    filename: 'Haig Beylerian - Armenian Folk Music for Guitar vol 2.pdf',
  },
  'solo': {
    name:     'Solo Guitar',
    amount:   3000,
    r2Key:    'Haig Beylerian - Solo Guitar.pdf',
    filename: 'Haig Beylerian - Solo Guitar.pdf',
  },
  'vg-1': { name: 'Super Mario Bros. — Overworld Theme', amount: 500, r2Key: 'Super Mario Bros - Overworld Theme.pdf', filename: 'Super Mario Bros - Overworld Theme.pdf' },
  'vg-2': { name: 'Super Mario Bros. 2 — Overworld Theme', amount: 500, r2Key: 'Super Mario Bros 2 - Overworld Theme.pdf', filename: 'Super Mario Bros 2 - Overworld Theme.pdf' },
  'vg-3': { name: 'Super Mario Bros. 3 — Overworld Theme', amount: 500, r2Key: 'Super Mario Bros 3 - Overworld Theme.pdf', filename: 'Super Mario Bros 3 - Overworld Theme.pdf' },
  'vg-4': { name: 'Super Mario World — Castle Theme', amount: 500, r2Key: 'Super Mario World - Castle Theme.pdf', filename: 'Super Mario World - Castle Theme.pdf' },
  'vg-5': { name: 'Hollow Knight — Dirtmouth', amount: 500, r2Key: 'Hollow Knight - Dirtmouth.pdf', filename: 'Hollow Knight - Dirtmouth.pdf' },
  'vg-bundle': {
    name:     'Video Game Transcriptions — Complete (5)',
    amount:   2000,
    r2Key:    'vg-bundle.zip',
    filename: 'Haig Beylerian - Video Game Transcriptions Complete.zip',
  },
  'pop-1': { name: 'Smells Like Teen Spirit — Nirvana', amount: 500, r2Key: 'Nirvana - Smells Like Teen Spirit.pdf', filename: 'Nirvana - Smells Like Teen Spirit.pdf' },
  'pop-2': { name: 'Black Hole Sun — Soundgarden', amount: 500, r2Key: 'Soundgarden - Black Hole Sun.pdf', filename: 'Soundgarden - Black Hole Sun.pdf' },
  'pop-3': { name: 'How Deep Is Your Love — Bee Gees', amount: 500, r2Key: 'Bee Gees - How Deep Is Your Love.pdf', filename: 'Bee Gees - How Deep Is Your Love.pdf' },
  'pop-4': { name: 'Dancing Queen — ABBA', amount: 500, r2Key: 'ABBA - Dancing Queen.pdf', filename: 'ABBA - Dancing Queen.pdf' },
  'pop-bundle': {
    name:     'Pop Song Transcriptions — Complete (4)',
    amount:   1500,
    r2Key:    'pop-bundle.zip',
    filename: 'Haig Beylerian - Pop Song Transcriptions Complete.zip',
  },
};

// ── CORS ─────────────────────────────────────────────────────────────────────

function allowedOrigin(request) {
  const origin = request.headers.get('Origin') ?? '';
  if (origin === 'https://haigbeylerian.com') return origin;
  if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return origin;
  return 'https://haigbeylerian.com';
}

function corsHeaders(request) {
  return {
    'Access-Control-Allow-Origin':  allowedOrigin(request),
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

// ── HMAC download tokens (Web Crypto, no external deps) ──────────────────────

function toB64URL(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function fromB64URL(str) {
  return Uint8Array.from(
    atob(str.replace(/-/g, '+').replace(/_/g, '/')),
    c => c.charCodeAt(0),
  );
}

async function hmacKey(secret, usage) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    [usage],
  );
}

async function generateToken(productId, r2Key, filename, secret) {
  const exp     = Math.floor(Date.now() / 1000) + 86400; // 24 h
  const payload = toB64URL(new TextEncoder().encode(JSON.stringify({ productId, r2Key, filename, exp })));
  const key     = await hmacKey(secret, 'sign');
  const sig     = toB64URL(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload)));
  return `${payload}.${sig}`;
}

async function verifyToken(token, secret) {
  const dot = token.lastIndexOf('.');
  if (dot < 1) return null;

  const payload = token.slice(0, dot);
  const sig     = token.slice(dot + 1);
  const key     = await hmacKey(secret, 'verify');

  const valid = await crypto.subtle.verify(
    'HMAC', key,
    fromB64URL(sig),
    new TextEncoder().encode(payload),
  );
  if (!valid) return null;

  const data = JSON.parse(new TextDecoder().decode(fromB64URL(payload)));
  if (data.exp < Math.floor(Date.now() / 1000)) return null;
  return data;
}

// ── Email ─────────────────────────────────────────────────────────────────────

async function sendDownloadEmail(to, productName, downloadUrl, resendApiKey) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from:    'Haig Beylerian <tabs@haigbeylerian.com>',
      to,
      subject: `Your download is ready: ${productName}`,
      html: `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0"
             style="background:#ffffff;max-width:560px;width:100%;border-radius:3px;overflow:hidden;">

        <!-- header -->
        <tr>
          <td style="background:#0b0b0b;padding:24px 40px;">
            <p style="margin:0;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;
                      color:#3a9eb5;font-weight:600;">Haig Beylerian</p>
          </td>
        </tr>

        <!-- body -->
        <tr>
          <td style="padding:40px;color:#333333;">
            <h1 style="margin:0 0 6px;font-size:24px;font-weight:400;color:#111111;">
              Thanks for your purchase.
            </h1>
            <p style="margin:0 0 28px;font-size:13px;color:#999999;">${productName}</p>

            <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#555555;">
              Your file is ready to download. Click the button below — the link
              is active for <strong>24 hours</strong>, so please save the file to your
              device as soon as you can.
            </p>

            <!-- download button -->
            <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td style="background:#0b0b0b;border-radius:2px;">
                  <a href="${downloadUrl}"
                     style="display:inline-block;padding:14px 32px;font-size:11px;font-weight:600;
                            letter-spacing:0.1em;text-transform:uppercase;color:#f0f0f0;
                            text-decoration:none;">
                    Download Now &rarr;
                  </a>
                </td>
              </tr>
            </table>

            <!-- expiry callout -->
            <table cellpadding="0" cellspacing="0"
                   style="background:#f8f8f8;border-left:3px solid #3a9eb5;
                          margin-bottom:28px;width:100%;">
              <tr>
                <td style="padding:14px 18px;font-size:13px;line-height:1.7;color:#666666;">
                  If your link has expired before you download, simply reply to this email
                  and I'll send you a fresh one right away.
                </td>
              </tr>
            </table>

            <!-- plain-text fallback link -->
            <p style="font-size:12px;color:#aaaaaa;line-height:1.6;margin:0;">
              Button not working? Copy this link into your browser:<br>
              <a href="${downloadUrl}" style="color:#3a9eb5;word-break:break-all;">
                ${downloadUrl}
              </a>
            </p>
          </td>
        </tr>

        <!-- footer -->
        <tr>
          <td style="background:#f8f8f8;padding:18px 40px;border-top:1px solid #eeeeee;">
            <p style="margin:0;font-size:11px;color:#bbbbbb;line-height:1.6;">
              You received this because you purchased
              <em>${productName}</em> at haigbeylerian.com.<br>
              Questions? Just reply to this email.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend ${res.status}: ${body}`);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function jsonResp(data, status, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extra },
  });
}

function htmlResp(title, bodyHtml, status = 200) {
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8">
    <meta name="viewport" content="width=device-width">
    <title>${title}</title>
    <style>
      body{font-family:'Helvetica Neue',sans-serif;max-width:520px;margin:80px auto;
           padding:0 1.5rem;color:#333;background:#fafafa}
      h1{font-size:1.3rem;font-weight:400;color:#111;margin-bottom:.5rem}
      p{font-size:.9rem;line-height:1.8;color:#666}
      a{color:#3a9eb5}
    </style>
    </head><body><h1>${title}</h1>${bodyHtml}</body></html>`,
    { status, headers: { 'Content-Type': 'text/html;charset=UTF-8' } },
  );
}

function stripeClient(secretKey) {
  return new Stripe(secretKey, {
    apiVersion:  '2023-10-16',
    httpClient:  Stripe.createFetchHttpClient(),
  });
}

// ── Handlers ──────────────────────────────────────────────────────────────────

async function handleCreateCheckout(request, env) {
  let productId;
  try {
    ({ productId } = await request.json());
  } catch {
    return jsonResp({ error: 'Invalid JSON body' }, 400, corsHeaders(request));
  }

  const product = PRODUCTS[productId];
  if (!product) {
    return jsonResp({ error: 'Unknown product' }, 400, corsHeaders(request));
  }

  const stripe  = stripeClient(env.STRIPE_SECRET_KEY);
  const session = await stripe.checkout.sessions.create({
    mode:                 'payment',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency:     'cad',
        unit_amount:  product.amount,
        product_data: { name: product.name },
      },
      quantity: 1,
    }],
    metadata:    { productId },
    success_url: `${env.SITE_URL}/?purchase=success`,
    cancel_url:  `${env.SITE_URL}/?purchase=cancelled`,
  });

  return jsonResp({ url: session.url }, 200, corsHeaders(request));
}

async function handleWebhook(request, env) {
  const body = await request.text();
  const sig  = request.headers.get('stripe-signature');

  const stripe = stripeClient(env.STRIPE_SECRET_KEY);

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      sig,
      env.STRIPE_WEBHOOK_SECRET,
      undefined,
      Stripe.createSubtleCryptoProvider(),
    );
  } catch (err) {
    console.error('Stripe signature verification failed:', err.message);
    return new Response(`Webhook error: ${err.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session   = event.data.object;
    const productId = session.metadata?.productId;
    const email     = session.customer_details?.email;

    if (!productId || !email) {
      // Log and return 200 so Stripe doesn't retry a permanently malformed event
      console.error('Missing productId or email on session', session.id);
      return new Response('OK');
    }

    const product = PRODUCTS[productId];
    if (!product) {
      console.error('Unknown productId in webhook:', productId, 'session:', session.id);
      return new Response('OK');
    }

    try {
      const token       = await generateToken(productId, product.r2Key, product.filename, env.DOWNLOAD_SIGNING_SECRET);
      const downloadUrl = `${env.WORKER_BASE}/download?token=${encodeURIComponent(token)}`;
      await sendDownloadEmail(email, product.name, downloadUrl, env.RESEND_API_KEY);
    } catch (err) {
      // Return 500 so Stripe retries delivery — idempotent since the token is time-based
      console.error('Failed to send download email:', err);
      return new Response('Email delivery failed', { status: 500 });
    }
  }

  return new Response('OK');
}

async function handleDownload(request, env) {
  const token = new URL(request.url).searchParams.get('token');

  if (!token) {
    return htmlResp('Invalid Link', '<p>No download token was provided.</p>', 400);
  }

  let payload;
  try {
    payload = await verifyToken(token, env.DOWNLOAD_SIGNING_SECRET);
  } catch {
    payload = null;
  }

  if (!payload) {
    return htmlResp(
      'Link Expired or Invalid',
      `<p>This download link has expired or is not valid.</p>
       <p>Links are active for <strong>24 hours</strong> from the time of purchase.
       If yours has expired, reply to your purchase confirmation email and Haig will
       send a new one.</p>
       <p><a href="https://haigbeylerian.com">&larr; Back to haigbeylerian.com</a></p>`,
    );
  }

  const object = await env.R2_BUCKET.get(payload.r2Key);
  if (!object) {
    console.error('R2 key not found:', payload.r2Key);
    return htmlResp(
      'File Not Found',
      `<p>There was a problem retrieving your file. Please email
       <a href="mailto:tabs@haigbeylerian.com">tabs@haigbeylerian.com</a>
       and it will be sorted out promptly.</p>`,
      500,
    );
  }

  const contentType = payload.filename.endsWith('.zip') ? 'application/zip' : 'application/pdf';

  return new Response(object.body, {
    headers: {
      'Content-Type':        contentType,
      'Content-Disposition': `attachment; filename="${payload.filename}"`,
      'Cache-Control':       'no-store, no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

// ── Router ────────────────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const { method }   = request;
    const { pathname } = new URL(request.url);

    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    if (method === 'POST' && pathname === '/create-checkout') {
      return handleCreateCheckout(request, env);
    }

    if (method === 'POST' && pathname === '/webhook') {
      return handleWebhook(request, env);
    }

    if (method === 'GET' && pathname === '/download') {
      return handleDownload(request, env);
    }

    return new Response('Not found', { status: 404 });
  },
};
