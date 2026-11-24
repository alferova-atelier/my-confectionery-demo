"use strict";
const UI = (() => {
  const paths = {
    overview:'<rect x="3" y="3" width="7" height="7" rx="1.2"/><rect x="14" y="3" width="7" height="7" rx="1.2"/><rect x="3" y="14" width="7" height="7" rx="1.2"/><rect x="14" y="14" width="7" height="7" rx="1.2"/>',
    calculator:'<rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M8 6h8v3H8zM8 13h2m4 0h2m-8 4h2m4 0h2"/>',
    ingredients:'<path d="m3.5 7 8.5-4.5L20.5 7v10L12 21.5 3.5 17zM4 7l8 4.5L20 7M12 11.5v9M8 4.5l8.5 4.8v4"/>',
    recipes:'<path d="M3 4c3.5-1.2 6-.4 9 1.4C15 3.6 17.5 2.8 21 4v15c-3.5-1.2-6-.4-9 1.4C9 18.6 6.5 17.8 3 19zM12 5.4v15"/>',
    settings:'<path d="m9 3 .6-1h4.8L15 4l2 .9 2-.2 2 3.5-1.2 1.7.2 2.1 1.2 1.9-2.1 3.6-2.1-.1-1.8 1-.8 2.3H9.6l-.8-2.2-2-1.1-2 .1-2.1-3.6L4 12l.1-2.1L3 8.2l2-3.5 2.2.2L9 4z"/><circle cx="12" cy="11.5" r="3"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',
    panel:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',
    save:'<path d="M4 3h13l4 4v14H3V3zM7 3v6h9V3M7 21v-7h10v7"/>',
    drive:'<rect x="3" y="4" width="18" height="13" rx="1.6"/><path d="M8 21h8m-4-4v4"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
    weight:'<path d="M6 8h12l3 12H3z"/><circle cx="12" cy="6" r="3"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    edit:'<path d="m14.5 5.5 4 4M4 20l4.8-1 12-12a1.5 1.5 0 0 0 0-2.1l-1.7-1.7a1.5 1.5 0 0 0-2.1 0l-12 12z"/>',
    wallet:'<path d="M20 8H5a2 2 0 0 1 0-4l13-1v5M3 6v13a2 2 0 0 0 2 2h15V8M21 12h-5v5h5z"/>',
    receipt:'<path d="M5 3l2 1.5L9 3l3 1.5L15 3l2 1.5L19 3v18l-2-1.5-2 1.5-3-1.5L9 21l-2-1.5L5 21zM8 8h8m-8 4h8m-8 4h4"/>',
    profit:'<path d="M3 17l6-6 4 4 8-10m-6 0h6v6"/>',
    pie:'<path d="M11 3a9 9 0 1 0 10 10H11zM14 2.7V10h7.3A8.5 8.5 0 0 0 14 2.7Z"/>',
    sliders:'<path d="M4 6h6m4 0h6M4 12h10m4 0h2M4 18h2m4 0h10"/><circle cx="12" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="8" cy="18" r="2"/>',
    bulb:'<path d="M9 17c0-3-4-3.5-4-8a7 7 0 0 1 14 0c0 4.5-4 5-4 8zM9 20h6m-5 2h4"/>',
    tag:'<path d="M3 4h8l10 10-7 7L3 10z"/><circle cx="7.3" cy="7.3" r="1"/>',
    menu:'<path d="M3 6h18M3 12h18M3 18h18"/>',close:'<path d="m6 6 12 12M6 18 18 6"/>',
    search:'<circle cx="10" cy="10" r="6.5"/><path d="m15 15 5 5"/>',
    trash:'<path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7"/>',
    copy:'<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
    file:'<path d="M5 2h9l5 5v15H5zM14 2v6h5M8 13h8m-8 4h6"/>',
    check:'<path d="m4 12 5 5L20 6"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-11v1"/>',
    scale:'<path d="M3 7h18v10H3zM7 7v4m4-4v3m4-3v4m3-4v3"/>',
    download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
    upload:'<path d="M12 16V4m-5 5 5-5 5 5M4 16v5h16v-5"/>',
    reset:'<path d="M3 4v6h6M4 10a8 8 0 1 1 0 6"/>',
    flask:'<path d="M8 3h8m-6 0v6L4 19a1 1 0 0 0 1 2h14a1 1 0 0 0 1-2L14 9V3M7 15h10"/>'
  };
  const icon = (name, size=20) => `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">${paths[name] || ''}</svg>`;
  const esc = s => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const formatter = new Intl.NumberFormat("ru-RU",{maximumFractionDigits:2});
  const num = n => n == null || !Number.isFinite(n) ? "—" : formatter.format(n);
  const measurement = n => new Intl.NumberFormat("ru-RU",{maximumFractionDigits:8}).format(n);
  const money = n => n == null ? "—" : num(n) + " ₽";
  const pct = n => n == null ? "—" : num(n)+"%";
  const date = s => new Intl.DateTimeFormat("ru-RU",{day:"2-digit",month:"2-digit",year:"numeric"}).format(new Date(s+"T12:00:00"));
  const action = (act,label,ico="",cls="btn",id="") => `<button type="button" class="${cls}" data-action="${act}"${id ? ` data-id="${esc(id)}"` : ""}>${ico?icon(ico,17):""}${esc(label)}</button>`;
  const small = (act,label,ico,id) => `<button type="button" class="icon-button" data-action="${act}" data-id="${esc(id)}" aria-label="${esc(label)}" title="${esc(label)}">${icon(ico,17)}</button>`;
  const field = (label,key,value,opt={}) => `<label class="field"><span>${esc(label)}</span><span class="input-wrap"><input name="${key}" ${opt.bind?`data-bind="${opt.bind}"`:""} ${opt.num?`inputmode="decimal" data-numeric ${opt.max!=null?`data-max="${opt.max}"`:""} ${opt.positive?"data-positive":""}`:""} ${opt.required?"required":""} maxlength="${opt.num?24:220}" value="${esc(value)}" ${opt.placeholder?`placeholder="${esc(opt.placeholder)}"`:""} autocomplete="off">${opt.suffix?`<span class="suffix">${esc(opt.suffix)}</span>`:""}</span></label>`;
  const options = (arr,sel) => arr.map(v=>`<option ${v===sel?"selected":""} value="${esc(v)}">${esc(v)}</option>`).join("");
  const select = (label,name,values,val) => `<label class="field"><span>${esc(label)}</span><select name="${name}">${options(values,val)}</select></label>`;
  const heading = (title,desc,actions="")=>`<div class="page-heading"><div><h1>${esc(title)}</h1><p>${esc(desc)}</p></div>${actions?`<div class="heading-actions">${actions}</div>`:""}</div>`;
  const finance = {
    income:"Мой заработок после расходов и налога",
    cash:"Денежные расходы с налогом",
    profit:"Прибыль сверх оплаты моего труда",
    loss:"Убыток с учётом стоимости моего труда",
    hourly:"Заработок за час"
  };
  const explanations = {
    cost:"Полная себестоимость до налога складывается из ингредиентов, других расходов на заказ и оценки твоего времени.",
    labor:"Часы работы умножаются на желаемую ставку. Это оценка твоего времени. Отдельно платить эту сумму не нужно.",
    margin:"Доля цены заказа, которая остаётся в прибыли после расходов, налога и желаемой оплаты твоего труда.",
    markup:"Прибыль сверх оплаты труда делится на полную себестоимость до налога. Так видно, сколько прибыли приходится на каждый вложенный рубль.",
    minimum:"Это цена, которая покрывает денежные расходы, налог и желаемую оплату твоего труда.",
    recommended:"Это цена, которая покрывает расходы, налог и желаемую оплату труда и обеспечивает целевую маржинальность."
  };
  const termHelp = (label,term) => `<details class="term-help" name="finance-help"><summary><span>${esc(label)}</span>${icon("info",15)}<span class="sr">Пояснение</span></summary><p>${esc(explanations[term])}</p></details>`;
  const row = (label,value,cls="",term="")=>`<div class="amount-row ${cls}">${term?termHelp(label,term):`<span>${esc(label)}</span>`}<strong>${esc(value)}</strong></div>`;
  function earningsDetails(r) {
    if(r.balance<0) return `Денежный дефицит — ${money(-r.balance)}. Цена не покрывает даже денежные расходы и налог. На оплату времени ничего не остаётся.`;
    if(r.profit<0) return `На оплату твоего времени остаётся ${money(r.balance)} из желаемых ${money(r.labor)}. Не хватает ${money(-r.profit)}.`;
    if(r.labor===0) return r.balance>0 ? `Оплата труда в расчёте — 0 ₽. Весь заработок ${money(r.balance)} считается прибылью сверх неё.` : "После денежных расходов и налога остаётся 0 ₽. Оплата труда в расчёте — 0 ₽.";
    if(r.profit===0) return `Все ${money(r.balance)} приходятся на желаемую оплату твоего времени. Прибыль сверх неё — 0 ₽.`;
    return `Из этой суммы ${money(r.labor)} приходится на оплату твоего времени. Ещё ${money(r.profit)} — прибыль сверх неё.`;
  }
  function earningsCard(r) {
    return `<div class="metric earnings-card ${r.balance<0?"deficit":""}">
      <div class="metric-label"><span class="tile-icon ${r.balance<0?"loss":"green"}">${icon("wallet",18)}</span><span>${finance.income}</span></div>
      <strong>${money(r.balance)}</strong>
      <p>${esc(earningsDetails(r))}</p>
      <small>Стоимость труда — оценка твоего времени. Отдельно платить эту сумму не нужно.</small>
    </div>`;
  }
  const panel = (title,body,actions="",cls="")=>`<section class="panel ${cls}"><div class="section-title"><h2>${esc(title)}</h2>${actions}</div>${body}</section>`;
  const note = (msg,kind="") => `<div class="note ${kind}">${icon("info",18)}<span>${esc(msg)}</span></div>`;
  const empty = (text) => `<p class="empty">${esc(text)}</p>`;
  const chartColors = ["#355b78","#ca8b6e","#94aeba","#d6bc91","#58856e"];
  function recommendation(o,r) {
    if(r.recommended === null) return "Сумма налога и целевой маржинальности должна быть меньше 100%. Проверь параметры расчёта.";
    if(!o.price && !r.base) return "Добавь ингредиенты, время работы и цену продажи, чтобы оценить заказ.";
    if(r.balance < 0) return "Цена заказа не покрывает денежные расходы и налог. Для покрытия всех затрат нужна цена от " + money(r.minimum) + ".";
    if(r.profit < 0) return "После расходов на оплату твоего труда остаётся меньше запланированного. Минимальная цена заказа — " + money(r.minimum) + ".";
    if(r.margin == null) return "Укажи цену продажи, чтобы увидеть маржинальность.";
    if(r.margin + 1e-9 < o.margin) return `Расходы и труд окупаются. Для маржинальности ${pct(o.margin)} подними цену на ${money(r.recommended - o.price)}.`;
    return `Цена покрывает расходы, оплату труда и обеспечивает целевую маржинальность ${pct(o.margin)}.`;
  }
  function chart(r) {
    const entries=[["Ингредиенты",r.ingredients],["Доп. расходы",r.extras],["Собственный труд",r.labor],["Налог",r.tax],["Сверх оплаты труда",Math.max(0,r.profit)]];
    const total=entries.reduce((v,e)=>v+e[1],0);
    let offset=0;
    const circles=entries.map(([,v],i)=>{
      if(!v || !total) return "";
      const part=v/total*100;
      const result=`<circle cx="100" cy="100" r="78" fill="none" stroke="${chartColors[i]}" stroke-width="28" pathLength="100" stroke-dasharray="${Math.max(0,part-(part<100?Math.min(.45,part*.08):0))} 100" stroke-dashoffset="${-offset}" />`;
      offset+=part;return result;
    }).join("");
    return `<div class="chart-body"><div class="donut"><svg viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="78" fill="none" stroke="#eae6dd" stroke-width="28"/><g transform="rotate(-90 100 100)">${circles}</g></svg><div><b>${money(total)}</b><small>${r.profit < 0?"все затраты":"цена заказа"}</small></div></div><div class="legend">${entries.map(([label,v],i)=>`<div><i style="background:${chartColors[i]}"></i><span>${label}</span><strong>${money(v)}</strong></div>`).join("")}</div></div>${r.profit<0?note("Сюда включена желаемая оплата твоего времени. До покрытия всех затрат не хватает "+money(-r.profit)+".","danger"):""}`;
  }
  function metric(label,value,ico,tone,detail,positive=false) {
    return `<div class="metric"><div class="metric-label"><span class="tile-icon ${tone}">${icon(ico,18)}</span><span>${label}</span></div><strong class="${positive ? tone : ""}">${value}</strong><small>${detail}</small></div>`;
  }
  function overview(s) {
    const o=s.order,r=Studio.calculate(o,s.products);
    return heading("Финансовый обзор","Себестоимость и доходность текущего заказа.",action("new","Новый расчёт","plus","btn primary"))+
      `<section class="order-banner"><div class="order-intro"><div class="banner-meta"><span class="order-label">Текущий расчёт</span>${o.demo?`<span class="demo-pill">Демопример</span>`:""}</div><h2>${esc(o.name || "Новый заказ")}</h2><div class="order-facts"><span>${icon("weight",15)}${num(o.weight)} кг</span><i></i><span>${icon("clock",15)}${num(o.hours)} ч работы</span></div></div><div class="banner-end">${action("edit-order","Редактировать","edit","btn banner-action")}</div></section>
      <div class="metrics">${earningsCard(r)}
        ${metric("Стоимость заказа",money(r.price),"tag","denim","Цена продажи")}
        ${metric(finance.cash,money(r.cashWithTax),"receipt","clay","В том числе налог "+money(r.tax))}
        ${metric(finance.hourly,money(r.hourly),"clock","sand","Желаемая ставка "+money(o.rate)+"/ч")}
        ${metric(r.profit<0?finance.loss:finance.profit,money(Math.abs(r.profit)),"profit",r.profit<0?"loss":"green","При оценке труда "+money(r.labor),true)}
      </div>
      <div class="dashboard-grid">${panel(r.profit<0?"Структура затрат":"Структура цены",chart(r),`<span class="panel-symbol">${icon("pie",20)}</span>`,"chart-panel")}${panel("Ценовые ориентиры",
        row("Минимальная цена",money(r.minimum),"","minimum")+row("Рекомендуемая цена",money(r.recommended),"recommended","recommended")+
        `<div class="margin-line"><div>${termHelp("Маржинальность","margin")}<b class="${r.margin<0?"loss":""}">${pct(r.margin)}</b></div><div class="meter" role="img" aria-label="Маржинальность ${pct(r.margin)}, цель ${pct(o.margin)}"><i style="width:${Math.max(0,Math.min(100,(r.margin||0)/(o.margin||100)*100))}%"></i></div><small>Цель ${pct(o.margin)}</small></div>`,`<span class="panel-symbol">${icon("sliders",20)}</span>`,"pricing-panel")}</div>
      <section class="advice"><span class="advice-icon">${icon("bulb",22)}</span><div><h3>Рекомендация</h3><p>${esc(recommendation(o,r))}</p></div></section>
      <p class="footnote">${icon("info",15)}<span>Результат зависит от полноты введённых расходов и не заменяет бухгалтерский или налоговый учёт.</span></p>`;
  }
  return {finance,termHelp,earningsDetails,icon,esc,num,measurement,money,pct,date,action,small,field,options,select,heading,row,panel,note,empty,overview,recommendation};
})();

