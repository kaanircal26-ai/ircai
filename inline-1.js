
(function(){
 const syncRail=()=>{
  [["statProjects","railProjectCount"],["statChats","railChatCount"]].forEach(([source,target])=>{
   const a=document.getElementById(source),b=document.getElementById(target);
   if(a&&b)b.textContent=a.textContent||"0";
  });
 };
 syncRail();
 const observer=new MutationObserver(syncRail);
 ["statProjects","statChats"].forEach(id=>{const el=document.getElementById(id);if(el)observer.observe(el,{childList:true,subtree:true,characterData:true});});
})();
