from pathlib import Path
p=Path('/mnt/data/tozra_edit/index.html')
s=p.read_text()
start=s.index('<div class="page active" id="workspacePage">')
end=s.index('<div class="page" id="projectListPage">', start)
new='''<div class="page active" id="workspacePage">
 <section class="tozra-reference-home" aria-label="TOZRA ana sayfa">
  <header class="trh-header">
   <button class="trh-round trh-menu" id="homeMenuButton" type="button" aria-label="Menüyü aç"><svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button>
   <div class="trh-brand"><img src="/tozra-logo.svg" alt=""><span>TOZRA</span></div>
   <button class="trh-round trh-bell" id="homeNotificationButton" type="button" aria-label="Bildirimler"><svg viewBox="0 0 24 24"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg><i></i></button>
  </header>
  <nav class="trh-shortcuts" aria-label="Hızlı gezinme">
   <button class="trh-shortcut active" type="button" id="homeNavChat"><svg viewBox="0 0 24 24"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-6.5A7.5 7.5 0 1 1 20 11.5Z"/></svg>AI Chat</button>
   <button class="trh-shortcut" type="button" id="homeNavStudio"><svg viewBox="0 0 24 24"><path d="m12 3 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 16l9 5 9-5"/></svg>Studio</button>
   <button class="trh-shortcut" type="button" id="homeNavProjects"><svg viewBox="0 0 24 24"><path d="M3 7.5A1.5 1.5 0 0 1 4.5 6H10l2 2h7.5A1.5 1.5 0 0 1 21 9.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z"/></svg>Projeler</button>
   <button class="trh-shortcut" type="button" id="homeNavCalendar"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 9h18"/></svg>Takvim</button>
  </nav>
  <div class="trh-orbit" aria-hidden="true"><span class="trh-orbit-line"></span><span class="trh-orbit-glow"><img src="/tozra-logo.svg" alt=""></span></div>
  <div class="trh-welcome"><h1 id="homeWelcomeTitle">Merhaba!</h1><p>Bugün ne üretmek, planlamak<br class="trh-mobile-break"> veya keşfetmek istersin?</p></div>
  <form class="trh-composer" id="homeComposerForm">
   <label class="trh-prompt-label" for="homePromptInput"><span class="trh-spark">✦</span><input id="homePromptInput" type="text" placeholder="TOZRA’ya bir şey sor..." autocomplete="off"></label>
   <div class="trh-composer-tools">
    <button type="button" class="trh-tool" id="homeAttachButton" aria-label="Dosya ekle"><svg viewBox="0 0 24 24"><path d="m8 12.5 7.2-7.2a3 3 0 0 1 4.2 4.2L9.8 19.1a5 5 0 0 1-7.1-7.1L12 2.7"/></svg></button>
    <button type="button" class="trh-tool" id="homeImageButton" aria-label="Görsel ekle"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg></button>
    <button type="button" class="trh-tool" id="homeMicButton" aria-label="Sesli mesaj"><svg viewBox="0 0 24 24"><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4M8 22h8"/></svg></button>
    <button type="submit" class="trh-send" aria-label="Gönder"><svg viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button>
   </div>
  </form>
  <section class="trh-section trh-quick-section">
   <div class="trh-section-head"><h2>Hızlı Erişim</h2><button type="button" id="homeSeeAllQuick">Tümünü Gör <span>›</span></button></div>
   <div class="trh-quick-grid">
    <button class="trh-quick-card" id="homeIdeaCard" type="button"><span class="trh-card-icon"><svg viewBox="0 0 24 24"><path d="M9 18h6M10 22h4M8.5 14.5a7 7 0 1 1 7 0c-.8.6-1.2 1.3-1.3 2.5H9.8c-.1-1.2-.5-1.9-1.3-2.5Z"/></svg></span><span><strong>Fikir Geliştir</strong><small>Yeni fikirler üret</small></span><i>→</i></button>
    <button class="trh-quick-card" id="homeProjectsCard" type="button"><span class="trh-card-icon"><svg viewBox="0 0 24 24"><path d="M3 7.5A1.5 1.5 0 0 1 4.5 6H10l2 2h7.5A1.5 1.5 0 0 1 21 9.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z"/></svg></span><span><strong>Projelerim</strong><small>Çalışmalarını yönet</small></span><i>→</i></button>
    <button class="trh-quick-card" id="homeStudioCard" type="button"><span class="trh-card-icon"><svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 9 9c0-1.1-.9-2-2-2h-2a2 2 0 0 1-2-2V6a3 3 0 0 0-3-3Z"/><circle cx="7.5" cy="10" r="1"/><circle cx="10" cy="6.5" r="1"/><circle cx="15.5" cy="7.5" r="1"/></svg></span><span><strong>Creative Studio</strong><small>İçeriklerini tasarla</small></span><i>→</i></button>
    <button class="trh-quick-card" id="homeCalendarCard" type="button"><span class="trh-card-icon"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 9h18M8 13h2M14 13h2M8 17h2"/></svg></span><span><strong>Takvim</strong><small>Planlarını düzenle</small></span><i>→</i></button>
   </div>
  </section>
  <section class="trh-section trh-recent-section">
   <div class="trh-section-head"><h2>Son Sohbetler</h2><button type="button" id="homeSeeAllChats">Tümünü Gör <span>›</span></button></div>
   <button class="trh-recent-card" id="homeRecentChat" type="button"><span class="trh-recent-icon"><svg viewBox="0 0 24 24"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-6.5A7.5 7.5 0 1 1 20 11.5Z"/></svg></span><span><strong>TOZRA proje yol haritası</strong><small>Son sohbetlerine devam et</small></span><i>→</i></button>
  </section>
  <nav class="trh-bottom-nav" aria-label="Alt gezinme">
   <button class="selected" type="button" id="homeBottomHome"><svg viewBox="0 0 24 24"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/></svg><span>Ana Sayfa</span></button>
   <button type="button" id="homeBottomExplore"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8z"/></svg><span>Keşfet</span></button>
   <button type="button" id="homeBottomProjects"><svg viewBox="0 0 24 24"><path d="M3 7.5A1.5 1.5 0 0 1 4.5 6H10l2 2h7.5A1.5 1.5 0 0 1 21 9.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z"/></svg><span>Projeler</span></button>
   <button type="button" id="homeBottomProfile"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 21c.5-3.8 3.2-5.8 7.5-5.8s7 2 7.5 5.8"/></svg><span>Profil</span></button>
  </nav>
 </section>
</div>
'''
s=s[:start]+new+s[end:]
# Add handlers immediately after existing home chat listener.
needle='$("homeChatButton")?.addEventListener("click", openGeneralChat);'
handlers='''$("homeNavChat")?.addEventListener("click", openGeneralChat);
$("homeNavStudio")?.addEventListener("click", ()=>$ ("navCreativeStudio").click());
$("homeNavProjects")?.addEventListener("click", ()=>$ ("navProjects").click());
$("homeNavCalendar")?.addEventListener("click", ()=>$ ("navTasks").click());
$("homeMenuButton")?.addEventListener("click", ()=>$ ("menuButton").click());
$("homeNotificationButton")?.addEventListener("click", ()=>$ ("sideSettings").click());
$("homeIdeaCard")?.addEventListener("click", ()=>startChatWithPrompt("Yeni bir fikir geliştirmek istiyorum. Bana yardımcı ol."));
$("homeProjectsCard")?.addEventListener("click", ()=>$ ("navProjects").click());
$("homeStudioCard")?.addEventListener("click", ()=>$ ("navCreativeStudio").click());
$("homeCalendarCard")?.addEventListener("click", ()=>$ ("navTasks").click());
$("homeSeeAllQuick")?.addEventListener("click", ()=>$ ("navCreativeStudio").click());
$("homeSeeAllChats")?.addEventListener("click", openGeneralChat);
$("homeRecentChat")?.addEventListener("click", openGeneralChat);
$("homeBottomHome")?.addEventListener("click", ()=>$ ("navWorkspace").click());
$("homeBottomExplore")?.addEventListener("click", ()=>$ ("navCreativeStudio").click());
$("homeBottomProjects")?.addEventListener("click", ()=>$ ("navProjects").click());
$("homeBottomProfile")?.addEventListener("click", ()=>$ ("profileButton").click());
$("homeAttachButton")?.addEventListener("click", ()=>$ ("imageButton").click());
$("homeImageButton")?.addEventListener("click", ()=>$ ("imageButton").click());
$("homeMicButton")?.addEventListener("click", ()=>$ ("voiceButton").click());
$("homeComposerForm")?.addEventListener("submit", event=>{event.preventDefault();const value=$("homePromptInput").value.trim();if(value){$("homePromptInput").value="";startChatWithPrompt(value);setTimeout(()=>$("send")?.click(),80);}});
'''
# Correct accidental whitespace in JS arrow expression.
handlers=handlers.replace('()=>$ (', '()=>$(")').replace('click();', 'click();')
# Better construct without malformed replacement
handlers='''$("homeNavChat")?.addEventListener("click", openGeneralChat);
$("homeNavStudio")?.addEventListener("click", ()=>$("navCreativeStudio").click());
$("homeNavProjects")?.addEventListener("click", ()=>$("navProjects").click());
$("homeNavCalendar")?.addEventListener("click", ()=>$("navTasks").click());
$("homeMenuButton")?.addEventListener("click", ()=>$("menuButton").click());
$("homeNotificationButton")?.addEventListener("click", ()=>$("sideSettings").click());
$("homeIdeaCard")?.addEventListener("click", ()=>startChatWithPrompt("Yeni bir fikir geliştirmek istiyorum. Bana yardımcı ol."));
$("homeProjectsCard")?.addEventListener("click", ()=>$("navProjects").click());
$("homeStudioCard")?.addEventListener("click", ()=>$("navCreativeStudio").click());
$("homeCalendarCard")?.addEventListener("click", ()=>$("navTasks").click());
$("homeSeeAllQuick")?.addEventListener("click", ()=>$("navCreativeStudio").click());
$("homeSeeAllChats")?.addEventListener("click", openGeneralChat);
$("homeRecentChat")?.addEventListener("click", openGeneralChat);
$("homeBottomHome")?.addEventListener("click", ()=>$("navWorkspace").click());
$("homeBottomExplore")?.addEventListener("click", ()=>$("navCreativeStudio").click());
$("homeBottomProjects")?.addEventListener("click", ()=>$("navProjects").click());
$("homeBottomProfile")?.addEventListener("click", ()=>$("profileButton").click());
$("homeAttachButton")?.addEventListener("click", ()=>$("imageButton").click());
$("homeImageButton")?.addEventListener("click", ()=>$("imageButton").click());
$("homeMicButton")?.addEventListener("click", ()=>$("voiceButton").click());
$("homeComposerForm")?.addEventListener("submit", event=>{event.preventDefault();const value=$("homePromptInput").value.trim();if(value){$("homePromptInput").value="";startChatWithPrompt(value);setTimeout(()=>$("send")?.click(),80);}});
'''
s=s.replace(needle,needle+'\n'+handlers)
# Welcome name from existing auth session when available.
marker='function openGeneralChat(){\n showPage("chat");'
s=s.replace(marker,'''function updateHomeWelcome(){
 const user=TozraAuth.getSession()?.user;
 const fullName=user?.user_metadata?.full_name||user?.user_metadata?.name||"";
 const firstName=String(fullName).trim().split(/\\s+/)[0];
 const el=$("homeWelcomeTitle");if(el)el.textContent=firstName?`Merhaba ${firstName},`:"Merhaba!";
}
function openGeneralChat(){
 showPage("chat");''')
s=s.replace('window.openGeneralChat = openGeneralChat;','window.openGeneralChat = openGeneralChat;\nsetTimeout(updateHomeWelcome,500);')
# Append design layer last so it overrides previous experimental homepage CSS.
css='''
<style id="tozra-reference-home-v1">
:root{--trh-lime:#a6dc54;--trh-green:#2d6b35;--trh-ink:#171a18;--trh-muted:#6d716e;--trh-line:rgba(255,255,255,.76)}
#workspacePage{display:block!important;width:100%!important;max-width:none!important;margin:0 auto!important;padding:0!important;background:transparent!important}
#workspacePage .tozra-reference-home{position:relative;isolation:isolate;min-height:calc(100dvh - 70px);width:100%;max-width:920px;margin:0 auto;padding:22px clamp(18px,4vw,34px) 18px;overflow:hidden;border-radius:0;background:radial-gradient(ellipse at 2% 28%,rgba(165,219,130,.25),transparent 28%),radial-gradient(ellipse at 100% 65%,rgba(183,224,165,.2),transparent 32%),linear-gradient(145deg,#f4f5f4 0%,#f0f1f2 48%,#f7f7f7 100%);color:var(--trh-ink)}
#workspacePage .tozra-reference-home:before,#workspacePage .tozra-reference-home:after{content:"";position:absolute;z-index:-1;pointer-events:none;border-radius:50%;filter:blur(1px)}
#workspacePage .tozra-reference-home:before{width:430px;height:230px;left:-250px;top:250px;background:linear-gradient(135deg,rgba(141,203,103,.24),transparent 72%);transform:rotate(24deg)}
#workspacePage .tozra-reference-home:after{width:440px;height:230px;right:-270px;top:310px;background:linear-gradient(225deg,rgba(167,214,126,.22),transparent 70%);transform:rotate(-24deg)}
.trh-header{height:70px;display:grid;grid-template-columns:54px 1fr 54px;align-items:center;gap:8px}
.trh-round{width:48px;height:48px;border:1px solid rgba(255,255,255,.9);border-radius:50%;background:rgba(255,255,255,.55);display:grid;place-items:center;color:#141916;box-shadow:0 4px 18px rgba(48,60,46,.035);position:relative}
.trh-round svg,.trh-shortcut svg,.trh-tool svg,.trh-send svg,.trh-card-icon svg,.trh-recent-icon svg,.trh-bottom-nav svg{width:23px;height:23px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.trh-brand{display:flex;align-items:center;justify-content:center;gap:9px;font-size:25px;font-weight:800;letter-spacing:-.8px}
.trh-brand img{width:42px;height:42px;object-fit:contain}
.trh-bell i{position:absolute;width:9px;height:9px;right:7px;top:8px;background:#83c83d;border-radius:50%;border:1px solid #fff}
.trh-shortcuts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin:14px 0 16px}
.trh-shortcut{min-width:0;min-height:53px;border:1px solid rgba(255,255,255,.85);border-radius:28px;background:rgba(255,255,255,.58);color:#191d1a;display:flex;align-items:center;justify-content:center;gap:8px;padding:8px 10px;font-size:14px;font-weight:550;white-space:nowrap;box-shadow:0 5px 16px rgba(30,40,30,.035)}
.trh-shortcut.active{background:linear-gradient(135deg,#e6f8d7,#d7f0bf);border-color:#f6fff0;box-shadow:inset 0 0 0 1px rgba(255,255,255,.8)}
.trh-shortcut.active svg{color:#285c30}
.trh-orbit{height:188px;position:relative;display:grid;place-items:center;margin:4px auto 0;max-width:510px}
.trh-orbit-line{position:absolute;width:76%;height:65px;border:1px solid rgba(143,195,113,.45);border-radius:50%;transform:rotate(-13deg)}
.trh-orbit-glow{width:142px;height:142px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 45% 35%,rgba(255,255,255,.98),rgba(230,250,216,.82) 50%,rgba(175,222,133,.28) 72%,transparent 74%);border:2px solid rgba(245,255,234,.9);box-shadow:0 0 17px rgba(164,226,112,.55),inset 0 0 20px rgba(255,255,255,.95)}
.trh-orbit-glow img{width:82px;height:82px;object-fit:contain;filter:drop-shadow(0 7px 8px rgba(57,107,40,.2))}
.trh-welcome{text-align:center;margin:4px 0 22px}
.trh-welcome h1{font-size:clamp(27px,5vw,38px);line-height:1.15;letter-spacing:-1.1px;margin:0 0 9px;font-weight:750;color:#111513}
.trh-welcome p{font-size:clamp(16px,2.8vw,21px);line-height:1.4;color:#656a6b;margin:0}
.trh-composer{position:relative;display:flex;flex-direction:column;min-height:126px;padding:14px 17px 12px;border:1px solid rgba(255,255,255,.95);border-radius:23px;background:rgba(255,255,255,.62);box-shadow:0 8px 24px rgba(30,39,35,.055),inset 0 1px 0 rgba(255,255,255,.85);backdrop-filter:blur(15px);margin:0 0 30px}
.trh-prompt-label{display:flex;align-items:center;gap:12px;min-height:36px;color:#6e7471}
.trh-spark{font-size:24px;color:#77ad32;line-height:1}
.trh-prompt-label input{width:100%;min-width:0;border:0;outline:0;background:transparent;color:#202521;font-size:15px}
.trh-prompt-label input::placeholder{color:#777d79;opacity:1}
.trh-composer-tools{display:flex;align-items:center;gap:10px;margin-top:auto;padding-top:8px}
.trh-tool{width:49px;height:49px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.95);border-radius:50%;background:rgba(255,255,255,.58);color:#1c2420;box-shadow:0 3px 12px rgba(30,40,30,.035)}
.trh-tool svg{width:22px;height:22px}
.trh-send{width:59px;height:59px;margin-left:auto;display:grid;place-items:center;border:0;border-radius:50%;background:linear-gradient(145deg,#b7e96a,#8bd43a);color:#15240e;box-shadow:0 5px 17px rgba(142,205,71,.2)}
.trh-send svg{width:27px;height:27px;stroke-width:2}
.trh-section{margin:0 0 25px}
.trh-section-head{display:flex;align-items:center;justify-content:space-between;margin:0 2px 12px}
.trh-section-head h2{margin:0;color:#171b19;font-size:19px;font-weight:750;letter-spacing:-.5px}
.trh-section-head button{border:0;background:transparent;color:#6d9b39;font-size:13px;font-weight:600;padding:5px 0}
.trh-section-head button span{font-size:24px;vertical-align:-2px;margin-left:5px}
.trh-quick-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.trh-quick-card{min-height:84px;display:flex;align-items:center;gap:13px;text-align:left;padding:12px 13px;border:1px solid rgba(255,255,255,.92);border-radius:19px;background:rgba(255,255,255,.63);box-shadow:0 5px 18px rgba(30,40,30,.045);color:#1b201d}
.trh-card-icon{width:60px;height:56px;flex:0 0 60px;display:grid;place-items:center;color:#2c7137}
.trh-card-icon svg{width:43px;height:43px;stroke-width:1.8;filter:drop-shadow(0 2px 3px rgba(78,132,56,.12))}
.trh-quick-card>span:nth-child(2),.trh-recent-card>span:nth-child(2){min-width:0;display:flex;flex-direction:column;gap:5px}
.trh-quick-card strong,.trh-recent-card strong{font-size:15px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.trh-quick-card small,.trh-recent-card small{font-size:12px;color:#858a86;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.trh-quick-card>i,.trh-recent-card>i{margin-left:auto;width:29px;height:29px;flex:0 0 29px;border-radius:50%;background:rgba(235,238,237,.85);display:grid;place-items:center;color:#343a36;font-style:normal;font-size:19px}
.trh-recent-section{margin-bottom:17px}
.trh-recent-card{width:100%;min-height:80px;display:flex;align-items:center;gap:13px;text-align:left;padding:12px 14px;border:1px solid rgba(255,255,255,.94);border-radius:22px;background:rgba(255,255,255,.66);box-shadow:0 5px 18px rgba(30,40,30,.04);color:#1b201d}
.trh-recent-icon{width:57px;height:57px;flex:0 0 57px;border-radius:50%;display:grid;place-items:center;background:#e7f1e4;color:#245f30}
.trh-recent-icon svg{width:30px;height:30px}
.trh-bottom-nav{position:sticky;bottom:8px;z-index:10;display:grid;grid-template-columns:repeat(4,1fr);gap:3px;padding:7px;border:1px solid rgba(255,255,255,.96);border-radius:38px;background:rgba(255,255,255,.72);backdrop-filter:blur(18px);box-shadow:0 7px 24px rgba(34,42,37,.08);margin-top:7px}
.trh-bottom-nav button{min-width:0;min-height:66px;border:0;border-radius:30px;background:transparent;color:#626966;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;font-size:12px}
.trh-bottom-nav button.selected{background:linear-gradient(135deg,#e9f5dc,#e0f0d0);color:#172119}
.trh-bottom-nav button.selected svg{fill:#172119}
.trh-bottom-nav svg{width:25px;height:25px}
#workspacePage .trh-mobile-break{display:none}
#workspacePage .trh-header,#workspacePage .trh-shortcuts,#workspacePage .trh-orbit,#workspacePage .trh-welcome,#workspacePage .trh-composer,#workspacePage .trh-section,#workspacePage .trh-bottom-nav{position:relative;z-index:1}
@media(min-width:900px){#workspacePage .tozra-reference-home{padding:28px 42px 24px;min-height:calc(100vh - 70px);max-width:1020px}.trh-orbit{height:210px}.trh-composer{max-width:100%;}}
@media(max-width:600px){
 #workspacePage .tozra-reference-home{min-height:calc(100dvh - 62px);padding:12px 15px max(16px,env(safe-area-inset-bottom));}
 .trh-header{height:62px;grid-template-columns:46px 1fr 46px}.trh-round{width:43px;height:43px}.trh-brand{font-size:22px}.trh-brand img{width:37px;height:37px}
 .trh-shortcuts{gap:6px;margin:12px 0 8px}.trh-shortcut{min-height:47px;padding:7px 5px;gap:5px;font-size:clamp(10px,2.9vw,13px);border-radius:24px}.trh-shortcut svg{width:19px;height:19px;flex:0 0 19px}
 .trh-orbit{height:151px;margin-top:0}.trh-orbit-glow{width:120px;height:120px}.trh-orbit-glow img{width:70px;height:70px}.trh-orbit-line{width:76%;height:52px}
 .trh-welcome{margin:0 0 18px}.trh-welcome h1{font-size:29px}.trh-welcome p{font-size:17px}.trh-mobile-break{display:block!important}
 .trh-composer{min-height:120px;padding:12px 13px 10px;border-radius:21px;margin-bottom:26px}.trh-prompt-label input{font-size:13px}.trh-tool{width:44px;height:44px}.trh-tool svg{width:20px;height:20px}.trh-send{width:53px;height:53px}
 .trh-section{margin-bottom:22px}.trh-section-head{margin-bottom:10px}.trh-section-head h2{font-size:17px}.trh-section-head button{font-size:12px}
 .trh-quick-grid{gap:8px}.trh-quick-card{min-height:77px;gap:7px;padding:9px 8px;border-radius:16px}.trh-card-icon{width:43px;height:46px;flex-basis:43px}.trh-card-icon svg{width:35px;height:35px}.trh-quick-card strong{font-size:12px}.trh-quick-card small{font-size:10px}.trh-quick-card>i{width:24px;height:24px;flex-basis:24px;font-size:16px}
 .trh-recent-card{min-height:73px;padding:9px 11px;border-radius:18px}.trh-recent-icon{width:49px;height:49px;flex-basis:49px}.trh-recent-card strong{font-size:13px}.trh-recent-card small{font-size:10px}
 .trh-bottom-nav{bottom:3px;padding:5px;border-radius:31px;margin-top:3px}.trh-bottom-nav button{min-height:59px;font-size:10px}.trh-bottom-nav svg{width:22px;height:22px}
}
@media(max-height:760px) and (max-width:600px){.trh-orbit{height:118px}.trh-orbit-glow{width:100px;height:100px}.trh-orbit-glow img{width:60px;height:60px}.trh-composer{min-height:105px}.trh-section{margin-bottom:15px}.trh-quick-card{min-height:68px}.trh-bottom-nav button{min-height:53px}}
@media(prefers-reduced-motion:reduce){#workspacePage .tozra-reference-home *{scroll-behavior:auto!important;transition:none!important}}
</style>
'''
s=s.replace('</body>',css+'\n</body>')
p.write_text(s)
print('patched',len(s))
