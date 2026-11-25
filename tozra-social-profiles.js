/* TOZRA CREATOR PROFILES — profile, discovery and follow graph */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[ch]));
  const auth = () => window.TozraAuth;
  const client = () => auth()?.getClient?.();
  const currentUser = () => auth()?.getSession?.()?.user || null;
  let panelRoot = null;
  let loading = false;

  const styles = `
  <style id="tozra-creator-profile-styles">
    .tcp-wrap{margin:18px 0 4px;padding:18px;border:1px solid var(--border,#e6e8e3);border-radius:18px;background:var(--card-bg,rgba(255,255,255,.72));color:var(--text,#20251f)}
    .tcp-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px}
    .tcp-eyebrow{font-size:9px;font-weight:900;letter-spacing:1.7px;color:var(--muted,#7b8278)}
    .tcp-title{font-size:17px;font-weight:850;margin:4px 0 0}
    .tcp-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:12px 0 16px}
    .tcp-stat{padding:12px 7px;text-align:center;border:1px solid var(--border,#e6e8e3);border-radius:13px;background:var(--surface,#fff)}
    .tcp-stat b{display:block;font-size:19px;font-weight:900}
    .tcp-stat span{display:block;font-size:9px;color:var(--muted,#7b8278);margin-top:3px}
    .tcp-field{display:block;margin:10px 0}
    .tcp-field span{display:block;font-size:10px;font-weight:800;margin-bottom:6px;color:var(--muted,#737a70)}
    .tcp-field input,.tcp-field textarea,.tcp-search{width:100%;box-sizing:border-box;border:1px solid var(--border,#dfe3dc);border-radius:11px;background:var(--input-bg,#fff);color:var(--text,#20251f);padding:11px 12px;font:inherit;font-size:12px;outline:none}
    .tcp-field textarea{min-height:76px;resize:vertical}
    .tcp-row{display:flex;align-items:center;gap:9px;flex-wrap:wrap}
    .tcp-btn{border:1px solid var(--border,#dfe3dc);border-radius:10px;padding:10px 13px;background:var(--surface,#fff);color:var(--text,#20251f);font-size:11px;font-weight:800;cursor:pointer}
    .tcp-btn.primary{background:var(--accent,#d7e5ce);border-color:var(--accent,#d7e5ce);color:#1d281e}
    .tcp-btn:disabled{opacity:.5;cursor:wait}
    .tcp-switch{display:flex;align-items:center;gap:8px;font-size:11px;color:var(--muted,#737a70);margin:12px 0}
    .tcp-person{display:flex;align-items:center;gap:10px;padding:11px 0;border-top:1px solid var(--border,#e6e8e3)}
    .tcp-avatar{width:38px;height:38px;flex:0 0 38px;border-radius:14px;display:grid;place-items:center;background:var(--surface,#eef1eb);font-weight:900;font-size:15px;overflow:hidden}
    .tcp-avatar img{width:100%;height:100%;object-fit:cover}
    .tcp-person-main{min-width:0;flex:1}
    .tcp-person-name{font-size:11px;font-weight:850;overflow-wrap:anywhere}
    .tcp-person-handle{font-size:10px;color:var(--muted,#7b8278);margin-top:3px}
    .tcp-person-bio{font-size:10px;color:var(--muted,#7b8278);margin-top:4px;line-height:1.4}
    .tcp-note{font-size:10px;color:var(--muted,#7b8278);line-height:1.5;margin:9px 0}
    .tcp-error{font-size:10px;color:#b42318;margin:8px 0}
    .tcp-success{font-size:10px;color:#287443;margin:8px 0}
    .tcp-tabs{display:flex;gap:6px;margin:14px 0 10px}
    .tcp-tabs button{flex:1}
    @media(prefers-color-scheme:dark){.tcp-wrap{--card-bg:#191b18;--surface:#20231f;--input-bg:#151714;--border:#343a32;--text:#f0f1eb;--muted:#a4aa9e}}
  </style>`;
  function injectStyles(){
    if(!$('tozra-creator-profile-styles')) document.head.insertAdjacentHTML('beforeend',styles);
  }
  function setMessage(node, message, type='note'){
    if(node) node.innerHTML = `<div class="tcp-${type}">${esc(message)}</div>`;
  }
  function personCard(profile, actionHtml=''){
    const initial = (profile.display_name || profile.username || '?').trim().slice(0,1).toUpperCase();
    const avatar = profile.avatar_url
      ? `<img src="${esc(profile.avatar_url)}" alt="">`
      : esc(initial);
    return `<div class="tcp-person"><div class="tcp-avatar">${avatar}</div><div class="tcp-person-main"><div class="tcp-person-name">${esc(profile.display_name || profile.username)}</div><div class="tcp-person-handle">@${esc(profile.username)}</div>${profile.bio?`<div class="tcp-person-bio">${esc(profile.bio)}</div>`:''}</div>${actionHtml}</div>`;
  }
  async function getMyProfile(){
    const user=currentUser();
    if(!user) throw new Error('Profilini oluşturmak için giriş yapmalısın.');
    const {data,error}=await client().from('profiles').select('id,username,display_name,bio,is_private,avatar_url').eq('id',user.id).maybeSingle();
    if(error) throw error;
    return data;
  }
  async function countRows(column,id,status='accepted'){
    const {count,error}=await client().from('follows').select('id',{count:'exact',head:true}).eq(column,id).eq('status',status);
    if(error) throw error;
    return count||0;
  }
  async function loadMyStats(userId){
    const [followers,following,pending]=await Promise.all([
      countRows('followed_id',userId,'accepted'),
      countRows('follower_id',userId,'accepted'),
      countRows('followed_id',userId,'pending')
    ]);
    return {followers,following,pending};
  }
  async function loadPeople(){
    const user=currentUser();
    const {data:profiles,error}=await client().from('profiles')
      .select('id,username,display_name,bio,is_private,avatar_url')
      .neq('id',user.id).eq('is_private',false).order('created_at',{ascending:false}).limit(24);
    if(error) throw error;
    const ids=(profiles||[]).map(p=>p.id);
    let relations=[];
    if(ids.length){
      const result=await client().from('follows').select('followed_id,status').eq('follower_id',user.id).in('followed_id',ids);
      if(result.error) throw result.error;
      relations=result.data||[];
    }
    const map=new Map(relations.map(r=>[r.followed_id,r.status]));
    return (profiles||[]).map(p=>({...p,relation:map.get(p.id)||'none'}));
  }
  async function loadConnections(kind){
    const user=currentUser();
    const column=kind==='followers'?'followed_id':'follower_id';
    const other=kind==='followers'?'follower_id':'followed_id';
    const {data,error}=await client().from('follows').select('follower_id,followed_id,status').eq(column,user.id).eq('status','accepted').order('created_at',{ascending:false}).limit(100);
    if(error) throw error;
    const ids=(data||[]).map(row=>row[other]);
    if(!ids.length) return [];
    const result=await client().from('profiles').select('id,username,display_name,bio,avatar_url').in('id',ids);
    if(result.error) throw result.error;
    const map=new Map((result.data||[]).map(p=>[p.id,p]));
    return ids.map(id=>map.get(id)).filter(Boolean);
  }
  async function renderConnections(kind){
    const list=$('tcp-people-list');
    if(!list) return;
    list.innerHTML='<p class="tcp-note">Yükleniyor…</p>';
    try{
      if(kind==='requests'){
        const user=currentUser();
        const {data:rows,error}=await client().from('follows').select('follower_id,followed_id,status').eq('followed_id',user.id).eq('status','pending').order('created_at',{ascending:false}).limit(100);
        if(error) throw error;
        const ids=(rows||[]).map(row=>row.follower_id);
        let profiles=[];
        if(ids.length){
          const result=await client().from('profiles').select('id,username,display_name,bio,avatar_url').in('id',ids);
          if(result.error) throw result.error;
          profiles=result.data||[];
        }
        const map=new Map(profiles.map(p=>[p.id,p]));
        const requests=(rows||[]).map(row=>map.get(row.follower_id)||({id:row.follower_id,username:'tozra_user',display_name:'TOZRA kullanıcısı'}));
        list.innerHTML=requests.length?requests.map(p=>personCard(p,`<div class="tcp-row"><button class="tcp-btn primary" data-accept="${esc(p.id)}">Onayla</button><button class="tcp-btn" data-reject="${esc(p.id)}">Reddet</button></div>`)).join():'<p class="tcp-note">Bekleyen takip isteğin yok.</p>';
      }else{
        const people=await loadConnections(kind);
        list.innerHTML=people.length?people.map(p=>personCard(p,`<button class="tcp-btn" data-unfollow="${esc(p.id)}">Takibi bırak</button>`)).join():'<p class="tcp-note">Henüz burada gösterilecek kullanıcı yok.</p>';
      }
    }catch(e){list.innerHTML=`<div class="tcp-error">${esc(e.message||'Liste yüklenemedi.')}</div>`;}
  }
  async function handleFollowRequest(followerId, accept){
    const user=currentUser();
    const query=client().from('follows').update({status:'accepted'}).eq('follower_id',followerId).eq('followed_id',user.id).eq('status','pending');
    if(accept){
      const {error}=await query;
      if(error) throw error;
    }else{
      const {error}=await client().from('follows').delete().eq('follower_id',followerId).eq('followed_id',user.id).eq('status','pending');
      if(error) throw error;
    }
  }
  async function removeFollow(targetId){
    const user=currentUser();
    const {error}=await client().from('follows').delete().eq('follower_id',user.id).eq('followed_id',targetId);
    if(error) throw error;
  }
  async function renderDiscovery(){
    const list=$('tcp-people-list');
    if(!list) return;
    list.innerHTML='<p class="tcp-note">Üreticiler aranıyor…</p>';
    try{
      const people=await loadPeople();
      list.innerHTML=people.length?people.map(p=>{
        const status=p.relation;
        const label=status==='accepted'?'Takibi bırak':status==='pending'?'İsteği iptal et':'Takip et';
        const action=status==='accepted'||status==='pending'
          ? `<button class="tcp-btn" data-unfollow="${esc(p.id)}">${label}</button>`
          : `<button class="tcp-btn primary" data-follow="${esc(p.id)}">Takip et</button>`;
        return personCard(p,action);
      }).join(''):'<p class="tcp-note">Henüz keşfedilecek açık profil yok. Profilini herkese açık yapan üreticiler burada görünür.</p>';
    }catch(e){list.innerHTML=`<div class="tcp-error">${esc(e.message||'Üreticiler yüklenemedi.')}</div>`;}
  }
  async function followUser(targetId){
    const user=currentUser();
    if(!user) throw new Error('Takip etmek için giriş yapmalısın.');
    const {data:target,error:targetError}=await client().from('profiles').select('id,is_private').eq('id',targetId).single();
    if(targetError) throw targetError;
    const status=target.is_private?'pending':'accepted';
    const {error}=await client().from('follows').insert({follower_id:user.id,followed_id:targetId,status});
    if(error) throw error;
  }
  async function renderPanel(){
    if(loading) return;
    const user=currentUser();
    if(!user) return;
    const modal=$('modalContent');
    if(!modal) return;
    loading=true;
    try{
      injectStyles();
      const existing=$('tozraCreatorProfilePanel');
      if(existing) existing.remove();
      const panel=document.createElement('section');
      panel.id='tozraCreatorProfilePanel';
      panel.className='tcp-wrap';
      panel.innerHTML=`
        <div class="tcp-head"><div><div class="tcp-eyebrow">TOZRA CREATOR NETWORK</div><div class="tcp-title">Üretici profilin</div></div><span style="font-size:20px">✦</span></div>
        <div id="tcp-status" aria-live="polite"></div>
        <div class="tcp-stats"><div class="tcp-stat"><b id="tcp-followers">—</b><span>Takipçi</span></div><div class="tcp-stat"><b id="tcp-following">—</b><span>Takip</span></div><div class="tcp-stat"><b id="tcp-pending">—</b><span>İstek</span></div></div>
        <form id="tcp-profile-form">
          <label class="tcp-field"><span>Kullanıcı adı · 3–24 karakter</span><input id="tcp-username" maxlength="24" pattern="[a-zA-Z0-9_.]{3,24}" placeholder="kaan.irc" required></label>
          <label class="tcp-field"><span>Görünen ad</span><input id="tcp-display-name" maxlength="48" placeholder="Adın" required></label>
          <label class="tcp-field"><span>Biyografi · en fazla 160 karakter</span><textarea id="tcp-bio" maxlength="160" placeholder="Kendini ve ürettiklerini tanıt…"></textarea></label>
          <label class="tcp-switch"><input id="tcp-private" type="checkbox"> Gizli profil (takip istekleri onay gerektirir)</label>
          <div class="tcp-row"><button class="tcp-btn primary" type="submit" id="tcp-save">Profili kaydet</button><span class="tcp-note">E-posta adresin herkese gösterilmez.</span></div>
        </form>
        <div class="tcp-tabs">
          <button class="tcp-btn primary" type="button" data-tcp-tab="discover">Keşfet</button>
          <button class="tcp-btn" type="button" data-tcp-tab="followers">Takipçiler</button>
          <button class="tcp-btn" type="button" data-tcp-tab="following">Takip</button>
          <button class="tcp-btn" type="button" data-tcp-tab="requests">İstekler</button>
        </div>
        <div id="tcp-people-list"><p class="tcp-note">Yükleniyor…</p></div>`;
      modal.appendChild(panel);
      panelRoot=panel;
      const profile=await getMyProfile();
      if(profile){
        $('tcp-username').value=profile.username||'';
        $('tcp-display-name').value=profile.display_name||user.user_metadata?.full_name||'';
        $('tcp-bio').value=profile.bio||'';
        $('tcp-private').checked=!!profile.is_private;
      }else{
        const suggested=(user.user_metadata?.full_name||user.email?.split('@')[0]||'tozra_user')
          .toLowerCase().replace(/[^a-z0-9_.]/g,'').slice(0,24);
        $('tcp-username').value=suggested.length>=3?suggested:`user_${user.id.slice(0,8)}`;
        $('tcp-display-name').value=user.user_metadata?.full_name||'TOZRA kullanıcısı';
        $('tcp-private').checked=true;
      }
      const stats=await loadMyStats(user.id);
      $('tcp-followers').textContent=stats.followers;
      $('tcp-following').textContent=stats.following;
      $('tcp-pending').textContent=stats.pending;
      $('tcp-profile-form').addEventListener('submit',async e=>{
        e.preventDefault();
        const button=$('tcp-save'), status=$('tcp-status');
        const payload={
          id:user.id,
          username:$('tcp-username').value.trim().toLowerCase(),
          display_name:$('tcp-display-name').value.trim(),
          bio:$('tcp-bio').value.trim(),
          is_private:$('tcp-private').checked,
          updated_at:new Date().toISOString()
        };
        if(!/^[a-z0-9_.]{3,24}$/.test(payload.username)){setMessage(status,'Kullanıcı adı 3–24 karakter olmalı; yalnızca harf, rakam, nokta ve alt çizgi kullan.','error');return;}
        if(!payload.display_name){setMessage(status,'Görünen ad boş bırakılamaz.','error');return;}
        button.disabled=true;button.textContent='Kaydediliyor…';
        try{
          const {error}=await client().from('profiles').upsert(payload,{onConflict:'id'});
          if(error) throw error;
          setMessage(status,'Profilin kaydedildi.','success');
          await renderDiscovery();
        }catch(err){setMessage(status,err.message||'Profil kaydedilemedi.','error');}
        finally{button.disabled=false;button.textContent='Profili kaydet';}
      });
      panel.querySelectorAll('[data-tcp-tab]').forEach(button=>button.addEventListener('click',()=>{
        panel.querySelectorAll('[data-tcp-tab]').forEach(b=>{b.classList.toggle('primary',b===button);});
        if(button.dataset.tcpTab==='discover') renderDiscovery();
        else renderConnections(button.dataset.tcpTab);
      }));
      $('tcp-people-list').addEventListener('click',async e=>{
        const button=e.target.closest('[data-follow],[data-unfollow],[data-accept],[data-reject]');
        if(!button) return;
        button.disabled=true;
        const previous=button.textContent;
        button.textContent='İşleniyor…';
        try{
          if(button.dataset.follow) await followUser(button.dataset.follow);
          else if(button.dataset.unfollow) await removeFollow(button.dataset.unfollow);
          else if(button.dataset.accept) await handleFollowRequest(button.dataset.accept,true);
          else if(button.dataset.reject) await handleFollowRequest(button.dataset.reject,false);
          setMessage($('tcp-status'),'Takip işlemi güncellendi.','success');
          const active=panel.querySelector('[data-tcp-tab].primary')?.dataset.tcpTab||'discover';
          if(active==='discover') await renderDiscovery(); else await renderConnections(active);
          const updated=await loadMyStats(user.id);
          $('tcp-followers').textContent=updated.followers;
          $('tcp-following').textContent=updated.following;
          $('tcp-pending').textContent=updated.pending;
        }catch(err){setMessage($('tcp-status'),err.message||'Takip işlemi başarısız.','error');button.disabled=false;button.textContent=previous;}
      });
      await renderDiscovery();
    }catch(error){
      if(panelRoot) panelRoot.innerHTML=`<div class="tcp-eyebrow">TOZRA CREATOR NETWORK</div><div class="tcp-error">${esc(error.message||'Profil alanı yüklenemedi.')}</div><p class="tcp-note">Supabase profil tablolarının kurulu olduğundan emin ol.</p>`;
    }finally{loading=false;}
  }
  function schedulePanel(){
    window.setTimeout(()=>{
      if($('modalTitle')?.textContent?.trim()==='Profil' || $('modalTitle')?.textContent?.trim()==='Hesap'){
        renderPanel();
      }
    },120);
  }
  // The main app handles #profileButton in a capture listener and stops propagation.
  // Listen in capture phase too, so the creator panel is injected after the profile modal opens.
  document.addEventListener('click',event=>{
    if(event.target.closest('#profileButton')) schedulePanel();
  }, true);
  document.addEventListener('tozra:profile-open',schedulePanel);
  window.TozraCreatorProfiles={render:renderPanel};
})();
