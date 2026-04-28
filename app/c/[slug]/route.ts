import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { signSession } from '@/lib/cloaker-crypto'

export const runtime = 'nodejs'

// ─── Bot UA patterns (expanded) ──────────────────────────────────────────────

const BOT_UA_PATTERNS = [
  // Social / review crawlers
  'facebookexternalhit', 'facebot', 'facebookcatalog', 'meta-externalagent',
  'bytespider', 'tiktokspider', 'tiktok',
  'googlebot', 'google-structured-data-testing-tool', 'google-inspectiontool',
  'googleweblight', 'adsbot-google', 'mediapartners-google', 'google-adstransparency',
  'bingbot', 'msnbot', 'adidxbot', 'bingpreview',
  'applebot', 'twitterbot', 'linkedinbot', 'snapchat', 'pinterestbot',
  'outbrain', 'taboola', 'mgid',

  // SEO crawlers
  'semrushbot', 'ahrefsbot', 'mj12bot', 'dotbot', 'petalbot', 'rogerbot',
  'screaming frog', 'seokicks', 'sistrix', 'yandexbot', 'baiduspider',
  'duckduckbot', 'exabot', 'sogou', 'ia_archiver',

  // Generic bot signals
  'spider', 'crawler', 'scraper', 'bot/', '/bot',

  // Headless / automation
  'headlesschrome', 'phantomjs', 'selenium', 'puppeteer', 'playwright',
  'webdriver', 'htmlunit', 'cypress', 'nightmare',

  // HTTP libraries / CLI tools
  'python-requests', 'python-urllib', 'python/3', 'python/2',
  'go-http-client', 'okhttp', 'axios/', 'node-fetch',
  'curl/', 'wget/', 'java/', 'ruby', 'perl/',

  // Ad verification / brand-safety
  'adscore', 'integral-ads', 'doubleverify', 'moat/', 'iasds01',
  'protected media', 'whiteops', 'human security',

  // Messaging / preview
  'whatsapp', 'slackbot', 'discordbot', 'telegrambot', 'skype',
  'viber', 'line/', 'kakaotalk',
]

function detectBot(ua: string): { isBot: boolean; reason: string } {
  if (!ua || ua.trim().length < 10) return { isBot: true, reason: 'empty_ua' }
  const lower = ua.toLowerCase()
  for (const pattern of BOT_UA_PATTERNS) {
    if (lower.includes(pattern)) return { isBot: true, reason: `ua:${pattern}` }
  }

  // Accept-Language: missing or suspiciously short often signals a crawler
  // (handled in route via header check below)

  return { isBot: false, reason: '' }
}

// ─── Route ───────────────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const ua = request.headers.get('user-agent') ?? ''
  const acceptLang = request.headers.get('accept-language') ?? ''
  const referer = request.headers.get('referer') ?? ''
  const country = request.headers.get('x-vercel-ip-country') ?? ''

  // Preserve all tracking / click IDs from the original URL
  const url = new URL(request.url)
  const clickParams = ['fbclid', 'gclid', 'ttclid', 'kwclid', 'msclkid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
  const preserved: Record<string, string> = {}
  clickParams.forEach(k => { const v = url.searchParams.get(k); if (v) preserved[k] = v })

  const { data: cloaker } = await supabaseAdmin
    .from('cloakers')
    .select('id, safe_url, destination_url, is_active, allowed_countries')
    .eq('slug', slug)
    .maybeSingle()

  if (!cloaker || !cloaker.is_active) {
    return NextResponse.redirect('https://www.google.com', { status: 302 })
  }

  const { isBot, reason } = detectBot(ua)

  // Country filter
  const countries: string[] = cloaker.allowed_countries ?? []
  const countryBlocked = countries.length > 0 && country && !countries.includes(country)

  // Accept-Language empty = likely bot
  const langBlocked = !acceptLang && !isBot

  const verdict = isBot || countryBlocked || langBlocked ? 'bot' : 'human'
  const botReason = isBot ? reason : countryBlocked ? `country:${country}` : langBlocked ? 'no_lang' : null

  void supabaseAdmin.from('cloaker_clicks').insert({
    cloaker_id: cloaker.id,
    verdict,
    bot_reason: botReason,
    user_agent: ua.slice(0, 250),
    country: country || null,
    referer: referer.slice(0, 300) || null,
  })

  void supabaseAdmin.rpc('increment_cloaker_clicks', {
    p_id: cloaker.id,
    p_is_bot: verdict === 'bot',
  })

  if (verdict === 'bot') {
    return NextResponse.redirect(cloaker.safe_url || 'https://www.google.com', { status: 302 })
  }

  const sessionToken = signSession(slug)
  // Embed preserved params + destination into session so go/[token] can append them
  const encodedParams = encodeURIComponent(JSON.stringify(preserved))

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
      // ── Fingerprint checks ──────────────────────────────────────────────
      function fp(){
        try{
          // 1. WebDriver / automation flags
          if(navigator.webdriver)return'webdriver';
          if(window.callPhantom||window._phantom||window.__nightmare)return'phantom';
          if(/HeadlessChrome/i.test(navigator.userAgent))return'headless_chrome';

          // 2. Fake Chrome UA (no window.chrome object)
          if(/chrome/i.test(navigator.userAgent)&&!(/edg|opr|brave/i.test(navigator.userAgent))&&!window.chrome)return'fake_chrome';

          // 3. No plugins on desktop Chrome
          if(typeof navigator.plugins==='object'&&navigator.plugins.length===0
            &&/chrome/i.test(navigator.userAgent)&&!/edg|opr|brave|mobile/i.test(navigator.userAgent))return'no_plugins';

          // 4. Language list empty
          if(!navigator.languages||navigator.languages.length===0)return'no_languages';

          // 5. Screen too small
          if(screen.width<400||screen.height<400)return'small_screen';

          // 6. Zero CPU cores
          if(typeof navigator.hardwareConcurrency!=='undefined'&&navigator.hardwareConcurrency<1)return'no_cpu';

          // 7. WebGL — virtual GPU detection
          try{
            var gl=document.createElement('canvas').getContext('webgl')||document.createElement('canvas').getContext('experimental-webgl');
            if(gl){
              var dbg=gl.getExtension('WEBGL_debug_renderer_info');
              if(dbg){
                var renderer=(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)||'').toLowerCase();
                if(/swiftshader|llvmpipe|virtualbox|vmware|microsoft basic/i.test(renderer))return'virtual_gpu';
              }
            }
          }catch(e){}

          // 8. Canvas fingerprint — blank canvas = headless
          try{
            var cv=document.createElement('canvas');
            cv.width=200;cv.height=50;
            var ctx=cv.getContext('2d');
            if(ctx){
              ctx.textBaseline='top';ctx.font='14px Arial';
              ctx.fillStyle='#f60';ctx.fillRect(125,1,62,20);
              ctx.fillStyle='#069';ctx.fillText('FlowBot©',2,15);
              ctx.fillStyle='rgba(102,204,0,0.7)';ctx.fillText('FlowBot©',4,17);
              var hash=cv.toDataURL();
              if(!hash||hash==='data:,'||hash.length<100)return'blank_canvas';
            }
          }catch(e){}

          // 9. Timezone — inconsistency with browser locale
          try{
            var tz=Intl.DateTimeFormat().resolvedOptions().timeZone;
            if(!tz||tz==='UTC')return'utc_tz';
          }catch(e){}

          // 10. Permission API — denied in most headless environments
          try{
            if(navigator.permissions){
              navigator.permissions.query({name:'notifications'}).then(function(r){});
            }
          }catch(e){}

          // 11. Touch on "mobile" UA without touch API
          if(/mobile|android/i.test(navigator.userAgent)&&!('ontouchstart' in window)&&navigator.maxTouchPoints===0)return'fake_mobile';

          // 12. Connection type check
          var conn=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
          if(conn&&conn.effectiveType==='2g'&&screen.width>1200)return'suspicious_conn';

          return null;
        }catch(e){return null}
      }

      // ── Mouse / touch behavior gate (200ms) ─────────────────────────────
      var moved=false;
      function onMove(){moved=true;}
      document.addEventListener('mousemove',onMove,{once:true,passive:true});
      document.addEventListener('touchstart',onMove,{once:true,passive:true});

      function send(verdict){
        fetch('/api/cloakers/verify',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({slug:'${slug}',verdict:verdict,params:'${encodedParams}'})
        })
        .then(function(r){return r.json()})
        .then(function(d){if(d.token)window.location.replace('/c/go/'+d.token);else window.location.replace('${cloaker.safe_url || 'https://www.google.com'}')})
        .catch(function(){window.location.replace('${cloaker.safe_url || 'https://www.google.com'}')});
      }

      // Run fingerprint immediately, wait up to 400ms for mouse movement
      var fpResult=fp();
      if(fpResult){send('s');return;}

      var deadline=setTimeout(function(){send('h')},400);
      document.addEventListener('mousemove',function(){clearTimeout(deadline);send('h')},{once:true,passive:true});
      document.addEventListener('touchstart',function(){clearTimeout(deadline);send('h')},{once:true,passive:true});
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
      'X-Content-Type-Options': 'nosniff',
    },
  })

  response.cookies.set('_ck', sessionToken, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600,
    path: '/',
  })

  return response
}
