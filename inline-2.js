
/* TOZRA CREATIVE STUDIO — resilient interaction layer */
(function(){
 "use strict";
 const byId=id=>document.getElementById(id);
 const modes={
  idea:{title:"Idea Lab çalışma alanı",name:"Yeni bir fikir geliştirelim",icon:"✧",desc:"Aklındaki fikri net bir yaratıcı konsepte dönüştürelim.",placeholder:"Aklındaki fikri, çözmek istediğin problemi veya geliştirmek istediğin konsepti anlat...",task:"Fikri değerlendir; güçlü bir yaratıcı konsept, hedef, değer önerisi, farklılaşma noktaları ve uygulanabilir ilk adımları oluştur."},
  image:{title:"Visual Studio çalışma alanı",name:"Görsel konsept oluştur",icon:"▧",desc:"Görsel yön, kompozisyon ve üretim brief'i hazırla.",placeholder:"Görselin konusu, kullanım yeri, kompozisyonu ve vermesini istediğin hissi anlat...",task:"Profesyonel bir görsel üretim brief'i ve ayrıntılı görsel üretim prompt'u hazırla. Kompozisyon, ışık, renk, stil ve kadrajı belirt."},
  video:{title:"Video Studio çalışma alanı",name:"Video fikrini geliştir",icon:"▷",desc:"Video fikrini senaryo ve storyboard'a dönüştür.",placeholder:"Videonun konusu, platformu, hedef süresi ve hedef kitlesini anlat...",task:"Video konsepti, kısa senaryo, sahne sahne storyboard, çekim planı ve kurgu önerisi hazırla."},
  design:{title:"Design Studio çalışma alanı",name:"Marka ve tasarım sistemi",icon:"◈",desc:"Marka kimliği ve tasarım yönünü netleştir.",placeholder:"Markayı, hedef kitlesini, sektörünü ve tasarım ihtiyacını anlat...",task:"Marka kimliği brief'i, görsel yön, renk paleti önerileri, tipografi yaklaşımı ve tasarım sistemi hazırla."},
  writing:{title:"Writing Studio çalışma alanı",name:"Metin ve hikâye üret",icon:"▤",desc:"İçerik, reklam metni ve hikâye taslağı hazırla.",placeholder:"Yazının konusunu, amacını, platformunu ve hedef kitlesini anlat...",task:"Amaca uygun, özgün ve hedef kitleye göre uyarlanmış metin taslağı hazırla. Başlık ve alternatifler de sun."},
  campaign:{title:"Campaign Lab çalışma alanı",name:"Kampanya planı oluştur",icon:"⌁",desc:"Uçtan uca yaratıcı kampanya planı oluştur.",placeholder:"Kampanyanın amacı, ürün/hizmet, hedef kitle, platformlar ve zaman aralığı nedir?",task:"Kampanya amacı, hedef kitle, içgörü, ana fikir, slogan, kanal stratejisi, içerik serisi, yayın akışı ve başarı göstergelerini içeren uygulanabilir kampanya planı hazırla."}
 };
 let active='idea';
 function chooseMode(mode){
  active=Object.prototype.hasOwnProperty.call(modes,mode)?mode:'idea';
  const c=modes[active];
  document.querySelectorAll('[data-creative-mode]').forEach(el=>{
   const selected=el.getAttribute('data-creative-mode')===active;
   el.classList.toggle('selected',selected);
   if(el.classList.contains('studio-link'))el.classList.toggle('active',selected);
  });
  const set=(id,value)=>{const el=byId(id);if(el)el.textContent=value;};
  set('csBuilderTitle',c.title);set('csBuilderName',c.name);set('csBuilderIcon',c.icon);set('csBuilderDescription',c.desc);
  const brief=byId('csBrief');if(brief)brief.placeholder=c.placeholder;
 }
 function openStudio(){
  if(typeof window.showPage==='function')window.showPage('creativeStudio');
  else {document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));byId('creativeStudioPage')?.classList.add('active');}
 }
 function makePrompt(){
  const brief=(byId('csBrief')?.value||'').trim();
  if(!brief){alert('Lütfen yaratıcı brief alanına fikrini veya ihtiyacını yaz.');byId('csBrief')?.focus();return null;}
  const c=modes[active];
  return ['TOZRA CREATIVE STUDIO — '+c.title,'ÇALIŞMA ADI: '+((byId('csProjectName')?.value||'').trim()||'İsimsiz yaratıcı çalışma'),'HEDEF KİTLE: '+((byId('csAudience')?.value||'').trim()||'Belirtilmedi'),'YARATICI YAKLAŞIM: '+(byId('csTone')?.value||'Özgün yaklaşım'),'', 'KULLANICININ BRIEF\'İ:',brief,'','GÖREV:',c.task,'Önce brief\'i değerlendir. Eksik kritik bilgi varsa tek bir net soru sor; yeterli bilgi varsa doğrudan uygulanabilir ve profesyonel bir çıktı üret. Varsayımlarını açıkça belirt.'].join('\n');
 }
 function generate(){
  const prompt=makePrompt();if(!prompt)return;
  openStudio();
  if(typeof window.showPage==='function')window.showPage('chat');
  if(typeof window.startChatWithPrompt==='function')window.startChatWithPrompt(prompt);
  const input=byId('prompt');if(input)input.value=prompt;
  if(typeof window.sendGeneralMessage==='function')window.sendGeneralMessage(prompt);
  else {input?.focus();alert('Brief sohbet alanına aktarıldı. Göndermek için gönder düğmesine bas.');}
 }
 async function generateImage(){
  const brief=(byId('csBrief')?.value||'').trim();
  if(!brief){alert('Önce görsel için kısa bir açıklama yaz.');byId('csBrief')?.focus();return;}
  const button=byId('csGenerateImage');
  const panel=byId('csImageResult');
  const status=byId('csImageStatus');
  const image=byId('csGeneratedImage');
  const download=byId('csDownloadImage');
  if(!button||!panel||!status||!image||!download)return;
  button.disabled=true;button.textContent='Görsel oluşturuluyor…';
  panel.hidden=false;image.hidden=true;download.hidden=true;
  status.textContent='TOZRA görselini hazırlıyor. Bu işlem biraz sürebilir…';
  try{
   await TozraAuth.init();
   const headers=await TozraAuth.authHeaders();
   const c=modes[active]||modes.image;
   const prompt=[
    'Create a polished, original visual based on this creative brief.',
    'Project: '+((byId('csProjectName')?.value||'').trim()||'TOZRA Creative Studio'),
    'Audience: '+((byId('csAudience')?.value||'').trim()||'General audience'),
    'Art direction: '+(byId('csTone')?.value||'Modern and minimal'),
    'Brief: '+brief,
    'Create a coherent, high-quality composition. Avoid adding unnecessary text or watermarks. If text is essential, use only the language requested in the brief.'
   ].join('\n');
   const response=await fetch('/api/generate-image',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify({prompt})});
   const result=await response.json().catch(()=>({}));
   if(!response.ok||!result.success)throw new Error(result.error||'Görsel oluşturulamadı.');
   image.src=result.image;
   image.hidden=false;
   download.href=result.image;download.hidden=false;
   status.textContent='Görselin hazır.';
  }catch(error){
   console.error('TOZRA image generation:',error);
   status.textContent='Görsel oluşturulamadı: '+(error.message||'Bilinmeyen hata');
  }finally{
   button.disabled=false;button.textContent='✦ Görsel oluştur';
  }
 }
 function saveProject(){
  const brief=(byId('csBrief')?.value||'').trim();
  if(!brief){alert('Önce yaratıcı brief alanına çalışmanı yaz.');byId('csBrief')?.focus();return;}
  try{
   if(!Array.isArray(projects))throw new Error('Proje listesi hazır değil.');
   const c=modes[active],name=(byId('csProjectName')?.value||'').trim()||c.name;
   const project={id:typeof window.makeId==='function'?window.makeId():Date.now().toString(36),name,category:active==='image'||active==='design'?'Görsel stüdyo':active==='video'?'Video stüdyo':active==='writing'||active==='campaign'?'İçerik üretimi':'Fikir geliştirme',description:brief.slice(0,250),createdAt:Date.now(),updatedAt:Date.now(),messages:[],notes:'CREATIVE STUDIO BRIEF\n\n'+brief+'\n\nHedef kitle: '+((byId('csAudience')?.value||'').trim()||'Belirtilmedi')+'\nYaratıcı yaklaşım: '+(byId('csTone')?.value||'Belirtilmedi')};
   projects.unshift(project);
   if(typeof window.saveProjects==='function')window.saveProjects();
   else localStorage.setItem('tozra-projects',JSON.stringify(projects));
   if(typeof window.openProject==='function')window.openProject(project.id);
   alert('Creative Studio çalışman projelerine kaydedildi.');
  }catch(err){console.error('Creative Studio project save:',err);alert('Proje kaydedilemedi: '+err.message);}
 }
 document.addEventListener('click',function(event){
  const target=event.target instanceof Element?event.target:null;if(!target)return;
  const modeButton=target.closest('[data-creative-mode]');
  if(modeButton){event.preventDefault();event.stopImmediatePropagation();chooseMode(modeButton.getAttribute('data-creative-mode'));openStudio();byId('csBrief')?.focus({preventScroll:true});return;}
  const button=target.closest('#csGenerate,#csSaveProject,#csStartIdea,#csGenerateImage');if(!button)return;
  event.preventDefault();event.stopImmediatePropagation();
  if(button.id==='csGenerate')generate();
  else if(button.id==='csSaveProject')saveProject();
  else if(button.id==='csGenerateImage')generateImage();
  else {chooseMode('idea');openStudio();byId('csBrief')?.focus({preventScroll:true});}
 },true);
 document.addEventListener('DOMContentLoaded',()=>chooseMode('idea'));
 if(document.readyState!=='loading')chooseMode('idea');
})();
