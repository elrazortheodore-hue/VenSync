export default async function handler(req, res) {
  const BIN_ID = process.env.JSONBIN_ID;
  const BIN_KEY = process.env.JSONBIN_KEY;

  try {
    const configCheck = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
      headers: { 'X-Master-Key': BIN_KEY }
    });
    
    if (configCheck.ok) {
      const configData = await configCheck.json();
      if (configData.record.isPublicEnabled === false) {
        // Enforce server-level redirect trap if public mode is off
        return res.redirect(307, '/private');
      }
    } else {
      return res.redirect(307, '/private');
    }
  } catch (err) {
    return res.redirect(307, '/private');
  }

  // Render the V4 Chat interface dynamically with inline styles and scripts (> 900 lines)
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>VenSync</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#3b82f6">
<style>
/* ════════════════════════════════════════
   TOKENS
════════════════════════════════════════ */
:root {
  --bg:          #ffffff;
  --surface:     #f8f9fa;
  --surface2:    #f1f3f4;
  --border:      #e8eaed;
  --border-soft: #f1f3f4;
  --text:        #202124;
  --text-2:      #5f6368;
  --text-3:      #9aa0a6;
  --blue:        #1a73e8;
  --blue-soft:   #e8f0fe;
  --green:       #34a853;
  --red:         #ea4335;
  
  /* Theme dynamic variables */
  --oppo-blue:   #1a73e8;
  --oppo-blue-glow: rgba(26,115,232,0.10);
  --oppo-blue-grad: linear-gradient(135deg, #1a73e8 0%, #00c2ff 100%);
  
  --oppo-green:  #0f9d58;
  --oppo-green-glow: rgba(15,157,88,0.10);
  --oppo-green-grad: linear-gradient(135deg, #0f9d58 0%, #34a853 100%);

  --oppo:        var(--oppo-blue);
  --oppo-glow:   var(--oppo-blue-glow);
  --oppo-grad:   var(--oppo-blue-grad);

  --doc-bg:      #fafbff;
  --doc-border:  #c5cae9;
  --sh:          0 1px 4px rgba(0,0,0,0.07),0 1px 2px rgba(0,0,0,0.04);
  --sh-md:       0 4px 20px rgba(0,0,0,0.09),0 2px 8px rgba(0,0,0,0.04);
  --r:           12px;
  --r-sm:        8px;
  --r-pill:      999px;
  --f:           'Inter', sans-serif;
  --sw:          264px;
  --ease:        cubic-bezier(.4,0,.2,1);
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg:          #0d0d10;
    --surface:     #18181f;
    --surface2:    #22222c;
    --border:      #2a2a38;
    --border-soft: #1c1c26;
    --text:        #e8eaed;
    --text-2:      #9aa0a6;
    --text-3:      #4e535a;
    --blue:        #8ab4f8;
    --blue-soft:   rgba(138,180,248,0.09);
    --green:       #81c995;
    --red:         #f28b82;
    --oppo-blue:   #8ab4f8;
    --oppo-blue-glow: rgba(138,180,248,0.15);
    --oppo-blue-grad: linear-gradient(135deg, #8ab4f8 0%, #1a73e8 100%);
    
    --oppo-green:  #81c995;
    --oppo-green-glow: rgba(129,201,149,0.15);
    --oppo-green-grad: linear-gradient(135deg, #81c995 0%, #34a853 100%);

    --oppo:        var(--oppo-blue);
    --oppo-glow:   var(--oppo-blue-glow);
    --oppo-grad:   var(--oppo-blue-grad);
    --doc-bg:      #121219;
    --doc-border:  #33334d;
    --sh:          0 1px 4px rgba(0,0,0,0.5),0 1px 2px rgba(0,0,0,0.4);
    --sh-md:       0 4px 20px rgba(0,0,0,0.5),0 2px 8px rgba(0,0,0,0.4);
  }
}

/* Shifting animated gradient */
@keyframes shiftGrad {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
.animated-gradient {
  background: linear-gradient(-45deg, #1a73e8, #00c2ff, #1557b0, #00d2c4);
  background-size: 400% 400%;
  animation: shiftGrad 12s ease infinite;
}

/* Transforming menu hamburger to X */
.hamb-icon {
  width: 18px;
  height: 12px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
}
.hamb-icon span {
  display: block;
  width: 100%;
  height: 2px;
  background-color: var(--text-2);
  border-radius: 1px;
  transition: transform 0.38s cubic-bezier(0.68, -0.6, 0.32, 1.6), opacity 0.38s var(--ease);
}
.sidebar-open-state .menu-btn .hamb-icon .bar1 {
  transform: translateY(5px) rotate(45deg) rotate(180deg);
}
.sidebar-open-state .menu-btn .hamb-icon .bar2 {
  transform: translateY(-5px) rotate(-45deg) rotate(180deg);
}

/* Floating element micro-animation physics */
@keyframes floatAnim {
  0% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-8px) rotate(1deg); }
  100% { transform: translateY(0px) rotate(0deg); }
}
.floating-element {
  animation: floatAnim 6s ease-in-out infinite;
}

/* ════════════════════════════════════════
   RESET
════════════════════════════════════════ */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;font-family:var(--f);background:var(--bg);color:var(--text);font-size:14px;line-height:1.5;-webkit-font-smoothing:antialiased;overflow:hidden}
button{font-family:var(--f);cursor:pointer;outline:none}
textarea{font-family:var(--f)}
::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}

/* ════════════════════════════════════════
   LAYOUT
════════════════════════════════════════ */
.app{display:flex;height:100vh;height:100dvh;position:relative;overflow:hidden}

/* ════════════════════════════════════════
   SIDEBAR BACKDROP (mobile)
════════════════════════════════════════ */
.sb-backdrop{
  display:none;position:fixed;inset:0;background:rgba(0,0,0,0.4);
  z-index:199;opacity:0;transition:opacity 0.25s var(--ease);
}
.sb-backdrop.show{opacity:1}

/* ════════════════════════════════════════
   SIDEBAR
════════════════════════════════════════ */
.sidebar{
  width:var(--sw);flex-shrink:0;
  background:var(--surface);border-right:1px solid var(--border);
  display:flex;flex-direction:column;
  transition:transform 0.28s var(--ease);
  z-index:200;
}
.sidebar-head{
  padding:18px 14px 12px;
  display:flex;align-items:center;gap:10px;
  border-bottom:1px solid var(--border-soft);
}
.logo-mark{
  width:30px;height:30px;border-radius:8px;
  background:var(--oppo-grad);
  display:flex;align-items:center;justify-content:center;flex-shrink:0;
}
.logo-mark svg{width:14px;height:14px;fill:white}
.logo-text{
  font-weight:700;font-size:15px;letter-spacing:-.4px;
  background:var(--oppo-grad);-webkit-background-clip:text;
  -webkit-text-fill-color:transparent;background-clip:text;
}
.sb-close{
  margin-left:auto;display:none;
  width:28px;height:28px;border:none;background:none;
  border-radius:6px;color:var(--text-2);
  align-items:center;justify-content:center;
  transition:background .12s;
}
.sb-close:hover{background:var(--surface2)}
.sb-close svg{width:14px;height:14px;fill:currentColor}

.sb-label{
  padding:14px 14px 5px;
  font-size:10.5px;font-weight:700;letter-spacing:.9px;
  text-transform:uppercase;color:var(--text-3);
}
.chat-list{flex:1;overflow-y:auto;padding:2px 8px 8px}
.chat-item{
  padding:8px 10px;border-radius:var(--r-sm);
  cursor:pointer;display:flex;align-items:center;gap:9px;
  color:var(--text-2);font-size:13px;
  transition:background .12s,color .12s;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  user-select:none;
}
.chat-item:hover{background:var(--surface2);color:var(--text)}
.chat-item.active{background:var(--blue-soft);color:var(--blue);font-weight:500}
.chat-dot{
  width:6px;height:6px;border-radius:50%;
  background:currentColor;opacity:.45;flex-shrink:0;
}
.chat-item.active .chat-dot{opacity:1}

.sb-foot{
  padding:10px 12px;border-top:1px solid var(--border-soft);
  display:flex;align-items:center;gap:9px;
}
.av{
  width:28px;height:28px;border-radius:50%;
  background:var(--oppo-grad);flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
  font-size:11px;font-weight:700;color:white;
}
.u-name{font-size:12.5px;font-weight:500;color:var(--text)}
.u-status{font-size:11px;color:var(--green);display:flex;align-items:center;gap:4px;margin-top:1px}
.u-dot{width:5px;height:5px;border-radius:50%;background:var(--green);animation:pulse 2s infinite}

/* ════════════════════════════════════════
   MAIN PANEL
════════════════════════════════════════ */
.main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}

/* ─ Topbar ─ */
.topbar{
  height:54px;flex-shrink:0;
  border-bottom:1px solid var(--border);
  display:flex;align-items:center;padding:0 16px;gap:10px;
  background:var(--bg);
}
.menu-btn,.icon-btn{
  width:34px;height:34px;border:none;background:none;
  border-radius:var(--r-sm);color:var(--text-2);
  display:flex;align-items:center;justify-content:center;
  transition:background .12s,color .12s;flex-shrink:0;
}
.menu-btn:hover,.icon-btn:hover{background:var(--surface2);color:var(--text)}
.menu-btn svg,.icon-btn svg{width:16px;height:16px;fill:currentColor}
.topbar-title{
  flex:1;font-weight:500;font-size:14.5px;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.topbar-actions{display:flex;align-items:center;gap:4px}
.sync-badge{
  padding:4px 9px;border-radius:var(--r-pill);
  font-size:11px;font-weight:600;letter-spacing:.2px;
  background:rgba(52,168,83,.10);color:var(--green);
  border:1px solid rgba(52,168,83,.22);
  display:flex;align-items:center;gap:5px;
}
.sync-dot{width:6px;height:6px;border-radius:50%;background:var(--green);animation:pulse 2s infinite}

/* ─ Messages ─ */
.messages{
  flex:1;overflow-y:auto;overflow-x:hidden;
  padding:20px 16px 8px;
  display:flex;flex-direction:column;gap:18px;
  scroll-behavior:smooth;
}

/* ─ Message enter animation ─ */
@keyframes msgIn{
  from{opacity:0;transform:translateY(10px)}
  to{opacity:1;transform:translateY(0)}
}
.msg-group{
  display:flex;gap:10px;
  max-width:680px;align-self:flex-start;width:100%;
  animation:msgIn .22s var(--ease) both;
}
.msg-group.self{align-self:flex-end;flex-direction:row-reverse}

.msg-av{
  width:26px;height:26px;border-radius:50%;
  flex-shrink:0;margin-top:2px;
  font-size:10px;font-weight:700;color:white;
  display:flex;align-items:center;justify-content:center;
}
.msg-av.them{background:linear-gradient(135deg,#34a853,#0d9488)}
.msg-av.me{background:var(--oppo-grad)}

.msg-col{flex:1;display:flex;flex-direction:column;gap:3px;min-width:0}
.msg-meta{display:flex;align-items:baseline;gap:7px;padding:0 2px}
.msg-group.self .msg-meta{flex-direction:row-reverse}
.msg-sender{font-size:11.5px;font-weight:600}
.msg-time{font-size:10.5px;color:var(--text-3)}

.bubble{
  padding:9px 13px;
  border-radius:14px;border-bottom-left-radius:4px;
  font-size:13.5px;line-height:1.55;
  background:var(--surface);border:1px solid var(--border);
  color:var(--text);word-break:break-word;
  transition:box-shadow .15s;
}
.msg-group.self .bubble{
  border-bottom-left-radius:14px;border-bottom-right-radius:4px;
  background:var(--blue-soft);border-color:rgba(78,93,244,.18);
}

/* ─ Date divider ─ */
.date-div{
  display:flex;align-items:center;gap:10px;
  font-size:10.5px;font-weight:600;letter-spacing:.6px;
  text-transform:uppercase;color:var(--text-3);
}
.date-div::before,.date-div::after{content:'';flex:1;height:1px;background:var(--border)}

/* ════════════════════════════════════════
   DOC CARD
════════════════════════════════════════ */
.doc-card{
  border:1px solid var(--doc-border);border-radius:var(--r);
  background:var(--doc-bg);overflow:hidden;
  box-shadow:var(--sh);transition:box-shadow .2s;
  width:100%;
}
.doc-card:hover{box-shadow:var(--sh-md)}

.doc-head{
  padding:9px 12px;
  display:flex;align-items:center;gap:9px;
  border-bottom:1px solid var(--doc-border);
  background:linear-gradient(to right,var(--oppo-glow),transparent);
}
.doc-icon{
  width:26px;height:26px;border-radius:6px;
  background:var(--oppo-grad);flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
}
.doc-icon svg{width:12px;height:12px;fill:white}
.doc-title-wrap{flex:1;min-width:0}
.doc-title{font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.doc-subtitle{font-size:10.5px;color:var(--text-3);margin-top:1px}
.doc-acts{display:flex;gap:4px;flex-shrink:0}

.doc-btn{
  padding:3px 9px;border-radius:6px;
  border:1px solid var(--border);background:var(--bg);
  color:var(--text-2);font-size:11.5px;font-weight:500;
  transition:background .12s,color .12s,border-color .12s,transform .1s;
}
.doc-btn:hover{background:var(--surface2);color:var(--text)}
.doc-btn:active{transform:scale(.95)}
.doc-btn.accent{
  background:var(--oppo-glow);border-color:var(--oppo);color:var(--oppo);
}
.doc-btn.accent:hover{background:rgba(78,93,244,.2)}
.doc-btn.save-mode{
  background:rgba(52,168,83,.10);border-color:var(--green);color:var(--green);
}

/* ─ Collapse / expand body ─ */
.doc-body{overflow:hidden;transition:max-height .32s var(--ease)}
.doc-body.collapsed{max-height:72px}
.doc-body.expanded{max-height:420px}

.doc-snippet{
  padding:10px 13px;
  font-size:13px;color:var(--text-2);line-height:1.6;
  display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;
}
.doc-full{
  display:none;
  padding:10px 13px;
  font-size:13px;color:var(--text);line-height:1.7;
  white-space:pre-wrap;overflow-y:auto;max-height:360px;
}
.doc-edit{
  display:none;
  width:100%;min-height:220px;max-height:360px;
  border:none;outline:none;resize:vertical;
  background:var(--bg);color:var(--text);
  font-size:13px;line-height:1.7;
  padding:10px 13px;
  caret-color:var(--oppo);
}

/* state classes */
.doc-card.expanded .doc-snippet{display:none}
.doc-card.expanded .doc-full{display:block}
.doc-card.editing .doc-snippet{display:none}
.doc-card.editing .doc-full{display:none!important}
.doc-card.editing .doc-edit{display:block}

.doc-foot{
  padding:7px 12px;
  display:flex;align-items:center;justify-content:space-between;
  border-top:1px solid var(--doc-border);background:var(--surface);
}
.doc-stats{font-size:10.5px;color:var(--text-3);display:flex;gap:12px;align-items:center}
.copy-btn{
  padding:3px 10px;border-radius:var(--r-pill);border:none;
  background:var(--oppo-grad);color:white;
  font-size:10.5px;font-weight:600;letter-spacing:.2px;
  display:flex;align-items:center;gap:4px;
  transition:opacity .14s,transform .1s;
}
.copy-btn:hover{opacity:.88}
.copy-btn:active{transform:scale(.94)}
.copy-btn svg{width:9px;height:9px;fill:white}

/* ════════════════════════════════════════
   LINK PREVIEW CARD
════════════════════════════════════════ */
.link-card{
  border:1px solid var(--border);border-radius:var(--r);
  background:var(--surface);overflow:hidden;
  display:flex;max-width:400px;width:100%;cursor:pointer;
  transition:box-shadow .15s,border-color .15s,transform .12s;
}
.link-card:hover{box-shadow:var(--sh-md);border-color:var(--oppo);transform:translateY(-1px)}
.link-card:active{transform:scale(.99)}
.link-bar{width:3px;flex-shrink:0;background:var(--oppo-grad)}
.link-body{padding:10px 12px;flex:1;min-width:0}
.link-domain{font-size:10.5px;color:var(--text-3);display:flex;align-items:center;gap:5px;margin-bottom:3px}
.link-fav{width:11px;height:11px;border-radius:2px;background:var(--text-3);flex-shrink:0}
.link-title{font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:3px}
.link-desc{font-size:11.5px;color:var(--text-2);line-height:1.4;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.anon-tag{
  display:inline-flex;align-items:center;gap:3px;
  font-size:9.5px;font-weight:700;letter-spacing:.5px;
  padding:2px 6px;border-radius:4px;
  background:rgba(52,168,83,.10);color:var(--green);margin-top:5px;
}
.anon-tag svg{width:7px;height:7px;fill:currentColor}

/* ════════════════════════════════════════
   TYPING INDICATOR
════════════════════════════════════════ */
.typing-indicator{
  display:flex;gap:10px;max-width:200px;align-self:flex-start;
  animation:msgIn .2s var(--ease) both;
}
.typing-bubble{
  padding:10px 14px;border-radius:14px;border-bottom-left-radius:4px;
  background:var(--surface);border:1px solid var(--border);
  display:flex;align-items:center;gap:4px;
}
.typing-dot{
  width:6px;height:6px;border-radius:50%;background:var(--text-3);
  animation:typingBounce 1.2s infinite;
}
.typing-dot:nth-child(2){animation-delay:.2s}
.typing-dot:nth-child(3){animation-delay:.4s}
@keyframes typingBounce{
  0%,60%,100%{transform:translateY(0);opacity:.4}
  30%{transform:translateY(-5px);opacity:1}
}

/* ════════════════════════════════════════
   INPUT ZONE
════════════════════════════════════════ */
.input-zone{
  border-top:1px solid var(--border);
  background:var(--bg);
  padding:10px 16px 12px;
  padding-bottom:max(12px, env(safe-area-inset-bottom));
  flex-shrink:0;
}
.toolbar{display:flex;align-items:center;gap:3px;padding-bottom:8px;flex-wrap:wrap}
.tb-btn{
  padding:4px 9px;border-radius:6px;
  border:1px solid var(--border);background:none;
  color:var(--text-2);font-size:11.5px;font-weight:500;
  display:flex;align-items:center;gap:4px;
  transition:background .12s,color .12s,border-color .12s;
}
.tb-btn:hover{background:var(--surface2);color:var(--text)}
.tb-btn.on{background:var(--blue-soft);color:var(--blue);border-color:transparent}
.tb-btn svg{width:11px;height:11px;fill:currentColor}
.tb-sep{width:1px;height:18px;background:var(--border);margin:0 2px}

.input-wrap{
  display:flex;align-items:flex-end;gap:8px;
  background:var(--surface);border:1.5px solid var(--border);
  border-radius:14px;padding:7px 7px 7px 13px;
  transition:border-color .18s,box-shadow .18s;
}
.input-wrap:focus-within{
  border-color:var(--oppo);
  box-shadow:0 0 0 3px var(--oppo-glow);
}
.msg-input{
  flex:1;border:none;background:none;color:var(--text);
  font-size:13.5px;line-height:1.5;resize:none;outline:none;
  min-height:22px;max-height:130px;overflow-y:auto;
}
.msg-input::placeholder{color:var(--text-3)}

.send-btn{
  width:34px;height:34px;border-radius:10px;border:none;
  background:var(--oppo-grad);color:white;
  display:flex;align-items:center;justify-content:center;flex-shrink:0;
  transition:opacity .14s,transform .12s,box-shadow .14s;
  position:relative;overflow:hidden;
}
.send-btn:not(:disabled):hover{opacity:.9;box-shadow:0 3px 10px rgba(78,93,244,.35)}
.send-btn:not(:disabled):active{transform:scale(.9)}
.send-btn:disabled{opacity:.3;cursor:not-allowed}
.send-btn svg{width:14px;height:14px;fill:white}

/* Ripple */
.ripple{
  position:absolute;border-radius:50%;
  background:rgba(255,255,255,0.35);
  transform:scale(0);animation:rippleAnim .5s linear;
  pointer-events:none;
}
@keyframes rippleAnim{to{transform:scale(4);opacity:0}}

.paste-hint{
  text-align:center;font-size:10.5px;color:var(--text-3);
  padding-top:7px;display:flex;align-items:center;justify-content:center;gap:5px;
}
.kbd{
  padding:1px 5px;border-radius:4px;
  background:var(--surface2);border:1px solid var(--border);
  font-size:10px;font-family:monospace;color:var(--text-2);
}

/* char counter */
.char-count{
  font-size:10.5px;color:var(--text-3);
  align-self:center;white-space:nowrap;flex-shrink:0;
  transition:color .2s;
}
.char-count.warn{color:var(--red)}

/* ════════════════════════════════════════
   DRAG OVERLAY
════════════════════════════════════════ */
.drag-ov{
  position:fixed;inset:0;
  background:rgba(78,93,244,.07);
  border:2px dashed var(--oppo);
  display:none;align-items:center;justify-content:center;
  z-index:500;backdrop-filter:blur(3px);
  animation:dragFadeIn .15s var(--ease);
}
.drag-ov.on{display:flex}
@keyframes dragFadeIn{from{opacity:0}to{opacity:1}}
.drag-label{text-align:center;color:var(--oppo)}
.drag-title{font-size:22px;font-weight:700;margin-bottom:5px}
.drag-sub{font-size:13px;opacity:.65}

/* ════════════════════════════════════════
   TOAST & BADGES
════════════════════════════════════════ */
.toast{
  position:fixed;bottom:80px;left:50%;
  transform:translateX(-50%) translateY(16px);
  background:var(--text);color:var(--bg);
  padding:8px 16px;border-radius:var(--r-pill);
  font-size:12.5px;font-weight:500;
  opacity:0;pointer-events:none;z-index:600;
  white-space:nowrap;
  transition:opacity .2s var(--ease),transform .2s var(--ease);
  box-shadow:var(--sh-md);
}
.toast.show{opacity:1;transform:translateX(-50%) translateY(0)}

.msg-badge-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
  align-items: center;
}
.msg-cat-badge {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 700;
  border: 1px solid rgba(78,93,244,0.3);
  background: var(--oppo-glow);
  color: var(--oppo);
  display: inline-block;
}
.msg-status-badge {
  font-size: 8px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 2px 5px;
  border-radius: 3px;
  font-weight: 700;
  border: 1px solid var(--border);
  display: inline-block;
}
.msg-status-badge.Pending   { color: #d97706; border-color: rgba(217,119,6,0.3); background: rgba(217,119,6,0.08); }
.msg-status-badge.Started   { color: #2563eb; border-color: rgba(37,99,235,0.3); background: rgba(37,99,235,0.08); }
.msg-status-badge.Completed { color: #16a34a; border-color: rgba(22,163,74,0.3); background: rgba(22,163,74,0.08); }
.msg-status-badge.Scratch   { color: #4b5563; border-color: rgba(75,85,99,0.3); background: rgba(75,85,99,0.08); text-decoration: line-through; }
.msg-status-badge.Offline   { color: #6b7280; border-color: rgba(107,114,128,0.3); background: rgba(107,114,128,0.08); }

/* Modals */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.modal-card {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--r);
  width: 100%;
  max-width: 500px;
  box-shadow: var(--sh-md);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.modal-head {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.modal-title {
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.modal-body {
  padding: 16px;
  overflow-y: auto;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.modal-foot {
  padding: 12px 16px;
  border-top: 1px solid var(--border);
  background: var(--surface);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.form-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
  color: var(--text-2);
}
.form-input, .form-select, .form-textarea {
  width: 100%;
  padding: 8px 12px;
  border-radius: var(--r-sm);
  border: 1.5px solid var(--border);
  background: var(--bg);
  color: var(--text);
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s;
}
.form-input:focus, .form-select:focus, .form-textarea:focus {
  border-color: var(--oppo);
}

/* ════════════════════════════════════════
   PULSE
════════════════════════════════════════ */
@keyframes pulse{
  0%,100%{opacity:1;transform:scale(1)}
  50%{opacity:.5;transform:scale(.8)}
}

/* ════════════════════════════════════════
   RESPONSIVE — MOBILE
════════════════════════════════════════ */
@media (max-width:640px){
  .sidebar{
    position:fixed;left:0;top:0;height:100%;height:100dvh;
    transform:translateX(-100%);
    box-shadow:none;
  }
  .sidebar.open{
    transform:translateX(0);
    box-shadow:4px 0 24px rgba(0,0,0,.18);
  }
  .sb-close{display:flex}
  .sb-backdrop{display:block}
  .topbar{padding:0 10px}
  .messages{padding:14px 10px 6px}
  .input-zone{padding:8px 10px 10px;padding-bottom:max(10px,env(safe-area-inset-bottom))}
  .msg-group,.msg-group.self{max-width:100%}
  .link-card{max-width:100%}
  .toolbar{gap:2px}
  .tb-btn span{display:none}
  .tb-btn{padding:4px 6px}
  .paste-hint .label{display:none}
}
@media (min-width:641px) and (max-width:900px){
  :root{--sw:220px}
  .messages{padding:16px 14px 8px}
}

/* Offline pending message styling (WhatsApp style pending state) */
.msg-group.offline-pending {
  opacity: 0.7;
}
.msg-group.offline-pending .bubble {
  background: #f1f3f4 !important;
  border-color: #dadce0 !important;
  color: #5f6368 !important;
  font-style: italic;
}
.msg-group.offline-pending .link-card {
  background: #f1f3f4 !important;
  border-color: #dadce0 !important;
}
.msg-group.offline-pending .doc-card {
  background: #f1f3f4 !important;
  border-color: #dadce0 !important;
}
@media (prefers-color-scheme: dark) {
  .msg-group.offline-pending .bubble {
    background: #202124 !important;
    border-color: #303134 !important;
    color: #9aa0a6 !important;
  }
  .msg-group.offline-pending .link-card,
  .msg-group.offline-pending .doc-card {
    background: #1c1c24 !important;
    border-color: #303134 !important;
  }
}
</style>
</head>
<body>
<div class="app">

<!-- Sidebar backdrop for mobile -->
<div class="sb-backdrop" id="sbBackdrop" onclick="closeSidebar()"></div>

<!-- Sidebar -->
<aside class="sidebar" id="sidebar">
  <div class="sidebar-head">
    <div class="logo-mark">
      <svg viewBox="0 0 16 16"><path d="M8 1L2 4v4c0 3.3 2.6 6.4 6 7 3.4-.6 6-3.7 6-7V4L8 1zm-1 9.4L4.6 8l1.1-1.1L7 9.2l3.3-3.3 1.1 1.1L7 10.4z"/></svg>
    </div>
    <span class="logo-text">VenSync</span>
    <button class="sb-close" onclick="closeSidebar()">
      <svg viewBox="0 0 16 16"><path d="M12.7 3.3a1 1 0 00-1.4 0L8 6.6 4.7 3.3a1 1 0 00-1.4 1.4L6.6 8l-3.3 3.3a1 1 0 001.4 1.4L8 9.4l3.3 3.3a1 1 0 001.4-1.4L9.4 8l3.3-3.3a1 1 0 000-1.4z"/></svg>
    </button>
  </div>

  <div class="sb-label">Channels</div>
  <div class="chat-list" id="chatList">
    <!-- Categories will be dynamically rendered here as channels -->
    <div class="chat-item active" onclick="selectCategory('all', this)"><span class="chat-dot"></span>SYS_ALL</div>
  </div>

  <div class="sb-foot">
    <div class="av">PUB</div>
    <div style="flex:1; min-width:0;">
      <div class="u-name">Public Mode</div>
      <div class="u-status"><span class="u-dot"></span>Synced</div>
    </div>
    <button class="icon-btn" id="sbReloadBtn" title="Sync database now" onclick="triggerManualReload()" style="width:28px; height:28px;">
      <svg viewBox="0 0 16 16" style="width:14px; height:14px; fill:currentColor;"><path fill-rule="evenodd" d="M8 3a5 5 0 104.546 2.914.5.5 0 01.908-.417A6 6 0 118 2v1z" clip-rule="evenodd"/><path d="M8 4.4a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v3a.5.5 0 01-1 0V5.07l-2.5 2.5a.5.5 0 01-.708-.708l2.5-2.5H8.5a.5.5 0 01-.5-.5z"/></svg>
    </button>
  </div>
</aside>

<!-- Main panel -->
<main class="main">

  <!-- Topbar -->
  <div class="topbar">
    <button class="menu-btn" onclick="toggleSidebar()" aria-label="Toggle Navigation">
      <div class="hamb-icon">
        <span class="bar1"></span>
        <span class="bar2"></span>
      </div>
    </button>
    <span class="topbar-title" id="topbarTitle">Public Sync Pad</span>
    
    <!-- Topbar search field -->
    <div class="search-wrap" id="searchWrap" style="display:none; flex:1; margin:0 10px;">
      <input type="text" id="searchInput" placeholder="Search public cards..." style="width:100%; padding:4px 8px; border-radius:6px; border:1px solid var(--border); background:var(--surface); color:var(--text); font-size:12px; outline:none;" onkeyup="onSearch(this.value)">
    </div>

    <div class="topbar-actions">
      <div class="sync-badge"><span class="sync-dot"></span>Live</div>
      <button class="icon-btn" id="pwaInstallBtn" title="Install Web App" style="display:none;" onclick="triggerPwaInstall()">
        <svg viewBox="0 0 16 16" style="width:16px;height:16px;fill:currentColor;"><path d="M.5 9.9a.5.5 0 01.5.5v2.5a1 1 0 001 1h12a1 1 0 001-1v-2.5a.5.5 0 011 0v2.5a2 2 0 01-2 2H2a2 2 0 01-2-2v-2.5a.5.5 0 01.5-.5zM7.5 11.5a.5.5 0 01-1 0V2.707L4.354 4.854a.5.5 0 11-.708-.708l3-3a.5.5 0 01.708 0l3 3a.5.5 0 01-.708.708L8.5 2.707V11.5z"/></svg>
      </button>
      <button class="icon-btn" title="Share channel" onclick="copyShareLink()">
        <svg viewBox="0 0 16 16"><path d="M11 10.2a2.5 2.5 0 00-1.7.67L5.96 8.6a2.5 2.5 0 000-1.2l3.34-2.27A2.5 2.5 0 1011 3.5a2.49 2.49 0 00-1.7.67L5.96 6.44A2.5 2.5 0 103.5 10.5a2.49 2.49 0 001.7-.67l3.34 2.27A2.5 2.5 0 1011 10.2z"/></svg>
      </button>
      <button class="icon-btn" title="Search cards" id="searchBtn" onclick="toggleSearch()">
        <svg viewBox="0 0 16 16"><path d="M11.742 10.344a6.5 6.5 0 10-1.397 1.398l3.85 3.85a1 1 0 001.415-1.415l-3.868-3.833zm-5.242 1.156a5 5 0 110-10 5 5 0 010 10z"/></svg>
      </button>
      <a href="/private" class="icon-btn" title="Admin gateway door" style="text-decoration:none; display:flex; align-items:center; justify-content:center;">
        <svg viewBox="0 0 16 16" style="width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;"><path d="M9 3h4a1 1 0 011 1v8a1 1 0 01-1 1H9m-4-3l3-3-3-3m3 3H2"/></svg>
      </a>
    </div>
  </div>

  <!-- Messages / Cards thread -->
  <div class="messages" id="messages">
    <!-- Pagination Load Older button at top of chat thread -->
    <button id="loadOlderBtn" class="doc-btn" style="margin: 0 auto 10px; display: none; align-self: center;" onclick="loadOlderMessages()">Load Older Messages</button>
    <div id="msgEnd"></div>
  </div>

  <!-- Input zone -->
  <div class="input-zone">
    <div class="toolbar">
      <button class="tb-btn" onclick="openAttachModal()" title="Attach cloud document card with warning">
        <svg viewBox="0 0 16 16"><path d="M4.5 3a2.5 2.5 0 015 0v9a1.5 1.5 0 01-3 0V5a.5.5 0 011 0v7a.5.5 0 001 0V3a1.5 1.5 0 00-3 0v9a2.5 2.5 0 005 0V5a.5.5 0 011 0v7a3.5 3.5 0 01-7 0V3z"/></svg>
        <span>Attach</span>
      </button>
      <button class="tb-btn" onclick="openTagCardModal()" title="Reference an existing card">
        <svg viewBox="0 0 16 16" style="width:11px; height:11px; fill:currentColor;"><path d="M2 2a2 2 0 012-2h8a2 2 0 012 2v13.5a.5.5 0 01-.777.416L8 13.101l-5.223 3.315A.5.5 0 012 16V2zm2-1a1 1 0 00-1 1v12.566l4.636-2.943a.5.5 0 01.528 0L13 14.566V2a1 1 0 00-1-1H4z"/></svg>
        <span>Tag Card</span>
      </button>
      <button class="tb-btn" id="linkToggle" onclick="toggleLinkMode()" title="Enforce URL link validation">
        <svg viewBox="0 0 16 16"><path d="M6.354 5.5H4a3 3 0 000 6h3a3 3 0 002.83-2H9a2 2 0 01-2 1.5H4a2 2 0 010-4h2.354l1-1zM9.646 10.5H12a3 3 0 000-6H9a3 3 0 00-2.83 2H7a2 2 0 012-1.5h3a2 2 0 010 4H9.646l-1 1z"/></svg>
        <span>Link</span>
      </button>
    </div>

    <div class="input-wrap">
      <textarea
        class="msg-input" id="msgInput" rows="1"
        placeholder="Type a message, paste text, or drop a file…"
        oninput="onInput(this)"
        onpaste="onPaste(event)"
        onkeydown="onKey(event)"
      ></textarea>
      <span class="char-count" id="charCount" style="display:none"></span>
      <button class="send-btn" id="sendBtn" disabled onclick="sendMsg(event)">
        <svg viewBox="0 0 16 16"><path d="M15.854.146a.5.5 0 01.11.54l-5.819 14.547a.75.75 0 01-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 01.124-1.33L15.314.037a.5.5 0 01.54.11z"/></svg>
      </button>
    </div>
    <div class="paste-hint">
      <span class="kbd">Enter</span>
      <span class="label">Send · Large pastes auto-attach as documents</span>
    </div>
  </div>
</main>
</div>

<!-- Hidden file input -->
<input type="file" id="fileInput" accept=".txt,.md,.html,.csv,.json" style="display:none" onchange="onFileSelect(event)">

<!-- Drag overlay -->
<div class="drag-ov" id="dragOv">
  <div class="drag-label">
    <div class="drag-title">Drop to sync</div>
    <div class="drag-sub">Text files, documents, or raw text</div>
  </div>
</div>

<!-- Card Details Modal (Read-Only) -->
<div class="modal-overlay" id="detailsModal" style="display:none;">
  <div class="modal-card">
    <div class="modal-head">
      <h3 class="modal-title" id="mHeader">Card Details</h3>
      <button class="menu-btn" onclick="closeDetailsModal()" style="border:none; background:none; color:var(--text-2); cursor:pointer;"><svg viewBox="0 0 16 16" style="width:16px;height:16px;fill:currentColor;"><path d="M12.7 3.3a1 1 0 00-1.4 0L8 6.6 4.7 3.3a1 1 0 00-1.4 1.4L6.6 8l-3.3 3.3a1 1 0 001.4 1.4L8 9.4l3.3 3.3a1 1 0 001.4-1.4L9.4 8l3.3-3.3a1 1 0 000-1.4z"/></svg></button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <span class="form-label">Designation</span>
        <h2 id="mTitle" style="font-size:16px; font-weight:700; color:var(--text); word-break:break-word;"></h2>
      </div>
      <div class="form-group" id="mUrlGroup">
        <span class="form-label">Vector Path (URL)</span>
        <div style="display:flex; gap:8px;">
          <input type="text" id="mUrl" class="form-input" readonly style="flex:1; opacity:0.8;">
          <button class="doc-btn" onclick="copyCardLink()" style="flex-shrink:0;">Copy Link</button>
        </div>
      </div>
      <div class="form-group">
        <span class="form-label">Classification / Category</span>
        <span id="mCategory" class="msg-cat-badge" style="align-self:flex-start;">General</span>
      </div>
      <div class="form-group">
        <span class="form-label">Operational Notes</span>
        <div id="mNotes" style="font-family:monospace; padding:10px; border:1px solid var(--border); border-radius:var(--r-sm); background:var(--surface); font-size:12px; white-space:pre-wrap; max-height:200px; overflow-y:auto;"></div>
      </div>
    </div>
    <div class="modal-foot">
      <button id="mLaunchBtn" class="doc-btn accent" onclick="launchCardUrl()">Initiate Launch</button>
      <button class="doc-btn" onclick="closeDetailsModal()">Close</button>
    </div>
  </div>
</div>

<!-- Toast -->
<div class="toast" id="toast"></div>

<!-- Cloud Document Attachment Modal -->
<div class="modal-overlay" id="attachModal" style="display:none; z-index:1100;">
  <div class="modal-card" style="max-width: 440px; border-radius: var(--r);">
    <div class="modal-head" style="padding: 14px 16px; border-bottom: 1px solid var(--border);">
      <h3 class="modal-title">Cloud Document Attachment</h3>
      <button class="menu-btn" onclick="closeAttachModal()"><svg viewBox="0 0 16 16" style="width:16px;height:16px;fill:currentColor;"><path d="M12.7 3.3a1 1 0 00-1.4 0L8 6.6 4.7 3.3a1 1 0 00-1.4 1.4L6.6 8l-3.3 3.3a1 1 0 001.4 1.4L8 9.4l3.3 3.3a1 1 0 001.4-1.4L9.4 8l3.3-3.3a1 1 0 000-1.4z"/></svg></button>
    </div>
    <div class="modal-body" style="padding: 16px; gap: 12px;">
      <div class="form-group">
        <label class="form-label">Document Title</label>
        <input type="text" id="attachTitle" class="form-input" placeholder="e.g. System Parameters">
      </div>
      <div class="form-group">
        <label class="form-label">Document Content</label>
        <textarea id="attachContent" class="form-textarea" rows="6" placeholder="Enter text content here..."></textarea>
      </div>
      <div style="font-size: 11px; color: #b25e00; background: rgba(217,119,6,0.08); border: 1px solid rgba(217,119,6,0.3); padding: 10px; border-radius: var(--r-sm); display: flex; gap: 8px;">
        <span style="font-size: 14px;">⚠️</span>
        <div><strong>Cloud Attachment Warning:</strong> Attaching a file copies its raw content into the VenSync database. Check credentials before sharing.</div>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
        <span class="form-label">Or upload file content</span>
        <button class="doc-btn" onclick="triggerFileInput()" style="font-size:11px; padding:4px 8px;">Browse Local File</button>
      </div>
    </div>
    <div class="modal-foot" style="padding: 12px 16px; border-top: 1px solid var(--border); background: var(--surface); display: flex; justify-content: flex-end; gap: 8px;">
      <button class="doc-btn" onclick="closeAttachModal()">Abort</button>
      <button class="doc-btn accent" onclick="executeCloudAttach()">Upload & Attach</button>
    </div>
  </div>
</div>

<!-- Card Tagging Modal -->
<div class="modal-overlay" id="tagCardModal" style="display:none; z-index:1100;">
  <div class="modal-card" style="max-width: 440px; border-radius: var(--r);">
    <div class="modal-head" style="padding: 14px 16px; border-bottom: 1px solid var(--border);">
      <h3 class="modal-title">Tag Collateral Card</h3>
      <button class="menu-btn" onclick="closeTagCardModal()"><svg viewBox="0 0 16 16" style="width:16px;height:16px;fill:currentColor;"><path d="M12.7 3.3a1 1 0 00-1.4 0L8 6.6 4.7 3.3a1 1 0 00-1.4 1.4L6.6 8l-3.3 3.3a1 1 0 001.4 1.4L8 9.4l3.3 3.3a1 1 0 001.4-1.4L9.4 8l3.3-3.3a1 1 0 000-1.4z"/></svg></button>
    </div>
    <div class="modal-body" style="padding: 16px; gap: 12px;">
      <div class="form-group">
        <label class="form-label">Search Cards</label>
        <input type="text" id="tagCardSearch" class="form-input" placeholder="Type title to filter..." oninput="onTagCardSearchInput(this.value)">
      </div>
      <div id="tagCardList" style="max-height: 200px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; border: 1px solid var(--border); border-radius: var(--r-sm); padding: 6px;">
        <!-- Filled dynamically -->
      </div>
    </div>
    <div class="modal-foot" style="padding: 12px 16px; border-top: 1px solid var(--border); background: var(--surface); display: flex; justify-content: flex-end; gap: 8px;">
      <button class="doc-btn" onclick="closeTagCardModal()">Close</button>
    </div>
  </div>
</div>

<script>
/* ════════════════════════════════════════
   CLIENT DASHBOARD STATE & SCRIPTS
════════════════════════════════════════ */
let activeCategory = 'all';
let currentMessages = [];
let offset = 0;
const limit = 20;
let hasMoreMessages = false;
let searchQuery = '';
let linkModeEnforced = false;

// PWA installation triggers
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const installBtn = document.getElementById('pwaInstallBtn');
  if (installBtn) installBtn.style.display = 'inline-flex';
});

async function triggerPwaInstall() {
  if (!deferredPrompt) {
    showToast("Application is already installed or standalone.");
    return;
  }
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') {
    showToast("Installation started!");
  }
  deferredPrompt = null;
  const installBtn = document.getElementById('pwaInstallBtn');
  if (installBtn) installBtn.style.display = 'none';
}

// Initialize on load
window.addEventListener('load', () => {
  const params = new URLSearchParams(window.location.search);
  const chan = params.get('channel') || params.get('category');
  if (chan) {
    activeCategory = chan;
    document.getElementById('topbarTitle').textContent = chan;
  }

  initApp();
  
  // Dynamic refresh loop (every 5 seconds) to fetch live updates
  setInterval(pollNewMessages, 5000);

  // Register PWA service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW registration failed:', err));
  }

  // Update connection status
  updateOnlineStatus(navigator.onLine);
});

window.addEventListener('online', () => updateOnlineStatus(true));
window.addEventListener('offline', () => updateOnlineStatus(false));

function updateOnlineStatus(isOnline) {
  const statusContainer = document.querySelector('.sidebar .u-status');
  const syncBadge = document.querySelector('.sync-badge');
  const queue = JSON.parse(localStorage.getItem('vs_public_offline_queue') || '[]');
  const queueText = queue.length > 0 ? \` (\${queue.length} queued)\` : '';

  if (statusContainer) {
    if (isOnline) {
      statusContainer.innerHTML = \`<span class="u-dot" style="background:var(--green); animation:pulse 2s infinite;"></span>Synced\`;
      statusContainer.style.color = 'var(--green)';
    } else {
      statusContainer.innerHTML = \`<span class="u-dot" style="background:var(--red); animation:none;"></span>Offline\${queueText}\`;
      statusContainer.style.color = 'var(--red)';
    }
  }

  if (syncBadge) {
    if (isOnline) {
      syncBadge.innerHTML = \`<span class="sync-dot" style="background:var(--green); animation:pulse 2s infinite;"></span>Live\`;
      syncBadge.style.color = 'var(--green)';
      syncBadge.style.background = 'rgba(52,168,83,.10)';
      syncBadge.style.borderColor = 'rgba(52,168,83,.22)';
    } else {
      syncBadge.innerHTML = \`<span class="sync-dot" style="background:var(--red); animation:none;"></span>Offline\${queueText}\`;
      syncBadge.style.color = 'var(--red)';
      syncBadge.style.background = 'rgba(234,67,53,.10)';
      syncBadge.style.borderColor = 'rgba(234,67,53,.22)';
    }
  }

  if (isOnline) {
    syncOfflineQueue();
  }
}

// Continuous server pinger removed to save battery. Relying on window online event to sync queue.

async function syncOfflineQueue() {
  if (!navigator.onLine) return;
  const queue = JSON.parse(localStorage.getItem('vs_public_offline_queue') || '[]');
  if (queue.length === 0) return;

  showToast("Syncing offline queue...");
  const failed = [];

  for (const msg of queue) {
    const cleanMsg = { ...msg };
    if (cleanMsg.id && cleanMsg.id.startsWith('off-')) {
      delete cleanMsg.id; // Server generates new ID
    }
    try {
      const response = await fetch('/api/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanMsg)
      });
      if (!response.ok) {
        failed.push(msg);
      }
    } catch (e) {
      failed.push(msg);
    }
  }

  if (failed.length > 0) {
    localStorage.setItem('vs_public_offline_queue', JSON.stringify(failed));
    showToast(\`Offline sync: \${failed.length} items failed.\`);
    updateOnlineStatus(false);
  } else {
    localStorage.removeItem('vs_public_offline_queue');
    showToast("Offline messages synced!");
    updateOnlineStatus(true);
    loadMessages(true);
  }
}

/* ════════════════════════════════════════
   APP INITIALIZATION
════════════════════════════════════════ */
function initApp() {
  activeCategory = 'all';
  searchQuery = '';
  document.getElementById('searchInput').value = '';
  document.getElementById('searchWrap').style.display = 'none';
  loadMessages(true).then(() => {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#msg-')) {
      const cardId = hash.replace('#', '');
      openDetailsModal(cardId);
    }
  });
}

/* ════════════════════════════════════════
   DATA SYNCHRONIZATION
════════════════════════════════════════ */
async function loadMessages(reset = false) {
  if (reset) {
    offset = 0;
    currentMessages = [];
  }

  try {
    let url = \`/api/public?limit=\${limit}&offset=\${offset}&category=\${activeCategory}\`;
    const response = await fetch(url);
    if (response.status === 403) {
      showToast("Access Denied: Private Channel");
      activeCategory = 'General';
      document.getElementById('topbarTitle').textContent = 'General';
      history.replaceState(null, null, window.location.pathname);
      loadMessages(true);
      return;
    }
    if (!response.ok) throw new Error("Failed to load messages");

    const data = await response.json();
    
    if (reset) {
      currentMessages = data.messages || [];
    } else {
      currentMessages = currentMessages.concat(data.messages || []);
    }

    hasMoreMessages = data.hasMore;
    renderCategories(data.categories || []);
    renderMessagesList();
    updateOnlineStatus(true);
  } catch (err) {
    updateOnlineStatus(false);
    showToast("Sync pad unreachable");
    renderMessagesList();
  }
}

async function pollNewMessages() {
  if (!navigator.onLine) return;
  try {
    let url = \`/api/public?limit=\${limit}&offset=0&category=\${activeCategory}\`;
    const response = await fetch(url);
    if (response.status === 403) {
      activeCategory = 'General';
      document.getElementById('topbarTitle').textContent = 'General';
      history.replaceState(null, null, window.location.pathname);
      loadMessages(true);
      return;
    }
    if (!response.ok) return;

    const data = await response.json();
    const newMsgs = data.messages || [];
    
    if (newMsgs.length > 0 && (currentMessages.length === 0 || newMsgs[0].id !== currentMessages[0].id)) {
      loadMessages(true);
    }
  } catch (e) {}
}

function loadOlderMessages() {
  offset += limit;
  loadMessages(false);
}

/* ════════════════════════════════════════
   CATEGORIES (CHANNELS)
════════════════════════════════════════ */
function renderCategories(categoriesList) {
  const chatList = document.getElementById('chatList');
  let html = \`<div class="chat-item \${activeCategory === 'all' ? 'active' : ''}" onclick="selectCategory('all', this)"><span class="chat-dot"></span>SYS_ALL</div>\`;
  
  categoriesList.forEach(cat => {
    if (cat.toLowerCase() !== 'all') {
      html += \`<div class="chat-item \${activeCategory === cat ? 'active' : ''}" onclick="selectCategory('\${cat}', this)"><span class="chat-dot"></span>\${escapeHtml(cat)}</div>\`;
    }
  });
  chatList.innerHTML = html;
}

function selectCategory(catName, el) {
  document.querySelectorAll('.chat-item').forEach(item => item.classList.remove('active'));
  el.classList.add('active');
  activeCategory = catName;
  document.getElementById('topbarTitle').textContent = catName === 'all' ? 'Public Sync Pad' : catName;
  closeSidebar();
  loadMessages(true);
}

/* ─ Card Tag Parser ─ */
function parseCardTags(text) {
  if (!text) return '';
  const regex = /\[Card:\s*([^\]]+)\]\((msg-[^)]+|off-[^)]+)\)/g;
  return text.replace(regex, (match, title, id) => {
    return \`<span class="card-tag" onclick="openDetailsModal('\${id}'); event.stopPropagation();" style="display:inline-flex; align-items:center; gap:3px; padding:2px 6px; border-radius:4px; background:var(--blue-soft); color:var(--blue); font-size:11px; font-weight:600; cursor:pointer; border:1px solid rgba(26,115,232,0.2); margin:0 2px;">🏷️ \${escapeHtml(title)}</span>\`;
  });
}

/* ════════════════════════════════════════
   MESSAGES LIST
════════════════════════════════════════ */
function renderMessagesList() {
  const messagesDiv = document.getElementById('messages');
  const loadBtn = document.getElementById('loadOlderBtn');
  
  messagesDiv.querySelectorAll('.msg-group').forEach(b => b.remove());

  const queue = JSON.parse(localStorage.getItem('vs_public_offline_queue') || '[]');
  let merged = [...queue.filter(m => activeCategory === 'all' || m.category === activeCategory), ...currentMessages];

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    merged = merged.filter(m => 
      (m.text || '').toLowerCase().includes(q) || 
      (m.title || '').toLowerCase().includes(q) || 
      (m.category || '').toLowerCase().includes(q) || 
      (m.notes || '').toLowerCase().includes(q)
    );
  }

  const end = document.getElementById('msgEnd');

  merged.forEach(msg => {
    const msgGroup = document.createElement('div');
    const isOfflineItem = msg.id && msg.id.startsWith('off-');
    msgGroup.className = 'msg-group' + (isOfflineItem ? ' offline-pending' : '');
    msgGroup.id = \`bubble-\${msg.id}\`;

    let contentHtml = '';
    
    if (msg.type === 'link') {
      let domain = '';
      try { domain = new URL(msg.text).hostname.replace('www.', ''); } catch (e) { domain = 'link'; }
      contentHtml = \`
        <div class="link-card" onclick="openDetailsModal('\${msg.id}')">
          <div class="link-bar"></div>
          <div class="link-body">
            <div class="link-domain"><div class="link-fav"></div>\${escapeHtml(domain)}</div>
            <div class="link-title">\${parseCardTags(escapeHtml(msg.title || msg.text))}</div>
            <div class="link-desc">\${escapeHtml(msg.text)}</div>
            <div class="anon-tag"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3a2 2 0 110 4 2 2 0 010-4zm0 9.2a6.1 6.1 0 01-4.3-1.8A5 5 0 018 9.5c1.8 0 3.3.9 4.3 2A6.1 6.1 0 018 13.2z"/></svg>PUBLIC PREVIEW</div>
          </div>
        </div>\`;
    } 
    else if (msg.type === 'doc') {
      const wordCount = (msg.text || '').trim().split(/\\s+/).filter(Boolean).length;
      contentHtml = \`
        <div class="doc-card" id="card-\${msg.id}">
          <div class="doc-head">
            <div class="doc-icon"><svg viewBox="0 0 16 16"><path d="M9.5 1H3a1 1 0 00-1 1v12a1 1 0 001 1h10a1 1 0 001-1V5.5L9.5 1zM9 2.5V5h2.5M5 8h6M5 10h6M5 6h3"/></svg></div>
            <div class="doc-title-wrap" onclick="openDetailsModal('\${msg.id}')" style="cursor:pointer;">
              <div class="doc-title">\${parseCardTags(escapeHtml(msg.title || "Document Card"))}</div>
              <div class="doc-subtitle">\${wordCount} words · Click details</div>
            </div>
            <div class="doc-acts">
              <button class="doc-btn" onclick="toggleDocCardExpand('\${msg.id}')" id="expBtn-\${msg.id}">Expand</button>
            </div>
          </div>
          <div class="doc-body collapsed" id="body-\${msg.id}">
            <div class="doc-snippet">\${parseCardTags(escapeHtml(msg.text.substring(0, 150) + (msg.text.length > 150 ? '…' : '')))}</div>
            <div class="doc-full" id="full-\${msg.id}">\${parseCardTags(escapeHtml(msg.text))}</div>
          </div>
          <div class="doc-foot">
            <div class="doc-stats">
              <span>\${wordCount} words</span>
              <span>● \${isOfflineItem ? 'Offline Queue' : 'Synced'}</span>
            </div>
            <button class="copy-btn" onclick="copyCardShareLink('\${msg.id}')">
              <svg viewBox="0 0 16 16"><path d="M4 4a2 2 0 00-2 2v6a2 2 0 002 2h8a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 1h8a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z"/><path d="M6 2h4a1 1 0 011 1v1H5V3a1 1 0 011-1z"/></svg>
              Copy Link
            </button>
          </div>
        </div>\`;
    } 
    else {
      contentHtml = \`
        <div class="bubble" onclick="openDetailsModal('\${msg.id}')" style="cursor:pointer;">
          \${parseCardTags(escapeHtml(msg.text))}
        </div>\`;
    }

    const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let badgeHtml = '';
    if (msg.category && msg.category !== 'General') {
      badgeHtml += \`<span class="msg-cat-badge">\${escapeHtml(msg.category)}</span>\`;
    }
    if (isOfflineItem) {
      badgeHtml += \`<span class="msg-status-badge Offline">Offline Queue</span>\`;
    } else if (msg.status) {
      badgeHtml += \`<span class="msg-status-badge \${msg.status}">\${msg.status}</span>\`;
    }

    msgGroup.innerHTML = \`
      <div class="msg-av them">VS</div>
      <div class="msg-col">
        <div class="msg-meta">
          <span class="msg-sender">Synced Card</span>
          <span class="msg-time">\${timeStr}</span>
        </div>
        
        \${contentHtml}

        <div class="msg-badge-row">
          \${badgeHtml}
        </div>
      </div>\`;

    messagesDiv.insertBefore(msgGroup, end);
  });

  loadBtn.style.display = hasMoreMessages ? 'block' : 'none';
}

function toggleDocCardExpand(id) {
  const body = document.getElementById(\`body-\${id}\`);
  const btn = document.getElementById(\`expBtn-\${id}\`);
  
  if (body.classList.contains('collapsed')) {
    body.classList.remove('collapsed');
    body.classList.add('expanded');
    btn.innerText = "Collapse";
    document.getElementById(\`full-\${id}\`).style.display = 'block';
  } else {
    body.classList.add('collapsed');
    body.classList.remove('expanded');
    btn.innerText = "Expand";
    document.getElementById(\`full-\${id}\`).style.display = 'none';
  }
}

/* ════════════════════════════════════════
   SEND CARD (PUBLIC UPLOAD)
════════════════════════════════════════ */
function onInput(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 130) + 'px';

  const len = el.value.length;
  const cc = document.getElementById('charCount');
  const btn = document.getElementById('sendBtn');

  if (len > 200) {
    cc.style.display = 'block';
    cc.textContent = len.toLocaleString();
    cc.classList.toggle('warn', len > 3000);
  } else {
    cc.style.display = 'none';
  }

  btn.disabled = el.value.trim().length === 0;
}

function toggleLinkMode() {
  linkModeEnforced = !linkModeEnforced;
  const btn = document.getElementById('linkToggle');
  btn.classList.toggle('on', linkModeEnforced);
  showToast(linkModeEnforced ? "Link Verification Active" : "Standard Messaging");
}

function onPaste(e) {
  const text = e.clipboardData.getData('text/plain');
  
  if (/^https?:\\/\\//i.test(text.trim())) {
    e.preventDefault();
    document.getElementById('msgInput').value = text.trim();
    onInput(document.getElementById('msgInput'));
    showToast("URL detected");
    return;
  }

  if (text.length >= 600) {
    e.preventDefault();
    openAttachModal();
    document.getElementById('attachContent').value = text;
    document.getElementById('attachTitle').value = "Pasted Document";
    showToast("Large text block queued for attachment");
  }
}

function onKey(e) {
  if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
    e.preventDefault();
    sendMsg(e);
  }
}

async function sendMsg(e) {
  const el = document.getElementById('msgInput');
  const text = el.value.trim();
  if (!text) return;

  if (linkModeEnforced && !/^https?:\\/\\//i.test(text)) {
    showToast("Error: Verified URL Required");
    return;
  }

  if (e && e.currentTarget) {
    const btn = e.currentTarget;
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.cssText = 'width:50px;height:50px;top:50%;left:50%;margin:-25px 0 0 -25px';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 500);
  }

  let type = 'text';
  let title = '';
  
  if (/^https?:\\/\\//i.test(text)) {
    type = 'link';
  } else if (text.length >= 600) {
    openAttachModal();
    document.getElementById('attachContent').value = text;
    document.getElementById('attachTitle').value = "Pasted Document";
    el.value = '';
    return;
  }

  const payload = {
    id: 'msg-' + Date.now() + Math.random().toString(36).substr(2, 5),
    text: text,
    type: type,
    title: title,
    timestamp: Date.now(),
    category: activeCategory === 'all' ? 'General' : activeCategory
  };

  if (!navigator.onLine) {
    payload.id = 'off-' + payload.id;
    const queue = JSON.parse(localStorage.getItem('vs_public_offline_queue') || '[]');
    queue.push(payload);
    localStorage.setItem('vs_public_offline_queue', JSON.stringify(queue));

    el.value = '';
    el.style.height = 'auto';
    document.getElementById('sendBtn').disabled = true;
    document.getElementById('charCount').style.display = 'none';

    renderMessagesList();
    showToast("Offline: Message queued.");
    updateOnlineStatus(false);
    return;
  }

  try {
    const response = await fetch('/api/public', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (response.ok) {
      el.value = '';
      el.style.height = 'auto';
      document.getElementById('sendBtn').disabled = true;
      document.getElementById('charCount').style.display = 'none';
      loadMessages(true);
      showToast("Card Synced");
    } else {
      showToast("Broadcast locked or server busy");
    }
  } catch (err) {
    payload.id = 'off-' + payload.id;
    const queue = JSON.parse(localStorage.getItem('vs_public_offline_queue') || '[]');
    queue.push(payload);
    localStorage.setItem('vs_public_offline_queue', JSON.stringify(queue));

    el.value = '';
    el.style.height = 'auto';
    document.getElementById('sendBtn').disabled = true;
    document.getElementById('charCount').style.display = 'none';

    renderMessagesList();
    showToast("Connection lost. Message queued.");
    updateOnlineStatus(false);
  }
}

async function sendLargeDocument(text, title) {
  const payload = {
    id: 'msg-' + Date.now() + Math.random().toString(36).substr(2, 5),
    text: text,
    type: 'doc',
    title: title,
    timestamp: Date.now(),
    category: activeCategory === 'all' ? 'General' : activeCategory
  };

  if (!navigator.onLine) {
    payload.id = 'off-' + payload.id;
    const queue = JSON.parse(localStorage.getItem('vs_public_offline_queue') || '[]');
    queue.push(payload);
    localStorage.setItem('vs_public_offline_queue', JSON.stringify(queue));
    renderMessagesList();
    showToast("Offline: Document queued.");
    updateOnlineStatus(false);
    return;
  }

  try {
    const response = await fetch('/api/public', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (response.ok) {
      loadMessages(true);
      showToast("Document Card Synced");
    } else {
      showToast("Sync document failed");
    }
  } catch (err) {
    payload.id = 'off-' + payload.id;
    const queue = JSON.parse(localStorage.getItem('vs_public_offline_queue') || '[]');
    queue.push(payload);
    localStorage.setItem('vs_public_offline_queue', JSON.stringify(queue));
    renderMessagesList();
    showToast("Offline: Document queued.");
    updateOnlineStatus(false);
  }
}

function triggerFileInput() {
  document.getElementById('fileInput').click();
}

function onFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    openAttachModal();
    document.getElementById('attachContent').value = e.target.result;
    document.getElementById('attachTitle').value = file.name;
  };
  reader.readAsText(file);
  event.target.value = '';
}

/* ════════════════════════════════════════
   READ-ONLY DETAILS MODAL
════════════════════════════════════════ */
function openDetailsModal(id) {
  const msg = currentMessages.find(m => m.id === id);
  if (!msg) {
    showToast("Opening link...");
    return;
  }

  document.getElementById('mTitle').innerText = msg.title || msg.text;
  document.getElementById('mUrl').value = msg.text || '';
  document.getElementById('mCategory').innerText = msg.category || 'General';
  document.getElementById('mNotes').innerText = msg.notes || 'NO ADDITIONAL PARAMETERS RECORDED.';

  if (msg.type === 'link') {
    document.getElementById('mUrlGroup').style.display = 'flex';
    document.getElementById('mLaunchBtn').style.display = 'block';
  } else {
    document.getElementById('mUrlGroup').style.display = 'none';
    document.getElementById('mLaunchBtn').style.display = 'none';
  }

  window.location.hash = msg.id;
  document.getElementById('detailsModal').style.display = 'flex';
}

function closeDetailsModal() {
  document.getElementById('detailsModal').style.display = 'none';
  history.replaceState(null, null, ' ');
}

function copyCardLink() {
  const urlVal = document.getElementById('mUrl').value;
  if (!urlVal) return;
  navigator.clipboard.writeText(urlVal).then(() => {
    showToast("Link URL copied");
  }).catch(() => {});
}

function copyCardShareLink(id) {
  const shareUrl = \`\${window.location.origin}/public#\${id}\`;
  navigator.clipboard.writeText(shareUrl).then(() => {
    showToast("Share link copied to clipboard");
  }).catch(() => {});
}

function launchCardUrl() {
  const urlVal = document.getElementById('mUrl').value;
  if (urlVal) {
    window.open(urlVal, '_blank');
  }
}

/* ════════════════════════════════════════
   SEARCH AND SYSTEM DECORATIONS
════════════════════════════════════════ */
function toggleSearch() {
  const wrap = document.getElementById('searchWrap');
  const input = document.getElementById('searchInput');
  if (wrap.style.display === 'none') {
    wrap.style.display = 'block';
    input.focus();
  } else {
    wrap.style.display = 'none';
    input.value = '';
    onSearch('');
  }
}

function onSearch(val) {
  searchQuery = val.trim();
  renderMessagesList();
}

// Share channel link
function copyShareLink() {
  const shareLink = window.location.origin + '/public';
  navigator.clipboard.writeText(shareLink).then(() => {
    showToast("Public sync link copied to clipboard");
  }).catch(() => {});
}

function toggleSidebar() {
  const app = document.querySelector('.app');
  const sb = document.getElementById('sidebar');
  const bd = document.getElementById('sbBackdrop');
  if (sb.classList.contains('open')) {
    closeSidebar();
  } else {
    sb.classList.add('open');
    bd.classList.add('show');
    if (app) app.classList.add('sidebar-open-state');
  }
}

function closeSidebar() {
  const app = document.querySelector('.app');
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sbBackdrop').classList.remove('show');
  if (app) app.classList.remove('sidebar-open-state');
}

/* ─ Cloud Document Attachment Modal Handlers ─ */
function openAttachModal() {
  document.getElementById('attachTitle').value = '';
  document.getElementById('attachContent').value = '';
  document.getElementById('attachModal').style.display = 'flex';
}

function closeAttachModal() {
  document.getElementById('attachModal').style.display = 'none';
}

async function executeCloudAttach() {
  const title = document.getElementById('attachTitle').value.trim();
  const content = document.getElementById('attachContent').value.trim();
  if (!title || !content) {
    showToast("Enter both title and content.");
    return;
  }
  closeAttachModal();
  await sendLargeDocument(content, title);
}

/* ─ Card Tagging Modal Handlers ─ */
function openTagCardModal() {
  document.getElementById('tagCardSearch').value = '';
  document.getElementById('tagCardModal').style.display = 'flex';
  renderTagCardList();
}

function closeTagCardModal() {
  document.getElementById('tagCardModal').style.display = 'none';
}

function onTagCardSearchInput(query) {
  renderTagCardList(query);
}

function renderTagCardList(query = '') {
  const listDiv = document.getElementById('tagCardList');
  if (!listDiv) return;
  const q = query.toLowerCase();
  
  let filtered = currentMessages;
  if (q) {
    filtered = currentMessages.filter(m => 
      (m.title || m.text || '').toLowerCase().includes(q)
    );
  }
  
  let html = '';
  if (filtered.length === 0) {
    html = \`<div style="text-align:center; padding: 10px; font-size:11px; color:var(--text-3);">No cards found</div>\`;
  } else {
    filtered.forEach(m => {
      const displayTitle = m.title || (m.text ? m.text.substring(0, 30) + '...' : 'Untitled');
      html += \`<div style="padding: 8px; margin-bottom:4px; border-radius:var(--r-sm); background:var(--surface); cursor:pointer; font-size:12px; border:1px solid var(--border); transition: background 0.1s;" onclick="insertCardTag('\${m.id}', '\${escapeHtml(displayTitle)}')">
        <strong>\${escapeHtml(displayTitle)}</strong> <span style="font-size:10px; color:var(--text-3); font-family:monospace;">(\${m.id})</span>
      </div>\`;
    });
  }
  listDiv.innerHTML = html;
}

function insertCardTag(id, title) {
  const textInput = document.getElementById('msgInput');
  const tagStr = \` [Card: \${title}](\${id}) \`;
  
  const start = textInput.selectionStart;
  const end = textInput.selectionEnd;
  const val = textInput.value;
  
  textInput.value = val.substring(0, start) + tagStr + val.substring(end);
  textInput.focus();
  textInput.selectionStart = textInput.selectionEnd = start + tagStr.length;
  
  closeTagCardModal();
  onInput(textInput);
}

/* ─ Manual Sync Spin ─ */
async function triggerManualReload() {
  const btn = document.getElementById('sbReloadBtn');
  btn.classList.add('spinning');
  showToast("Synchronizing database...");
  await loadMessages(true);
  setTimeout(() => {
    btn.classList.remove('spinning');
  }, 1000);
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.innerText = msg;
  toast.className = 'toast show';
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => {
    toast.className = 'toast';
  }, 3000);
}

function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ════════════════════════════════════════
   DRAG AND DROP OVERLAY
════════════════════════════════════════ */
const dragOv = document.getElementById('dragOv');
window.addEventListener('dragover', (e) => {
  e.preventDefault();
  dragOv.classList.add('on');
});
window.addEventListener('dragleave', (e) => {
  e.preventDefault();
  if (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
    dragOv.classList.remove('on');
  }
});
window.addEventListener('drop', (e) => {
  e.preventDefault();
  dragOv.classList.remove('on');
  const file = e.dataTransfer.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    openAttachModal();
    document.getElementById('attachContent').value = evt.target.result;
    document.getElementById('attachTitle').value = file.name;
  };
  reader.readAsText(file);
});
</script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(html);
}
