// ============================================================
//  QUANTUM LAB — SUPABASE CONFIGURATION
//  ⚠️  Replace the two values below with your actual keys.
//  Get them from: supabase.com → Project → Settings → API
// ============================================================

const SUPABASE_URL = 'https://iojkeauhcwztmtdimxka.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvamtlYXVoY3d6dG10ZGlteGthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMzE5ODcsImV4cCI6MjA5MjcwNzk4N30.gdcOMBNbRTgDCWflB1BE916bYKKPu0qcMgtGMPb6PwU';

// Create client (supabase-js CDN must be loaded BEFORE this file)
const qlSupabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Auth Guard ───────────────────────────────────────────────
// Add these two tags to every protected page's <head>:
//   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
//   <script src="supabase-config.js"></script>
// Then call qlAuthGuard() at the top of each page's <script>.
// ─────────────────────────────────────────────────────────────
async function qlAuthGuard() {
  // Hide page until auth check completes (prevents flash of content)
  document.body.style.visibility = 'hidden';

  const { data: { session } } = await qlSupabase.auth.getSession();

  if (!session) {
    window.location.replace('login.html');
    return null;
  }

  document.body.style.visibility = 'visible';
  _qlInjectUserUI(session.user);
  return session.user;
}

// ── Inject user badge + logout into any page nav ─────────────
function _qlInjectUserUI(user) {
  const name = user.user_metadata?.name
    || user.email?.split('@')[0]
    || 'User';

  // Inject styles once
  if (!document.getElementById('_ql-auth-style')) {
    const s = document.createElement('style');
    s.id = '_ql-auth-style';
    s.textContent = `
      #_ql-badge {
        display:flex; align-items:center; gap:.55rem; margin-left:.75rem; flex-shrink:0;
      }
      #_ql-name {
        font-size:.8rem; font-weight:500; color:#7a91ad;
        max-width:130px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
        font-family:'Inter',system-ui,sans-serif;
      }
      #_ql-logout {
        padding:.28rem .7rem; background:transparent;
        border:1px solid rgba(255,45,85,.45); border-radius:6px;
        color:#ff2d55; font-size:.76rem; font-weight:600; cursor:pointer;
        font-family:'Inter',system-ui,sans-serif; transition:all .2s;
      }
      #_ql-logout:hover { background:rgba(255,45,85,.12); border-color:#ff2d55; }

      /* Floating pill for pages that have no .q-nav */
      #_ql-pill {
        position:fixed; top:10px; right:14px; z-index:9999;
        display:flex; align-items:center; gap:.45rem;
        background:rgba(6,13,30,.92); border:1px solid rgba(0,212,255,.22);
        border-radius:100px; padding:.28rem .75rem;
        backdrop-filter:blur(14px); font-family:'Inter',system-ui,sans-serif;
        box-shadow:0 4px 20px rgba(0,0,0,.4);
      }
      #_ql-pill span { font-size:.76rem; color:#7a91ad; font-weight:500; }
      #_ql-pill button {
        padding:.18rem .5rem; background:transparent;
        border:1px solid rgba(255,45,85,.4); border-radius:100px;
        color:#ff2d55; font-size:.7rem; font-weight:600; cursor:pointer;
        font-family:inherit; transition:all .2s;
      }
      #_ql-pill button:hover { background:rgba(255,45,85,.12); }
    `;
    document.head.appendChild(s);
  }

  const nav = document.querySelector('.q-nav');
  if (nav) {
    const badge = document.createElement('div');
    badge.id = '_ql-badge';
    badge.innerHTML = `<span id="_ql-name">👤 ${name}</span>
      <button id="_ql-logout" onclick="qlSignOut()">Logout</button>`;
    nav.appendChild(badge);
  } else {
    // Pages with custom headers (flight, bridge, qkd, bomb)
    const pill = document.createElement('div');
    pill.id = '_ql-pill';
    pill.innerHTML = `<span>👤 ${name}</span>
      <button onclick="qlSignOut()">Logout</button>`;
    document.body.appendChild(pill);
  }
}

// ── Sign out ─────────────────────────────────────────────────
async function qlSignOut() {
  await qlSupabase.auth.signOut();
  window.location.replace('login.html');
}
