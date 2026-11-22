
/* TOZRA SMART MEMORY UI */
(function(){
 const $=id=>document.getElementById(id);
 const form=$("phMemoryForm"), input=$("phMemoryInput"), category=$("phMemoryCategory"), list=$("phMemoryList");
 if(!form||!input||!list)return;
 function render(){
  const api=window.TozraMemory, items=api&&api.getAll?api.getAll():[];
  list.replaceChildren();
  if(!items.length){const empty=document.createElement("div");empty.className="ph-empty";empty.textContent="Henüz kaydedilmiş bilgi yok.";list.appendChild(empty);return;}
  items.slice().reverse().forEach(item=>{
   const row=document.createElement("div");row.className="ph-memory-item";
   const body=document.createElement("div");body.className="ph-memory-body";
   const tag=document.createElement("span");tag.className="ph-memory-tag";tag.textContent=item.category||"Genel";
   const content=document.createElement("p");content.textContent=item.content;body.append(tag,content);
   const remove=document.createElement("button");remove.type="button";remove.className="ph-memory-remove";remove.textContent="Sil";
   remove.addEventListener("click",()=>{if(api.remove(item.id))render();});
   row.append(body,remove);list.appendChild(row);
  });
 }
 form.addEventListener("submit",event=>{
  event.preventDefault();const value=input.value.trim();if(!value)return;
  try{if(!window.TozraMemory)throw new Error("Hafıza sistemi yüklenemedi.");window.TozraMemory.add(value,category.value);input.value="";render();}
  catch(error){alert(error.message||"Hafızaya kaydedilemedi.");}
 });
 render();
})();
