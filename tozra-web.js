(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const KEY = 'tozra.web.builder.v1';
  const starter = `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Yeni Web Projesi</title><style>
*{box-sizing:border-box}body{margin:0;font-family:Inter,Arial,sans-serif;background:#f5f6f2;color:#20251d}header{padding:22px 7%;display:flex;justify-content:space-between;align-items:center;background:#fff}header strong{letter-spacing:.12em}nav{display:flex;gap:18px;font-size:13px}main{max-width:1050px;margin:70px auto;padding:0 24px}.hero{padding:58px;border-radius:24px;background:#20291b;color:#f4f7ef}.hero small{color:#b5d18a;letter-spacing:.16em}.hero h1{font-size:clamp(36px,6vw,66px);line-height:1.02;max-width:700px;margin:18px 0}.hero p{color:#d0d8c9;line-height:1.7;max-width:540px}.btn{display:inline-block;background:#b5d18a;color:#172015;padding:13px 18px;border-radius:9px;text-decoration:none;font-weight:700;margin-top:12px}.features{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:20px}.feature{padding:22px;background:white;border:1px solid #e3e7de;border-radius:14px}@media(max-width:650px){header{padding:18px}nav{display:none}main{margin:30px auto}.hero{padding:30px 24px}.features{grid-template-columns:1fr}}
</style></head><body><header><strong>YOUR BRAND</strong><nav><span>Ana sayfa</span><span>Hakkımızda</span><span>İletişim</span></nav></header><main><section class="hero"><small>YENİ BİR BAŞLANGIÇ</small><h1>Fikrini güçlü bir dijital deneyime dönüştür.</h1><p>Bu alanı kendi markana, ürününe ve hedef kitlene göre düzenleyebilirsin. TOZRA Web ile ilk taslağını oluşturmaya başla.</p><a class="btn" href="#features">Keşfet</a></section><section class="features" id="features"><article class="feature"><h3>Özgün tasarım</h3><p>Markanı yansıtan sade ve güçlü bir görünüm.</p></article><article class="feature"><h3>Her ekranda uyum</h3><p>Mobil ve masaüstünde dengeli deneyim.</p></article><article class="feature"><h3>Kolay yönetim</h3><p>İçeriğini ihtiyaçlarına göre güncelle.</p></article></section></main></body></html>`;
  function init(){
    const code=$('twCode'),frame=$('twFrame'),status=$('twStatus'),brief=$('twBrief');
    if(!code||!frame)return;
    let saved=null;try{saved=JSON.parse(localStorage.getItem(KEY)||'null')}catch{}
    code.value=saved?.code||starter;brief.value=saved?.brief||'';
    const preview=()=>{
      const html=String(code.value||'');
      // Re-assign only after the editor value is committed; srcdoc is the isolated preview document.
      frame.removeAttribute('src');
      frame.srcdoc=html || '<!doctype html><html lang="tr"><body style="font:16px Arial;padding:24px">Önizleme için HTML kodu ekle.</body></html>';
      frame.dataset.previewUpdatedAt=String(Date.now());
    };
    window.TozraWebPreview={refresh:()=>requestAnimationFrame(preview)};
    preview();
    $('twRefresh')?.addEventListener('click',preview);
    code.addEventListener('input',()=>{ $('twSaveState').textContent='Kaydedilmemiş değişiklik'; });
    $('twSave')?.addEventListener('click',()=>{try{localStorage.setItem(KEY,JSON.stringify({code:code.value,brief:brief.value,updatedAt:new Date().toISOString()}));$('twSaveState').textContent='Kaydedildi';status.textContent='Taslağın bu cihazda kaydedildi.';}catch(e){status.textContent='Kaydedilemedi: tarayıcı depolama alanı kullanılamıyor.';}});
    $('twReset')?.addEventListener('click',()=>{if(!confirm('Mevcut taslağı başlangıç şablonuyla değiştirmek istiyor musun?'))return;code.value=starter;preview();$('twSaveState').textContent='Sıfırlandı · Kaydedilmedi';});
    $('twDownload')?.addEventListener('click',()=>{const blob=new Blob([code.value],{type:'text/html;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='tozra-web-site.html';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
    $('twGenerate')?.addEventListener('click',async()=>{
      const request=brief.value.trim();if(!request){status.textContent='Önce oluşturmak istediğin web sitesini tarif et.';brief.focus();return;}
      const button=$('twGenerate');button.disabled=true;button.textContent='Oluşturuluyor…';status.textContent='TOZRA AI taslağı hazırlıyor. Bu işlem biraz sürebilir.';
      try{
        if(!window.TozraAuth?.authHeaders)throw new Error('Oturum doğrulama servisi hazır değil. Sayfayı yenileyip tekrar dene.');
        const headers=await window.TozraAuth.authHeaders();
        const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify({prompt:`Bir uzman web tasarımcısı ve frontend geliştiricisi olarak aşağıdaki brief için TAM, tek dosyalık, üretime yakın bir HTML web sitesi oluştur. Sadece eksiksiz HTML kodunu döndür; Markdown kod çiti, açıklama veya özet ekleme. CSS ve gerekli JavaScript HTML içinde olsun. Responsive tasarım, erişilebilir etiketler, modern tipografi, gerçekçi içerik ve tutarlı tasarım sistemi kullan. Dış servis/API anahtarı gerektirme. Brief: ${request}`,history:[],projectContext:'TOZRA Web Builder: tek dosyalık HTML üretimi. Kullanıcı kodu düzenleyip iframe içinde önizleyecek.',agentMode:false})});
        const data=await response.json();if(!response.ok||!data.success)throw new Error(data.error||'AI taslağı oluşturamadı.');
        let html=String(data.answer||'').trim();const match=html.match(/```(?:html)?\s*([\s\S]*?)```/i);if(match)html=match[1].trim();
        if(!/<html[\s>]/i.test(html)&&!/^<!doctype/i.test(html))throw new Error('AI yanıtı geçerli bir HTML belgesi içermiyor. Yeniden deneyebilirsin.');
        code.value=html;preview();$('twSaveState').textContent='Yeni taslak · Kaydedilmedi';status.textContent='Taslak oluşturuldu. Kodu düzenleyebilir, önizlemeyi yenileyebilir ve HTML olarak indirebilirsin.';
      }catch(error){status.textContent=error.message||'Beklenmeyen bir hata oluştu.';}
      finally{button.disabled=false;button.textContent='✦ TOZRA AI ile taslak oluştur';}
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
