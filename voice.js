/* TOZRA — Karşılıklı sesli sohbet PRO
   Ücretsiz tarayıcı SpeechRecognition + mevcut sohbet API + SpeechSynthesis.
   Kullanıcı, TOZRA konuşurken "Araya gir" düğmesiyle söz alabilir.
*/
(function(){
 "use strict";
 const $=id=>document.getElementById(id);
 const buttonId="voiceConversationButton";
 const statusId="voiceStatus";
 let active=false;
 let recognition=null;
 let speaking=false;
 let restarting=false;
 let currentUtterance=null;
 let listenTimer=null;
 let requestInFlight=false;

 function status(message, mode){
  const el=$(statusId);
  if(!el)return;
  el.textContent=message||"";
  el.classList.remove("voice-listening","voice-speaking","voice-thinking","voice-idle");
  el.classList.add(mode||"voice-idle");
 }
 function setButton(){
  const b=$(buttonId);
  if(!b)return;
  b.classList.toggle("active",active);
  b.textContent=active?"■ Sohbeti durdur":"🎧 Sesli sohbet";
  b.setAttribute("aria-pressed",active?"true":"false");
  const interrupt=$("voiceInterruptButton");
  if(interrupt)interrupt.hidden=!(active&&speaking);
 }
 function getRecognition(){return window.SpeechRecognition||window.webkitSpeechRecognition;}
 function clearListenTimer(){
  if(listenTimer){clearTimeout(listenTimer);listenTimer=null;}
 }
 function stopRecognition(){
  clearListenTimer();
  const r=recognition;
  recognition=null;
  restarting=false;
  if(r){
   r.onend=null;
   r.onerror=null;
   try{r.stop();}catch(e){}
  }
 }
 function stopAll(message){
  active=false;
  speaking=false;
  requestInFlight=false;
  stopRecognition();
  if(window.speechSynthesis)window.speechSynthesis.cancel();
  currentUtterance=null;
  setButton();
  status(message||"Sesli sohbet durduruldu.","voice-idle");
 }
 function listen(){
  if(!active||speaking||recognition||restarting||requestInFlight)return;
  const Recognition=getRecognition();
  if(!Recognition){
   stopAll("Bu tarayıcı sürekli konuşma tanımayı desteklemiyor. Güncel Chrome veya Edge deneyebilirsin.");
   return;
  }
  restarting=true;
  const r=new Recognition();
  recognition=r;
  let finalText="";
  let sent=false;
  r.lang="tr-TR";
  r.continuous=false;
  r.interimResults=true;
  r.maxAlternatives=1;
  r.onstart=()=>{
   restarting=false;
   if(active)status("Seni dinliyorum… Konuşmanı bitirince TOZRA yanıt verecek.","voice-listening");
  };
  r.onresult=e=>{
   let interim="";
   for(let i=e.resultIndex;i<e.results.length;i++){
    const result=e.results[i];
    const t=result[0]?.transcript||"";
    if(result.isFinal)finalText+=t;
    else interim+=t;
   }
   if(interim)status("Duyuyorum: "+interim,"voice-listening");
  };
  r.onerror=e=>{
   if(!active)return;
   if(e.error==="no-speech"){
    status("Ses algılanmadı. Yeniden dinliyorum…","voice-listening");
    return;
   }
   const messages={
    "not-allowed":"Mikrofon izni verilmedi. Tarayıcı ayarlarından mikrofon iznini aç.",
    "service-not-allowed":"Tarayıcı konuşma tanıma servisine izin vermedi.",
    "audio-capture":"Mikrofon bulunamadı veya kullanılamıyor.",
    "network":"Konuşma tanıma servisine bağlanılamadı. İnternet bağlantını kontrol et."
   };
   stopAll(messages[e.error]||("Mikrofon hatası: "+e.error));
  };
  r.onend=()=>{
   if(recognition===r)recognition=null;
   restarting=false;
   const text=finalText.trim();
   if(!active)return;
   if(text&&!sent){
    sent=true;
    requestInFlight=true;
    status("Söylediğini TOZRA'ya iletiyorum…","voice-thinking");
    try{
     if(typeof window.sendGeneralMessage==="function"){
      Promise.resolve(window.sendGeneralMessage(text)).finally(()=>{
       requestInFlight=false;
       if(active&&!speaking&&!recognition)listen();
      });
     }else{
      const input=$("prompt");
      if(input){input.value=text;requestInFlight=false;status("Mesajı gönder düğmesine bas.","voice-idle");}
      else {requestInFlight=false;listen();}
     }
    }catch(err){
     requestInFlight=false;
     status("Mesaj gönderilemedi. Yeniden deneyebilirsin.","voice-idle");
     setTimeout(()=>listen(),500);
    }
   }else if(active&&!requestInFlight){
    listenTimer=setTimeout(()=>{listenTimer=null;listen();},350);
   }
  };
  try{r.start();}
  catch(err){
   recognition=null;
   restarting=false;
   stopAll("Mikrofon başlatılamadı: "+(err.message||"Tekrar dene."));
  }
 }
 function speak(text){
  if(!active)return;
  if(!window.speechSynthesis||!window.SpeechSynthesisUtterance){
   stopAll("Bu tarayıcı sesli yanıt özelliğini desteklemiyor.");
   return;
  }
  stopRecognition();
  const synth=window.speechSynthesis;
  synth.cancel();
  const clean=String(text||"").trim();
  if(!clean){listen();return;}
  const utterance=new SpeechSynthesisUtterance(clean.slice(0,7000));
  utterance.lang="tr-TR";
  utterance.rate=1;
  utterance.pitch=1;
  utterance.volume=1;
  const voices=synth.getVoices();
  const trVoice=voices.find(v=>/^tr([-_]|$)/i.test(v.lang))||voices.find(v=>/turkish|türkçe/i.test(v.name));
  if(trVoice)utterance.voice=trVoice;
  currentUtterance=utterance;
  speaking=true;
  setButton();
  status("TOZRA konuşuyor… Söz almak için “Araya gir” düğmesine bas.","voice-speaking");
  utterance.onend=()=>{
   if(currentUtterance!==utterance)return;
   currentUtterance=null;
   speaking=false;
   setButton();
   if(active){
    status("Yanıt tamamlandı. Seni dinliyorum…","voice-listening");
    listenTimer=setTimeout(()=>{listenTimer=null;listen();},220);
   }
  };
  utterance.onerror=()=>{
   if(currentUtterance!==utterance)return;
   currentUtterance=null;
   speaking=false;
   setButton();
   if(active){
    status("Sesli yanıt oynatılamadı. Yeniden dinlemeye geçiyorum…","voice-listening");
    listenTimer=setTimeout(()=>{listenTimer=null;listen();},450);
   }
  };
  synth.speak(utterance);
 }
 function interrupt(){
  if(!active||!speaking)return;
  // Önce eski utterance referansını temizle; cancel() onerror tetiklese de yeni durumu bozmasın.
  currentUtterance=null;
  speaking=false;
  if(window.speechSynthesis)window.speechSynthesis.cancel();
  setButton();
  status("TOZRA durdu. Seni dinliyorum…","voice-listening");
  listen();
 }
 function toggle(){
  if(active){stopAll("Sesli sohbet durduruldu.");return;}
  const Recognition=getRecognition();
  if(!Recognition){status("Bu tarayıcı konuşma tanımayı desteklemiyor. Güncel Chrome veya Edge kullan.","voice-idle");return;}
  if(typeof window.sendGeneralMessage!=="function"){
   status("Sohbet henüz hazır değil. Sayfayı yenileyip tekrar dene.","voice-idle");return;
  }
  if(typeof window.stopVoiceCapture==="function")window.stopVoiceCapture();
  if(window.speechSynthesis)window.speechSynthesis.cancel();
  active=true;
  requestInFlight=false;
  setButton();
  status("Sesli sohbet başlatılıyor… Mikrofon iznini onayla.","voice-listening");
  listen();
 }

 // Mevcut mesaj balonlarındaki tek seferlik sesli okuma düğmesi korunur.
 window.speakText=function(text,button){
  if(!window.speechSynthesis||!window.SpeechSynthesisUtterance){
   if(button)button.textContent="Ses desteklenmiyor";
   return;
  }
  window.speechSynthesis.cancel();
  const utterance=new SpeechSynthesisUtterance(String(text||""));
  utterance.lang="tr-TR";
  utterance.rate=1;
  utterance.pitch=1;
  const voices=window.speechSynthesis.getVoices();
  const trVoice=voices.find(v=>/^tr([-_]|$)/i.test(v.lang))||voices.find(v=>/turkish|türkçe/i.test(v.name));
  if(trVoice)utterance.voice=trVoice;
  if(button)button.textContent="⏹ Durdur";
  utterance.onend=()=>{if(button)button.textContent="🔊 Sesli dinle";};
  utterance.onerror=()=>{if(button)button.textContent="🔊 Tekrar dene";};
  window.speechSynthesis.speak(utterance);
 };
 window.tozraVoiceConversation={
  isActive:()=>active,
  isSpeaking:()=>speaking,
  onAssistantResponse:text=>{if(active)speak(text);},
  interrupt,
  stop:()=>stopAll("Sesli sohbet durduruldu.")
 };
 const bind=()=>{
  const b=$(buttonId);
  if(b&&!b.dataset.voiceBound){b.dataset.voiceBound="1";b.addEventListener("click",toggle);}
  const i=$("voiceInterruptButton");
  if(i&&!i.dataset.voiceBound){i.dataset.voiceBound="1";i.addEventListener("click",interrupt);}
 };
 bind();
 window.addEventListener("beforeunload",()=>stopAll());
})();
