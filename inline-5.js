
(function(){
 "use strict";
 const $id=id=>document.getElementById(id);
 const dock=$id("mobileDock");
 let selectedTab="home";
 let deferredInstallPrompt=null;
 function setDockTab(tab){
  selectedTab=tab;
  if(!dock)return;
  dock.querySelectorAll("[data-mobile-tab]").forEach(button=>{
   const active=button.dataset.mobileTab===tab;
   button.classList.toggle("is-active",active);
   button.setAttribute("aria-current",active?"page":"false");
  });
 }
 function scrollToProjects(){
  const target=$id("projectGrid");
  if(target)target.scrollIntoView({behavior:"smooth",block:"start"});
 }
 if(dock) dock.addEventListener("click",event=>{
  const button=event.target.closest("[data-mobile-tab]");
  if(!button)return;
  const tab=button.dataset.mobileTab;
  setDockTab(tab);
  if(tab==="home")$id("navWorkspace")?.click();
  if(tab==="chat"){
   // Switch directly to the existing AI chat page; do not simulate a click
   // on the home-page CTA and do not clear the current conversation.
   if(typeof window.openGeneralChat === "function"){
    window.openGeneralChat();
   }else if(typeof window.showPage === "function"){
    window.showPage("chat");
   }else{
    console.error("TOZRA: Yapay zekâ sohbet ekranı açılamadı; sayfa geçiş fonksiyonu bulunamadı.");
   }
  }
  if(tab==="projects"){$id("navProjects")?.click();window.setTimeout(scrollToProjects,180);}
  if(tab==="studio")$id("navCreativeStudio")?.click();
  if(tab==="profile" && typeof showModal==="function")showModal("profile");
 });
 function syncDockToPage(){
  const active=document.querySelector(".page.active");
  if(!active)return;
  const map={workspacePage:"home",chatPage:"chat",projectPage:"projects",creativeStudioPage:"studio"};
  const tab=map[active.id];
  if(tab)setDockTab(tab);
 }
 const pageObserver=new MutationObserver(syncDockToPage);
 document.querySelectorAll(".page").forEach(page=>pageObserver.observe(page,{attributes:true,attributeFilter:["class"]}));
 syncDockToPage();

 function addCapturedFiles(inputId,kind){
  const input=$id(inputId);if(!input)return;
  const isProject=$id("projectPage")?.classList.contains("active");
  const target=isProject?projectAttachments:attachments;
  const areaId=isProject?"projectAttachments":"attachments";
  if(typeof addFiles==="function")addFiles(input.files,kind,target,areaId);
  input.value="";
 }
 $id("cameraButton")?.addEventListener("click",()=>$id("cameraInput")?.click());
 $id("recordVideoButton")?.addEventListener("click",()=>$id("recordVideoInput")?.click());
 $id("cameraInput")?.addEventListener("change",()=>addCapturedFiles("cameraInput","image"));
 $id("recordVideoInput")?.addEventListener("change",()=>addCapturedFiles("recordVideoInput","video"));

 window.addEventListener("beforeinstallprompt",event=>{event.preventDefault();deferredInstallPrompt=event;});
 document.addEventListener("click",async event=>{
  if(event.target.closest("#installTozraButton")){
   const status=$id("mobileSettingsStatus");
   if(deferredInstallPrompt){
    try{
     deferredInstallPrompt.prompt();
     const choice=await deferredInstallPrompt.userChoice;
     if(status)status.textContent=choice?.outcome==="accepted"?"TOZRA ana ekrana ekleniyor.":"Kurulum isteği iptal edildi.";
    }catch(error){if(status)status.textContent="Kurulum penceresi açılamadı. Tarayıcı menüsünü kullanabilirsin.";}
    deferredInstallPrompt=null;
   }else if(/iphone|ipad|ipod/i.test(navigator.userAgent)){
    if(status)status.textContent="Safari'de Paylaş düğmesine dokun, ardından 'Ana Ekrana Ekle' seçeneğini seç.";
   }else if(status)status.textContent="Tarayıcı menüsünden 'Uygulamayı yükle' veya 'Ana ekrana ekle' seçeneğini kontrol et.";
  }
  if(event.target.closest("#enableTozraNotifications")){
   const status=$id("mobileSettingsStatus");
   if(!("Notification" in window)){if(status)status.textContent="Bu tarayıcı bildirim iznini desteklemiyor.";return;}
   try{
    const permission=await Notification.requestPermission();
    if(status)status.textContent=permission==="granted"
     ?"Tarayıcı bildirim izni verildi. Anlık push bildirimi için ayrıca bildirim sunucusu kurulmalıdır."
     :permission==="denied"?"Bildirim izni reddedildi. Telefonunun tarayıcı ayarlarından değiştirebilirsin.":"Bildirim izni seçilmedi.";
   }catch(error){if(status)status.textContent="Bildirim izni şu anda alınamadı.";}
  }
  if(event.target.closest("#profilePlansButton"))showModal("plans");
  if(event.target.closest("#profileSettingsButton"))showModal("settings");
 });
 function updateConnection(){
  const status=document.querySelector(".top-actions .status");
  if(status)status.textContent=navigator.onLine?"Çevrimiçi":"Çevrimdışı";
 }
 window.addEventListener("online",updateConnection);
 window.addEventListener("offline",updateConnection);
 updateConnection();
})();

/* GÖREVLERİM & TAKVİM */
const TASKS_KEY="ircal_tasks_calendar_v1";
let taskItems=safeRead(TASKS_KEY,{tasks:[],events:[]});
if(!taskItems || !Array.isArray(taskItems.tasks) || !Array.isArray(taskItems.events)) taskItems={tasks:[],events:[]};
let calendarCursor=new Date(); calendarCursor.setDate(1);
let calendarSelected=new Date().toISOString().slice(0,10);
const taskEl=id=>document.getElementById(id);
const dateKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
function persistTaskItems(){
 const serialized=JSON.stringify(taskItems);
 const scopedKey=scopedStorageKey(TASKS_KEY);
 try{
  // Write the account-scoped record first and verify it before reporting success.
  localStorage.setItem(scopedKey,serialized);
  if(localStorage.getItem(scopedKey)!==serialized) throw new Error("Görev kaydı doğrulanamadı.");
  // Keep a legacy fallback so older app builds can still recover the same task list.
  localStorage.setItem(TASKS_KEY,serialized);
  if(window.TozraCloudSync) window.TozraCloudSync.schedule();
  return true;
 }catch(error){
  console.error("TOZRA görev/takvim kayıt hatası:",error);
  alert("Görev kaydedilemedi. Tarayıcı depolama iznini kontrol et. Ayrıntı: "+(error?.message||error));
  return false;
 }
}
function dateLabel(value){if(!value)return "";const d=new Date(value+"T12:00:00");return d.toLocaleDateString("tr-TR",{day:"numeric",month:"short",year:"numeric"});}
function renderTasksCalendar(){
 taskEl("tasksActiveCount").textContent=taskItems.tasks.filter(x=>!x.done).length;
 taskEl("tasksDoneCount").textContent=taskItems.tasks.filter(x=>x.done).length;
 taskEl("tasksEventCount").textContent=taskItems.events.length;
 const list=taskEl("tasksList");
 const sorted=[...taskItems.tasks].sort((a,b)=>a.date.localeCompare(b.date));
 list.innerHTML=sorted.length?sorted.map(t=>`<div class="task-item ${t.done?"done":""}">
  <input class="task-check" type="checkbox" data-task-check="${escapeAttr(t.id)}" ${t.done?"checked":""} aria-label="Görevi tamamla">
  <div class="task-copy"><strong>${escapeHTML(t.title)}</strong><small>${dateLabel(t.date)}${t.note?" · "+escapeHTML(t.note):""}</small></div>
  <span class="task-priority ${escapeAttr(t.priority)}">${t.priority==="high"?"Yüksek":t.priority==="low"?"Düşük":"Normal"}</span>
  <button class="task-delete" type="button" data-task-delete="${escapeAttr(t.id)}" aria-label="Görevi sil">×</button>
 </div>`).join(""):'<div class="tasks-empty">Henüz görev eklemedin. İlk görevini oluşturarak başlayabilirsin.</div>';
 const y=calendarCursor.getFullYear(),m=calendarCursor.getMonth();
 taskEl("calendarMonth").textContent=calendarCursor.toLocaleDateString("tr-TR",{month:"long",year:"numeric"});
 const first=new Date(y,m,1), start=(first.getDay()+6)%7;
 const days=new Date(y,m+1,0).getDate(), prevDays=new Date(y,m,0).getDate();
 const names=["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"];
 let cells=names.map(n=>`<div class="calendar-dayname">${n}</div>`).join("");
 for(let i=0;i<42;i++){
  let dayNum, date, muted=false;
  if(i<start){dayNum=prevDays-start+i+1;date=new Date(y,m-1,dayNum);muted=true;}
  else if(i>=start+days){dayNum=i-start-days+1;date=new Date(y,m+1,dayNum);muted=true;}
  else{dayNum=i-start+1;date=new Date(y,m,dayNum);}
  const key=dateKey(date),has=taskItems.tasks.some(t=>t.date===key&&!t.done)||taskItems.events.some(e=>e.date===key);
  const today=key===dateKey(new Date());
  cells+=`<button type="button" class="calendar-day ${muted?"muted":""} ${key===calendarSelected?"selected":""} ${today?"today":""} ${has?"has-items":""}" data-calendar-date="${key}">${dayNum}</button>`;
 }
 taskEl("calendarGrid").innerHTML=cells;
 renderCalendarAgenda();
}
function renderCalendarAgenda(){
 taskEl("agendaTitle").textContent=dateLabel(calendarSelected)+" planı";
 const tasks=taskItems.tasks.filter(t=>t.date===calendarSelected).map(t=>({title:t.title,detail:t.done?"Tamamlandı":"Görev",time:"",type:"Görev"}));
 const events=taskItems.events.filter(e=>e.date===calendarSelected).map(e=>({title:e.title,detail:e.note||"Takvim etkinliği",time:e.time||"",type:"Etkinlik"}));
 const all=[...events,...tasks].sort((a,b)=>(a.time||"").localeCompare(b.time||""));
 taskEl("calendarAgenda").innerHTML=all.length?all.map(x=>`<div class="agenda-item"><div class="agenda-copy"><strong>${escapeHTML(x.title)}</strong><small>${escapeHTML(x.detail)}</small></div><span class="agenda-type">${x.time?escapeHTML(x.time)+" · ":""}${x.type}</span></div>`).join(""):'<div class="tasks-empty">Bu gün için plan bulunmuyor.</div>';
}
taskEl("taskAddToggle").onclick=()=>{taskEl("taskForm").hidden=!taskEl("taskForm").hidden;taskEl("taskDate").value=calendarSelected;};
taskEl("eventAddToggle").onclick=()=>{taskEl("eventForm").hidden=!taskEl("eventForm").hidden;taskEl("eventDate").value=calendarSelected;};
taskEl("taskCancel").onclick=()=>taskEl("taskForm").hidden=true;
taskEl("eventCancel").onclick=()=>taskEl("eventForm").hidden=true;
taskEl("taskForm").onsubmit=e=>{
 e.preventDefault();const title=taskEl("taskTitle").value.trim(),date=taskEl("taskDate").value;
 if(!title||!date)return;
 taskItems.tasks.push({id:makeId(),title,date,priority:taskEl("taskPriority").value,note:taskEl("taskNote").value.trim(),done:false});
 calendarSelected=date;if(!persistTaskItems()){taskItems.tasks=taskItems.tasks.filter(x=>x.id!==taskItems.tasks[taskItems.tasks.length-1]?.id);return;}taskEl("taskForm").reset();taskEl("taskForm").hidden=true;renderTasksCalendar();
};
taskEl("eventForm").onsubmit=e=>{
 e.preventDefault();const title=taskEl("eventTitle").value.trim(),date=taskEl("eventDate").value;
 if(!title||!date)return;
 taskItems.events.push({id:makeId(),title,date,time:taskEl("eventTime").value,note:taskEl("eventNote").value.trim()});
 calendarSelected=date;if(!persistTaskItems()){taskItems.events=taskItems.events.filter(x=>x.id!==taskItems.events[taskItems.events.length-1]?.id);return;}taskEl("eventForm").reset();taskEl("eventForm").hidden=true;renderTasksCalendar();
};
taskEl("tasksList").addEventListener("change",e=>{
 const id=e.target.dataset.taskCheck;if(!id)return;
 const item=taskItems.tasks.find(t=>t.id===id);if(item){item.done=e.target.checked;persistTaskItems();renderTasksCalendar();}
});
taskEl("tasksList").addEventListener("click",e=>{
 const id=e.target.dataset.taskDelete;if(!id)return;
 taskItems.tasks=taskItems.tasks.filter(t=>t.id!==id);persistTaskItems();renderTasksCalendar();
});
taskEl("calendarGrid").addEventListener("click",e=>{
 const key=e.target.dataset.calendarDate;if(!key)return;
 calendarSelected=key;const d=new Date(key+"T12:00:00");calendarCursor=new Date(d.getFullYear(),d.getMonth(),1);renderTasksCalendar();
});
taskEl("calendarPrev").onclick=()=>{calendarCursor.setMonth(calendarCursor.getMonth()-1);renderTasksCalendar();};
taskEl("calendarNext").onclick=()=>{calendarCursor.setMonth(calendarCursor.getMonth()+1);renderTasksCalendar();};
renderTasksCalendar();


/* Home calendar preview mirrors the standalone Tasks & Calendar page */
(function(){
 const grid=document.getElementById("phHomeCalendarGrid");
 if(!grid)return;
 const open=document.getElementById("phOpenCalendar");
 if(open)open.addEventListener("click",()=>{if(typeof showPage==="function"){showPage("tasks");if(typeof renderTasksCalendar==="function")renderTasksCalendar();}});
 let data={tasks:[],events:[]};
 try{const raw=localStorage.getItem(typeof window.tozraStorageKey==="function"?window.tozraStorageKey("ircal_tasks_calendar_v1"):"ircal_tasks_calendar_v1");if(raw)data=JSON.parse(raw)||data;}catch(e){}
 const now=new Date(),year=now.getFullYear(),month=now.getMonth();
 document.getElementById("phHomeCalendarMonth").textContent=now.toLocaleDateString("tr-TR",{month:"long",year:"numeric"});
 const total=(data.tasks||[]).filter(x=>!x.done).length+(data.events||[]).length;
 document.getElementById("phHomeCalendarSummary").textContent=total?`${total} planın ve görevin var.`:"Görevlerini ve etkinliklerini takip et.";
 const names=["P","S","Ç","P","C","C","P"];
 let out=names.map(n=>`<div class="ph-hcal-dayname">${n}</div>`).join("");
 const first=new Date(year,month,1),offset=(first.getDay()+6)%7,days=new Date(year,month+1,0).getDate(),prev=new Date(year,month,0).getDate();
 const planned=new Set([...(data.tasks||[]).map(x=>x.date),...(data.events||[]).map(x=>x.date)]);
 for(let i=0;i<42;i++){
  let d,muted=false;
  if(i<offset){d=new Date(year,month-1,prev-offset+i+1);muted=true;}
  else if(i>=offset+days){d=new Date(year,month+1,i-offset-days+1);muted=true;}
  else d=new Date(year,month,i-offset+1);
  const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  out+=`<div class="ph-hcal-day ${muted?"muted":""} ${key===`${year}-${String(month+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`?"today":""} ${planned.has(key)?"planned":""}">${d.getDate()}</div>`;
 }
 grid.innerHTML=out;
 const upcoming=[...(data.events||[]),...(data.tasks||[]).filter(x=>!x.done)].filter(x=>x.date>=now.toISOString().slice(0,10)).sort((a,b)=>a.date.localeCompare(b.date))[0];
 document.getElementById("phHomeNextEvent").textContent=upcoming?`${upcoming.title} · ${new Date(upcoming.date+"T12:00:00").toLocaleDateString("tr-TR",{day:"numeric",month:"short"})}`:"Yaklaşan plan bulunmuyor";
})();

