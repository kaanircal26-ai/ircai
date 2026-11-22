
(()=>{
 const root=document.getElementById('personalHome');if(!root)return;
 const $=id=>document.getElementById(id), DAYS=['Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi','Pazar'];
 const scoped=key=>typeof window.tozraStorageKey==='function'?window.tozraStorageKey(key):key;
 const safeRead=(key,fallback)=>{try{const v=JSON.parse(localStorage.getItem(scoped(key)));if(v!==null)return v;const legacy=localStorage.getItem(key);if(legacy!==null){localStorage.setItem(scoped(key),legacy);localStorage.removeItem(key);return JSON.parse(legacy)}return fallback}catch{return fallback}};
 let tasks=safeRead('tozra-web-home-tasks-v1',[]),week=safeRead('tozra-web-home-week-v1',{}),activeDay=0;
 const save=(key,value)=>{try{localStorage.setItem(scoped(key),JSON.stringify(value));window.TozraCloudSync?.schedule()}catch(e){console.warn('TOZRA home storage:',e)}};
 function renderTasks(){const list=$('phTaskList');list.innerHTML='';if(!tasks.length){list.innerHTML='<div class="ph-empty">Henüz görev yok. İlk görevini ekleyerek başla.</div>';}else tasks.forEach(task=>{const row=document.createElement('div');row.className='ph-task'+(task.done?' done':'');const check=document.createElement('button');check.className='ph-check'+(task.done?' done':'');check.type='button';check.setAttribute('aria-label',task.done?'Görevi tamamlanmadı yap':'Görevi tamamla');check.textContent=task.done?'✓':'';check.onclick=()=>{tasks=tasks.map(t=>t.id===task.id?{...t,done:!t.done}:t);save('tozra-web-home-tasks-v1',tasks);renderTasks()};const label=document.createElement('span');label.className='ph-task-label';label.textContent=task.title;const del=document.createElement('button');del.className='ph-delete';del.type='button';del.setAttribute('aria-label','Görevi sil');del.textContent='×';del.onclick=()=>{tasks=tasks.filter(t=>t.id!==task.id);save('tozra-web-home-tasks-v1',tasks);renderTasks()};row.append(check,label,del);list.append(row)});$('phTotal').textContent=tasks.length;$('phDone').textContent=tasks.filter(t=>t.done).length;$('phPending').textContent=tasks.filter(t=>!t.done).length;}
 $('phTaskForm').addEventListener('submit',e=>{e.preventDefault();const input=$('phTaskInput'),title=input.value.trim();if(!title)return;tasks.unshift({id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),title,done:false});save('tozra-web-home-tasks-v1',tasks);input.value='';renderTasks();});
 $('phNotes').value=localStorage.getItem(scoped('tozra-web-home-notes-v1'))||localStorage.getItem('tozra-web-home-notes-v1')||'';let noteTimer; $('phNotes').addEventListener('input',()=>{ $('phNotesStatus').textContent='Kaydediliyor…';clearTimeout(noteTimer);noteTimer=setTimeout(()=>{try{localStorage.setItem(scoped('tozra-web-home-notes-v1'),$('phNotes').value);window.TozraCloudSync?.schedule();$('phNotesStatus').textContent='Kaydedildi · Hesabınla eşitleniyor.'}catch{$('phNotesStatus').textContent='Kaydedilemedi · Tarayıcı depolama alanını kontrol et.'}},250)});
 function renderDays(){const el=$('phDays');el.innerHTML='';DAYS.forEach((day,i)=>{const b=document.createElement('button');b.type='button';b.className='ph-day'+(i===activeDay?' active':'');b.textContent=day.slice(0,3);b.onclick=()=>{activeDay=i;renderDays();$('phPlanDay').textContent=day;$('phPlan').value=week[i]||''};el.append(b)});$('phPlanDay').textContent=DAYS[activeDay];$('phPlan').value=week[activeDay]||'';}
 let planTimer;$('phPlan').addEventListener('input',()=>{week[activeDay]=$('phPlan').value;$('phPlanStatus').textContent='Kaydediliyor…';clearTimeout(planTimer);planTimer=setTimeout(()=>{save('tozra-web-home-week-v1',week);$('phPlanStatus').textContent='Haftalık planın kaydedildi.'},250)});
 $('phAsk').addEventListener('click',()=>{const chat=document.getElementById('navChat');if(chat)chat.click();else document.getElementById('navChat')?.click()});
 renderTasks();renderDays();
 window.addEventListener('tozra-cloud-hydrated',()=>{
  tasks=safeRead('tozra-web-home-tasks-v1',[]);week=safeRead('tozra-web-home-week-v1',{});
  $('phNotes').value=localStorage.getItem(scoped('tozra-web-home-notes-v1'))||'';
  renderTasks();renderDays();
 });
})();
