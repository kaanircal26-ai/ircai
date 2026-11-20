/* TOZRA — Ücretsiz karşılıklı sesli sohbet
   Tarayıcı SpeechRecognition + mevcut /api/chat + SpeechSynthesis kullanır.
   OpenAI Realtime bağlantısı veya ayrı Realtime API anahtarı gerektirmez.
*/
(function(){
 "use strict";
 const $=id=>document.getElementById(id);
 let active=false;
 let recognition=null;
 let speaking=false;
 let restarting=false;
 let currentUtterance=null;
 let lastTranscriptAt=0;
 const buttonId="voiceConversationButton";
 const statusId="voiceStatus";

 function status(message){const el=$(statusId);if(el)el.textContent=message;}
 function setButton(){
  const b=$(buttonId); if(!b)return;
  b.classList.toggle("active",active);
  b.textContent=active?"■ Sohbeti durdur":"🎧 Sesli sohbet";
  b.setAttribute("aria-pressed",active?"true":"false");
 }
 function stopRecognition(){
  const r=recognition; recognition=null;
  if(r){try{r.onend=null;r.stop();}catch(e){}}
 }
 function stopAll(message){
  active=false; restarting=false; speaking=false;
  stopRecognition();
  if(window.speechSynthesis)window.speechSynthesis.cancel();
  currentUtterance=null;
  setButton();
  if(message)status(message);
 }
 function getRecognition(){return window.SpeechRecognition||window.webkitSpeechRecognition;}
 function listen(){
  if(!active||speaking||recognition||restarting)return;
  const Recognition=getRecognition();
  if(!Recognition){stopAll("Bu tarayıcı sürekli konuşma tanımayı desteklemiyor. Güncel Chrome veya Edge kullanabilirsin.");return;}
  restarting=true;
  const r=new Recognition();
  recognition=r;
  let finalText="";
  r.lang="tr-TR";
  r.continuous=false;
  r.interimResults=true;
  r.maxAlternatives=1;
  r.onstart=()=>{restarting=false;if(active)status("Seni dinliyorum… Konuşmanı bitirince TOZRA yanıt verecek.");};
  r.onresult=e=>{
   let interim="";
   for(let i=e.resultIndex;i<e.results.length;i++){
    const t=e.results[i][0]?.transcript||"";
    if(e.results[i].isFinal)finalText+=t;
    else interim+=t;
   }
   if(interim)status("Duyuyorum: "+interim);
  };
  r.onerror=e=>{
   const messages={
    "not-allowed":"Mikrofon izni verilmedi. Tarayıcı ayarlarından mikrofon iznini aç.",
    "service-not-allowed":"Tarayıcı konuşma tanıma servisine izin vermedi.",
    "audio-capture":"Mikrofon bulunamadı veya kullanılamıyor.",
    "network":"Konuşma tanıma servisine bağlanılamadı. İnternet bağlantını kontrol et.",
    "no-speech":"Ses algılanmadı. Yeniden dinliyorum…"
   };
   if(e.error!=="no-speech"){
    status(messages[e.error]||("Mikrofon hatası: "+e.error));
    stopAll(messages[e.error]||("Mikrofon hatası: "+e.error));
   }
  };
  r.onend=()=>{
   if(recognition===r)recognition=null;
   restarting=false;
   const text=finalText.trim();
   if(!active)return;
   if(text){
    lastTranscriptAt=Date.now();
    status("Söylediğini gönderiyorum…");
    if(typeof window.sendGeneralMessage==="function"){
     window.sendGeneralMessage(text);
    }else{
     const input=$("prompt"); if(input){input.value=text;status("Mesajı gönder düğmesine bas.");}
    }
   }else if(active){
    setTimeout(()=>{if(active&&!speaking&&!recognition)listen();},350);
   }
  };
  try{r.start();}
  catch(err){recognition=null;restarting=false;stopAll("Mikrofon başlatılamadı: "+(err.message||"Tekrar dene."));}
 }
 function speak(text, onEnd){
  if(!active)return;
  if(!window.speechSynthesis||!window.SpeechSynthesisUtterance){
   status("Bu tarayıcı sesli yanıt özelliğini desteklemiyor.");
   stopAll();return;
  }
  stopRecognition();
  window.speechSynthesis.cancel();
  const clean=String(text||"").trim();
  if(!clean){if(onEnd)onEnd();return;}
  const utterance=new SpeechSynthesisUtterance(clean.slice(0,7000));
  utterance.lang="tr-TR";
  utterance.rate=1;
  utterance.pitch=1;
  utterance.volume=1;
  const voices=window.speechSynthesis.getVoices();
  const trVoice=voices.find(v=>/^tr([-_]|$)/i.test(v.lang))||voices.find(v=>/turkish|türkçe/i.test(v.name));
  if(trVoice)utterance.voice=trVoice;
  currentUtterance=utterance;
  speaking=true;
  status("TOZRA konuşuyor… İstediğinde sohbeti durdurabilirsin.");
  utterance.onend=()=>{
   if(currentUtterance!==utterance)return;
   currentUtterance=null;speaking=false;
   if(active){status("Yanıt tamamlandı. Seni dinliyorum…");setTimeout(()=>listen(),250);}
   if(onEnd)onEnd();
  };
  utterance.onerror=()=>{
   if(currentUtterance!==utterance)return;
   currentUtterance=null;speaking=false;
   if(active){status("Sesli yanıt oynatılamadı. Yeniden dinlemeye geçiyorum…");setTimeout(()=>listen(),500);}
  };
  currentUtterance=utterance;
  window.speechSynthesis.speak(utterance);
 }
 function toggle(){
  if(active){stopAll("Sesli sohbet durduruldu.");return;}
  const Recognition=getRecognition();
  if(!Recognition){status("Bu tarayıcı konuşma tanımayı desteklemiyor. Güncel Chrome veya Edge kullan.");return;}
  if(typeof window.sendGeneralMessage!=="function"){
   status("Sohbet henüz hazır değil. Sayfayı yenileyip tekrar dene.");return;
  }
  if(typeof window.stopVoiceCapture==="function")window.stopVoiceCapture();
  if(window.speechSynthesis)window.speechSynthesis.cancel();
  active=true;setButton();status("Sesli sohbet başlatılıyor… Mikrofon iznini onayla.");listen();
 }

 // Mevcut mesaj balonlarındaki tek seferlik sesli okuma düğmesi.
 window.speakText=function(text,button){
  if(!window.speechSynthesis||!window.SpeechSynthesisUtterance){
   if(button)button.textContent="Ses desteklenmiyor";
   return;
  }
  window.speechSynthesis.cancel();
  const utterance=new SpeechSynthesisUtterance(String(text||""));
  utterance.lang="tr-TR";utterance.rate=1;utterance.pitch=1;
  const voices=window.speechSynthesis.getVoices();
  const trVoice=voices.find(v=>/^tr([-_]|$)/i.test(v.lang))||voices.find(v=>/turkish|türkçe/i.test(v.name));
  if(trVoice)utterance.voice=trVoice;
  if(button&&window.speechSynthesis.speaking){
   window.speechSynthesis.cancel();button.textContent="🔊 Sesli dinle";return;
  }
  if(button)button.textContent="⏹ Durdur";
  utterance.onend=()=>{if(button)button.textContent="🔊 Sesli dinle";};
  utterance.onerror=()=>{if(button)button.textContent="🔊 Tekrar dene";};
  window.speechSynthesis.speak(utterance);
 };

 window.tozraVoiceConversation={
  isActive:()=>active,
  onAssistantResponse:text=>{if(active)speak(text);},
  stop:()=>stopAll("Sesli sohbet durduruldu.")
 };
 // Bu dosya HTML'nin sonunda yüklendiği için kontrol doğrudan bağlanabilir.
 const bind=()=>{const b=$(buttonId);if(b&&!b.dataset.voiceBound){b.dataset.voiceBound="1";b.addEventListener("click",toggle);}};
 bind();
 window.addEventListener("beforeunload",()=>stopAll());
})();
