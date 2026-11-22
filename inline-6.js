
(()=>{
 const splash=document.getElementById('splash');
 const value=document.getElementById('splashProgressValue');
 if(!splash||!value)return;
 const started=performance.now(),duration=13500;
 const tick=now=>{
  if(!document.getElementById('splash'))return;
  const pct=Math.min(100,Math.round(((now-started)/duration)*100));
  value.textContent='%'+pct;
  if(pct<100)requestAnimationFrame(tick);
 };
 requestAnimationFrame(tick);
})();
