/* Meu estudo: moedas e loja (dados locais, sem dinheiro real) */
(function () {
  "use strict";
  var KEY="meuestudo.recompensas.v1";
  var items=[
    {id:"lilas",kind:"tema",name:"Verde-limão (padrão)",icon:"🌿",cost:0,description:"Identidade visual dos meus sites",colors:["#0c0f11","#c0f16e"]},
    {id:"oceano",kind:"tema",name:"Oceano tranquilo",icon:"🌊",cost:80,description:"Azul e céu",colors:["#1771cc","#8bcafa"]},
    {id:"menta",kind:"tema",name:"Jardim de menta",icon:"🌿",cost:100,description:"Verde suave",colors:["#158674","#b3e7d3"]},
    {id:"amanhecer",kind:"tema",name:"Amanhecer",icon:"🌅",cost:120,description:"Pêssego e laranja",colors:["#de6d51","#ffc5a0"]},
    {id:"noite",kind:"tema",name:"Noite estrelada",icon:"🌙",cost:160,description:"Fundo escuro",colors:["#6755d4","#211e3c"]},
    {id:"livro",kind:"emblema",name:"Amante dos livros",icon:"📚",cost:0,description:"Emblema inicial"},
    {id:"raio",kind:"emblema",name:"Mente elétrica",icon:"⚡",cost:45,description:"Ritmo e energia"},
    {id:"alvo",kind:"emblema",name:"Foco total",icon:"🎯",cost:85,description:"Mantenha o foco"},
    {id:"foguete",kind:"emblema",name:"Em evolução",icon:"🚀",cost:130,description:"Subindo de nível"},
    {id:"estrela",kind:"emblema",name:"Estrela do estudo",icon:"✨",cost:160,description:"Sua conquista"},
    {id:"simples",kind:"moldura",name:"Sem moldura",icon:"◯",cost:0,description:"Minimalista"},
    {id:"aura",kind:"moldura",name:"Aura violeta",icon:"◉",cost:65,description:"Perfil destacado"},
    {id:"brilho",kind:"moldura",name:"Brilho dourado",icon:"✷",cost:110,description:"Toque especial"},
    {id:"galaxia",kind:"moldura",name:"Galáxia",icon:"✦",cost:155,description:"Brilho espacial"}
  ];
  var defaults={coins:0,total:0,earned:{},owned:["lilas","livro","simples"],equipped:{tema:"lilas",emblema:"livro",moldura:"simples"},today:{date:"",hits:0}};
  var state;
  try {state=JSON.parse(localStorage.getItem(KEY))||{};}catch(e){state={};}
  if(typeof state!=="object"||Array.isArray(state))state={};
  state={
    coins:Math.max(0,Math.trunc(Number(state.coins)||0)),
    total:Math.max(0,Math.trunc(Number(state.total)||0)),
    earned:(state.earned&&typeof state.earned==="object")?state.earned:{},
    owned:Array.from(new Set(defaults.owned.concat(Array.isArray(state.owned)?state.owned:[]))),
    equipped:Object.assign({},defaults.equipped,state.equipped||{}),
    today:(state.today&&typeof state.today==="object")?state.today:{date:"",hits:0}
  };
  function lookup(id){return items.find(function(x){return x.id===id;});}
  ["tema","emblema","moldura"].forEach(function(kind){
    var x=lookup(state.equipped[kind]);
    if(!x||x.kind!==kind||state.owned.indexOf(x.id)===-1)state.equipped[kind]=defaults.equipped[kind];
  });
  function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){console.warn("Moedas não puderam ser salvas",e);}}
  function date(){
    var d=new Date();
    return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
  }
  function resetDay(){if(state.today.date!==date())state.today={date:date(),hits:0};}
  function fmt(n){return Number(n).toLocaleString("pt-BR");}
  function level(){return Math.floor(state.total/150)+1;}
  var pane="loja",filter="tema",previousFocus=null,toastTimer;
  function paint(){
    resetDay();
    document.body.setAttribute("data-me-theme",state.equipped.tema);
    document.body.setAttribute("data-me-frame",state.equipped.moldura);
    document.querySelectorAll("[data-reward-coins]").forEach(function(el){el.textContent=fmt(state.coins);});
    document.querySelectorAll("[data-reward-level]").forEach(function(el){el.textContent=level();});
    document.querySelectorAll("[data-reward-hits]").forEach(function(el){el.textContent=Math.min(5,state.today.hits||0)+"/5";});
    var avatar=document.getElementById("rewardAvatar");
    if(avatar)avatar.textContent=(lookup(state.equipped.emblema)||{icon:"📚"}).icon;
  }
  function toast(s){
    var el=document.getElementById("rewardToast");if(!el)return;
    el.textContent="🪙 "+s;el.classList.add("show");
    clearTimeout(toastTimer);toastTimer=setTimeout(function(){el.classList.remove("show");},3200);
  }
  function give(key,coins,reason){
    if(state.earned[key])return false;
    state.earned[key]=true;state.coins+=coins;state.total+=coins;save();paint();
    toast("+"+coins+" moedas • "+reason);return true;
  }
  function correct(topic,index){
    resetDay();
    if(give("acerto:"+topic+":"+index,5,"Novo acerto")){
      state.today.hits++;
      if(state.today.hits===1)give("dia:"+date(),10,"Primeiro acerto do dia");
      if(state.today.hits>=5)give("meta:"+date(),20,"Cinco acertos hoje");
      save();paint();
    }
  }
  window.MeuEstudoRecompensas={
    acerto:correct,
    quizConcluido:function(topic,hits,total){if(total>=10&&hits>=7)give("quiz:"+topic,25,"Treino com 70% ou mais");},
    marcarAssunto:function(topic){give("assunto:"+topic,15,"Assunto concluído");},
    leituraConcluida:function(topic){give("leitura:"+topic,10,"Leitura completa");}
  };
  function equip(item){
    state.equipped[item.kind]=item.id;save();paint();draw();toast("Personalização aplicada!");
  }
  function buy(item){
    if(state.owned.indexOf(item.id)!==-1){equip(item);return;}
    if(state.coins<item.cost){toast("Faltam "+fmt(item.cost-state.coins)+" moedas");return;}
    state.coins-=item.cost;state.owned.push(item.id);save();equip(item);
  }
  function card(item){
    var owned=state.owned.indexOf(item.id)!==-1;
    var current=state.equipped[item.kind]===item.id;
    var enough=state.coins>=item.cost;
    var label=current?"Equipado":owned?"Usar":enough?"Comprar • "+fmt(item.cost):"Faltam "+fmt(item.cost-state.coins);
    var colors=item.colors?'<div class="reward-swatches"><i style="background:'+item.colors[0]+'"></i><i style="background:'+item.colors[1]+'"></i></div>':"";
    return '<article class="reward-item"><div class="reward-item-icon">'+item.icon+'</div><h4>'+item.name+'</h4><p>'+item.description+'</p>'+colors+'<div class="reward-item-footer"><b>'+(item.cost?"🪙 "+fmt(item.cost):"GRÁTIS")+'</b><button data-buy="'+item.id+'" '+(current||(!owned&&!enough)?"disabled":"")+'>'+label+'</button></div></article>';
  }
  function draw(){
    var area=document.getElementById("rewardContent");if(!area)return;
    resetDay();paint();
    var hits=Math.min(5,Math.max(0,state.today.hits||0));
    var blocks=[
      '<div class="reward-overview"><div class="reward-saldo"><span>SALDO DISPONÍVEL</span><strong>🪙 '+fmt(state.coins)+'</strong><small>Nível '+level()+' · '+fmt(state.total)+' moedas acumuladas</small></div>',
      '<div class="reward-daily"><span>MISSÃO DE HOJE</span><strong>'+hits+'/5 novos acertos</strong><div class="reward-track"><i style="width:'+(hits*20)+'%"></i></div><small>Ganhe +20 moedas ao chegar a 5.</small></div></div>',
      '<div class="reward-nav"><button data-view="loja" class="'+(pane==="loja"?"active":"")+'">Loja</button><button data-view="colecao" class="'+(pane==="colecao"?"active":"")+'">Minha coleção</button><button data-view="ganhar" class="'+(pane==="ganhar"?"active":"")+'">Como ganhar</button></div>'
    ];
    if(pane==="ganhar"){
      var rules=[
        ["✓","Novo acerto","+5","Uma única vez por questão de cada assunto"],
        ["☀","Primeiro acerto do dia","+10","Bônus diário"],
        ["🎯","Meta de 5 acertos","+20","Uma vez por dia"],
        ["▤","Leitura completa","+10","Uma vez por assunto"],
        ["✎","Assunto concluído","+15","Uma vez por assunto"],
        ["🏆","Treino com pelo menos 70%","+25","Uma vez por assunto"]
      ];
      blocks.push('<div class="reward-rules">'+rules.map(function(r){return '<div class="reward-rule"><span>'+r[0]+'</span><div><strong>'+r[1]+'</strong><small>'+r[3]+'</small></div><b>'+r[2]+'</b></div>';}).join("")+'</div>');
    } else {
      blocks.push('<p class="reward-hint">'+(pane==="loja"?"Troque suas moedas virtuais por personalizações. Sem dinheiro real.":"Itens desbloqueados para usar quando quiser.")+'</p>');
      if(pane==="loja")blocks.push('<div class="reward-categories">'+[["tema","🎨 Temas"],["emblema","🏅 Emblemas"],["moldura","◉ Molduras"]].map(function(x){return '<button data-kind="'+x[0]+'" class="'+(filter===x[0]?"active":"")+'">'+x[1]+'</button>';}).join("")+'</div>');
      blocks.push('<div class="reward-grid">'+items.filter(function(item){return pane==="colecao"?state.owned.indexOf(item.id)!==-1:item.kind===filter;}).map(card).join("")+'</div>');
    }
    blocks.push('<p class="reward-disclaimer">As moedas são apenas recompensas digitais. Seu saldo e suas compras ficam neste navegador e podem ser perdidos se você limpar os dados do site.</p>');
    area.innerHTML=blocks.join("");
    area.querySelectorAll("[data-view]").forEach(function(b){b.onclick=function(){pane=b.dataset.view;draw();};});
    area.querySelectorAll("[data-kind]").forEach(function(b){b.onclick=function(){filter=b.dataset.kind;draw();};});
    area.querySelectorAll("[data-buy]").forEach(function(b){b.onclick=function(){var item=lookup(b.dataset.buy);if(item)buy(item);};});
  }
  function open(){
    var dialog=document.getElementById("rewardDialog");if(!dialog)return;
    previousFocus=document.activeElement;pane="loja";draw();
    if(dialog.showModal&&!dialog.open)dialog.showModal();else dialog.setAttribute("open","");
  }
  function close(){
    var dialog=document.getElementById("rewardDialog");if(!dialog)return;
    if(dialog.close&&dialog.open)dialog.close();else dialog.removeAttribute("open");
    if(previousFocus&&previousFocus.focus)previousFocus.focus();
  }
  function init(){
    var top=document.querySelector(".topbar");
    if(top)top.insertAdjacentHTML("beforeend",'<div class="reward-top"><button id="rewardWallet" class="reward-wallet" title="Minhas moedas">🪙 <b data-reward-coins>0</b></button><button id="rewardShop" class="reward-open">✦ Loja</button><span id="rewardAvatar" class="reward-avatar" title="Seu emblema">📚</span></div>');
    var side=document.querySelector(".sidebar-bottom");
    if(side)side.insertAdjacentHTML("beforebegin",'<div class="reward-sidebar"><span>🏆 SUAS CONQUISTAS</span><strong>Nível <b data-reward-level>1</b> · 🪙 <b data-reward-coins>0</b></strong><button id="rewardSideOpen">Abrir loja →</button></div>');
    document.body.insertAdjacentHTML("beforeend",'<dialog id="rewardDialog" class="reward-dialog" aria-labelledby="rewardTitle"><div class="reward-header"><div><span>MEU ESTUDO · RECOMPENSAS</span><h2 id="rewardTitle">Loja de conquistas ✦</h2></div><button id="rewardClose" class="reward-close" aria-label="Fechar loja">×</button></div><div id="rewardContent" class="reward-content"></div></dialog><div id="rewardToast" class="reward-toast" role="status" aria-live="polite"></div>');
    ["rewardWallet","rewardShop","rewardSideOpen"].forEach(function(id){var el=document.getElementById(id);if(el)el.onclick=open;});
    document.getElementById("rewardClose").onclick=close;
    var d=document.getElementById("rewardDialog");
    d.onclick=function(e){if(e.target===d)close();};
    save();paint();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();