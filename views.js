"use strict";
const Views = (() => {
  const {finance,icon,esc,num,measurement,money,pct,date,action,small,field,select,options,heading,row,panel,note,empty} = UI;
  const nf = (label,key,value,bind,suffix,max) => field(label,key,value || "",{num:true,bind,suffix,max,placeholder:"0"});
  const privacy = "Данные хранятся в этом браузере на этом устройстве. Для переноса на другой компьютер сохрани резервную копию.";
  function ingredientTable(lines,products) {
    if (!lines.length) return empty("Добавь первый ингредиент, чтобы посчитать стоимость рецептуры.");
    return `<div class="data-table"><table><thead><tr><th>Ингредиент</th><th>Упаковка</th><th>В рецепте</th><th class="right">Стоимость</th><th><span class="sr">Действия</span></th></tr></thead><tbody>`+
    lines.map(l=>{
      const p=Studio.productFor(l,products);
      return `<tr><th scope="row">${esc(p.name)}<small>${l.productId?"Из справочника":"Ручной ввод"}</small></th><td data-label="Упаковка">${measurement(p.pack)} ${esc(p.unit)} · ${money(p.price)}</td><td data-label="В рецепте">${measurement(l.qty)} ${esc(l.unit)}</td><td data-label="Стоимость" class="right strong">${money(Studio.lineCost(l,products))}</td><td class="tools">${small("line-edit","Изменить "+p.name,"edit",l.id)}${small("line-delete","Убрать "+p.name,"trash",l.id)}</td></tr>`;
    }).join("")+"</tbody></table></div>";
  }
  function resultList(o,r) {
    const items = [
      ["Ингредиенты",money(r.ingredients)],["Дополнительные расходы",money(r.extras)],
      ["Денежные затраты без налога",money(r.cash)],["Налог с выручки",money(r.tax)],
      [finance.cash,money(r.cashWithTax)],["Собственный труд",money(r.labor),"","labor"],
      ["Полная себестоимость без налога",money(r.base),"","cost"],["Общие затраты с трудом и налогом",money(r.total)],
      [finance.income,money(r.balance),r.balance<0?"loss":"green"],[finance.hourly,money(r.hourly)],
      [r.profit<0?finance.loss:finance.profit,money(Math.abs(r.profit)),r.profit<0?"loss":"green"],
      ["Маржинальность",pct(r.margin),"","margin"],["Наценка к полной себестоимости",pct(r.markup),"","markup"],
      ["Минимальная цена продажи",money(r.minimum),"","minimum"],["Рекомендуемая цена продажи",money(r.recommended),"green","recommended"],
      ["Рекомендуемая цена за килограмм",money(r.perKg)]
    ];
    return `<div class="results-grid">${items.map(a=>row(...a)).join("")}</div>${r.profit<0?note(UI.earningsDetails(r),r.balance<0?"danger":""):""}${r.recommended===null?note("Налог и целевая маржинальность в сумме достигают 100% или больше. Уменьши одно из значений для расчёта рекомендуемой цены.","danger"):""}${[r.hourly,r.margin,r.markup,r.perKg,r.minimum].includes(null)?note("Прочерк означает, что показатель пока не определён. Проверь часы, цену, вес, себестоимость и ставку налога."):""}`;
  }
  function scenarioTable(s,price) {
    const current = Studio.calculate(s.order,s.products);
    const variants = [
      {label:"Текущая цена",kind:"current",result:current},
      {label:"Сценарная цена",kind:"chosen",result:Studio.calculate(s.order,s.products,price)},
      {label:"Минимальная цена",kind:"minimum",term:"minimum",price:current.minimum},
      {label:"Целевая цена",kind:"target",term:"recommended",price:current.recommended}
    ];
    for(const v of variants) {
      if(v.term && v.price!==null) v.result=Studio.calculate(s.order,s.products,v.price);
    }
    const measures = [
      ["Налог с выручки","tax",money],[finance.income,"balance",money],
      [finance.hourly,"hourly",money],[finance.profit,"profit",money],["Маржинальность","margin",pct]
    ];
    const title = v => v.term?UI.termHelp(v.label,v.term):esc(v.label);
    function tableRow([label,key,fmt]) {
      const cells = variants.map(v=>{
        const value=v.result?.[key];
        let detail="";
        if(value<0 && key==="balance") detail="Денежный дефицит";
        if(value<0 && key==="profit") detail=finance.loss;
        return `<td class="${v.kind}${value<0?" loss":""}">${fmt(value)}${detail?`<small>${esc(detail)}</small>`:""}</td>`;
      });
      return `<tr><th scope="row">${esc(label)}</th>${cells.join("")}</tr>`;
    }
    function card(v) {
      const rows=measures.map(([label,key,fmt])=>{
        const value=v.result?.[key],loss=key==="profit" && value<0;
        const detail=key==="balance" && value<0?"<small>Денежный дефицит</small>":"";
        return `<div class="${key}"><dt>${esc(loss?finance.loss:label)}</dt><dd class="${value<0?"loss":""}">${fmt(loss?-value:value)}${detail}</dd></div>`;
      });
      return `<article class="scenario-card ${v.kind}" aria-label="${esc(v.label)}"><div class="scenario-card-head"><div>${title(v)}</div><strong>${money(v.result?.price)}</strong></div><dl>${rows.join("")}</dl></article>`;
    }
    const table=`<div class="scenario-table"><table><thead><tr><th scope="col">Показатель</th>${variants.map(v=>`<th scope="col" class="${v.kind}">${title(v)}</th>`).join("")}</tr></thead><tbody>${[["Цена продажи","price",money],...measures].map(tableRow).join("")}</tbody></table></div>`;
    const unavailable=current.recommended===null?note("Целевая цена недоступна, пока налог и целевая маржинальность в сумме составляют 100% или больше."+(current.minimum===null?" При налоге 100% минимальная цена также не определяется.":""),"danger"):"";
    return table+`<div class="scenario-cards">${variants.map(card).join("")}</div>`+unavailable;
  }
  function scenarioRange(o,r,price) {
    return Math.ceil(Math.min(Studio.LIMIT,Math.max(10000,price,o.price*2,(r.recommended||r.minimum||0)*1.5)));
  }
  function priceMarks(r,max) {
    return [[r.minimum,"Минимум","min"],[r.recommended,"Цель","goal"]].filter(([v])=>v!==null&&v<=max).map(([v,label,type])=>
      `<i class="${type}" style="left:${v/max*100}%" title="${label} · ${money(v)}"></i>`).join("");
  }
  function calculator(s,scenario) {
    const o=s.order,r=Studio.calculate(o,s.products);
    return heading("Калькулятор","Собери расходы на изделие и рассчитай цену продажи.",action("new","Новый расчёт","plus","btn primary"))+
    panel("Параметры изделия",`<div class="form-grid order-fields">${field("Название изделия","name",o.name,{bind:"order",placeholder:"Например, шоколадный торт"})}${nf("Вес готового изделия","weight",o.weight,"order","кг")}${nf("Цена продажи","price",o.price,"order","₽")}</div>${o.demo?`<p class="hint">${icon("flask",15)}Демонстрационный расчёт. Количества ингредиентов условные.</p>`:""}`,action("load-recipe","Загрузить рецепт","recipes","btn secondary compact"))+
    panel("Ингредиенты",ingredientTable(o.lines,s.products)+row("Стоимость ингредиентов",money(r.ingredients),"subtotal")+
      `<div class="recipe-save-row">${action("save-as-recipe","Сохранить состав как рецепт","save","btn secondary compact")}<p class="hint">Состав и пропорции ингредиентов можно будет использовать в будущих заказах.</p></div>`,
      action("line-add","Добавить","plus","btn secondary compact"))+
    panel("Дополнительные расходы",`<div class="expense-list">${o.extras.map(e=>`<div><span>${esc(e.name)}</span><b>${money(e.amount)}</b><span class="tools">${small("expense-edit","Изменить расход "+e.name,"edit",e.id)}${small("expense-delete","Убрать расход "+e.name,"trash",e.id)}</span></div>`).join("")||empty("Здесь можно учесть упаковку, доставку и другие затраты на заказ.")}</div>${row("Всего расходов",money(r.extras),"subtotal")}`,action("expense-add","Добавить","plus","btn secondary compact"))+
    `<div class="split">${panel("Собственный труд",`<div class="form-grid pair">${nf("Время работы","hours",o.hours,"order","ч")}${nf("Стоимость часа","rate",o.rate,"order","₽")}</div><p class="hint">Часы и ставка показывают, как ты оцениваешь своё время. Эта сумма входит в твой заработок, если заказ её покрывает.</p>`)}${panel("Финансовые параметры",`<div class="form-grid pair">${nf("Налог с выручки","tax",o.tax,"order","%",100)}${nf("Целевая маржинальность","margin",o.margin,"order","%",100)}</div><p class="hint">Укажи ставку налога самостоятельно.</p>`)}</div>`+
    panel("Результаты расчёта",`<p class="hint"><span><span id="calculation-save-status"></span> История заказов пока не предусмотрена.</span></p><div id="results">${resultList(o,r)}</div>`)+
    panel("Что, если изменить цену?",`<p class="panel-desc">Например, покупатель просит скидку. Укажи предложенную им цену и посмотри, сколько денег останется после расходов, как изменится оплата твоего времени и будет ли заказ прибыльным. Основная цена заказа не изменится, пока ты не нажмёшь «Применить цену».</p><div class="scenario-controls">${nf("Сценарная цена","scenario",scenario,"scenario","₽")}<div class="slider-wrap"><label class="slider"><span class="sr">Изменить сценарную цену</span><input type="range" min="0" max="${scenarioRange(o,r,scenario)}" step="1" value="${scenario}" name="scenario-range"></label><div class="price-marks" aria-hidden="true">${priceMarks(r,scenarioRange(o,r,scenario))}</div><div class="mark-key"><span>Минимум</span><span>Цель</span></div></div>${action("apply-scenario","Применить цену","check","btn primary")}</div><div id="scenario-results">${scenarioTable(s,scenario)}</div>`);
  }
  function productRows(s,search,category) {
    const products=s.products.filter(p=>p.name.toLocaleLowerCase("ru").includes(search.trim().toLocaleLowerCase("ru")) && (!category||p.category===category));
    if(!products.length) return empty(s.products.length?"По этим условиям ничего не найдено. Измени поиск или категорию.":"Справочник пуст. Добавь продукт и укажи его закупочную цену.");
    return `<div class="data-table catalog"><table><thead><tr><th>Продукт</th><th>Упаковка</th><th>Цена</th><th>За единицу</th><th>Изменение цены</th><th><span class="sr">Действия</span></th></tr></thead><tbody>${products.map(p=>`<tr><th scope="row">${esc(p.name)}<small>${esc(p.category)}</small></th><td data-label="Упаковка">${measurement(p.pack)} ${esc(p.unit)}</td><td data-label="Цена">${money(p.price)}</td><td data-label="За единицу">${measurement(p.price/p.pack)} ₽/${esc(p.unit)}</td><td data-label="Изменение цены">${date(p.date)}</td><td class="tools">${small("product-edit","Изменить "+p.name,"edit",p.id)}${small("product-delete","Удалить "+p.name,"trash",p.id)}</td></tr>`).join("")}</tbody></table></div>`;
  }
  function ingredients(s,search,category) {
    return heading("Ингредиенты","Закупочные цены продуктов для твоих рецептов.",action("product-add","Добавить ингредиент","plus","btn primary"))+
      `<section class="panel"><div class="filters"><label class="search">${icon("search",18)}<input type="search" name="search" aria-label="Поиск по названию" placeholder="Поиск по названию" value="${esc(search)}"></label><select aria-label="Категория продуктов" name="filter-category"><option value="">Все категории</option>${options([...new Set(s.products.map(p=>p.category))].sort(),category)}</select></div><div id="products-list">${productRows(s,search,category)}</div></section>`;
  }
  function recipes(s) {
    return heading("Мои рецепты","Рецептуры, выход изделий и актуальная стоимость ингредиентов.",action("recipe-add","Создать рецепт","plus","btn primary"))+
      `<div class="recipe-list">${s.recipes.map(r=>`<article class="panel recipe-card"><div class="recipe-top"><span class="recipe-symbol">${icon("recipes",25)}</span><span class="category">${esc(r.category)}</span></div><h2>${esc(r.name)}</h2><div class="recipe-facts"><span>${icon("weight",16)}${measurement(r.weight)} кг</span><span>${icon("ingredients",16)}Позиций: ${r.lines.length}</span></div>${row("Ингредиенты",money(Studio.ingredientCost(r.lines,s.products)))}<div class="recipe-actions">${action("recipe-load","В калькулятор","calculator","btn secondary compact",r.id)}<div class="tools">${small("recipe-edit","Редактировать "+r.name,"edit",r.id)}${small("recipe-copy","Копировать "+r.name,"copy",r.id)}${small("recipe-delete","Удалить "+r.name,"trash",r.id)}</div></div></article>`).join("")||panel("Пока нет рецептов",empty("Создай рецепт с нуля или сохрани состав изделия из калькулятора."))}</div>`;
  }
  function recipeEditor(s,draft,existing) {
    return heading(existing?"Редактирование рецепта":"Новый рецепт","Сохрани состав и выход изделия для следующих расчётов.",action("recipe-cancel","Отмена","","btn secondary")+action("recipe-save","Сохранить рецепт","save","btn primary"))+
      panel("Рецептура",`<div class="form-grid">${field("Название рецепта","name",draft.name,{bind:"draft",required:true})}${field("Категория","category",draft.category,{bind:"draft",required:true})}${nf("Выход изделия","weight",draft.weight,"draft","кг")}</div><label class="field notes"><span>Заметки</span><textarea name="notes" data-bind="draft" maxlength="10000" rows="3">${esc(draft.notes)}</textarea></label>`)+
      panel("Состав",ingredientTable(draft.lines,s.products)+row("Стоимость ингредиентов",money(Studio.ingredientCost(draft.lines,s.products)),"subtotal"),action("line-add","Добавить ингредиент","plus","btn secondary compact"));
  }
  function settings(s) {
    const f=s.settings;
    return heading("Настройки","Параметры новых расчётов и резервные копии кабинета.")+
      panel("Значения по умолчанию",`<div class="form-grid">${nf("Желаемая стоимость часа","rate",f.rate,"settings","₽")}${nf("Налог с выручки","tax",f.tax,"settings","%",100)}${nf("Целевая маржинальность","margin",f.margin,"settings","%",100)}</div><p class="hint">Эти значения подставляются в каждый новый расчёт. Налоговую ставку выбираешь ты.</p><div id="settings-warning"></div>`)+
      panel("Резервные копии",`<p class="panel-desc">${privacy} Периодически экспортируй копию с рецептами, ценами, текущим заказом и настройками.</p><div class="button-row">${action("export","Скачать копию JSON","download","btn primary")}${action("import","Загрузить копию","upload","btn secondary")}<input type="file" id="import-file" accept=".json,application/json" hidden></div>`)+
      panel("Данные кабинета",`<div class="manage-row"><div><h3>Восстановить демопример</h3><p>Заменить данные примером заказа на шоколадный торт весом 3 кг.</p></div>${action("restore","Восстановить","reset","btn secondary")}</div><div class="manage-row"><div><h3>Очистить кабинет</h3><p>Удалить рецепты, продукты и текущий расчёт. Настройки вернутся к исходным.</p></div>${action("clear","Удалить данные","trash","btn danger-button")}</div>`);
  }
  return { calculator,resultList,scenarioTable,scenarioRange,priceMarks,ingredients,productRows,recipes,recipeEditor,settings };
})();

