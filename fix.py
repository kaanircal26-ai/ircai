from pathlib import Path
p=Path('/mnt/data/bugfix_work/ircai-main/index.html')
s=p.read_text()
# 1) Make splash lifecycle idempotent and persist successful entry for current tab.
old='''function finishSplash(){
 const splash=$("splash");
 if(!splash)return;
 $("modalOverlay")?.classList.remove("splash-auth");
 splash.classList.add("hide");
 setTimeout(()=>splash.remove(),850);
}
function closeSplashAuth(){
 $("modalOverlay")?.classList.remove("show","splash-auth");
 finishSplash();
}'''
new='''function finishSplash(){
 const splash=$("splash");
 if(tozraSplashTimer){clearTimeout(tozraSplashTimer);tozraSplashTimer=null;}
 try{sessionStorage.setItem("tozra-authenticated-entry","1");}catch(e){}
 if(!splash)return;
 $("modalOverlay")?.classList.remove("splash-auth");
 splash.classList.add("hide");
 if(!splash.dataset.removalQueued){
  splash.dataset.removalQueued="1";
  setTimeout(()=>{if(splash.isConnected)splash.remove();},850);
 }
}
function closeSplashAuth(){
 $("modalOverlay")?.classList.remove("show","splash-auth");
 finishSplash();
}'''
assert old in s
s=s.replace(old,new,1)
# Auth event closes the login-on-splash scene as soon as a valid session is established.
old='''      session = nextSession || null;
      updateAccountUI();
      if(event === "PASSWORD_RECOVERY") showModal("updatePassword");'''
new='''      session = nextSession || null;
      updateAccountUI();
      if(event === "SIGNED_IN" && session){
       closeSplashAuth();
      }
      if(event === "PASSWORD_RECOVERY") showModal("updatePassword");'''
assert old in s
s=s.replace(old,new,1)
# Add accent color picker after theme section in both signed-in and guest profile markup.
needle='''   <section class="profile-theme-picker" aria-label="Tema seçimi"><h4>Görünüm teması</h4><div class="theme-choice-row"><button type="button" class="theme-choice" data-theme-choice="light"><span class="theme-preview theme-preview-light"></span><span>Aydınlık</span><i>✓</i></button><button type="button" class="theme-choice" data-theme-choice="dark"><span class="theme-preview theme-preview-dark"></span><span>Karanlık</span><i>✓</i></button></div></section>'''
accent=needle+'''\n   <section class="profile-accent-picker" aria-label="Vurgu rengi seçimi"><h4>Vurgu rengi</h4><div class="accent-choice-row"><button type="button" class="accent-choice" data-accent-choice="lime"><span class="accent-dot accent-lime"></span><span>Lime</span><i>✓</i></button><button type="button" class="accent-choice" data-accent-choice="forest"><span class="accent-dot accent-forest"></span><span>Orman</span><i>✓</i></button><button type="button" class="accent-choice" data-accent-choice="ocean"><span class="accent-dot accent-ocean"></span><span>Okyanus</span><i>✓</i></button><button type="button" class="accent-choice" data-accent-choice="plum"><span class="accent-dot accent-plum"></span><span>Erik</span><i>✓</i></button></div></section>'''
assert s.count(needle)==2, s.count(needle)
s=s.replace(needle,accent)
# Wire theme + accent controls, persist selection, and update visible app accents.
old=''' if(type==="profile"){
  content.querySelectorAll("[data-theme-choice]").forEach(button=>{
   button.classList.toggle("is-selected", button.dataset.themeChoice===getTozraTheme());
   button.addEventListener("click",()=>{
    setTozraTheme(button.dataset.themeChoice);
    content.querySelectorAll("[data-theme-choice]").forEach(item=>item.classList.toggle("is-selected",item===button));
   });
  });
 }'''
new=''' if(type==="profile"){
  content.querySelectorAll("[data-theme-choice]").forEach(button=>{
   button.classList.toggle("is-selected", button.dataset.themeChoice===getTozraTheme());
   button.addEventListener("click",()=>{
    setTozraTheme(button.dataset.themeChoice);
    content.querySelectorAll("[data-theme-choice]").forEach(item=>item.classList.toggle("is-selected",item===button));
   });
  });
  content.querySelectorAll("[data-accent-choice]").forEach(button=>{
   button.classList.toggle("is-selected",button.dataset.accentChoice===getTozraAccent());
   button.addEventListener("click",()=>{
    setTozraAccent(button.dataset.accentChoice);
    content.querySelectorAll("[data-accent-choice]").forEach(item=>item.classList.toggle("is-selected",item===button));
   });
  });
 }'''
assert old in s
s=s.replace(old,new,1)
# Add accent theme implementation after setTozraTheme call.
needle='''setTozraTheme(getTozraTheme());

/* MODAL SİSTEMİ */'''
new='''setTozraTheme(getTozraTheme());

/* Vurgu rengi: bütün arayüzde ortak değişkenlerle uygulanır ve cihazda saklanır. */
const TOZRA_ACCENTS={
 lime:{main:"#a8c77b",soft:"#edf4e2",deep:"#607d3b",dark:"#c5df98"},
 forest:{main:"#4f936b",soft:"#e4f1e8",deep:"#286143",dark:"#82c69a"},
 ocean:{main:"#5798c8",soft:"#e5f1fa",deep:"#326d9b",dark:"#8bc4ee"},
 plum:{main:"#9a78bd",soft:"#f0e9f7",deep:"#705091",dark:"#c2a4df"}
};
function getTozraAccent(){const v=localStorage.getItem("tozra-accent");return TOZRA_ACCENTS[v]?v:"lime";}
function setTozraAccent(name){
 const key=TOZRA_ACCENTS[name]?name:"lime",c=TOZRA_ACCENTS[key],root=document.documentElement;
 root.dataset.tozraAccent=key;
 root.style.setProperty("--accent",c.main);
 root.style.setProperty("--accent-soft",c.soft);
 root.style.setProperty("--accent-deep",c.deep);
 root.style.setProperty("--tozra-accent",c.main);
 root.style.setProperty("--tozra-accent-soft",c.soft);
 root.style.setProperty("--tozra-accent-deep",c.deep);
 root.style.setProperty("--tozra-accent-dark",c.dark);
 localStorage.setItem("tozra-accent",key);
 const meta=document.querySelector('meta[name="theme-color"]');
 if(meta)meta.content=getTozraTheme()==="dark"?"#151b17":c.soft;
}
setTozraAccent(getTozraAccent());

/* MODAL SİSTEMİ */'''
assert needle in s
s=s.replace(needle,new,1)
# Robust delegated profile click: works even if an earlier handler was overwritten by UI refresh.
old='''$("profileButton").onclick=()=>showModal("profile");'''
new='''$("profileButton").onclick=()=>showModal("profile");
document.addEventListener("click",event=>{
 const profile=event.target.closest("#profileButton,#homeProfileButton");
 if(!profile)return;
 event.preventDefault();
 event.stopPropagation();
 showModal("profile");
},true);'''
assert old in s
s=s.replace(old,new,1)
# Startup: when a session is already valid, don't replay the opening sequence after login/redirect.
old=''' if(TozraAuth.getSession() && $("splash")){
  // Authenticated users see the full six-second cinematic launch, then enter the workspace.
  if(tozraSplashTimer)clearTimeout(tozraSplashTimer);
  tozraSplashTimer=setTimeout(finishSplash,6000);
 }'''
new=''' if(TozraAuth.getSession() && $("splash")){
  // A successful login/redirect must enter the workspace directly, not replay the login splash.
  let justAuthenticated=false;
  try{justAuthenticated=sessionStorage.getItem("tozra-authenticated-entry")==="1";}catch(e){}
  if(justAuthenticated)finishSplash();
  else finishSplash();
 }'''
assert old in s
s=s.replace(old,new,1)
# Ensure splash timers don't leave a stale callback behind.
# Add styles before final style close, unique anchor at final profile theme CSS.
style_anchor='''/* Profile theme selector. */'''
css='''/* TOZRA profile accent palette */
.profile-accent-picker{margin:12px 0 16px;padding:15px;border:1px solid var(--line,#e5e1d6);border-radius:14px;background:var(--paper,#fffefa)}
.profile-accent-picker h4{font-size:12px;margin:0 0 12px;color:var(--ink,#202820)}
.accent-choice-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
.accent-choice{display:flex;align-items:center;gap:9px;min-height:42px;padding:9px 10px;border:1px solid var(--line,#ddd);border-radius:10px;background:var(--paper-2,#f7f6f0);color:var(--ink,#202820);font-size:11px;font-weight:650;cursor:pointer}
.accent-dot{width:17px;height:17px;border-radius:50%;box-shadow:inset 0 0 0 1px #00000018;flex:0 0 17px}
.accent-lime{background:#a8c77b}.accent-forest{background:#4f936b}.accent-ocean{background:#5798c8}.accent-plum{background:#9a78bd}
.accent-choice i{display:none;margin-left:auto;color:var(--tozra-accent-deep,#607d3b);font-style:normal;font-weight:900}
.accent-choice.is-selected{border-color:var(--tozra-accent,#a8c77b);box-shadow:0 0 0 2px color-mix(in srgb,var(--tozra-accent,#a8c77b) 22%,transparent)}
.accent-choice.is-selected i{display:block}
html[data-tozra-accent] .primary,html[data-tozra-accent] .sidebar .nav-item.active,html[data-tozra-accent] .mobile-dock button.is-active{background:var(--tozra-accent)!important;border-color:var(--tozra-accent)!important}
html[data-tozra-accent] .primary{color:#182116!important}
html[data-tozra-accent] .sidebar .nav-item.active,html[data-tozra-accent] .mobile-dock button.is-active{color:#172117!important}
html[data-tozra-accent] .tool-card:hover,html[data-tozra-accent] .quick-card:hover,html[data-tozra-accent] .project-card:hover{border-color:var(--tozra-accent)!important}
html[data-tozra-accent] .top-button:focus-visible,html[data-tozra-accent] button:focus-visible,html[data-tozra-accent] input:focus-visible,html[data-tozra-accent] textarea:focus-visible{outline-color:var(--tozra-accent)!important}
html[data-tozra-theme="dark"] .profile-accent-picker{background:#202922!important;border-color:#39483b!important}
html[data-tozra-theme="dark"] .accent-choice{background:#151c17!important;color:#edf2e9!important;border-color:#39483b!important}
'''
assert style_anchor in s
s=s.replace(style_anchor,css+'\n'+style_anchor,1)
p.write_text(s)
print('patched',len(s))
