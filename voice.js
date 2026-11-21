/* TOZRA — Ücretsiz tarayıcı tabanlı sesli sohbet gönderimi
   OpenAI Realtime API veya ücretli API kotası kullanmaz.
   Ana uygulama index.html içinden önce yüklenir.
*/
"use strict";

/* ÜCRETSİZ TARAYICI SES SİSTEMİ — API / REALTIME KULLANMAZ */
let activeRecognition=null;
let activeVoiceButton=null;
let activeVoiceStatus=null;

function stopVoiceCapture(){
 if(activeRecognition){
  const current=activeRecognition;
  activeRecognition=null;
  try{current.stop();}catch(error){}
 }
 if(activeVoiceButton){
  activeVoiceButton.classList.remove("recording");
  activeVoiceButton.textContent="🎙 Konuş";
 }
 activeVoiceButton=null;
 activeVoiceStatus=null;
}

function startVoiceCapture(button,input,status){
 if(activeRecognition){
  stopVoiceCapture();
  status.textContent="Konuşma durduruldu.";
  return;
 }
 const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!Recognition){
  status.textContent="Bu tarayıcı konuşma tanımayı desteklemiyor. Güncel Chrome veya Edge deneyebilirsin.";
  return;
 }
 if(window.speechSynthesis)window.speechSynthesis.cancel();
 const recognition=new Recognition();
 let finalText="";
 recognition.lang="tr-TR";
 recognition.continuous=false;
 recognition.interimResults=true;
 recognition.maxAlternatives=1;
 activeRecognition=recognition;
 activeVoiceButton=button;
 activeVoiceStatus=status;
 button.classList.add("recording");
 button.textContent="■ Bitir";
 status.textContent="Dinliyorum… Konuşmanı bitirince metne aktaracağım.";
 recognition.onresult=event=>{
  let interim="";
  for(let i=event.resultIndex;i<event.results.length;i++){
   const value=event.results[i][0]?.transcript||"";
   if(event.results[i].isFinal)finalText+=value;
   else interim+=value;
  }
  if(interim)status.textContent="Duyulan: "+interim;
 };
 recognition.onerror=event=>{
  const messages={
   "not-allowed":"Mikrofon izni verilmedi. Tarayıcı ayarlarından mikrofon iznini aç.",
   "service-not-allowed":"Tarayıcı konuşma tanıma servisine izin vermedi.",
   "no-speech":"Ses algılanmadı. Tekrar deneyebilirsin.",
   "audio-capture":"Mikrofon bulunamadı veya kullanılamıyor.",
   "network":"Tarayıcının konuşma tanıma servisine bağlanılamadı."
  };
  status.textContent=messages[event.error]||("Konuşma tanınamadı: "+event.error);
 };
 recognition.onend=()=>{
  const transcript=finalText.trim();
  if(transcript){
   input.value=(input.value.trim()?input.value.trim()+" ":"")+transcript;
   input.dispatchEvent(new Event("input",{bubbles:true}));
   status.textContent="Konuşman algılandı. TOZRA'ya gönderiliyor…";
   window.tozraSpeakNextReply=true;
   // Gönderim düğmesine tıklayarak uygulamanın normal mesaj akışını kullan.
   // Bu yöntem fonksiyonların global kapsamda olup olmamasından etkilenmez.
   const sendId=input.id==="projectPrompt"?"projectSend":"send";
   const sendButton=document.getElementById(sendId);
   if(sendButton){
    window.setTimeout(()=>sendButton.click(),180);
   }else{
    status.textContent="Gönder düğmesi bulunamadı. Metni elle gönderebilirsin.";
   }
  }else if(!status.textContent.includes("izin")&&!status.textContent.includes("desteklemiyor")&&!status.textContent.includes("bağlanılamadı")){
   status.textContent="Konuşma algılanmadı. Tekrar deneyebilirsin.";
  }
  if(activeRecognition===recognition)activeRecognition=null;
  button.classList.remove("recording");
  button.textContent="🎙 Konuş";
  if(activeVoiceButton===button){activeVoiceButton=null;activeVoiceStatus=null;}
 };
 try{recognition.start();}
 catch(error){
  status.textContent="Mikrofon başlatılamadı: "+(error.message||"Tekrar dene.");
  stopVoiceCapture();
 }
}

/*
 * Bu dosya index.html içindeki ana uygulama kodundan önce yükleniyor.
 * Butonlar henüz DOM'a eklenmeden onclick ataması yapmak null hatasına
 * ve mobilde dahil ses butonlarının tamamen tepkisiz kalmasına yol açıyordu.
 * DOMContentLoaded sonrasında bağlayarak hem masaüstünü hem mobil tarayıcıları
 * destekle.
 */
function bindTozraVoiceButtons(){
 const voiceButton = document.getElementById("voiceButton");
 const voiceStatus = document.getElementById("voiceStatus");
 const projectVoiceButton = document.getElementById("projectVoiceButton");
 const projectVoiceStatus = document.getElementById("projectVoiceStatus");
 const projectPrompt = document.getElementById("projectPrompt");

 if(voiceButton && typeof promptInput !== "undefined"){
  voiceButton.addEventListener("click",()=>{
   startVoiceCapture(voiceButton,promptInput,voiceStatus);
  });
 }

 if(projectVoiceButton && projectPrompt){
  projectVoiceButton.addEventListener("click",()=>{
   startVoiceCapture(projectVoiceButton,projectPrompt,projectVoiceStatus);
  });
 }
}

if(document.readyState === "loading"){
 document.addEventListener("DOMContentLoaded",bindTozraVoiceButtons,{once:true});
}else{
 bindTozraVoiceButtons();
}

