import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { signSession } from '@/lib/cloaker-crypto'

export const runtime = 'nodejs'

const BOT_UA_PATTERNS = [
  'facebookexternalhit', 'facebot', 'facebookcatalog', 'meta-externalagent',
  'bytespider', 'tiktokspider', 'tiktok',
  'googlebot', 'google-structured-data-testing-tool', 'google-inspectiontool',
  'googleweblight', 'adsbot-google', 'mediapartners-google',
  'bingbot', 'msnbot', 'adidxbot',
  'applebot', 'twitterbot', 'linkedinbot', 'snapchat',
  'semrushbot', 'ahrefsbot', 'mj12bot', 'dotbot', 'petalbot', 'rogerbot',
  'screaming frog', 'seokicks', 'sistrix',
  'spider', 'crawler', 'scraper', 'bot/', '/bot',
  'headlesschrome', 'phantomjs', 'selenium', 'puppeteer', 'playwright',
  'webdriver', 'htmlunit', 'python-requests', 'python-urllib',
  'go-http-client', 'okhttp', 'axios/', 'node-fetch',
  'curl/', 'wget/', 'java/',
  'adscore', 'integral-ads', 'doubleverify', 'moat/', 'iasds01',
  'whatsapp', 'slackbot', 'discordbot', 'telegrambot',
]

function detectBot(ua: string): { isBot: boolean; reason: string } {
  if (!ua || ua.trim().length < 10) return { isBot: true, reason: 'empty_ua' }
  const lower = ua.toLowerCase()
  for (const pattern of BOT_UA_PATTERNS) {
    if (lower.includes(pattern)) return { isBot: true, reason: `ua:${pattern}` }
  }
  return { isBot: false, reason: '' }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const ua = request.headers.get('user-agent') ?? ''

  const { data: cloaker } = await supabaseAdmin
    .from('cloakers')
    .select('id, safe_url, is_active')
    .eq('slug', slug)
    .maybeSingle()

  if (!cloaker || !cloaker.is_active) {
    return NextResponse.redirect('https://www.google.com', { status: 302 })
  }

  const { isBot, reason } = detectBot(ua)

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

  if (isBot) {
    return NextResponse.redirect(cloaker.safe_url, { status: 302 })
  }

  // Sign a session cookie so /api/cloakers/verify can confirm this browser
  // actually visited this cloaker page (prevents direct token farming)
  const sessionToken = signSession(slug)

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
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
      function fp(){
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
      var result=fp();
      fetch('/api/cloakers/verify',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({slug:'${slug}',verdict:result?'s':'h'})
      })
      .then(function(r){return r.json()})
      .then(function(d){
        if(d.token)window.location.replace('/c/go/'+d.token);
        else window.location.replace('https://www.google.com');
      })
      .catch(function(){window.location.replace('https://www.google.com')});
    }();
  </script>
</body>
</html>`

  const response = new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  })

  response.cookies.set('_ck', sessionToken, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600, // 10 minutes, matches verifySession window
    path: '/',
  })

  return response
}
