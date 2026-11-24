
"use strict";

const $=id=>document.getElementById(id);

const TozraAuth = (() => {
 let client = null;
 let session = null;
 let initialized = false;
 let initPromise = null;
 let authListenerRegistered = false;
 let configError = "";

 async function init() {
  if (initialized) return session;
  if (initPromise) return initPromise;

  initPromise = (async () => {
   try {
    if (!window.supabase?.createClient) throw new Error("Supabase istemcisi yüklenemedi.");

    if (!client) {
     const response = await fetch("/api/config", { cache: "no-store" });
     const config = await response.json();
     if (!response.ok || !config.success) throw new Error(config.error || "Supabase yapılandırması okunamadı.");
     client = window.supabase.createClient(config.supabaseUrl, config.supabaseKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
     });
    }

    const result = await client.auth.getSession();
    if (result.error) throw result.error;
    session = result.data.session || null;

    if (!authListenerRegistered) {
     client.auth.onAuthStateChange((event, nextSession) => {
      session = nextSession || null;
      updateAccountUI();
      if(event === "PASSWORD_RECOVERY") showModal("updatePassword");
     });
     authListenerRegistered = true;
    }

    initialized = true;
    configError = "";
   } catch (error) {
    configError = error.message || "Hesap servisine bağlanılamadı.";
    console.error("TOZRA auth:", error);
   } finally {
    updateAccountUI();
    initPromise = null;
   }
   return session;
  })();

  return initPromise;
 }

 const AVATARS = ["fox","cat","panda","rabbit","bear","dog","penguin","frog"];
 function avatarForCurrentUser() {
  const user = session?.user;
  if (!user) return "cat";
  const saved = user.user_metadata?.tozra_avatar;
  if (AVATARS.includes(saved)) return saved;
  // Deterministic fallback prevents avatar flicker while metadata is being saved.
  let hash = 0;
  for (const char of String(user.id || user.email || "")) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return AVATARS[hash % AVATARS.length];
 }
 async function ensureAvatar() {
  if (!client || !session?.user) return avatarForCurrentUser();
  const current = session.user.user_metadata?.tozra_avatar;
  if (AVATARS.includes(current)) return current;
  const chosen = AVATARS[Math.floor(Math.random() * AVATARS.length)];
  try {
   const { data, error } = await client.auth.updateUser({ data: { tozra_avatar: chosen } });
   if (!error && data?.user) session = { ...session, user: data.user };
  } catch (error) { console.warn("TOZRA avatar kaydedilemedi:", error); }
  updateAccountUI();
  return avatarForCurrentUser();
 }
 function updateAccountUI() {
  const button = document.getElementById("profileButton");
  if (button) {
   button.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="8" r="3.6"></circle><path d="M4.8 20c.5-3.6 3.3-5.6 7.2-5.6s6.7 2 7.2 5.6"></path></svg>`;
   button.title = session?.user?.email || "Hesap";
   button.setAttribute("aria-label", session?.user?.email ? "Profil" : "Misafir profil");
  }
 }

 function userId() { return session?.user?.id || "guest"; }
 function getClient() { return client; }
 function getSession() { return session; }
 function getError() { return configError; }
 async function signUp(name, email, password) {
  if (!client) throw new Error(configError || "Supabase bağlantısı hazır değil.");
  const { data, error } = await client.auth.signUp({
   email: email.trim().toLowerCase(),
   password,
   options: { data: { full_name: name.trim() }, emailRedirectTo: `${window.location.origin}/` }
  });
  if (error) throw error;
  session = data.session || null;
  return data;
 }
 async function signIn(email, password) {
  if (!client) throw new Error(configError || "Supabase bağlantısı hazır değil.");
  const { data, error } = await client.auth.signInWithPassword({
   email: email.trim().toLowerCase(), password
  });
  if (error) throw error;
  session = data.session || null;
  return data;
 }
 async function signInWithGoogle() {
  if (!client) throw new Error(configError || "Supabase bağlantısı hazır değil.");
  const { data, error } = await client.auth.signInWithOAuth({
   provider: "google",
   options: {
    redirectTo: `${window.location.origin}/`,
    queryParams: { prompt: "select_account" }
   }
  });
  if (error) throw error;
  return data;
 }
 async function resetPassword(email) {
  if (!client) throw new Error(configError || "Supabase bağlantısı hazır değil.");
  const { error } = await client.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: `${window.location.origin}/` });
  if (error) throw error;
 }
 async function resendConfirmation(email) {
  if (!client) throw new Error(configError || "Supabase bağlantısı hazır değil.");
  const { error } = await client.auth.resend({ type: "signup", email: email.trim().toLowerCase(), options: { emailRedirectTo: `${window.location.origin}/` } });
  if (error) throw error;
 }
 async function updatePassword(password) {
  if (!client) throw new Error(configError || "Supabase bağlantısı hazır değil.");
  const { error } = await client.auth.updateUser({ password });
  if (error) throw error;
 }
 async function signOut() {
  if (!client) return;
  const { error } = await client.auth.signOut();
  if (error) throw error;
  session = null;
 }
 async function authHeaders() {
  if (!session?.access_token) throw new Error("Oturum bulunamadı. Lütfen yeniden giriş yap.");
  return { Authorization: `Bearer ${session.access_token}` };
 }
 return { init, userId, getClient, getSession, getError, signUp, signIn, signInWithGoogle, resetPassword, resendConfirmation, updatePassword, signOut, authHeaders, updateAccountUI, ensureAvatar, avatarForCurrentUser };
})();
// voice.js ayrı dosyada çalıştığı için hesap servisini global alana aç.
window.TozraAuth = TozraAuth;

function scopedStorageKey(key) {
 const id = TozraAuth.userId();
 return id === "guest" ? `tozra-guest:${key}` : `tozra-user:${id}:${key}`;
}
window.tozraStorageKey = scopedStorageKey;

/* TOZRA CLOUD SYNC v1 — authenticated, account-scoped JSON backup */
const TozraCloudSync = (() => {
 const TABLE = "user_data";
 const KEYS = [
  "tozra-projects", "tozra-conversations", "ircal_tasks_calendar_v1",
  "tozra-web-home-tasks-v1", "tozra-web-home-notes-v1",
  "tozra-web-home-week-v1", "tozra-personal-memory-v1",
  "tozra-atlas-saved-v1", "tozra-atlas-layers-v1"
 ];
 let activeUser = null, timer = null, applying = false, channel = null;
 let pushPromise = null, pushQueued = false;
 let lastError = "";
 const keyFor = key => scopedStorageKey(key);
 function collect() {
  const data = {};
  for (const key of KEYS) {
   const raw = localStorage.getItem(keyFor(key));
   if (raw !== null) { try { data[key] = JSON.parse(raw); } catch {} }
  }
  return data;
 }
 function apply(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return;
  applying = true;
  try {
   for (const key of KEYS) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
     localStorage.setItem(keyFor(key), JSON.stringify(data[key]));
    }
   }
  } finally { applying = false; }
 }
 async function pushNow() {
  // Serialize cloud writes. If another save is requested while one is in flight,
  // perform one fresh upload afterwards so an older snapshot cannot win a race.
  if (pushPromise) {
   pushQueued = true;
   return pushPromise;
  }

  pushPromise = (async () => {
   let uploaded = false;
   do {
    pushQueued = false;
    const userId = TozraAuth.userId(), client = TozraAuth.getClient();
    if (!client || userId === "guest" || applying) return false;

    const updatedAt = new Date().toISOString();
    const payload = { ...collect(), _meta: { version: 1, updatedAt, app: "TOZRA" } };
    const { error } = await client.from(TABLE).upsert(
     { user_id: userId, data: payload, updated_at: updatedAt },
     { onConflict: "user_id" }
    );
    if (error) {
     lastError = error.message || "Bulut kaydı başarısız.";
     console.warn("TOZRA cloud sync:", lastError);
     return false;
    }

    uploaded = true;
    lastError = "";
    window.dispatchEvent(new CustomEvent("tozra-cloud-status", { detail: { status: "synced" } }));
   } while (pushQueued);
   return uploaded;
  })();

  try {
   return await pushPromise;
  } finally {
   pushPromise = null;
   // A request may arrive just as the upload settles; never leave it stranded.
   if (pushQueued) schedule();
  }
 }
 function schedule() {
  if (applying || TozraAuth.userId() === "guest") return;
  clearTimeout(timer);
  timer = setTimeout(() => pushNow().catch(error => { lastError = error.message; console.warn("TOZRA cloud sync:", error); }), 700);
 }
 async function init(force = false) {
  const userId = TozraAuth.userId(), client = TozraAuth.getClient();
  if (!client || userId === "guest") { activeUser = null; return { synced: false, reason: "guest" }; }
  if (!force && activeUser === userId) return { synced: true, cached: true };
  activeUser = userId;
  try {
   // One-time migration from the previous guest namespace into the newly signed-in account.
   for (const key of KEYS) {
    const accountKey = `tozra-user:${userId}:${key}`;
    const guestKey = `tozra-guest:${key}`;
    if (localStorage.getItem(accountKey) === null) {
     const guestValue = localStorage.getItem(guestKey);
     if (guestValue !== null) localStorage.setItem(accountKey, guestValue);
    }
   }
   const { data: row, error } = await client.from(TABLE).select("data,updated_at").eq("user_id", userId).maybeSingle();
   if (error) throw error;
   if (row && row.data && typeof row.data === "object") {
    apply(row.data);
   } else {
    // First cloud activation: preserve this account's existing browser data and upload it once.
    await pushNow();
   }
   window.dispatchEvent(new CustomEvent("tozra-cloud-hydrated", { detail: { userId } }));
   window.dispatchEvent(new CustomEvent("tozra-cloud-status", { detail: { status: "synced" } }));
   return { synced: true, migrated: !row };
  } catch (error) {
   lastError = error.message || "Bulut verisine erişilemedi.";
   console.warn("TOZRA cloud sync başlatılamadı:", lastError);
   window.dispatchEvent(new CustomEvent("tozra-cloud-status", { detail: { status: "error", message: lastError } }));
   return { synced: false, reason: lastError };
  }
 }
 function getStatus() { return { userId: activeUser, error: lastError, pending: !!timer }; }
 return Object.freeze({ init, schedule, pushNow, getStatus });
})();
window.TozraCloudSync = TozraCloudSync;

const promptInput=$("prompt");
let conversation=[],conversations=[],projects=[],currentProjectId=null;
let busy=false,attachments=[],projectAttachments=[];
let agentModeEnabled=false;
const agentModeToggle=$("agentModeToggle");
if(agentModeToggle){
 agentModeToggle.onclick=()=>{
  agentModeEnabled=!agentModeEnabled;
  agentModeToggle.classList.toggle("active",agentModeEnabled);
  agentModeToggle.setAttribute("aria-pressed",String(agentModeEnabled));
  $("agentModeHint").hidden=!agentModeEnabled;
  $("prompt").placeholder=agentModeEnabled
   ?"AI Agent'e hedefini ver. Örn. Bir araştırma planla ve rapor hazırla..."
   :"TOZRA'ya bir şey sor...";
 };
}

const categories={
 "Fikir geliştirme":"✳",
 "İçerik üretimi":"▤",
 "Görsel stüdyo":"▧",
 "Video stüdyo":"▷",
 "Araştırma":"⌕"
};

function safeRead(key,fallback){
 try{
  const scopedKey=scopedStorageKey(key);
  let raw=localStorage.getItem(scopedKey);
  if(raw===null && TozraAuth.userId()!=="guest"){
   const legacy=localStorage.getItem(key);
   if(legacy!==null){raw=legacy;localStorage.setItem(scopedKey,legacy);localStorage.removeItem(key);}
  }
  const value=JSON.parse(raw||"null");
  return value===null?fallback:value;
 }catch(e){return fallback}
}
function safeSave(key,value){
 try{
  localStorage.setItem(scopedStorageKey(key),JSON.stringify(value));
  if (window.TozraCloudSync) window.TozraCloudSync.schedule();
  return true;
 }catch(e){
  console.error("Kayıt hatası:",e);
  alert("Tarayıcı depolama alanı dolmuş olabilir. Bazı veriler kaydedilemedi.");
  return false;
 }
}
function makeId(){
 return Date.now().toString(36)+Math.random().toString(36).slice(2,8);
}
function escapeHTML(value){
 return String(value).replace(/[&<>"']/g,c=>({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
 }[c]));
}
function escapeAttr(value){return escapeHTML(value)}

/* AÇILIŞ — giriş/kayıt sırasında sahne arka planda çalışmaya devam eder. */
let tozraSplashTimer=null;
function finishSplash(){
 const splash=$("splash");
 if(!splash)return;
 $("modalOverlay")?.classList.remove("splash-auth");
 splash.classList.add("hide");
 setTimeout(()=>splash.remove(),850);
}
function closeSplashAuth(){
 $("modalOverlay")?.classList.remove("show","splash-auth");
 finishSplash();
}
window.addEventListener("load",()=>{
 tozraSplashTimer=setTimeout(()=>{
  if(TozraAuth.getSession()) finishSplash();
  // Oturum yoksa splash kapanmaz; login kartı onun üzerinde açılır.
 },14000);
});

/* MENÜ */
function toggleMenu(close=false){
 const open=close?false:!$("sidebar").classList.contains("open");
 $("sidebar").classList.toggle("open",open);
 $("menuBackdrop").classList.toggle("show",open);
 document.body.style.overflow=open?"hidden":"";
}
$("menuButton").onclick=()=>toggleMenu();
$("menuBackdrop").onclick=()=>toggleMenu(true);

/* SAYFA GEÇİŞLERİ */
function showPage(page){
 document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
 $(page+"Page").classList.add("active");
 $("navWorkspace").classList.toggle("active",page==="workspace");
 $("navProjects").classList.toggle("active",page==="projectList"||page==="project");
 $("navChat").classList.toggle("active",page==="chat");
 $("navCreativeStudio").classList.toggle("active",page==="creativeStudio");
 $("navTasks").classList.toggle("active",page==="tasks");
 $("topbarTitle").textContent=
  page==="workspace"?"TOZRA AI":
  page==="projectList"?"PROJECTS":
  page==="project"?"PROJECT WORKSPACE":
  page==="creativeStudio"?"CREATIVE STUDIO":
  page==="tasks"?"GÖREVLERİM & TAKVİM":"IRCAL DESIGN";
 toggleMenu(true);
 window.scrollTo({top:0,behavior:"smooth"});
}
$("navWorkspace").onclick=()=>showPage("workspace");
$("navProjects").onclick=()=>{showPage("projectList");renderProjects();};
$("navChat").onclick=()=>openGeneralChat();
$("navCreativeStudio").onclick=()=>showPage("creativeStudio");
$("navTasks").onclick=()=>{showPage("tasks");renderTasksCalendar();};

$("chatBack").onclick=()=>showPage("workspace");
$("backWorkspace").onclick=()=>showPage("workspace");

function openGeneralChat(){
 showPage("chat");
 renderGeneralMessages();
}
window.openGeneralChat = openGeneralChat;
window.showPage = showPage;

/* AKILLI KARŞILAMA KOMUTU */
function startChatWithPrompt(value){
 const prompt=String(value||"").trim();
 openGeneralChat();
 if(prompt){
  promptInput.value=prompt;
  promptInput.dispatchEvent(new Event("input",{bubbles:true}));
  promptInput.focus();
 }
}

/* CREATIVE STUDIO */
const creativeModes={
 idea:{
  title:"Idea Lab çalışma alanı",name:"Yeni bir fikir geliştirelim",icon:"✧",
  description:"Aklındaki fikri net bir yaratıcı konsepte dönüştürelim.",
  task:"Yaratıcı stratejist gibi çalış. Fikri netleştir, problem ve fırsatı tanımla, 3 özgün konsept öner, en güçlü konsepti gerekçelendir ve uygulanabilir bir yaratıcı yol haritası çıkar."
 },
 image:{
  title:"Image Studio çalışma alanı",name:"Görsel konseptini tasarlayalım",icon:"▧",
  description:"Görsel üretim araçlarında kullanabileceğin ayrıntılı sanat yönetimi ve prompt hazırla.",
  task:"Sanat yönetmeni ve görsel konsept tasarımcısı gibi çalış. Görselin ana fikrini, kompozisyonunu, kadrajını, ışığını, renk paletini, materyallerini ve atmosferini tanımla. Sonunda görsel üretim araçlarında kullanılabilecek ayrıntılı bir prompt ve negatif prompt hazırla. Bu ortamda doğrudan görsel render etme; metinsel üretim brief'i oluştur."
 },
 video:{
  title:"Video Studio çalışma alanı",name:"Video fikrini prodüksiyona hazırlayalım",icon:"▷",
  description:"Video fikrini senaryo, storyboard ve çekim planına dönüştür.",
  task:"Video kreatif direktörü ve senarist gibi çalış. Fikri geliştir; hedef, süre, format, açılış kancası, sahne sahne storyboard, kamera/kurgu notları, ses ve ekran yazılarını hazırla. Sonunda prodüksiyon planı ver. Doğrudan video render ettiğini iddia etme."
 },
 design:{
  title:"Design Studio çalışma alanı",name:"Marka ve tasarım kimliği oluşturalım",icon:"◈",
  description:"Marka karakteri, görsel kimlik ve tasarım brief'i oluştur.",
  task:"Marka ve grafik tasarım danışmanı gibi çalış. Marka konumlandırması, kişilik, isim/slogan alternatifleri gerekiyorsa öner, logo yönü, renk paleti, tipografi yaklaşımı, görsel sistem ve kullanım örneklerini içeren profesyonel bir tasarım brief'i hazırla."
 },
 writing:{
  title:"Writing Studio çalışma alanı",name:"Metin ve hikâyeni oluşturalım",icon:"▤",
  description:"Hedef kitlene ve platformuna uygun güçlü metinler üret.",
  task:"Profesyonel içerik yazarı ve editör gibi çalış. Amaç ve hedef kitleyi dikkate alarak güçlü bir metin üret. Gerektiğinde başlık alternatifleri, farklı ton seçenekleri, kısa/uzun versiyonlar ve yayın öncesi kontrol listesi ekle."
 },
 campaign:{
  title:"Campaign Lab çalışma alanı",name:"Yaratıcı kampanyanı planlayalım",icon:"⌁",
  description:"Kampanya fikrini hedef, kanal ve içerik planına dönüştür.",
  task:"Kreatif kampanya stratejisti gibi çalış. Kampanya amacı, hedef kitle, içgörü, ana fikir, slogan, kanal stratejisi, içerik serisi, yayın akışı ve başarı göstergelerini içeren uygulanabilir bir kampanya planı hazırla."
 }
};
let activeCreativeMode="idea";

function setCreativeMode(mode){
 const config=creativeModes[mode]||creativeModes.idea;
 activeCreativeMode=mode in creativeModes?mode:"idea";
 document.querySelectorAll("[data-creative-mode]").forEach(button=>{
  button.classList.toggle("selected",button.dataset.creativeMode===activeCreativeMode);
  button.classList.toggle("active",button.dataset.creativeMode===activeCreativeMode && button.classList.contains("studio-link"));
 });
 $("csBuilderTitle").textContent=config.title;
 $("csBuilderName").textContent=config.name;
 $("csBuilderIcon").textContent=config.icon;
 $("csBuilderDescription").textContent=config.description;
 const placeholders={
  idea:"Aklındaki fikir nedir? Hangi problemi çözüyor veya neyi farklı yapmak istiyorsun?",
  image:"Nasıl bir görsel istiyorsun? Konu, kullanım yeri, boyut, atmosfer ve referanslarını anlat...",
  video:"Videonun konusu, süresi, yayınlanacağı platform ve vermek istediğin mesaj nedir?",
  design:"Marka veya tasarımın adı, sektörü, hedef kitlesi ve vermesini istediğin his nedir?",
  writing:"Ne tür bir metin yazıyoruz? Konu, platform, hedef kitle, amaç ve yaklaşık uzunluğu belirt...",
  campaign:"Kampanyanın amacı, ürün/hizmet, hedef kitle, platformlar ve zaman aralığı nedir?"
 };
 $("csBrief").placeholder=placeholders[activeCreativeMode];
}
document.querySelectorAll("[data-creative-mode]").forEach(button=>{
 button.addEventListener("click",()=>{
  setCreativeMode(button.dataset.creativeMode);
  showPage("creativeStudio");
  $("csBrief").focus({preventScroll:true});
 });
});
function buildCreativePrompt(){
 const config=creativeModes[activeCreativeMode]||creativeModes.idea;
 const title=$("csProjectName").value.trim();
 const brief=$("csBrief").value.trim();
 const audience=$("csAudience").value.trim();
 const tone=$("csTone").value;
 if(!brief){
  alert("Lütfen yaratıcı brief alanına fikrini veya ihtiyacını yaz.");
  $("csBrief").focus();
  return null;
 }
 return [
  "TOZRA CREATIVE STUDIO — "+config.title,
  "ÇALIŞMA ADI: "+(title||"İsimsiz yaratıcı çalışma"),
  "ÇALIŞMA TÜRÜ: "+config.title,
  "HEDEF KİTLE: "+(audience||"Belirtilmedi"),
  "YARATICI YAKLAŞIM: "+tone,
  "",
  "KULLANICININ BRIEF'İ:",
  brief,
  "",
  "GÖREV:",
  config.task,
  "Önce brief'i değerlendir. Eksik kritik bilgi varsa tek bir net soru sor; yeterli bilgi varsa doğrudan uygulanabilir ve profesyonel bir çıktı üret. Varsayımlarını açıkça belirt. Sonucu başlıklarla düzenle ve sonraki geliştirme adımını öner."
 ].join("\n");
}
$("csGenerate").onclick=()=>{
 const creativePrompt=buildCreativePrompt();
 if(!creativePrompt)return;
 showPage("chat");
 startChatWithPrompt(creativePrompt);
};
$("csStartIdea").onclick=()=>{
 setCreativeMode("idea");
 showPage("creativeStudio");
 $("csBrief").focus({preventScroll:true});
};
$("csSaveProject").onclick=()=>{
 const brief=$("csBrief").value.trim();
 if(!brief){
  alert("Önce yaratıcı brief alanına çalışmanı yaz.");
  $("csBrief").focus();
  return;
 }
 const config=creativeModes[activeCreativeMode]||creativeModes.idea;
 const name=$("csProjectName").value.trim()||config.name;
 const description=brief.slice(0,250);
 const project={
  id:makeId(),name,category:activeCreativeMode==="image"?"Görsel stüdyo":
   activeCreativeMode==="video"?"Video stüdyo":
   activeCreativeMode==="writing"?"İçerik üretimi":
   activeCreativeMode==="design"?"Görsel stüdyo":
   activeCreativeMode==="campaign"?"İçerik üretimi":"Fikir geliştirme",
  description,createdAt:Date.now(),updatedAt:Date.now(),
  messages:[],notes:"CREATIVE STUDIO BRIEF\n\n"+brief+"\n\nHedef kitle: "+($("csAudience").value.trim()||"Belirtilmedi")+"\nYaratıcı yaklaşım: "+$("csTone").value
 };
 projects.unshift(project);
 saveProjects();
 openProject(project.id);
 $("projectPrompt").value="Bu Creative Studio brief'ini temel alarak çalışmayı geliştirelim:\n\n"+brief;
 $("projectPrompt").dispatchEvent(new Event("input",{bubbles:true}));
};
setCreativeMode("idea");

// Ana ekrandaki öneriler mevcut sohbet akışına yönlendirilir.
document.querySelectorAll('[data-home-prompt]').forEach(button=>{
 button.addEventListener('click',()=>startChatWithPrompt(button.dataset.homePrompt));
});
$("homeProfileButton")?.addEventListener("click",()=>$("profileButton")?.click());
/* Home voice button is wired once by voice.js after auth initialization. */

/* PROJE SİSTEMİ */
function updateDashboardStats(){
 if($("statChats"))$("statChats").textContent=String(Array.isArray(conversations)?conversations.length:0);
 if($("statProjects"))$("statProjects").textContent=String(projects.length);
 const user=TozraAuth.getSession()?.user;
 const name=user?.user_metadata?.full_name?.trim()?.split(/\s+/)[0];
 const hour=new Date().getHours(), greeting=hour<12?"Günaydın":hour<18?"İyi günler":"İyi akşamlar";
 if($("dashboardGreeting"))$("dashboardGreeting").textContent=name?`${greeting}, ${name}. Bugün ne üretmek istersin?`:`${greeting}. YARATICI ÇALIŞMA ALANIN.`;
}
function loadProjects(){
 const data=safeRead("tozra-projects",[]);
 projects=Array.isArray(data)?data:[];
 projects.forEach(p=>{
  p.messages=Array.isArray(p.messages)?p.messages:[];
  p.notes=typeof p.notes==="string"?p.notes:"";
  p.createdAt=p.createdAt||Date.now();
  p.updatedAt=p.updatedAt||p.createdAt;
  p.category=p.category||"Fikir geliştirme";
  p.description=p.description||"";
 });
 safeSave("tozra-projects",projects);
 renderProjects();
}
function saveProjects(){
 safeSave("tozra-projects",projects);
 renderProjects();
}
function renderProgressCenter(){
 const byId=id=>document.getElementById(id);
 if(!byId("pcProjectTotal"))return;
 const all=Array.isArray(projects)?projects:[];
 let stepTotal=0,stepDone=0,taskTotal=0,taskDone=0;
 const rows=all.map(project=>{
  const studio=project.studio&&typeof project.studio==="object"?project.studio:{};
  const milestones=Array.isArray(studio.milestones)?studio.milestones:[];
  const tasks=Array.isArray(studio.tasks)?studio.tasks:[];
  const total=milestones.length+tasks.length;
  const done=milestones.filter(x=>x.done).length+tasks.filter(x=>x.done).length;
  stepTotal+=total;stepDone+=done;taskTotal+=tasks.length;taskDone+=tasks.filter(x=>x.done).length;
  return {project,total,done,pct:total?Math.round(done/total*100):0,open:tasks.filter(x=>!x.done).length+milestones.filter(x=>!x.done).length};
 }).sort((a,b)=>(b.project.updatedAt||0)-(a.project.updatedAt||0));
 const daily=(()=>{try{const value=JSON.parse(localStorage.getItem("tozra-web-home-tasks-v1")||"[]");return Array.isArray(value)?value:[]}catch{return []}})();
 const dailyDone=daily.filter(x=>x.done).length;
 byId("pcProjectTotal").textContent=String(all.length);
 byId("pcAverageProgress").textContent=(stepTotal?Math.round(stepDone/stepTotal*100):0)+"%";
 byId("pcTasksDone").textContent=String(taskDone);
 byId("pcTasksCaption").textContent=taskDone+" / "+taskTotal+" proje görevi tamamlandı";
 byId("pcDailyDone").textContent=dailyDone+"/"+daily.length;
 const list=byId("pcProjectList");list.replaceChildren();
 if(!rows.length){
  const empty=document.createElement("div");empty.className="pc-empty";empty.textContent="Henüz proje yok. İlk projen oluşturulduğunda ilerleme özeti burada görünecek.";list.appendChild(empty);
 }else{
  rows.slice(0,5).forEach(row=>{
   const item=document.createElement("button");item.type="button";item.className="pc-project-row";
   const top=document.createElement("span");top.className="pc-project-top";
   const name=document.createElement("strong");name.textContent=row.project.name;
   const pct=document.createElement("b");pct.textContent=row.pct+"%";top.append(name,pct);
   const track=document.createElement("span");track.className="pc-track";
   const fill=document.createElement("span");fill.style.width=row.pct+"%";track.appendChild(fill);
   const meta=document.createElement("span");meta.className="pc-project-meta";meta.textContent=row.total?row.done+" / "+row.total+" adım tamamlandı":"Henüz takip edilecek adım eklenmedi";
   item.append(top,track,meta);item.addEventListener("click",()=>openProject(row.project.id));list.appendChild(item);
  });
 }
 const next=byId("pcNextStep");next.replaceChildren();
 let candidate=null;
 for(const row of rows){
  const studio=row.project.studio||{};
  const firstTask=(Array.isArray(studio.tasks)?studio.tasks:[]).find(x=>!x.done);
  const firstMilestone=(Array.isArray(studio.milestones)?studio.milestones:[]).find(x=>!x.done);
  const step=firstTask||firstMilestone;
  if(step){candidate={row,step};break;}
 }
 const icon=document.createElement("span");icon.className="pc-next-icon";icon.textContent="✦";
 const title=document.createElement("strong"),desc=document.createElement("p");
 if(candidate){
  title.textContent=candidate.step.title;
  desc.textContent=candidate.row.project.name+" · Sıradaki tamamlanmamış adım";
  next.append(icon,title,desc);
  const open=document.createElement("button");open.type="button";open.className="pc-open-next";open.textContent="Projeyi aç ↗";open.addEventListener("click",()=>openProject(candidate.row.project.id));next.appendChild(open);
 }else if(daily.some(x=>!x.done)){
  const todo=daily.find(x=>!x.done);title.textContent=todo.title;desc.textContent="Bugünkü görevlerinden sıradaki tamamlanmamış hedef.";
  next.append(icon,title,desc);
 }else{
  title.textContent=all.length?"Harika, bekleyen adım görünmüyor":"İlk projenle başla";
  desc.textContent=all.length?"Yeni bir hedef veya görev ekleyerek ilerlemeye devam et.":"Bir proje oluşturduğunda TOZRA ilerlemeni burada takip edecek.";
  next.append(icon,title,desc);
 }
}
document.getElementById("pcRefresh")?.addEventListener("click",renderProgressCenter);
function renderProjects(){
 const grid=$("projectGrid");
 grid.innerHTML="";
 $("projectCount").textContent=projects.length+" proje";
 if($("statProjects"))$("statProjects").textContent=String(projects.length);
 renderProgressCenter();

 if(!projects.length){
  const empty=document.createElement("div");
  empty.className="empty-projects";
  const strong=document.createElement("strong");
  strong.textContent="Henüz bir projen yok.";
  const p=document.createElement("div");
  p.textContent="İlk fikrini oluştur ve TOZRA ile geliştirmeye başla.";
  const btn=document.createElement("button");
  btn.className="primary-btn";
  btn.textContent="＋ İlk projeni oluştur";
  btn.onclick=()=>openProjectModal();
  empty.append(strong,p,btn);
  grid.appendChild(empty);
  return;
 }

 projects.slice().sort((a,b)=>b.updatedAt-a.updatedAt).forEach(project=>{
  const card=document.createElement("article");
  card.className="project-card";
  card.onclick=()=>openProject(project.id);

  const top=document.createElement("div");
  top.className="project-top";
  const symbol=document.createElement("div");
  symbol.className="project-symbol";
  symbol.textContent=categories[project.category]||"▣";

  const menu=document.createElement("button");
  menu.className="project-menu";
  menu.textContent="···";
  menu.title="Proje seçenekleri";
  menu.onclick=e=>{
   e.stopPropagation();
   openProjectOptions(project.id);
  };
  top.append(symbol,menu);

  const name=document.createElement("h3");
  name.textContent=project.name;
  const desc=document.createElement("p");
  desc.textContent=project.description||"Bu proje için henüz açıklama eklenmedi.";

  const meta=document.createElement("div");
  meta.className="project-meta";
  const cat=document.createElement("span");
  cat.textContent=project.category;
  const date=document.createElement("span");
  date.textContent=new Date(project.updatedAt).toLocaleDateString("tr-TR");
  meta.append(cat,date);

  card.append(top,name,desc,meta);
  grid.appendChild(card);
 });
}

function openProjectModal(id=null,category=null){
 const existing=id?projects.find(p=>p.id===id):null;
 $("modalTitle").textContent=existing?"Projeyi düzenle":"Yeni proje oluştur";
 $("modalContent").innerHTML=`
  <p>${existing?"Proje bilgilerini güncelle.":"Yeni fikrini bir projeye dönüştür. Proje bilgilerini daha sonra değiştirebilirsin."}</p>
  <label class="form-label" for="projectNameInput">Proje adı</label>
  <input class="modal-input" id="projectNameInput" maxlength="70" placeholder="Örn. Yeni marka projem" value="${escapeAttr(existing?.name||"")}">
  <label class="form-label" for="projectCategoryInput">Proje kategorisi</label>
  <select class="modal-select" id="projectCategoryInput">
   ${Object.keys(categories).map(c=>`<option ${((existing?.category||category)===c)?"selected":""}>${c}</option>`).join("")}
  </select>
  <label class="form-label" for="projectDescriptionInput">Kısa açıklama</label>
  <textarea class="modal-input" id="projectDescriptionInput" maxlength="250" rows="3" placeholder="Bu projede ne geliştirmek istiyorsun?">${escapeHTML(existing?.description||"")}</textarea>
  <button class="primary" id="saveProjectButton">${existing?"Değişiklikleri kaydet":"Projeyi oluştur"}</button>`;

 $("modalOverlay").classList.add("show");
 $("saveProjectButton").onclick=()=>{
  const name=$("projectNameInput").value.trim();
  const cat=$("projectCategoryInput").value;
  const description=$("projectDescriptionInput").value.trim();

  if(!name){
   alert("Lütfen proje adına bir isim yaz.");
   $("projectNameInput").focus();
   return;
  }

  if(existing){
   existing.name=name;
   existing.category=cat;
   existing.description=description;
   existing.updatedAt=Date.now();
   saveProjects();
   $("modalOverlay").classList.remove("show");
   openProject(existing.id);
  }else{
   const project={
    id:makeId(),name,category:cat,description,
    createdAt:Date.now(),updatedAt:Date.now(),
    messages:[],notes:""
   };
   projects.unshift(project);
   saveProjects();
   $("modalOverlay").classList.remove("show");
   openProject(project.id);
  }
 };
}

/* PROJECT STUDIO — proje hedefi, yol haritası ve görev takibi */
function ensureProjectStudio(project){
 if(!project.studio||typeof project.studio!=="object")project.studio={goal:"",milestones:[],tasks:[]};
 if(!Array.isArray(project.studio.milestones))project.studio.milestones=[];
 if(!Array.isArray(project.studio.tasks))project.studio.tasks=[];
 return project.studio;
}
function saveProjectStudio(){
 const p=getCurrentProject();
 if(!p)return;
 p.updatedAt=Date.now();
 saveProjects();
 renderProjectStudio(p);
}
function renderProjectStudio(project){
 const studio=ensureProjectStudio(project);
 const goal=$("psGoal");
 if(goal&&goal.value!==studio.goal)goal.value=studio.goal||"";
 const milestoneList=$("psMilestoneList"),taskList=$("psTaskList");
 if(!milestoneList||!taskList)return;
 milestoneList.innerHTML="";
 taskList.innerHTML="";
 const makeEmpty=(container,message)=>{
  const empty=document.createElement("div");empty.className="ps-empty";empty.textContent=message;container.appendChild(empty);
 };
 if(!studio.milestones.length)makeEmpty(milestoneList,"Projenin aşamalarını burada sırala.");
 studio.milestones.forEach((item,index)=>{
  const row=document.createElement("div");row.className="ps-list-row"+(item.done?" is-done":"");
  const check=document.createElement("button");check.type="button";check.className="ps-check";check.setAttribute("aria-label",item.done?"Aşamayı yeniden aç":"Aşamayı tamamla");check.textContent=item.done?"✓":"";
  check.onclick=()=>{item.done=!item.done;saveProjectStudio();};
  const label=document.createElement("span");label.className="ps-row-label";label.textContent=item.title;
  const remove=document.createElement("button");remove.type="button";remove.className="ps-remove";remove.textContent="×";remove.setAttribute("aria-label","Aşamayı sil");
  remove.onclick=()=>{studio.milestones.splice(index,1);saveProjectStudio();};
  row.append(check,label,remove);milestoneList.appendChild(row);
 });
 if(!studio.tasks.length)makeEmpty(taskList,"İlk görevini ekleyerek ilerlemeyi başlat.");
 studio.tasks.forEach((item,index)=>{
  const row=document.createElement("div");row.className="ps-list-row"+(item.done?" is-done":"");
  const check=document.createElement("button");check.type="button";check.className="ps-check";check.setAttribute("aria-label",item.done?"Görevi yeniden aç":"Görevi tamamla");check.textContent=item.done?"✓":"";
  check.onclick=()=>{item.done=!item.done;saveProjectStudio();};
  const label=document.createElement("span");label.className="ps-row-label";label.textContent=item.title;
  const remove=document.createElement("button");remove.type="button";remove.className="ps-remove";remove.textContent="×";remove.setAttribute("aria-label","Görevi sil");
  remove.onclick=()=>{studio.tasks.splice(index,1);saveProjectStudio();};
  row.append(check,label,remove);taskList.appendChild(row);
 });
 const total=studio.tasks.length+studio.milestones.length;
 const done=studio.tasks.filter(x=>x.done).length+studio.milestones.filter(x=>x.done).length;
 const pct=total?Math.round(done/total*100):0;
 $("psProgressValue").textContent=pct+"%";
 $("psProgressBar").style.width=pct+"%";
 $("psProgressCount").textContent=done+" / "+total+" tamamlandı";
 $("psProgressCaption").textContent=total?(pct===100?"Harika! Bu projenin tüm adımları tamamlandı.":"Adım adım ilerliyorsun."):"İlk adımını ekleyerek başla.";
 $("psMilestoneCount").textContent=studio.milestones.length;
 $("psTaskCount").textContent=studio.tasks.length;
 $("psDoneCount").textContent=done;
}
$("psGoal").addEventListener("input",()=>{
 const p=getCurrentProject();if(!p)return;
 ensureProjectStudio(p).goal=$("psGoal").value;
 p.updatedAt=Date.now();safeSave("tozra-projects",projects);
 $("psGoalStatus").textContent="Kaydediliyor…";
 clearTimeout(window.__psGoalSaveTimer);
 window.__psGoalSaveTimer=setTimeout(()=>{
  safeSave("tozra-projects",projects);
  $("psGoalStatus").textContent="Hedefin kaydedildi.";
 },350);
});
$("psMilestoneForm").addEventListener("submit",event=>{
 event.preventDefault();const p=getCurrentProject(),input=$("psMilestoneInput");
 const title=input.value.trim();if(!p||!title)return;
 ensureProjectStudio(p).milestones.push({id:makeId(),title,done:false,createdAt:Date.now()});
 input.value="";saveProjectStudio();input.focus();
});
$("psTaskForm").addEventListener("submit",event=>{
 event.preventDefault();const p=getCurrentProject(),input=$("psTaskInput");
 const title=input.value.trim();if(!p||!title)return;
 ensureProjectStudio(p).tasks.push({id:makeId(),title,done:false,createdAt:Date.now()});
 input.value="";saveProjectStudio();input.focus();
});
function askProjectStudioAI(kind){
 const p=getCurrentProject();if(!p)return;
 const studio=ensureProjectStudio(p);
 const summary=[
  "Bu projeyi Project Studio kapsamında değerlendir.",
  "Proje: "+p.name,
  "Kategori: "+p.category,
  "Açıklama: "+(p.description||"Belirtilmedi"),
  "Hedef: "+(studio.goal||"Henüz belirlenmedi"),
  "Yol haritası: "+(studio.milestones.map(x=>(x.done?"[Tamamlandı] ":"[Bekliyor] ")+x.title).join("; ")||"Henüz yok"),
  "Görevler: "+(studio.tasks.map(x=>(x.done?"[Tamamlandı] ":"[Bekliyor] ")+x.title).join("; ")||"Henüz yok"),
  kind==="plan"?"Eksik bilgileri sorarak netleştir; ardından ölçülebilir hedef, mantıklı aşamalar, önceliklendirilmiş görevler ve gerçekçi bir başlangıç planı öner.":"Projenin mevcut durumunu analiz et. En önemli üç riski, üç fırsatı ve hemen atılabilecek en iyi sonraki adımı belirt. Kullanıcı onaylamadan mevcut görevleri değiştirme."
 ].join("\\n");
 $("projectPrompt").value=summary;
 showPage("project");
 $("projectPrompt").focus();
 $("projectPrompt").scrollIntoView({behavior:"smooth",block:"center"});
}
$("psAiPlan").onclick=()=>askProjectStudioAI("plan");
$("psAiAdvice").onclick=()=>askProjectStudioAI("advice");

/* PROJE DETAYI */
function openProject(id){
 const project=projects.find(p=>p.id===id);
 if(!project)return;

 currentProjectId=id;
 $("detailName").textContent=project.name;
 $("detailCategory").textContent=project.category.toUpperCase();
 $("detailDescription").textContent=project.description||"Bu projeyi TOZRA ile birlikte geliştirmeye başla.";
 $("projectNotes").value=project.notes||"";
 renderProjectStudio(project);

 renderProjectInfo(project);
 renderProjectMessages();
 showPage("project");
}
function getCurrentProject(){
 return projects.find(p=>p.id===currentProjectId);
}
function renderProjectInfo(project){
 $("projectInfo").innerHTML=`
  <div><strong>Kategori:</strong> ${escapeHTML(project.category)}</div>
  <div><strong>Oluşturulma:</strong> ${new Date(project.createdAt).toLocaleDateString("tr-TR")}</div>
  <div><strong>Son güncelleme:</strong> ${new Date(project.updatedAt).toLocaleDateString("tr-TR")}</div>
  <div><strong>Mesaj sayısı:</strong> ${project.messages.length}</div>`;
}

/* PROJE HAFIZASI */
function buildProjectContext(project){
 return [
  "[TOZRA PROJE HAFIZASI]",
  "Bu istek yalnızca aşağıdaki projeye aittir.",
  "Bu projeye ait bilgileri başka projelerle karıştırma.",
  "",
  "Proje adı: "+project.name,
  "Proje kategorisi: "+project.category,
  "Proje açıklaması: "+(project.description||"Belirtilmedi"),
  "Proje hedefi: "+(project.studio?.goal||"Henüz belirlenmedi"),
  "Yol haritası: "+((project.studio?.milestones||[]).map(x=>(x.done?"Tamamlandı: ":"Bekliyor: ")+x.title).join("; ")||"Henüz oluşturulmadı"),
  "Görevler: "+((project.studio?.tasks||[]).map(x=>(x.done?"Tamamlandı: ":"Bekliyor: ")+x.title).join("; ")||"Henüz oluşturulmadı"),
  "",
  "[PROJE NOTLARI]",
  project.notes||"Henüz proje notu eklenmedi.",
  "",
  "[HAFIZA TALİMATI]",
  "Önceki proje konuşmalarını history alanından dikkate al.",
  "Kullanıcının bu projeyle ilgili önceki kararlarını ve tercihlerini koru.",
  "Yeni bilgiler önceki bilgilerle çelişirse kullanıcıya sor.",
  "Diğer projelerin bilgilerini kullanma.",
  "Yanıtlarını bu projenin amacına ve bağlamına göre oluştur."
 ].join("\n");
}

function findRelevantProjectContext(prompt){
 const query=String(prompt||"").toLocaleLowerCase("tr-TR");
 const projectIntent=/\b(proje|projeyi|projem|projeme|tozra|uygulama|ürünüm|ürün)\b/.test(query);
 if(!projectIntent)return "";

 const candidates=Array.isArray(projects)?projects:[];
 const normalize=value=>String(value||"")
  .trim().toLocaleLowerCase("tr-TR")
  .replace(/[ıİ]/g,"i");

 const named=candidates.find(project=>{
  const name=normalize(project.name);
  return name.length>=3 && normalize(query).includes(name);
 });
 const tozraProject=candidates.find(project=>normalize(project.name)==="tozra");
 const active=getCurrentProject();

 // Öncelik: açık isim eşleşmesi, TOZRA adı, aktif proje, tek kayıtlı proje.
 const selected=named ||
  (/\btozra\b/.test(query) ? tozraProject : null) ||
  (active && /\b(aktif proje|bu proje|mevcut projem|projem)\b/.test(query) ? active : null) ||
  (candidates.length===1 ? candidates[0] : null);

 if(!selected)return "";
 const context=buildProjectContext(selected);
 return typeof context==="string" ? context.slice(0,10000) : "";
}

$("projectNotes").addEventListener("input",()=>{
 const p=getCurrentProject();
 if(!p)return;
 p.notes=$("projectNotes").value;
 p.updatedAt=Date.now();
 safeSave("tozra-projects",projects);
});

$("editProject").onclick=()=>{
 const p=getCurrentProject();
 if(p)openProjectModal(p.id);
};
$("deleteProject").onclick=()=>deleteProject(currentProjectId);

function deleteProject(id){
 const p=projects.find(x=>x.id===id);
 if(!p)return;
 if(!confirm('"'+p.name+'" projesini silmek istediğine emin misin? Bu işlem geri alınamaz.'))return;
 projects=projects.filter(x=>x.id!==id);
 saveProjects();
 currentProjectId=null;
 showPage("workspace");
}

function openProjectOptions(id){
 const p=projects.find(x=>x.id===id);
 if(!p)return;
 $("modalTitle").textContent=p.name;
 $("modalContent").innerHTML=`
  <p>Bu proje üzerinde ne yapmak istiyorsun?</p>
  <button class="primary" id="optionOpen">Projeyi aç</button>
  <button class="secondary" id="optionEdit">Projeyi düzenle</button>
  <button class="secondary" id="optionDelete">Projeyi sil</button>`;
 $("modalOverlay").classList.add("show");
 $("optionOpen").onclick=()=>{
  $("modalOverlay").classList.remove("show");
  openProject(id);
 };
 $("optionEdit").onclick=()=>openProjectModal(id);
 $("optionDelete").onclick=()=>{
  $("modalOverlay").classList.remove("show");
  deleteProject(id);
 };
}

/* TÜRKÇE SESLİ YANIT — tarayıcının ücretsiz SpeechSynthesis özelliği */
function speakText(content, button){
 if(!("speechSynthesis" in window)){
  if(button)button.textContent="Ses desteklenmiyor";
  return;
 }
 const clean=String(content||"").trim();
 if(!clean)return;
 window.speechSynthesis.cancel();
 const utterance=new SpeechSynthesisUtterance(clean);
 utterance.lang="tr-TR";
 utterance.rate=1;
 utterance.pitch=1;
 const voices=window.speechSynthesis.getVoices();
 const turkish=voices.find(v=>/^tr([-_]|$)/i.test(v.lang));
 if(turkish)utterance.voice=turkish;
 utterance.onstart=()=>{if(button)button.textContent="⏸ Okunuyor…";};
 utterance.onend=()=>{if(button)button.textContent="🔊 Sesli dinle";};
 utterance.onerror=()=>{if(button)button.textContent="🔊 Tekrar dene";};
 window.speechSynthesis.speak(utterance);
}
function speakNextVoiceReply(content){
 if(!window.tozraSpeakNextReply)return;
 window.tozraSpeakNextReply=false;
 speakText(content);
}

/* MESAJ GÖRÜNÜMÜ */
function addMessage(area,role,content,sources=[]){
 const wrap=document.createElement("div");
 wrap.className="message "+role;
 const label=document.createElement("div");
 label.className="message-label";
 label.textContent=role==="user"?"SEN":"TOZRA";
 const text=document.createElement("div");
 text.className="message-text";
 text.textContent=content;
 wrap.append(label,text);

 if(role==="assistant" && Array.isArray(sources) && sources.length){
  const sourceBox=document.createElement("div");
  sourceBox.className="tozra-source-list";
  const sourceTitle=document.createElement("div");
  sourceTitle.className="tozra-source-title";
  sourceTitle.textContent="İnternette bulunan kaynaklar";
  sourceBox.appendChild(sourceTitle);
  sources.slice(0,8).forEach(source=>{
   if(!source || typeof source.url!=="string")return;
   try{
    const url=new URL(source.url);
    if(!["http:","https:"].includes(url.protocol))return;
    const link=document.createElement("a");
    link.href=url.href;
    link.target="_blank";
    link.rel="noopener noreferrer";
    link.textContent=String(source.title||url.hostname).slice(0,180);
    sourceBox.appendChild(link);
   }catch(e){}
  });
  if(sourceBox.querySelector("a"))wrap.appendChild(sourceBox);
 }

 if(role==="assistant"){
  const copy=document.createElement("button");
  copy.className="copy-button";
  copy.textContent="Kopyala";
  copy.onclick=async()=>{
   try{
    await navigator.clipboard.writeText(content);
    copy.textContent="Kopyalandı";
   }catch(e){copy.textContent="Kopyalanamadı"}
  };
  const speak=document.createElement("button");
  speak.className="speak-button";
  speak.type="button";
  speak.textContent="🔊 Sesli dinle";
  speak.onclick=()=>speakText(content,speak);
  wrap.append(copy,speak);
 }
 area.appendChild(wrap);
 wrap.scrollIntoView({behavior:"smooth",block:"end"});
}

function renderProjectMessages(){
 const p=getCurrentProject();
 const area=$("projectMessages");
 area.innerHTML="";
 if(!p)return;
 p.messages.forEach(m=>addMessage(area,m.role,m.content,m.sources||[]));
}
function renderGeneralMessages(){
 $("messages").innerHTML="";
 $("welcome").style.display=conversation.length?"none":"block";
 conversation.forEach(m=>addMessage($("messages"),m.role,m.content,m.sources||[]));
}

/* GENEL SOHBET GEÇMİŞİ */
function saveGeneralConversation(){
 if(!conversation.length)return;
 const id=conversation[0].id||Date.now();
 const item={
  id,
  title:conversation.find(m=>m.role==="user")?.content.slice(0,35)||"Yeni sohbet",
  messages:conversation
 };
 const i=conversations.findIndex(x=>x.id===id);
 if(i>=0)conversations[i]=item;
 else conversations.unshift(item);
 safeSave("tozra-conversations",conversations);
 renderHistory();
}
function loadHistory(){
 conversations=safeRead("tozra-conversations",[]);
 if(!Array.isArray(conversations))conversations=[];
 renderHistory();
}
function renderHistory(){
 $("history").innerHTML="";
 conversations.forEach(item=>{
  const el=document.createElement("div");
  el.className="history-item";
  el.textContent=item.title||"Sohbet";
  el.onclick=()=>{
   conversation=Array.isArray(item.messages)?item.messages:[];
   openGeneralChat();
  };
  $("history").appendChild(el);
 });
 updateDashboardStats();
}

/* DOSYA EKLERİ */
function renderAttachmentsFor(list,areaId){
 const area=$(areaId);
 area.innerHTML="";
 list.forEach((a,index)=>{
  const item=document.createElement("div");
  item.className="attachment";
  if(a.kind==="image"){
   const img=document.createElement("img");
   img.src=a.url;
   item.appendChild(img);
  }else{
   const video=document.createElement("video");
   video.src=a.url;
   video.muted=true;
   item.appendChild(video);
  }
  const name=document.createElement("span");
  name.textContent=a.file.name.slice(0,18);
  item.appendChild(name);
  const remove=document.createElement("button");
  remove.className="remove-file";
  remove.textContent="×";
  remove.onclick=()=>{
   URL.revokeObjectURL(a.url);
   list.splice(index,1);
   renderAttachmentsFor(list,areaId);
  };
  item.appendChild(remove);
  area.appendChild(item);
 });
}
function addFiles(files,kind,list,areaId){
 const selected=Array.from(files);
 if(list.length+selected.length>3){
  alert("Bir mesajda en fazla 3 dosya ekleyebilirsin.");
  return;
 }
 for(const file of selected){
  if(kind==="image"&&!["image/jpeg","image/png","image/webp"].includes(file.type)){
   alert("JPG, PNG veya WEBP fotoğraf seç.");
   continue;
  }
  if(kind==="video"&&!file.type.startsWith("video/")){
   alert("Geçerli bir video seç.");
   continue;
  }
  if(file.size>40*1024*1024){
   alert("Dosya boyutu 40 MB sınırını aşıyor.");
   continue;
  }
  list.push({file,kind,url:URL.createObjectURL(file)});
 }
 renderAttachmentsFor(list,areaId);
}
function clearFiles(list,areaId){
 list.forEach(a=>URL.revokeObjectURL(a.url));
 list.length=0;
 renderAttachmentsFor(list,areaId);
}
function imageToDataURL(file,maxSide=1100,quality=.72){
 return new Promise((resolve,reject)=>{
  const img=new Image();
  const url=URL.createObjectURL(file);
  img.onload=()=>{
   const scale=Math.min(1,maxSide/Math.max(img.width,img.height));
   const canvas=document.createElement("canvas");
   canvas.width=Math.max(1,Math.round(img.width*scale));
   canvas.height=Math.max(1,Math.round(img.height*scale));
   const ctx=canvas.getContext("2d");
   ctx.drawImage(img,0,0,canvas.width,canvas.height);
   URL.revokeObjectURL(url);
   resolve(canvas.toDataURL("image/jpeg",quality));
  };
  img.onerror=()=>{
   URL.revokeObjectURL(url);
   reject(new Error("Fotoğraf okunamadı."));
  };
  img.src=url;
 });
}
function formatTime(seconds){
 const safe=Math.max(0,Math.floor(seconds));
 return String(Math.floor(safe/60)).padStart(2,"0")+":"+String(safe%60).padStart(2,"0");
}
function videoToFrames(file,count=3){
 return new Promise((resolve,reject)=>{
  const video=document.createElement("video");
  const url=URL.createObjectURL(file);
  video.preload="auto";
  video.muted=true;
  video.playsInline=true;
  let finished=false;

  const finish=()=>{
   if(finished)return;
   finished=true;
   video.onloadeddata=null;
   video.onerror=null;
   URL.revokeObjectURL(url);
   video.removeAttribute("src");
   video.load();
  };

  video.onerror=()=>{
   finish();
   reject(new Error("Video okunamadı."));
  };

  video.onloadeddata=async()=>{
   try{
    const duration=video.duration;
    if(!Number.isFinite(duration)||duration<=0)throw new Error("Video süresi okunamadı.");
    const fractions=count===1?[.5]:count===2?[.2,.8]:[.1,.5,.9];
    const frames=[];

    for(const f of fractions){
     const target=Math.min(duration*f,Math.max(0,duration-.05));
     await new Promise((res,rej)=>{
      let settled=false;
      const timer=setTimeout(()=>{
       if(!settled){settled=true;rej(new Error("Video karesi alınamadı."))}
      },12000);
      video.addEventListener("seeked",()=>{
       if(settled)return;
       settled=true;
       clearTimeout(timer);
       res();
      },{once:true});
      try{
       video.currentTime=target;
       if(Math.abs(video.currentTime-target)<.01&&video.readyState>=2){
        if(!settled){settled=true;clearTimeout(timer);res()}
       }
      }catch(e){
       clearTimeout(timer);
       rej(e);
      }
     });

     const scale=Math.min(1,640/Math.max(video.videoWidth,video.videoHeight));
     const canvas=document.createElement("canvas");
     canvas.width=Math.max(1,Math.round(video.videoWidth*scale));
     canvas.height=Math.max(1,Math.round(video.videoHeight*scale));
     const ctx=canvas.getContext("2d");
     if(!ctx)throw new Error("Video karesi işlenemedi.");
     ctx.drawImage(video,0,0,canvas.width,canvas.height);
     frames.push({data:canvas.toDataURL("image/jpeg",.55),time:target});
    }

    finish();
    resolve({frames,duration,name:file.name});
   }catch(e){
    finish();
    reject(e);
   }
  };
  video.src=url;
  video.load();
 });
}
async function prepareMedia(list){
 const images=[],videoFrames=[],timeline=[];
 for(const item of list){
  if(item.kind==="image")images.push(await imageToDataURL(item.file));
 }
 for(const item of list){
  if(item.kind==="video"){
   const remaining=3-images.length-videoFrames.length;
   if(remaining<=0)break;
   const result=await videoToFrames(item.file,Math.min(3,remaining));
   timeline.push({
    name:result.name,
    duration:result.duration,
    frames:result.frames.map((f,i)=>({index:i+1,time:f.time}))
   });
   videoFrames.push(...result.frames.map(f=>f.data));
  }
 }

 let timelineText="";
 if(timeline.length){
  timelineText="\n\n[VİDEO ANALİZİ - KRONOLOJİK KARELER]\n";
  timeline.forEach(v=>{
   timelineText+="\nVideo: "+v.name+"\nSüre: "+v.duration.toFixed(2)+" saniye\n";
   v.frames.forEach(f=>{
    timelineText+="Kare "+f.index+": "+formatTime(f.time)+" zamanında alınmıştır.\n";
   });
  });
  timelineText+="\nKareleri zaman sırasına göre incele. Görüntüde olmayan hareketleri uydurma. Videonun sesini veya tamamını analiz ettiğini iddia etme.";
 }
 return {images,videoFrames,timelineText};
}

/* API */
function createTyping(area){
 const el=document.createElement("div");
 el.className="typing";
 const label=document.createElement("span");
 label.textContent="TOZRA düşünüyor";
 const dots=document.createElement("div");
 dots.className="typing-dots";
 for(let i=0;i<3;i++)dots.appendChild(document.createElement("span"));
 el.append(label,dots);
 area.appendChild(el);
 el.scrollIntoView({behavior:"smooth",block:"end"});
 return el;
}

async function sendToAI({text,list,area,history,onSuccess,onFailure,agentMode=false,projectContext=""}){
 if(busy)return;
 if(!text.trim()&&!list.length)return;
 if(!text.trim()&&list.length){
  alert("Dosyanı analiz edebilmem için ne yapmamı istediğini de yaz.");
  return;
 }

 busy=true;
 $("send").disabled=true;
 $("projectSend").disabled=true;
 const typing=createTyping(area);

 try{
  const media=await prepareMedia(list);
  const response=await fetch("/api/chat",{
   method:"POST",
   headers:{ "Content-Type":"application/json", ...(await TozraAuth.authHeaders()) },
   body:JSON.stringify({
    prompt:text+media.timelineText,
    history:history,
    images:media.images,
    videoFrames:media.videoFrames,
    projectContext:typeof projectContext==="string"?projectContext.slice(0,10000):"",
    personalMemory:window.TozraMemory && typeof window.TozraMemory.getAll==="function"
     ? (typeof window.TozraMemory.getRelevant==="function"
        ? window.TozraMemory.getRelevant(text,12)
        : window.TozraMemory.getAll().slice(-8))
        .map(item=>({content:item.content,category:item.category}))
     : [],
    agentMode:Boolean(agentMode)
   })
  });

  let data;
  try{data=await response.json()}
  catch(e){throw new Error("Sunucudan geçerli yanıt alınamadı.")}

  if(!response.ok||!data.success){
   const apiError=new Error(data.error||"Yapay zekâ yanıt veremedi.");
   apiError.responseData=data;
   throw apiError;
  }

  typing.remove();
  onSuccess(data.answer||"Bir yanıt oluşturulamadı.",data);
  clearFiles(list,list===attachments?"attachments":"projectAttachments");
 }catch(error){
  typing.remove();
  onFailure(
   "İstek tamamlanamadı: "+(error.message||"Bir bağlantı sorunu oluştu."),
   error.responseData||null
  );
  console.error(error);
 }finally{
  busy=false;
  $("send").disabled=false;
  $("projectSend").disabled=false;
 }
}

function offerMemorySuggestion(content,area){
 const value=String(content||"").trim();
 const durablePattern=/\b(bundan sonra|uzun vadeli hedefim|hedefim|tercihim|tercih ederim|tercih ediyorum|her zaman|gelecekte|üzerinde çalışıyorum|projem)\b/i;
 const sensitivePattern=/\b(şifre|parola|password|api[_ -]?key|token|secret|sağlık|hastalık|ilaç|tanı|teşhis|adresim|kimlik numaram|kart numaram|siyasi görüşüm|dinim|ırkım)\b/i;
 if(value.length<20||value.length>350||!durablePattern.test(value)||sensitivePattern.test(value))return;
 if(!window.TozraMemory||typeof window.TozraMemory.add!=="function")return;
 const card=document.createElement("div");
 card.className="ph-memory-item";
 card.style.margin="10px 0 10px 42px";
 card.style.background="var(--surface, #f7f9f6)";
 const body=document.createElement("div");
 body.className="ph-memory-body";
 const tag=document.createElement("span");
 tag.className="ph-memory-tag";
 tag.textContent="HAFIZA ÖNERİSİ";
 const description=document.createElement("p");
 description.textContent="Bu bilgi ileride işine yarayabilir. Kişisel hafızana kaydetmek ister misin?";
 body.append(tag,description);
 const actions=document.createElement("div");
 actions.style.display="flex";
 actions.style.gap="8px";
 actions.style.alignItems="center";
 const save=document.createElement("button");
 save.type="button";
 save.className="secondary";
 save.textContent="Hafızaya kaydet";
 const dismiss=document.createElement("button");
 dismiss.type="button";
 dismiss.className="ph-memory-remove";
 dismiss.textContent="Şimdi değil";
 save.addEventListener("click",()=>{
  try{
   window.TozraMemory.add(value,"Tercih ve hedefler");
   description.textContent="Bilgi kişisel hafızana kaydedildi.";
   save.remove();
   dismiss.remove();
  }catch(error){
   description.textContent=error.message||"Hafıza kaydedilemedi.";
  }
 });
 dismiss.addEventListener("click",()=>card.remove());
 actions.append(save,dismiss);
 card.append(body,actions);
 area.appendChild(card);
 card.scrollIntoView({behavior:"smooth",block:"nearest"});
}

/* GENEL SOHBET */
async function sendGeneralMessage(value){
 const text=(value??promptInput.value).trim();
 if((!text&&!attachments.length)||busy)return;

 const names=attachments.map(a=>a.file.name);
 const display=text+(names.length?"\n\nEklenen dosyalar: "+names.join(", "):"");
 const user={role:"user",content:display};
 if(!conversation.length)user.id=Date.now();
 conversation.push(user);

 $("welcome").style.display="none";
 addMessage($("messages"),"user",display);
 promptInput.value="";
 promptInput.style.height="38px";

 await sendToAI({
  text,
  list:attachments,
  area:$("messages"),
  history:conversation.slice(0,-1),
  agentMode:agentModeEnabled,
  projectContext:findRelevantProjectContext(text),
  onSuccess:(answer,data)=>{
   const sources=Array.isArray(data?.sources)?data.sources:[];
   conversation.push({role:"assistant",content:answer,sources});
   addMessage($("messages"),"assistant",answer,sources);
   offerMemorySuggestion(text,$("messages"));
   saveGeneralConversation();
   speakNextVoiceReply(answer);
  },
  onFailure:(error,errorData)=>{
   // Transport/API errors are UI notices, not assistant replies; do not feed them back as chat context.
   addMessage($("messages"),"assistant",error,errorData?.sources||[]);
   saveGeneralConversation();
  }
 });
}

/* PROJE SOHBETİ VE PROJEYE ÖZEL HAFIZA */
async function sendProjectMessage(){
 const p=getCurrentProject();
 const input=$("projectPrompt");
 if(!p||busy)return;

 const text=input.value.trim();
 if((!text&&!projectAttachments.length)||busy)return;

 const names=projectAttachments.map(a=>a.file.name);
 const display=text+(names.length?"\n\nEklenen dosyalar: "+names.join(", "):"");

 p.messages=p.messages||[];
 p.messages.push({role:"user",content:display});

 addMessage($("projectMessages"),"user",display);
 input.value="";
 input.style.height="38px";

 p.updatedAt=Date.now();
 saveProjects();

 const projectContext=buildProjectContext(p);

 await sendToAI({
  text,
  projectContext,
  list:projectAttachments,
  area:$("projectMessages"),
  history:p.messages.slice(0,-1),

  onSuccess:(answer,data)=>{
   const sources=Array.isArray(data?.sources)?data.sources:[];
   p.messages.push({role:"assistant",content:answer,sources});
   p.updatedAt=Date.now();
   saveProjects();
   addMessage($("projectMessages"),"assistant",answer,sources);
   renderProjectInfo(p);
   speakNextVoiceReply(answer);
  },

  onFailure:(error,errorData)=>{
   // Keep the user's prompt, but never store a network/API error as an AI answer.
   p.updatedAt=Date.now();
   saveProjects();
   addMessage($("projectMessages"),"assistant",error,errorData?.sources||[]);
   renderProjectInfo(p);
  }
 });
}

/* YENİ SOHBET */
function newGeneralChat(){
 conversation=[];
 $("messages").innerHTML="";
 $("welcome").style.display="block";
 promptInput.value="";
 clearFiles(attachments,"attachments");
 openGeneralChat();
}

/* PROJE OLUŞTURMA */
function createFromCategory(category){
 openProjectModal(null,category);
}
$("newProject").onclick=()=>openProjectModal();


document.querySelectorAll(".tool-card").forEach(card=>{
 card.onclick=()=>createFromCategory(card.dataset.category);
});

/* TOZRA tema tercihi: profil ekranından seçilir ve cihazda saklanır. */
function getTozraTheme(){return localStorage.getItem("tozra-theme") === "dark" ? "dark" : "light";}
function setTozraTheme(theme){
 const selected=theme==="dark"?"dark":"light";
 document.documentElement.dataset.tozraTheme=selected;
 document.documentElement.style.colorScheme=selected;
 localStorage.setItem("tozra-theme",selected);
 const meta=document.querySelector('meta[name="theme-color"]');
 if(meta)meta.content=selected==="dark"?"#151b17":"#f5f3ed";
}
setTozraTheme(getTozraTheme());
/* TOZRA vurgu rengi: sakin, erişilebilir ve cihazda kalıcı. */
const TOZRA_ACCENTS={
 lime:["#a7c96b","#7f9f45"],
 forest:["#5eaa78","#367b50"],
 ocean:["#6d9fc2","#477da4"],
 plum:["#a18bc4","#7963a0"]
};
function setTozraAccent(name){
 const key=TOZRA_ACCENTS[name]?name:"lime";
 const [main,deep]=TOZRA_ACCENTS[key];
 document.documentElement.style.setProperty("--green",main);
 document.documentElement.style.setProperty("--green2",deep);
 document.documentElement.dataset.tozraAccent=key;
 try{localStorage.setItem("tozra-accent",key)}catch(e){}
}
function getTozraAccent(){try{return localStorage.getItem("tozra-accent")||"lime"}catch(e){return "lime"}}
setTozraAccent(getTozraAccent());

/* MODAL SİSTEMİ */
function showModal(type){
 const title=$("modalTitle");
 const content=$("modalContent");
 const modal=document.querySelector("#modalOverlay .modal");
 if(modal) modal.classList.toggle("auth-screen", type==="login" || type==="register");
 if(["login","register"].includes(type) && $("splash") && !$("splash").classList.contains("hide")) $("modalOverlay").classList.add("splash-auth");

 if(type==="plans"){
  title.textContent="TOZRA üyelik planları";
  content.innerHTML=`
   <p>TOZRA deneyimini genişletmek için üyelik seçenekleri.</p>
   <div class="plan-grid">
    <div class="plan"><h3>Aylık üyelik</h3><div class="price">₺200</div><small>Her ay</small><button onclick="paymentNotice()">Planı seç</button></div>
    <div class="plan"><h3>Yıllık üyelik</h3><div class="price">₺1.000</div><small>Yıllık ödeme</small><button onclick="paymentNotice()">Planı seç</button></div>
   </div>
   <div class="notice">Fiyatlar tasarım aşamasındaki planlardır. Gerçek ödeme sistemi henüz bağlı değildir.</div>`;
 }

 if(type==="login"){
  title.textContent="TOZRA hesabına giriş";
  content.innerHTML=`
   <div class="auth-intro">
    <div class="auth-mark" aria-hidden="true"><img src="/tozra-logo.svg" alt=""></div>
    <div class="auth-kicker">TOZRA / IRCAL DESIGN</div>
    <h3>Yeniden hoş geldin.</h3>
    <p>Fikirlerine kaldığın yerden devam et. Çalışma alanın seni bekliyor.</p>
   </div>
   <form id="loginForm">
    <label class="form-label" for="loginEmail">E-posta adresi</label>
    <input class="modal-input" id="loginEmail" type="email" placeholder="ornek@eposta.com" autocomplete="email" required>
    <label class="form-label" for="loginPassword">Şifre</label>
    <input class="modal-input" id="loginPassword" type="password" placeholder="Şifren" autocomplete="current-password" required>
    <button class="primary" id="loginSubmit">Giriş yap</button>
   </form>
   <div class="auth-divider"><span>veya</span></div>
   <button class="google-auth-button" id="googleLogin" type="button"><span class="google-g-mark" aria-hidden="true">G</span> Google ile devam et</button>
   <button class="secondary" id="forgotPassword">Şifremi unuttum</button>
   <button class="secondary" id="registerSwitch">Yeni hesap oluştur</button>
   <div class="notice" id="authNotice">${escapeHTML(TozraAuth.getError() || "Hesabına e-posta adresin ve şifrenle giriş yap.")}</div>`;
  $("loginForm").onsubmit=async e=>{
   e.preventDefault(); const button=$("loginSubmit"), notice=$("authNotice");
   button.disabled=true; button.textContent="Giriş yapılıyor…";
   try{await TozraAuth.signIn($("loginEmail").value,$("loginPassword").value);await refreshAccountData();if($("splash"))closeSplashAuth();else $("modalOverlay").classList.remove("show");}
   catch(error){notice.textContent=error.message||"Giriş yapılamadı.";}
   finally{button.disabled=false;button.textContent="Giriş yap";}
  };
  $("forgotPassword").onclick=async()=>{
   const email=$("loginEmail").value.trim(), notice=$("authNotice"), button=$("forgotPassword");
   if(!email){notice.textContent="Şifre sıfırlama bağlantısı için önce e-posta adresini yaz.";$("loginEmail").focus();return;}
   button.disabled=true;button.textContent="Gönderiliyor…";
   try{await TozraAuth.resetPassword(email);notice.textContent="Şifre yenileme bağlantısı e-posta adresine gönderildi.";}
   catch(error){notice.textContent=error.message||"Bağlantı gönderilemedi.";}
   finally{button.disabled=false;button.textContent="Şifremi unuttum";}
  };
  $("googleLogin").onclick=async()=>{
   const button=$("googleLogin"), notice=$("authNotice");
   button.disabled=true;button.textContent="Google bağlantısı açılıyor…";
   try{await TozraAuth.signInWithGoogle();}
   catch(error){notice.textContent=error.message||"Google ile giriş başlatılamadı.";button.disabled=false;button.innerHTML='<span class="google-g-mark" aria-hidden="true">G</span> Google ile devam et';}
  };
  $("registerSwitch").onclick=()=>showModal("register");
 }
 if(type==="register"){
  title.textContent="TOZRA hesabı oluştur";
  content.innerHTML=`
   <p>Hesabını oluştur; fikirlerini ve projelerini tek bir çalışma alanında yönet.</p>
   <form id="registerForm">
    <label class="form-label" for="registerName">Adın</label>
    <input class="modal-input" id="registerName" placeholder="Adın soyadın" autocomplete="name" maxlength="80" required>
    <label class="form-label" for="registerEmail">E-posta adresi</label>
    <input class="modal-input" id="registerEmail" type="email" placeholder="ornek@eposta.com" autocomplete="email" required>
    <label class="form-label" for="registerPassword">Şifre</label>
    <input class="modal-input" id="registerPassword" type="password" placeholder="En az 8 karakter" autocomplete="new-password" minlength="8" required>
    <small style="display:block;color:#758478;font-size:10px;margin:-4px 0 10px">En az 8 karakter kullan. E-posta doğrulaması gerekebilir.</small>
    <button class="primary" id="registerSubmit">Ücretsiz hesap oluştur</button>
   </form>
   <div class="auth-divider"><span>veya</span></div>
   <button class="google-auth-button" id="googleRegister" type="button"><span class="google-g-mark" aria-hidden="true">G</span> Google ile kayıt ol</button>
   <button class="secondary" id="loginSwitch">Zaten hesabım var</button>
   <button class="secondary" id="resendConfirmation" type="button">Doğrulama e-postasını tekrar gönder</button>
   <div class="notice" id="authNotice">${escapeHTML(TozraAuth.getError() || "Kayıt sonrası doğrulama bağlantısını e-postandan açarak hesabını etkinleştir.")}</div>`;
  $("registerForm").onsubmit=async e=>{
   e.preventDefault(); const button=$("registerSubmit"), notice=$("authNotice");
   const name=$("registerName").value.trim(), email=$("registerEmail").value.trim(), password=$("registerPassword").value;
   if(name.length<2){notice.textContent="Lütfen adını en az 2 karakter olacak şekilde gir.";return;}
   if(password.length<8){notice.textContent="Şifren en az 8 karakter olmalı.";return;}
   button.disabled=true;button.textContent="Hesap oluşturuluyor…";
   try{
    const data=await TozraAuth.signUp(name,email,password);
    if(data.session){await refreshAccountData();if($("splash"))closeSplashAuth();else $("modalOverlay").classList.remove("show");}
    else{notice.textContent="Hesabın oluşturuldu. E-posta adresine gönderilen doğrulama bağlantısını aç, ardından giriş yap.";button.textContent="E-posta gönderildi";}
   }catch(error){notice.textContent=error.message||"Kayıt oluşturulamadı.";button.disabled=false;button.textContent="Ücretsiz hesap oluştur";}
  };
  $("resendConfirmation").onclick=async()=>{
   const email=$("registerEmail").value.trim(), notice=$("authNotice"), button=$("resendConfirmation");
   if(!email){notice.textContent="Önce e-posta adresini gir.";$("registerEmail").focus();return;}
   button.disabled=true;button.textContent="Gönderiliyor…";
   try{await TozraAuth.resendConfirmation(email);notice.textContent="Doğrulama e-postası yeniden gönderildi. Gelen kutunu ve spam klasörünü kontrol et.";}
   catch(error){notice.textContent=error.message||"Doğrulama e-postası gönderilemedi.";}
   finally{button.disabled=false;button.textContent="Doğrulama e-postasını tekrar gönder";}
  };
  $("googleRegister").onclick=async()=>{
   const button=$("googleRegister"), notice=$("authNotice");
   button.disabled=true;button.textContent="Google bağlantısı açılıyor…";
   try{await TozraAuth.signInWithGoogle();}
   catch(error){notice.textContent=error.message||"Google ile kayıt başlatılamadı.";button.disabled=false;button.innerHTML='<span class="google-g-mark" aria-hidden="true">G</span> Google ile kayıt ol';}
  };
  $("loginSwitch").onclick=()=>showModal("login");
 }

 if(type==="updatePassword"){
  title.textContent="Yeni şifre belirle";
  content.innerHTML=`
   <p>Hesabın için yeni bir şifre oluştur.</p>
   <form id="updatePasswordForm">
    <label class="form-label" for="newPassword">Yeni şifre</label>
    <input class="modal-input" id="newPassword" type="password" minlength="8" autocomplete="new-password" placeholder="En az 8 karakter" required>
    <label class="form-label" for="confirmNewPassword">Yeni şifreyi tekrar gir</label>
    <input class="modal-input" id="confirmNewPassword" type="password" minlength="8" autocomplete="new-password" placeholder="Şifreni tekrar yaz" required>
    <button class="primary" id="updatePasswordSubmit">Şifreyi güncelle</button>
   </form>
   <div class="notice" id="authNotice">Yeni şifren en az 8 karakter olmalı.</div>`;
  $("updatePasswordForm").onsubmit=async e=>{
   e.preventDefault(); const password=$("newPassword").value, confirm=$("confirmNewPassword").value, button=$("updatePasswordSubmit"), notice=$("authNotice");
   if(password.length<8){notice.textContent="Şifren en az 8 karakter olmalı.";return;}
   if(password!==confirm){notice.textContent="Girdiğin şifreler eşleşmiyor.";return;}
   button.disabled=true;button.textContent="Güncelleniyor…";
   try{await TozraAuth.updatePassword(password);notice.textContent="Şifren başarıyla güncellendi.";button.textContent="Güncellendi";setTimeout(()=>$("modalOverlay").classList.remove("show"),900);}
   catch(error){notice.textContent=error.message||"Şifre güncellenemedi.";button.disabled=false;button.textContent="Şifreyi güncelle";}
  };
 }

 if(type==="profile"){
  title.textContent="Profil";
  const user=TozraAuth.getSession()?.user;
  content.innerHTML=user?`
   <div style="text-align:center;padding:10px">
    <div class="avatar user-avatar profile-user-avatar" role="img" aria-label="Kullanıcı profili" style="margin:0 auto 14px;width:82px;height:82px;min-width:82px;border-radius:50%;display:grid;place-items:center;background:#edf2e7;border:3px solid #d7e5ce;color:#26362a;box-shadow:0 4px 14px rgba(25,45,28,.10)"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" style="width:39px;height:39px;fill:none;stroke:currentColor;stroke-width:1.55;stroke-linecap:round;stroke-linejoin:round"><circle cx="12" cy="8" r="3.5"></circle><path d="M4.8 20c.5-3.6 3.3-5.6 7.2-5.6s6.7 2 7.2 5.6"></path></svg></div>
    <h3>${escapeHTML(user.user_metadata?.full_name||"TOZRA kullanıcısı")}</h3>
    <p>${escapeHTML(user.email||"")}</p>
   </div>
   <section class="profile-theme-picker" aria-label="Tema seçimi"><h4>Görünüm teması</h4><div class="theme-choice-row"><button type="button" class="theme-choice" data-theme-choice="light"><span class="theme-preview theme-preview-light"></span><span>Aydınlık</span><i>✓</i></button><button type="button" class="theme-choice" data-theme-choice="dark"><span class="theme-preview theme-preview-dark"></span><span>Karanlık</span><i>✓</i></button></div></section>
   <section class="profile-accent-picker" aria-label="Vurgu rengi"><h4>Vurgu rengi</h4><div class="accent-choice-row">
    <button type="button" class="accent-choice" data-accent-choice="lime"><i></i><span>Lime</span></button>
    <button type="button" class="accent-choice" data-accent-choice="forest"><i></i><span>Orman</span></button>
    <button type="button" class="accent-choice" data-accent-choice="ocean"><i></i><span>Okyanus</span></button>
    <button type="button" class="accent-choice" data-accent-choice="plum"><i></i><span>Erik</span></button>
   </div></section>
   <div class="profile-actions"><button class="primary" id="profilePlansButton" type="button">Üyelik planları</button><button class="secondary" id="profileSettingsButton" type="button">Ayarlar</button></div><button class="secondary" id="logoutButton">Çıkış yap</button>`:`
   <div style="text-align:center;padding:10px">
    <div class="avatar user-avatar profile-user-avatar" role="img" aria-label="Kullanıcı profili" style="margin:0 auto 14px;width:82px;height:82px;min-width:82px;border-radius:50%;display:grid;place-items:center;background:#edf2e7;border:3px solid #d7e5ce;color:#26362a;box-shadow:0 4px 14px rgba(25,45,28,.10)"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" style="width:39px;height:39px;fill:none;stroke:currentColor;stroke-width:1.55;stroke-linecap:round;stroke-linejoin:round"><circle cx="12" cy="8" r="3.5"></circle><path d="M4.8 20c.5-3.6 3.3-5.6 7.2-5.6s6.7 2 7.2 5.6"></path></svg></div>
    <h3>Misafir kullanıcı</h3>
    <p>Projelerini hesabına bağlamak için giriş yap.</p>
   </div>
   <button class="primary" onclick="showModal('register')">Hesap oluştur</button>
   <button class="secondary" onclick="showModal('login')">Giriş yap</button>
   <section class="profile-theme-picker" aria-label="Tema seçimi"><h4>Görünüm teması</h4><div class="theme-choice-row"><button type="button" class="theme-choice" data-theme-choice="light"><span class="theme-preview theme-preview-light"></span><span>Aydınlık</span><i>✓</i></button><button type="button" class="theme-choice" data-theme-choice="dark"><span class="theme-preview theme-preview-dark"></span><span>Karanlık</span><i>✓</i></button></div></section>
   <section class="profile-accent-picker" aria-label="Vurgu rengi"><h4>Vurgu rengi</h4><div class="accent-choice-row">
    <button type="button" class="accent-choice" data-accent-choice="lime"><i></i><span>Lime</span></button>
    <button type="button" class="accent-choice" data-accent-choice="forest"><i></i><span>Orman</span></button>
    <button type="button" class="accent-choice" data-accent-choice="ocean"><i></i><span>Okyanus</span></button>
    <button type="button" class="accent-choice" data-accent-choice="plum"><i></i><span>Erik</span></button>
   </div></section>
   <div class="profile-actions"><button class="secondary" id="profilePlansButton" type="button">Üyelik planları</button><button class="secondary" id="profileSettingsButton" type="button">Ayarlar</button></div>`;
  if(user){
   $("logoutButton").onclick=async()=>{
    try{
     await TozraAuth.signOut();
     projects=[]; conversations=[]; conversation=[];
     renderProjects(); renderHistory(); renderGeneralMessages();
     $("modalOverlay").classList.remove("show");
     showModal("login");
    }catch(error){alert(error.message||"Çıkış yapılamadı.");}
   };
  }
 }

 if(type==="profile"){
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
 }

 if(type==="settings"){
  title.textContent="Ayarlar ve kişiselleştirme";
  content.innerHTML=`
   <div class="settings-intro"><span class="settings-eyebrow">TOZRA WORKSPACE</span><h3>Çalışma alanını kendine göre düzenle.</h3><p>Tema ve vurgu tercihlerin bu cihazda saklanır.</p></div>
   <section class="settings-card"><div class="settings-card-heading"><span class="settings-icon">◐</span><div><h3>Görünüm teması</h3><p>Çalışma alanının genel görünümü</p></div></div>
    <div class="theme-choice-row"><button type="button" class="theme-choice" data-theme-choice="light"><span class="theme-preview theme-preview-light"></span><span>Aydınlık</span><i>✓</i></button><button type="button" class="theme-choice" data-theme-choice="dark"><span class="theme-preview theme-preview-dark"></span><span>Karanlık</span><i>✓</i></button></div>
   </section>
   <section class="settings-card"><div class="settings-card-heading"><span class="settings-icon">✦</span><div><h3>Vurgu rengi</h3><p>Butonlar ve etkileşim vurguları</p></div></div>
    <div class="accent-choice-row"><button type="button" class="accent-choice" data-accent-choice="lime"><i></i><span>Lime</span></button><button type="button" class="accent-choice" data-accent-choice="forest"><i></i><span>Orman</span></button><button type="button" class="accent-choice" data-accent-choice="ocean"><i></i><span>Okyanus</span></button><button type="button" class="accent-choice" data-accent-choice="plum"><i></i><span>Erik</span></button></div>
   </section>
   <section class="settings-card"><div class="settings-card-heading"><span class="settings-icon">⌁</span><div><h3>Mobil uygulama</h3><p>TOZRA'yı ana ekrana ekle ve daha hızlı aç.</p></div></div>
    <div class="mobile-settings-actions"><button class="primary" id="installTozraButton" type="button">Ana ekrana ekle</button><button class="secondary" id="enableTozraNotifications" type="button">Bildirim iznini yönet</button></div>
    <p id="mobileSettingsStatus" class="mobile-settings-status" aria-live="polite">Yükleme ve bildirim durumu burada gösterilir.</p>
   </section>
   <section class="settings-card"><div class="settings-card-heading"><span class="settings-icon">ⓘ</span><div><h3>Uygulama bilgisi</h3><p>TOZRA — IRCAL DESIGN</p></div></div><p class="settings-footnote">Çevrimdışı kullanım için uygulama kabuğu önbelleğe alınır. Yapay zekâ, hesap ve medya işlemleri internet bağlantısı gerektirir.</p></section>`;
  content.querySelectorAll("[data-theme-choice]").forEach(button=>{
   button.classList.toggle("is-selected",button.dataset.themeChoice===getTozraTheme());
   button.addEventListener("click",()=>{setTozraTheme(button.dataset.themeChoice);content.querySelectorAll("[data-theme-choice]").forEach(item=>item.classList.toggle("is-selected",item===button));});
  });
  content.querySelectorAll("[data-accent-choice]").forEach(button=>{
   button.classList.toggle("is-selected",button.dataset.accentChoice===getTozraAccent());
   button.addEventListener("click",()=>{setTozraAccent(button.dataset.accentChoice);content.querySelectorAll("[data-accent-choice]").forEach(item=>item.classList.toggle("is-selected",item===button));});
  });
  const installBtn=$("installTozraButton"), notice=$("mobileSettingsStatus");
  /* Kurulum butonu mevcut beforeinstallprompt dinleyicisi tarafından yönetilir. */
  const notifyBtn=$("enableTozraNotifications");
  if(notifyBtn)notifyBtn.onclick=async()=>{if(!("Notification" in window)){notice.textContent="Bu tarayıcı bildirim iznini desteklemiyor.";return;}try{const result=await Notification.requestPermission();notice.textContent="Bildirim izni: "+result;}catch(e){notice.textContent="Bildirim ayarı açılamadı.";}}
 }

 $("modalOverlay").classList.add("show");
}
function paymentNotice(){
 alert("Ödeme altyapısı henüz bağlanmadı.");
}

/* BAĞLANTI EKLEME */
function addLink(input){
 const url=prompt("Eklemek istediğin bağlantıyı yaz:");
 if(!url)return;

 let parsed;
 try{parsed=new URL(url)}
 catch(e){
  alert("Lütfen geçerli bir bağlantı gir.");
  return;
 }

 if(!["http:","https:"].includes(parsed.protocol)){
  alert("Yalnızca http veya https bağlantıları kullanılabilir.");
  return;
 }

 input.value+=(input.value?"\n":"")+"Bağlantı: "+parsed.href;
 input.focus();
}


/* Sesli sohbet kodu /voice.js dosyasından yüklenir. */

/* ETKİLEŞİMLER */
$("send").onclick=()=>sendGeneralMessage();
$("projectSend").onclick=sendProjectMessage;

promptInput.addEventListener("keydown",e=>{
 if(e.key==="Enter"&&!e.shiftKey){
  e.preventDefault();
  sendGeneralMessage();
 }
});
$("projectPrompt").addEventListener("keydown",e=>{
 if(e.key==="Enter"&&!e.shiftKey){
  e.preventDefault();
  sendProjectMessage();
 }
});

[promptInput,$("projectPrompt")].forEach(input=>{
 input.addEventListener("input",()=>{
  input.style.height="38px";
  input.style.height=Math.min(input.scrollHeight,150)+"px";
 });
});

document.querySelectorAll(".suggestion").forEach(b=>{
 b.onclick=()=>sendGeneralMessage(b.textContent);
});

$("imageButton").onclick=()=>$("imageInput").click();
$("videoButton").onclick=()=>$("videoInput").click();
$("projectImageButton").onclick=()=>$("imageInput").click();
$("projectVideoButton").onclick=()=>$("videoInput").click();

$("imageInput").onchange=e=>{
 const target=$("projectPage").classList.contains("active")?projectAttachments:attachments;
 const area=target===attachments?"attachments":"projectAttachments";
 addFiles(e.target.files,"image",target,area);
 e.target.value="";
};
$("videoInput").onchange=e=>{
 const target=$("projectPage").classList.contains("active")?projectAttachments:attachments;
 const area=target===attachments?"attachments":"projectAttachments";
 addFiles(e.target.files,"video",target,area);
 e.target.value="";
};

$("linkButton").onclick=()=>addLink(promptInput);
$("projectLinkButton").onclick=()=>addLink($("projectPrompt"));

$("plansButton").onclick=()=>showModal("plans");
$("sidePlans").onclick=()=>{
 toggleMenu(true);
 showModal("plans");
};
$("sideSettings").onclick=()=>{
 toggleMenu(true);
 showModal("settings");
};
$("profileButton").onclick=()=>showModal("profile");

$("closeModal").onclick=()=>{if($("splash"))closeSplashAuth();else $("modalOverlay").classList.remove("show");};
$("modalOverlay").onclick=e=>{
 if(e.target===$("modalOverlay")){if($("splash"))closeSplashAuth();else $("modalOverlay").classList.remove("show");}
};

window.addEventListener("beforeunload",()=>{
 window.stopTozraVoice?.(false);
 if(window.speechSynthesis) window.speechSynthesis.cancel();
});

document.addEventListener("keydown",e=>{
 if(e.key==="Escape"){
  toggleMenu(true);
  if($("splash"))closeSplashAuth();else $("modalOverlay").classList.remove("show");
 }
});

/* BAŞLANGIÇ */
async function refreshAccountData(){
 await TozraAuth.ensureAvatar?.();
 if (window.TozraCloudSync) await TozraCloudSync.init(true);
 conversation=[]; conversations=[]; projects=[];
 loadHistory();
 loadProjects();
 if (typeof taskItems !== "undefined") {
  const restored=safeRead(TASKS_KEY,{tasks:[],events:[]});
  if(restored && Array.isArray(restored.tasks) && Array.isArray(restored.events)) taskItems=restored;
  if(typeof renderTasksCalendar === "function") renderTasksCalendar();
 }
 window.dispatchEvent(new CustomEvent("tozra-account-data-refreshed"));
 TozraAuth.updateAccountUI();
 updateDashboardStats();
}
window.addEventListener("load", async ()=>{
 await TozraAuth.init();
 await refreshAccountData();
 if(TozraAuth.getSession() && $("splash")){
  // Authenticated users see the full six-second cinematic launch, then enter the workspace.
  if(tozraSplashTimer)clearTimeout(tozraSplashTimer);
  tozraSplashTimer=setTimeout(finishSplash,6000);
 }
 // Guests remain on the animated opening screen and choose Login or Sign up below.
});

/* SERVICE WORKER */
if("serviceWorker" in navigator){
 window.addEventListener("load",()=>{
  navigator.serviceWorker.register("/sw.js").catch(console.error);
 });
}
