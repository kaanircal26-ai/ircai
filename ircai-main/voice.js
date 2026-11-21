/* TOZRA — mobile-friendly voice input. Browser speech recognition first,
   authenticated MediaRecorder transcription fallback for mobile Safari. */
"use strict";
let activeRecognition=null,activeRecorder=null,activeVoiceButton=null,activeVoiceStream=null,activeVoiceTimer=null;
function resetVoiceButton(button){
 if(button){button.classList.remove("recording");button.textContent="🎙 Konuş";button.setAttribute("aria-pressed","false");}
 if(activeVoiceButton===button)activeVoiceButton=null;
}
function stopVoiceCapture(){
 if(activeRecognition){const current=activeRecognition;activeRecognition=null;try{current.stop();}catch(error){}}
 if(activeRecorder&&activeRecorder.state!=="inactive"){try{activeRecorder.stop();}catch(error){}}
 if(activeVoiceTimer){clearTimeout(activeVoiceTimer);activeVoiceTimer=null;}
 if(activeVoiceStream){activeVoiceStream.getTracks().forEach(track=>track.stop());activeVoiceStream=null;}
 resetVoiceButton(activeVoiceButton);
}
function sendRecognizedText(text,input,button,status){
 const transcript=(text||"").trim();
 if(!transcript){status.textContent="Konuşma algılanmadı. Tekrar deneyebilirsin.";return;}
 input.value=(input.value.trim()?input.value.trim()+" ":"")+transcript;
 input.dispatchEvent(new Event("input",{bubbles:true}));
 status.textContent="Konuşman algılandı. TOZRA'ya gönderiliyor…";
 window.tozraSpeakNextReply=true;
 const sendButton=document.getElementById(input.id==="projectPrompt"?"projectSend":"send");
 if(sendButton)window.setTimeout(()=>sendButton.click(),180);
 else status.textContent="Gönder düğmesi bulunamadı. Metni elle gönderebilirsin.";
}
function blobToBase64(blob){
 return new Promise((resolve,reject)=>{
  const reader=new FileReader();
  reader.onload=()=>{const result=String(reader.result||"");resolve(result.includes(",")?result.split(",")[1]:result);};
  reader.onerror=()=>reject(new Error("Ses kaydı okunamadı."));
  reader.readAsDataURL(blob);
 });
}
async function transcribeRecordedAudio(blob,input,status,button){
 let token="";
 try{if(typeof TozraAuth!=="undefined")token=TozraAuth.getSession()?.access_token||"";}catch(error){}
 if(!token){status.textContent="Ses kaydını yazıya çevirmek için önce TOZRA hesabına giriş yapmalısın.";return;}
 if(!blob||!blob.size){status.textContent="Ses kaydı boş. Tekrar deneyebilirsin.";return;}
 if(blob.size>4*1024*1024){status.textContent="Kayıt çok uzun. Daha kısa konuşup tekrar dene.";return;}
 status.textContent="Konuşman yazıya çevriliyor…";
 try{
  const audio=await blobToBase64(blob);
  const response=await fetch("/api/transcribe",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+token},body:JSON.stringify({audio,mimeType:blob.type||"audio/mp4"})});
  let result={};try{result=await response.json();}catch(error){}
  if(!response.ok||!result.success)throw new Error(result.error||"Ses yazıya çevrilemedi.");
  sendRecognizedText(result.text,input,button,status);
 }catch(error){status.textContent=error.message||"Ses yazıya çevrilemedi. Tekrar deneyebilirsin.";}
}
async function startRecorderFallback(button,input,status){
 if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){status.textContent="Bu cihazda mikrofon kaydı desteklenmiyor. Güncel Safari veya Chrome kullanmayı dene.";return;}
 try{
  const stream=await navigator.mediaDevices.getUserMedia({audio:true});activeVoiceStream=stream;
  const formats=["audio/mp4","audio/webm;codecs=opus","audio/webm","audio/ogg;codecs=opus"];
  const mime=formats.find(type=>MediaRecorder.isTypeSupported?.(type));
  const recorder=mime?new MediaRecorder(stream,{mimeType:mime}):new MediaRecorder(stream);
  const chunks=[];activeRecorder=recorder;activeVoiceButton=button;
  button.classList.add("recording");button.textContent="■ Bitir";button.setAttribute("aria-pressed","true");
  status.textContent="Dinliyorum… Bitirmek için tekrar dokun. En fazla 25 saniye.";
  recorder.ondataavailable=event=>{if(event.data?.size)chunks.push(event.data);};
  recorder.onerror=()=>{status.textContent="Mikrofon kaydı sırasında hata oluştu.";stopVoiceCapture();};
  recorder.onstop=async()=>{
   const blob=new Blob(chunks,{type:recorder.mimeType||"audio/mp4"});
   if(activeVoiceTimer){clearTimeout(activeVoiceTimer);activeVoiceTimer=null;}
   if(activeVoiceStream){activeVoiceStream.getTracks().forEach(track=>track.stop());activeVoiceStream=null;}
   activeRecorder=null;resetVoiceButton(button);
   await transcribeRecordedAudio(blob,input,status,button);
  };
  recorder.start(300);
  activeVoiceTimer=setTimeout(()=>{if(recorder.state!=="inactive"){status.textContent="Kayıt süresi tamamlandı. Ses işleniyor…";recorder.stop();}},25000);
 }catch(error){
  status.textContent=error.name==="NotAllowedError"?"Mikrofon izni verilmedi. Telefonunun tarayıcı ayarlarından mikrofon iznini aç.":error.name==="NotFoundError"?"Mikrofon bulunamadı.":"Mikrofon başlatılamadı: "+(error.message||"Tekrar dene.");
  if(activeVoiceStream){activeVoiceStream.getTracks().forEach(track=>track.stop());activeVoiceStream=null;}
  resetVoiceButton(button);
 }
}
function startVoiceCapture(button,input,status){
 if(activeRecognition||activeRecorder){
  if(activeRecognition){const current=activeRecognition;activeRecognition=null;try{current.stop();}catch(error){}}
  if(activeRecorder&&activeRecorder.state!=="inactive"){try{activeRecorder.stop();}catch(error){}}
  if(activeVoiceTimer){clearTimeout(activeVoiceTimer);activeVoiceTimer=null;}
  status.textContent="Konuşma durduruluyor…";return;
 }
 if(window.speechSynthesis)window.speechSynthesis.cancel();
 const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!Recognition){startRecorderFallback(button,input,status);return;}
 const recognition=new Recognition();let finalText="";
 recognition.lang="tr-TR";recognition.continuous=false;recognition.interimResults=true;recognition.maxAlternatives=1;
 activeRecognition=recognition;activeVoiceButton=button;
 button.classList.add("recording");button.textContent="■ Bitir";button.setAttribute("aria-pressed","true");
 status.textContent="Dinliyorum… Konuşmanı bitirince metne aktaracağım.";
 recognition.onresult=event=>{
  let interim="";
  for(let i=event.resultIndex;i<event.results.length;i++){const value=event.results[i][0]?.transcript||"";if(event.results[i].isFinal)finalText+=value;else interim+=value;}
  if(interim)status.textContent="Duyulan: "+interim;
 };
 recognition.onerror=event=>{
  const messages={"not-allowed":"Mikrofon izni verilmedi. Tarayıcı ayarlarından mikrofon iznini aç.","service-not-allowed":"Tarayıcı konuşma tanıma servisine izin vermedi.","no-speech":"Ses algılanmadı. Tekrar deneyebilirsin.","audio-capture":"Mikrofon bulunamadı veya kullanılamıyor.","network":"Tarayıcının konuşma tanıma servisine bağlanılamadı."};
  status.textContent=messages[event.error]||("Konuşma tanınamadı: "+event.error);
 };
 recognition.onend=()=>{
  if(finalText.trim())sendRecognizedText(finalText,input,button,status);
  else if(!status.textContent.includes("izin")&&!status.textContent.includes("bağlanılamadı"))status.textContent="Konuşma algılanmadı. Tekrar deneyebilirsin.";
  if(activeRecognition===recognition)activeRecognition=null;resetVoiceButton(button);
 };
 try{recognition.start();}catch(error){activeRecognition=null;status.textContent="Konuşma başlatılamadı. Alternatif mikrofon kaydı deneniyor…";startRecorderFallback(button,input,status);}
}
function bindTozraVoiceButtons(){
 const button=document.getElementById("voiceButton"),status=document.getElementById("voiceStatus");
 const projectButton=document.getElementById("projectVoiceButton"),projectStatus=document.getElementById("projectVoiceStatus");
 const prompt=document.getElementById("prompt"),projectPrompt=document.getElementById("projectPrompt");
 if(button&&prompt)button.addEventListener("click",()=>startVoiceCapture(button,prompt,status));
 if(projectButton&&projectPrompt)projectButton.addEventListener("click",()=>startVoiceCapture(projectButton,projectPrompt,projectStatus));
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bindTozraVoiceButtons,{once:true});else bindTozraVoiceButtons();
