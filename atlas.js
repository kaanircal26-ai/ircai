/* TOZRA ATLAS — integrated discovery workspace */
(()=>{'use strict';
const $=id=>document.getElementById(id), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state={tab:'overview',countries:[],country:null,companyResults:[],techResults:[],saved:JSON.parse(localStorage.getItem('tozra-atlas-saved-v1')||'[]'),map:null,markers:null,globe:null,globeLoading:false,searchPoints:[]};
const root=$('atlasPage');if(!root)return;
const store=()=>{try{localStorage.setItem('tozra-atlas-saved-v1',JSON.stringify(state.saved))}catch(e){}};
const api=async(url)=>{const r=await fetch(url,{headers:{'Accept':'application/json'}});if(!r.ok)throw Error('Veri kaynağı yanıt vermedi ('+r.status+')');return r.json()};
function notice(id,msg){const el=$(id);if(el)el.textContent=msg}
function tab(name){state.tab=name;root.querySelectorAll('[data-atlas-tab]').forEach(b=>b.classList.toggle('is-active',b.dataset.atlasTab===name));root.querySelectorAll('.atlas-panel').forEach(p=>p.hidden=p.dataset.atlasPanel!==name);if(name==='map'){requestAnimationFrame(()=>initGlobe());loadOverview();}if(name==='countries')loadOverview();if(name==='overview')loadOverview();if(name==='countries'&&state.countries.length)renderCountries(state.countries)}


function initGlobe(){
 const host=$('atlasWorldGlobe');if(!host)return;
 if(state.globe){setTimeout(()=>{try{state.globe.resize()}catch(e){}},80);return}
 if(state.globeLoading)return;
 state.globeLoading=true;
 const start=()=>{
  if(!window.Cesium){state.globeLoading=false;notice('atlasMapStatus','3D uydu küresi yüklenemedi. Sayfayı yenileyip tekrar dene.');return}
  try{
   const C=window.Cesium;
   const imagery=new C.UrlTemplateImageryProvider({
    url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maximumLevel:19,
    credit:'Esri, Maxar, Earthstar Geographics ve katkıda bulunanlar'
   });
   state.globe=new C.Viewer(host,{
    imageryProvider:imagery,
    terrainProvider:new C.EllipsoidTerrainProvider(),
    animation:false,timeline:false,baseLayerPicker:false,geocoder:false,
    homeButton:false,sceneModePicker:false,navigationHelpButton:false,
    fullscreenButton:false,infoBox:false,selectionIndicator:false,
    scene3DOnly:true,shouldAnimate:true,
    requestRenderMode:false
   });
   const viewer=state.globe;
   viewer.scene.globe.enableLighting=true;
   viewer.scene.globe.showGroundAtmosphere=true;
   viewer.scene.skyAtmosphere.show=true;
   viewer.scene.backgroundColor=C.Color.fromCssColorString('#030912');
   viewer.scene.screenSpaceCameraController.enableTilt=true;
   viewer.scene.screenSpaceCameraController.enableRotate=true;
   viewer.scene.screenSpaceCameraController.enableZoom=true;
   viewer.camera.setView({destination:C.Cartesian3.fromDegrees(15,22,24500000)});
   viewer.entities.add({name:'TOZRA Atlas',position:C.Cartesian3.fromDegrees(15,22,0),point:{pixelSize:1,color:C.Color.TRANSPARENT}});
   setTimeout(()=>viewer.resize(),100);
   if(window.ResizeObserver)new ResizeObserver(()=>viewer.resize()).observe(host);
   $('atlasEarthHome')?.addEventListener('click',()=>viewer.camera.flyTo({destination:C.Cartesian3.fromDegrees(15,22,24500000),duration:1.5}));
   $('atlasEarthZoomIn')?.addEventListener('click',()=>viewer.camera.zoomIn(viewer.camera.positionCartographic.height*.45));
   $('atlasEarthZoomOut')?.addEventListener('click',()=>viewer.camera.zoomOut(viewer.camera.positionCartographic.height*.7));
   state.globeLoading=false;
   notice('atlasMapStatus','Uydu dünya görünümü hazır. Bir konum arayarak o noktaya yaklaşabilirsin.');
  }catch(e){state.globeLoading=false;notice('atlasMapStatus','3D uydu küresi başlatılamadı. Bağlantını kontrol edip tekrar dene.')}
 };
 if(window.Cesium){start();return}
 const urls=[
  'https://cesium.com/downloads/cesiumjs/releases/1.125/Build/Cesium/Cesium.js',
  'https://cdn.jsdelivr.net/npm/cesium@1.125/Build/Cesium/Cesium.js'
 ];
 const load=i=>{
  window.CESIUM_BASE_URL='https://cesium.com/downloads/cesiumjs/releases/1.125/Build/Cesium/';
  const script=document.createElement('script');script.src=urls[i];
  script.onload=()=>{if(window.Cesium)start();else if(i+1<urls.length)load(i+1);else{state.globeLoading=false;notice('atlasMapStatus','3D motor yüklenemedi. CDN bağlantısını kontrol et.')}};
  script.onerror=()=>{if(i+1<urls.length)load(i+1);else{state.globeLoading=false;notice('atlasMapStatus','3D motor yüklenemedi. CDN bağlantısını kontrol et.')}};
  document.head.append(script);
 };
 load(0);
}
function countryCard(c){return `<button class="atlas-country-card" data-country="${esc(c.cca3)}"><span class="atlas-flag">${esc(c.flag||'🌐')}</span><strong>${esc(c.name.common)}</strong><small>${esc(c.region||'')} · ${esc((c.capital||[])[0]||'Başkent bilgisi yok')}</small><em>${Number(c.population||0).toLocaleString('tr-TR')} nüfus</em></button>`}
function renderCountries(list){const target=state.tab==='countries'?'atlasCountryGridAll':'atlasCountryGrid';$(target).innerHTML=list.map(countryCard).join('')||'<div class="atlas-empty">Eşleşen ülke bulunamadı.</div>';root.querySelectorAll('[data-country]').forEach(b=>b.onclick=()=>showCountry(b.dataset.country))}
async function loadOverview(){if(state.countries.length)return;notice('atlasOverviewStatus','Ülke verileri yükleniyor…');try{state.countries=await api('https://restcountries.com/v3.1/all?fields=name,cca3,capital,region,population,flag,flags,area,languages,currencies,latlng');state.countries.sort((a,b)=>a.name.common.localeCompare(b.name.common,'tr'));if(state.globe){state.globe.pointsData(state.countries.filter(c=>Array.isArray(c.latlng)&&c.latlng.length===2).map(c=>({lat:c.latlng[0],lng:c.latlng[1],name:c.name.common,flag:c.flag,code:c.cca3})));}if(state.tab==='countries'||state.tab==='map')initGlobe();renderCountries(state.countries.slice(0,12));$('atlasCountryCount').textContent=state.countries.length+' ülke';notice('atlasOverviewStatus','REST Countries üzerinden güncel ülke profilleri alındı.');}catch(e){notice('atlasOverviewStatus','Ülke verileri şu an yüklenemedi. Bağlantını kontrol edip yeniden deneyebilirsin.')}}
async function showCountry(code){let c=state.countries.find(x=>x.cca3===code);if(!c)return;state.country=c;const detailId=state.tab==='countries'?'atlasCountryDetailAll':'atlasCountryDetail';$(detailId).hidden=false;$(detailId).innerHTML=`<div class="atlas-detail-head"><span>${esc(c.flag||'🌐')}</span><div><small>COUNTRY PROFILE</small><h3>${esc(c.name.common)}</h3><p>${esc(c.name.official||'')} · ${esc(c.region||'')}</p></div></div><div class="atlas-metrics"><article><small>NÜFUS</small><b>${Number(c.population||0).toLocaleString('tr-TR')}</b></article><article><small>YÜZÖLÇÜMÜ</small><b>${Number(c.area||0).toLocaleString('tr-TR')} km²</b></article><article><small>BAŞKENT</small><b>${esc((c.capital||['—']).join(', '))}</b></article></div><p><b>Diller:</b> ${esc(Object.values(c.languages||{}).join(', ')||'Bilgi yok')}</p><p><b>Para birimi:</b> ${esc(Object.values(c.currencies||{}).map(x=>x.name+' ('+x.symbol+')').join(', ')||'Bilgi yok')}</p><small class="atlas-source">Kaynak: REST Countries API · Ülke verileri değişebilir.</small>`;$(detailId).scrollIntoView({behavior:'smooth',block:'nearest'})}
async function companySearch(q){if(!q.trim())return;notice('atlasCompanyStatus','Wikidata kayıtları aranıyor…');$('atlasCompanyResults').innerHTML='';try{const sparql=`SELECT ?item ?itemLabel ?countryLabel ?industryLabel WHERE { ?item wdt:P31/wdt:P279* wd:Q4830453; rdfs:label ?label. FILTER(LANG(?label)="en" && CONTAINS(LCASE(?label), LCASE(${JSON.stringify(q)}))) OPTIONAL{?item wdt:P17 ?country.} OPTIONAL{?item wdt:P452 ?industry.} SERVICE wikibase:label { bd:serviceParam wikibase:language "en,tr". } } LIMIT 20`;const data=await api('https://www.wikidata.org/sparql?format=json&query='+encodeURIComponent(sparql));const rows=data.results.bindings;$('atlasCompanyResults').innerHTML=rows.map(x=>`<article class="atlas-result"><div><strong>${esc(x.itemLabel?.value||'Şirket')}</strong><small>${esc(x.countryLabel?.value||'Ülke bilgisi yok')} · ${esc(x.industryLabel?.value||'Sektör bilgisi yok')}</small></div><a href="${esc(x.item.value)}" target="_blank" rel="noopener">Wikidata ↗</a></article>`).join('')||'<div class="atlas-empty">Bu aramayla eşleşen kayıt bulunamadı. Daha genel bir şirket adı dene.</div>';notice('atlasCompanyStatus',rows.length+' kayıt bulundu · Kaynak: Wikidata.')}catch(e){notice('atlasCompanyStatus','Şirket verisi alınamadı. Wikidata bağlantısını daha sonra tekrar deneyebilirsin.')}}
async function techSearch(){notice('atlasTechStatus','Teknoloji haberleri aranıyor…');try{const url='https://api.gdeltproject.org/api/v2/doc/doc?query='+encodeURIComponent('(artificial intelligence OR robotics OR semiconductor OR climate technology)')+'&mode=ArtList&format=json&maxrecords=18&sort=HybridRel';const data=await api(url);const rows=data.articles||[];$('atlasTechResults').innerHTML=rows.map(a=>`<article class="atlas-result"><div><strong>${esc(a.title)}</strong><small>${esc(a.domain||'')} · ${esc(a.seendate||'')}</small></div><a href="${esc(a.url)}" target="_blank" rel="noopener">Haberi aç ↗</a></article>`).join('')||'<div class="atlas-empty">Şu anda sonuç bulunamadı.</div>';notice('atlasTechStatus',rows.length+' gelişme · Kaynak: GDELT haber verisi.');}catch(e){notice('atlasTechStatus','Teknoloji akışı yüklenemedi. Daha sonra tekrar dene.')}}

function initMap(){initGlobe()}

async function mapSearch(){
 const q=$('atlasMapSearch').value.trim();if(!q)return;
 notice('atlasMapStatus','Konum aranıyor…');
 try{
  const rows=await api('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q='+encodeURIComponent(q));
  if(!rows.length){notice('atlasMapStatus','Konum bulunamadı.');return}
  initGlobe();
  const fly=()=>{
   if(!state.globe){setTimeout(fly,150);return}
   const C=window.Cesium,viewer=state.globe;
   viewer.entities.removeAll();
   rows.forEach((x,i)=>{
    const lon=+x.lon,lat=+x.lat,label=x.name||x.display_name.split(',')[0];
    viewer.entities.add({
     name:label,description:esc(x.display_name),
     position:C.Cartesian3.fromDegrees(lon,lat,80),
     point:{pixelSize:12,color:C.Color.fromCssColorString('#b7dc79'),outlineColor:C.Color.WHITE,outlineWidth:2,heightReference:C.HeightReference.CLAMP_TO_GROUND},
     label:{text:label,font:'13px sans-serif',fillColor:C.Color.WHITE,outlineColor:C.Color.BLACK,outlineWidth:3,style:C.LabelStyle.FILL_AND_OUTLINE,pixelOffset:new C.Cartesian2(0,-22),disableDepthTestDistance:Number.POSITIVE_INFINITY}
    });
   });
   const x=rows[0],height=Math.max(90000,Math.min(9000000,Number(x.boundingbox?.[1]-x.boundingbox?.[0]||1)*150000));
   viewer.camera.flyTo({destination:C.Cartesian3.fromDegrees(+x.lon,+x.lat,height),duration:2.2});
   notice('atlasMapStatus',rows.length+' konum bulundu. Uydu görüntüsünde yakınlaştırılıyor · Kaynak: OpenStreetMap / Nominatim.');
  };
  fly();
 }catch(e){notice('atlasMapStatus','Konum araması başarısız oldu. Daha sonra tekrar dene.')}
}
function research(){const q=$('atlasResearchPrompt').value.trim();if(!q)return;const prompt=`TOZRA ATLAS ARAŞTIRMASI\n\nKonu: ${q}\n\nLütfen araştırmayı şu yapıda hazırla: kısa özet, doğrulanabilir bulgular, ülke/şirket/teknoloji bağlantıları, karşılaştırma gerekiyorsa tablo, belirsizlikler ve mutlaka kaynak bağlantıları. Güncel bilgiye erişemiyorsan bunu açıkça belirt; kaynak veya veri uydurma.`;if(typeof window.openGeneralChat==='function'){window.openGeneralChat();setTimeout(()=>{const input=$('prompt');if(input){input.value=prompt;input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();$('sendBtn')?.click()||$('sendButton')?.click()||$('send')?.click()}} ,350)}else{alert('Araştırma sohbeti açılamadı. Sohbet sayfasını açıp sorunu oraya aktarabilirsin.')}}
function renderSaved(){$('atlasSavedList').innerHTML=state.saved.length?state.saved.map((x,i)=>`<article class="atlas-result"><div><strong>${esc(x.title)}</strong><small>${esc(x.type)} · ${new Date(x.date).toLocaleDateString('tr-TR')}</small></div><button data-atlas-remove="${i}">Kaldır</button></article>`).join(''):'<div class="atlas-empty">Henüz kaydedilmiş keşfin yok.</div>';root.querySelectorAll('[data-atlas-remove]').forEach(b=>b.onclick=()=>{state.saved.splice(+b.dataset.atlasRemove,1);store();renderSaved()})}
root.querySelectorAll('[data-atlas-tab]').forEach(b=>b.addEventListener('click',()=>tab(b.dataset.atlasTab)));
$('atlasCountrySearch').addEventListener('input',e=>{state.tab='countries';const q=e.target.value.toLocaleLowerCase('tr');renderCountries(state.countries.filter(c=>c.name.common.toLocaleLowerCase('tr').includes(q)||c.region?.toLocaleLowerCase('tr').includes(q)).slice(0,60))});
$('atlasCompanyForm').addEventListener('submit',e=>{e.preventDefault();companySearch($('atlasCompanySearch').value)});
$('atlasTechRefresh').addEventListener('click',techSearch);$('atlasMapForm').addEventListener('submit',e=>{e.preventDefault();mapSearch()});$('atlasResearchRun').addEventListener('click',research);$('atlasSaveSearch').addEventListener('click',()=>{const q=$('atlasResearchPrompt').value.trim();if(!q)return;state.saved.unshift({title:q,type:'Araştırma konusu',date:new Date().toISOString()});store();renderSaved();notice('atlasResearchStatus','Araştırma konusu koleksiyonuna kaydedildi.')});
$('atlasExploreAll').addEventListener('click',()=>{tab('countries');renderCountries(state.countries)});
window.TozraAtlas={render:()=>{tab('overview');loadOverview()},open:tab};renderSaved();loadOverview();techSearch();
})();
