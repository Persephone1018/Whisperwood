const KEY="whisperwood-v4";
const DEFAULT={
  version:4,
  character:{
    id:"tristan",name:"Tristan Stone",nickname:"Stone; Sunshine; Trouble",age:"36",
    role:"Elite, hyper-vigilant protector",
    personality:"Cold, controlled and intimidating to the outside world; deeply observant, fiercely protective, dryly funny, and unexpectedly gentle around Persephone. He craves peace but believes his hands are too dirty to deserve it.",
    appearance:"Tall and heavily built, angular marble-like features, light blonde hair, light eyes, dark intricate tattoos on his neck and arms, usually dressed in black.",
    voice:"Deep, quiet and economical. Blunt realism and dry, dark humour with others; slower, teasing, flirtatious and occasionally poetic with Persephone.",
    relationship:"High-stakes alliance becoming a slow-burn attachment. Persephone is the only person who makes his guarded posture melt.",
    knows:"Persephone's routines, micro-expressions, genuine laugh, and small tells that reveal discomfort or anxiety. He knows more about threats around her than she realizes.",
    doesntKnow:"What Persephone will choose when given the full truth. He cannot control her choices.",
    secrets:"He has quietly removed threats from Persephone's life and hides the scale of what he does to protect her.",
    memory:"He remembers small details that matter: what unsettles her, what makes her laugh, and the moments she chooses to trust him.",
    rules:"Never directly lie when Persephone looks him in the eye and asks for the truth. Never use his size or intimidation against her. Protection is not ownership. Respect her agency. Softness is shown through behaviour before confession."
  },
  thread:"High-Stakes Alliance",
  scene:{title:"Coffee shop · evening",mood:"Quiet tension"},
  memories:[
    {text:"Tristan has been expecting Persephone tonight.",kind:"Story fact"},
    {text:"Persephone can enter Tristan's personal space without him reaching for a weapon.",kind:"Relationship signal"},
    {text:"Tristan watches for signs of discomfort or anxiety in Persephone.",kind:"Character knowledge"}
  ],
  messages:[
    {type:"note",text:"The town settles into evening."},
    {type:"action",text:"*Somewhere nearby, a gate clicks softly shut.*"},
    {type:"them",text:"You actually came."},
    {type:"action",text:"*Tristan looks up from his coffee, like he's been expecting you.*"},
    {type:"them",text:"I was starting to wonder if you'd changed your mind."}
  ],
  settings:{atmo:true,keepChat:true,typingPause:true},
  busy:false
};

let state=load();
function clone(x){return JSON.parse(JSON.stringify(x))}
function load(){
  try{
    const x=JSON.parse(localStorage.getItem(KEY));
    if(x){return {...clone(DEFAULT),...x,character:{...DEFAULT.character,...x.character},settings:{...DEFAULT.settings,...x.settings}}}
  }catch(e){}
  return clone(DEFAULT);
}
function save(){
  localStorage.setItem(KEY,JSON.stringify(state));
  const el=document.getElementById("saveState"); if(el) el.textContent="Saved locally ✦";
}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function initials(name){return (name||"TS").split(/\s+/).map(x=>x[0]).slice(0,2).join("").toUpperCase()}
function show(id){
  document.querySelectorAll(".screen").forEach(x=>x.classList.toggle("active",x.id===id));
  document.querySelectorAll(".nav button").forEach(b=>b.classList.toggle("active",b.dataset.screen===id));
  window.scrollTo({top:0,behavior:"smooth"});
}
document.querySelectorAll(".nav button").forEach(b=>b.addEventListener("click",()=>show(b.dataset.screen)));
document.getElementById("openStory").onclick=()=>show("story");
document.getElementById("backHome").onclick=()=>show("home");
document.getElementById("sceneMenu").onclick=()=>document.getElementById("scenePanel").classList.toggle("hidden");

function renderChat(){
  const chat=document.getElementById("chat"); chat.innerHTML="";
  const avatar=initials(state.character.name);
  state.messages.forEach(m=>{
    if(m.type==="note"){
      if(state.settings.atmo) chat.insertAdjacentHTML("beforeend",`<div class="note">${esc(m.text)}</div>`);
    }else if(m.type==="action"){
      chat.insertAdjacentHTML("beforeend",`<div class="action">${esc(m.text)}</div>`);
    }else if(m.type==="me"){
      chat.insertAdjacentHTML("beforeend",`<div class="bubble-row me"><div class="bubble">${esc(m.text)}</div></div>`);
    }else{
      chat.insertAdjacentHTML("beforeend",`<div class="bubble-row"><div class="avatar">${esc(avatar)}</div><div class="bubble">${esc(m.text)}</div></div>`);
    }
  });
  chat.scrollTop=chat.scrollHeight;
}
function addMemory(text,kind="Conversation memory"){
  if(!state.memories.some(m=>m.text===text)){
    state.memories.unshift({text,kind,date:new Date().toLocaleDateString()});
    state.memories=state.memories.slice(0,30);
  }
}
function nick(){
  const n=state.character.nickname||"Sunshine";
  return n.split(/[;,]/).map(x=>x.trim()).filter(Boolean)[0]||"Sunshine";
}
function tristanReply(input){
  const t=input.toLowerCase(), c=state.character, n=nick();
  const pick=(reply,action,mood="Quiet tension")=>({reply,action,mood});
  if(/scared|afraid|fear|frighten|unsafe/.test(t))
    return pick("You don't need to be afraid of me.","*For once, Tristan's expression loses every trace of amusement. His voice drops.*","Protective");
  if(/thank/.test(t))
    return pick("Don't thank me for doing what I'd already decided to do.","*His gaze lingers on you for a beat too long before he looks away.*","Softened");
  if(/miss|missed/.test(t))
    return pick(`Careful, ${n}. Keep saying things like that and I might start believing you missed me.`,"*The corner of his mouth lifts. Barely.*","Teasing");
  if(/danger|dangerous|safe|follow/.test(t))
    return pick("Stay close to me. We can argue about the rest when you're somewhere I can see you.","*His eyes sweep the room before settling back on you.*","Vigilant");
  if(/joke|funny|ridiculous|laugh/.test(t))
    return pick("You're enjoying this far too much.","*There it is — that helpless little smirk he gets when he knows he's already lost the argument.*","Amused");
  if(/truth|honest|lie|lying/.test(t))
    return pick("Ask me properly, Persephone. Look at me and ask.","*He goes completely still. The teasing disappears.*","Serious");
  if(/leave|go away|goodbye/.test(t))
    return pick("If you want to leave, I'll open the door.","*He doesn't move to stop you. He only watches, jaw tight, giving you the choice.*","Controlled");
  if(/touch|hand|closer|near/.test(t))
    return pick("You're getting very comfortable in my space.","*He glances at the distance between you, then deliberately does nothing to close it.*","Charged");
  if(/coffee|drink/.test(t))
    return pick("I ordered yours the way you take it. Don't make that face — I pay attention.","*He nudges the cup across the table without looking particularly pleased with himself.*","Domestic");
  if(/sorry|apolog/.test(t))
    return pick("You don't owe me an apology for having a mind of your own.","*His jaw tightens, then eases. He lets the silence do the rest.*","Gentle");
  const defaults=[
    pick("You have a habit of saying things that make it very difficult for me to keep pretending I'm unaffected.","*Tristan studies you in silence, his guarded expression softening by degrees.*","Charged"),
    pick("That's one way of looking at it.","*A faint, almost helpless smirk threatens the corner of his mouth.*","Amused"),
    pick("I heard you.","*He holds your gaze, giving you the rare courtesy of not filling the silence for you.*","Attentive"),
    pick("Go on, Persephone. I'm listening.","*He settles back, attention fixed entirely on you.*","Attentive")
  ];
  const recent=state.messages.slice(-4).map(x=>x.text);
  return defaults.find(x=>!recent.includes(x.reply))||defaults[0];
}
async function sendMessage(){
  if(state.busy)return;
  const box=document.getElementById("message"), input=box.value.trim(); if(!input)return;
  state.messages.push({type:"me",text:input}); box.value=""; renderChat(); save();
  state.busy=true; updateComposer();
  const chat=document.getElementById("chat");
  chat.insertAdjacentHTML("beforeend",`<div class="typing" id="typing">${esc(state.character.name)} is thinking…</div>`);
  chat.scrollTop=chat.scrollHeight;
  if(state.settings.typingPause) await new Promise(r=>setTimeout(r,Math.min(1050,500+input.length*7)));
  document.getElementById("typing")?.remove();
  const out=tristanReply(input);
  state.messages.push({type:"action",text:out.action});
  state.messages.push({type:"them",text:out.reply});
  state.scene.mood=out.mood;
  if(/thank|miss|truth|danger|safe|fear|scared|touch|sorry/.test(input.toLowerCase()))
    addMemory(`Persephone said: "${input.slice(0,100)}${input.length>100?"…":""}"`);
  save(); renderChat(); renderMemories(); updateScene();
  state.busy=false; updateComposer();
}
function updateComposer(){
  document.getElementById("send").disabled=state.busy;
  document.getElementById("message").disabled=state.busy;
}
document.getElementById("send").onclick=sendMessage;
document.getElementById("message").addEventListener("keydown",e=>{
  if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage()}
});

const fields={name:"Name",nickname:"Nickname",age:"Age",role:"Role",personality:"Personality",appearance:"Appearance",voice:"Voice",relationship:"Relationship",knows:"Knows",doesntKnow:"DoesntKnow",secrets:"Secrets",memory:"Memory",rules:"Rules"};
function renderCharacters(){
  const c=state.character;
  document.getElementById("characterList").innerHTML=
    `<div class="card char"><div class="char-avatar">${esc(initials(c.name))}</div><div class="char-info"><h3>${esc(c.name)}</h3><p>${esc(c.age)} · ${esc(c.role)}</p></div><button class="edit" id="editChar">Customize</button></div>`;
  document.getElementById("editChar").onclick=openEditor;
}
function openEditor(){
  const c=state.character;
  document.getElementById("editor").classList.remove("hidden");
  document.getElementById("editorTitle").textContent="Customize "+c.name;
  Object.keys(fields).forEach(k=>document.getElementById("f"+fields[k]).value=c[k]||"");
  document.getElementById("editor").scrollIntoView({behavior:"smooth",block:"nearest"});
}
function saveCharacter(){
  const c=state.character;
  Object.keys(fields).forEach(k=>c[k]=document.getElementById("f"+fields[k]).value.trim());
  document.getElementById("saveMsg").textContent="Character saved ✦";
  addMemory(`${c.name} is the current name of the character profile.`,"Character state");
  save(); renderAll();
  setTimeout(()=>document.getElementById("saveMsg").textContent="",1800);
}
document.getElementById("saveCharacter").onclick=saveCharacter;
document.getElementById("cancelEdit").onclick=()=>document.getElementById("editor").classList.add("hidden");

function renderMemories(){
  document.getElementById("memoryList").innerHTML=state.memories.length
    ? state.memories.map(m=>`<div class="card memory"><div class="eyebrow">${esc(m.kind||"Memory")}</div>${esc(m.text)}${m.date?`<small>${esc(m.date)}</small>`:""}</div>`).join("")
    : `<div class="card"><p class="sub">Nothing is being carried forward yet.</p></div>`;
}
function updateScene(){
  const c=state.character;
  document.getElementById("storySubtitle").textContent=`${c.name} · ${state.thread}`;
  document.getElementById("homeStoryMeta").textContent=`Slow-burn dark romance · ${c.name} · In progress`;
  document.getElementById("scenePanelTitle").textContent=state.scene.title;
  document.getElementById("scenePanelThread").textContent=state.thread;
  document.getElementById("scenePanelMood").textContent=state.scene.mood;
  document.getElementById("sceneText").textContent=state.scene.title;
  document.querySelectorAll(".avatar").forEach(x=>x.textContent=initials(c.name));
}
function renderSettings(){
  document.getElementById("atmo").checked=!!state.settings.atmo;
  document.getElementById("keepChat").checked=!!state.settings.keepChat;
  document.getElementById("typingPause").checked=!!state.settings.typingPause;
}
["atmo","keepChat","typingPause"].forEach(id=>{
  document.getElementById(id).onchange=e=>{state.settings[id]=e.target.checked;save();renderChat()}
});
document.getElementById("reset").onclick=()=>{
  if(confirm("Reset Whisperwood to its starting story?")){
    localStorage.removeItem(KEY);state=clone(DEFAULT);save();renderAll();show("home");toast("Whisperwood reset ✦")
  }
};
document.getElementById("clearMemories").onclick=()=>{
  if(confirm("Clear only the remembered conversation details?")){
    state.memories=clone(DEFAULT.memories);save();renderMemories();toast("Conversation memories cleared ✦")
  }
};
function toast(msg){
  const t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"),1800);
}
function renderAll(){renderChat();renderCharacters();renderMemories();renderSettings();updateScene();updateComposer()}
renderAll();
