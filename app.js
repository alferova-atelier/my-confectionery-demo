"use strict";
(() => {
  "use strict";
  const {icon,esc,num,money,measurement,action,field,select,options,note} = UI;
  const $ = s => document.querySelector(s);
  // На GitHub Pages разные проекты аккаунта разделяют один домен.
  const key = location.hostname.endsWith(".github.io")
    ? `my-confectionery-demo:${new URL(".", location.href).pathname}:v1`
    : "my-confectionery.studio.v1";
  const pages = {overview:"Обзор",calculator:"Калькулятор",ingredients:"Ингредиенты",recipes:"Мои рецепты",settings:"Настройки"};
  let state, persistence="saved", draft=null, scenario=null, search="", category="", page="";
  let dialogSubmit=null, lastFocus=null, toastTimer, invalidStorage=false;
  try {
    const raw=localStorage.getItem(key);
    state=raw===null?Studio.demo():Studio.validate(JSON.parse(raw));
    if(raw===null) localStorage.setItem(key,JSON.stringify(state));
  } catch(e) {
    if(e instanceof SyntaxError || (e instanceof Error && !(e instanceof DOMException))) {
      invalidStorage=true; persistence="damaged";state=Studio.blank();
    } else { persistence="memory"; state??=Studio.demo(); }
  }
  const dialog=$("#dialog");
  function toast(msg) {
    $("#toast").textContent=msg;$("#toast").classList.add("visible");
    clearTimeout(toastTimer);toastTimer=setTimeout(()=>$("#toast").classList.remove("visible"),3700);
  }
  function localStatus() {
    const text=persistence==="saved"?"Сохранено на устройстве":persistence==="damaged"?"Требуется восстановление":"Только в памяти";
    const calculationStatus=$("#calculation-save-status");
    if(calculationStatus) calculationStatus.textContent=persistence==="saved"?"Текущий расчёт сохраняется автоматически в этом браузере.":"Автосохранение текущего расчёта недоступно.";
    $("#local-status").innerHTML=`<span class="status-icon">${icon("drive",19)}</span><div><b>Локальный кабинет</b><small><i class="${persistence==="saved"?"online":""}"></i>${text}</small></div>`;
  }
  function persist() {
    if(invalidStorage) {toast("Хранилище повреждено. Восстанови копию в настройках.");return;}
    try {localStorage.setItem(key,JSON.stringify(state));invalidStorage=false;persistence="saved";}
    catch {persistence="memory";toast("Браузер не сохранил изменения. Скачай резервную копию в настройках.");}
    localStatus();
  }
  function route() {const id=location.hash.slice(1);return Object.hasOwn(pages,id)?id:"overview";}
  function go(id) {
    if(location.hash==="#"+id) {render();window.scrollTo(0,0);}
    else location.hash=id;
  }
  function menu(open) {
    document.body.classList.toggle("menu-open",open);
    $(".mobile-nav").setAttribute("aria-expanded",String(open));$("#scrim").hidden=!open;
    $(".workspace").inert=open;
    if(open) $("#navigation a[aria-current]")?.focus();
  }
  function warnSettings() {
    const el=$("#settings-warning");
    if(el) el.innerHTML=state.settings.tax+state.settings.margin>=100?note("Сумма налога и целевой маржинальности должна быть меньше 100%, чтобы можно было рассчитать рекомендуемую цену.","danger"):"";
  }
  function render() {
    page=route();const main=$("#main");
    $("#navigation").innerHTML=Object.entries(pages).map(([id,label])=>`<a href="#${id}" ${id===page?'aria-current="page"':""}>${icon(id)}<span>${label}</span></a>`).join("");
    $("#crumb").textContent=pages[page];document.title=pages[page]+" · Моя кондитерская";
    if(scenario===null) scenario=state.order.price;
    if(page==="overview") main.innerHTML=UI.overview(state);
    if(page==="calculator") main.innerHTML=Views.calculator(state,scenario);
    if(page==="ingredients") main.innerHTML=Views.ingredients(state,search,category);
    if(page==="recipes") main.innerHTML=draft?Views.recipeEditor(state,draft,state.recipes.some(r=>r.id===draft.id)):Views.recipes(state);
    if(page==="settings") {main.innerHTML=Views.settings(state);warnSettings();}
    if(invalidStorage) main.insertAdjacentHTML("afterbegin",note("Сохранённые данные не удалось прочитать. В настройках загрузи резервную копию или восстанови демопример.","danger"));
    localStatus();
  }
  function updateResults() {
    const o=state.order, r=Studio.calculate(o,state.products);
    if($("#results")) $("#results").innerHTML=Views.resultList(o,r);
    if($("#scenario-results")) $("#scenario-results").innerHTML=Views.scenarioTable(state,scenario);
    const slider=$("[name=scenario-range]");
    if(slider) {slider.max=Views.scenarioRange(o,r,scenario);slider.value=scenario;$(".price-marks").innerHTML=Views.priceMarks(r,Number(slider.max));}
  }
  function openForm(title,body,button,save,kind="") {
    if(!dialog.open) lastFocus=document.activeElement;
    dialog.innerHTML=`<form id="modal-form" novalidate><header><h2 id="dialog-title">${esc(title)}</h2>${action("dismiss","","close","icon-button")}</header><div class="modal-body">${body}<p class="form-error" id="form-error" role="alert" hidden></p></div><footer>${action("dismiss","Отмена","","btn secondary")}<button type="submit" class="btn ${kind==="danger"?"danger-solid":"primary"}">${esc(button)}</button></footer></form>`;
    dialog.querySelector("header button").setAttribute("aria-label","Закрыть");
    dialogSubmit=save;
    if(!dialog.open) dialog.showModal();
    const first=dialog.querySelector(".modal-body input:not([type=hidden]),.modal-body select");
    (first || dialog.querySelector("footer button")).focus();
  }
  function closeForm() { if(dialog.open) dialog.close(); }
  dialog.addEventListener("close",()=>{dialogSubmit=null;if(lastFocus?.isConnected)lastFocus.focus();});
  function confirmAction(title,body,label,execute,danger=false) {
    openForm(title,`<p class="confirm-text">${esc(body)}</p>`,label,()=>{execute();},danger?"danger":"");
  }
  function errorBox(msg) {
    const el=$("#form-error");if(el) {el.hidden=false;el.textContent=msg;}else toast(msg);
  }
  function numberFrom(input, allowBlank=false) {
    let val=input.value.trim();
    const n=allowBlank && !val?0:Studio.decimal(val), max=input.dataset.max==null?Studio.LIMIT:Number(input.dataset.max);
    let message="";
    if(n===null || n>max || (n>0 && n<1e-9)) message=`Введи число от 0 до ${num(max)}. Наименьшее положительное значение — 0,000000001.`;
    else if(input.hasAttribute("data-positive") && n<=0) message="Укажи количество больше нуля.";
    input.setCustomValidity(message);input.setAttribute("aria-invalid",String(!!message));
    if(message) throw Error(message);
    return n;
  }
  function values(form) {
    const v={};
    for(const el of form.querySelectorAll("input[name],select[name],textarea[name]")) {
      if(el.disabled || el.closest("[hidden]")) continue;
      try {
        if(el.hasAttribute("data-numeric")) v[el.name]=numberFrom(el);
        else {v[el.name]=el.value.trim();if(el.required&&!v[el.name]) throw Error("Заполни поле «"+el.closest("label").querySelector("span").textContent+"».");}
      } catch(e) {el.focus();throw e;}
    }
    return v;
  }
  dialog.addEventListener("submit",e=>{
    e.preventDefault();
    try {const v=values(e.target);dialogSubmit(v);closeForm();}
    catch(err){errorBox(err.message);}
  });
  function find(list,id) {const item=list.find(x=>x.id===id);if(!item)throw Error("Запись больше недоступна.");return item;}
  function patchRecord(list,item) {const i=list.findIndex(p=>p.id===item.id);if(i<0)list.push(item);else list[i]=item;}
  const nf=(label,k,v,suffix="",positive=false) => field(label,k,v,{num:true,suffix,positive,required:true});
  const activeLines=()=>page==="recipes"&&draft?draft.lines:state.order.lines;
  function afterLines() { if(!(page==="recipes"&&draft)) persist();render(); }
  function productDialog(id) {
    const p=id?find(state.products,id):{id:Studio.uid(),name:"",category:"",pack:1000,unit:"г",price:"",date:Studio.today()};
    const cats=[...new Set(["Бакалея","Молочные продукты","Шоколад и какао","Фрукты и ягоды","Орехи","Яйца","Прочее",...state.products.map(p=>p.category)])];
    openForm(id?"Изменить ингредиент":"Новый ингредиент",field("Название","name",p.name,{required:true,placeholder:"Например, какао"})+
      field("Категория","category",p.category,{required:true,placeholder:"Выбери или введи свою"}).replace('<input name="category"','<input list="category-options" name="category"')+`<datalist id="category-options">${options(cats)}</datalist>`+
      `<div class="form-grid pair">${nf("Количество в упаковке","pack",p.pack,"",true)}${select("Единица упаковки","unit",Object.keys(Studio.units),p.unit)}</div>`+
      nf("Цена упаковки","price",p.price,"₽"),"Сохранить",v=>{
        const linked=id && (Studio.usage(state,id).length || draft?.lines.some(l=>l.productId===id));
        if(linked && !Studio.compatible(p.unit,v.unit)) throw Error("Продукт используется в рецептуре. Выбери совместимую единицу или добавь новый продукт.");
        const normalizedBefore=p.price/(p.pack*Studio.units[p.unit][1]), normalizedAfter=v.price/(v.pack*Studio.units[v.unit][1]);
        patchRecord(state.products,{...p,...v,date:!id||p.price!==v.price||normalizedBefore!==normalizedAfter?Studio.today():p.date});
        if(category && !state.products.some(p=>p.category===category))category="";
        persist();render();toast("Ингредиент сохранён.");
      });
  }
  function lineForm(id) {
    const list=activeLines(), orig=id?find(list,id):null;
    const type=orig?(orig.productId?"catalog":"manual"):(state.products.length?"catalog":"manual");
    const manual=orig?.manual || {name:"",pack:1000,unit:"г",price:""};
    const productId=orig?.productId || state.products[0]?.id || "";
    const prodOptions=state.products.map(p=>`<option value="${esc(p.id)}" ${p.id===productId?"selected":""}>${esc(p.name)}</option>`).join("");
    const body=`<label class="field"><span>Источник ингредиента</span><select name="source">${state.products.length?`<option value="catalog" ${type==="catalog"?"selected":""}>Из справочника</option>`:""}<option value="manual" ${type==="manual"?"selected":""}>Ввести вручную</option></select></label>
      <div id="catalog-fields"><label class="field"><span>Продукт</span><select name="productId">${prodOptions}</select></label><p class="hint" id="pack-info"></p></div>
      <div id="manual-fields">${field("Название ингредиента","name",manual.name,{required:true})}<div class="form-grid pair">${nf("Количество в упаковке","pack",manual.pack,"",true)}${select("Единица упаковки","packUnit",Object.keys(Studio.units),manual.unit)}</div>${nf("Цена упаковки","price",manual.price,"₽")}</div>
      <div class="form-grid pair">${nf("Количество в рецепте","qty",orig?.qty??"")}${select("Единица в рецепте","unit",Object.keys(Studio.units),orig?.unit||"г")}</div><div id="line-cost" class="modal-summary"></div>`;
    openForm(id?"Изменить строку":"Добавить ингредиент",body,id?"Сохранить":"Добавить",v=>{
      const line={id:orig?.id||Studio.uid(), qty:v.qty,unit:v.unit};
      if(v.source==="catalog") line.productId=v.productId;
      else line.manual={name:v.name,price:v.price,pack:v.pack,unit:v.packUnit};
      Studio.lineCost(line,state.products);
      patchRecord(list,line);afterLines();
    });
    updateLineForm(orig?.unit);
  }
  function updateLineForm(preferred) {
    const form=$("#modal-form"),els=form.elements;
    if(!els.source)return;
    const linked=els.source.value==="catalog";
    $("#catalog-fields").hidden=!linked;$("#manual-fields").hidden=linked;
    const p=linked?state.products.find(p=>p.id===els.productId.value):{unit:els.packUnit.value,price:Studio.decimal(els.price.value),pack:Studio.decimal(els.pack.value)};
    if(!p)return;
    if(linked)$("#pack-info").textContent=`Упаковка ${measurement(p.pack)} ${p.unit} за ${money(p.price)}. Цену можно изменить в справочнике.`;
    const unit=preferred||els.unit.value;
    els.unit.innerHTML=options(Studio.unitList(p.unit),Studio.compatible(unit,p.unit)?unit:p.unit);
    const qty=Studio.decimal(els.qty.value);
    const cost=qty!==null && p.price!==null && p.pack>0?Studio.lineCost({qty,unit:els.unit.value,manual:p},[]):null;
    $("#line-cost").innerHTML=UI.row("Стоимость в рецепте",money(cost));
  }
  function expenseForm(id) {
    const list=state.order.extras,e=id?find(list,id):null;
    const names=Studio.expenseNames.filter(name=>!list.some(x=>x.name===name&&x.id!==id));
    openForm(id?"Изменить расход":"Добавить расход",field("Статья расхода","name",e?.name||"",{required:true,placeholder:"Выбери или введи свою"}).replace('<input name="name"','<input list="expense-names" name="name"')+
      `<datalist id="expense-names">${options(names)}</datalist>`+nf("Сумма","amount",e?.amount??"","₽"),"Сохранить",v=>{
        if(list.some(x=>x.id!==id&&x.name.trim().toLocaleLowerCase("ru")===v.name.toLocaleLowerCase("ru")))throw Error("Эта статья уже добавлена. Измени сумму в существующей строке.");
        patchRecord(list,{id:id||Studio.uid(),name:v.name,amount:v.amount});persist();render();
      });
  }
  function loadDialog(id) {
    if(!state.recipes.length){toast("Сначала создай рецепт в разделе «Мои рецепты».");return;}
    const initial=id?find(state.recipes,id):state.recipes[0];
    openForm("Загрузить рецепт",`<label class="field"><span>Рецепт</span><select name="recipeId">${state.recipes.map(r=>`<option value="${esc(r.id)}" ${r.id===initial.id?"selected":""}>${esc(r.name)}</option>`).join("")}</select></label><p class="hint" id="original-weight"></p>`+
      nf("Желаемый выход","weight",initial.weight,"кг",true)+`<div class="scale-info" id="scale-preview"></div>`+
      note("Предварительный пересчёт пропорций. Проверь рецептуру на практике. Загрузка заменит название, вес и состав заказа. Труд, упаковка и декор сохранят свои значения."),"Загрузить в калькулятор",v=>{
        state.order=Studio.loadRecipe(state.order,find(state.recipes,v.recipeId),v.weight);
        persist();go("calculator");toast("Состав загружен в текущий расчёт.");
      });
    updateScale(false);
  }
  function updateScale(reset) {
    const els=$("#modal-form").elements, r=find(state.recipes,els.recipeId.value);
    if(reset)els.weight.value=r.weight;
    $("#original-weight").textContent=`Исходный выход ${measurement(r.weight)} кг.`;
    const weight=Studio.decimal(els.weight.value);let html="";
    if(weight>0 && weight<=Studio.LIMIT)try{
      const lines=Studio.scale(r,weight);
      html=UI.row("Коэффициент",measurement(weight/r.weight))+lines.map(l=>UI.row(Studio.productFor(l,state.products).name,measurement(l.qty)+" "+l.unit)).join("")+
        UI.row("Ингредиенты",money(Studio.ingredientCost(lines,state.products)),"subtotal");
    }catch(e){html=note(e.message,"danger");}
    $("#scale-preview").innerHTML=html;
  }
  function startDraft(source, fromOrder=false) {
    draft=source?Studio.clone(source):{id:Studio.uid(),name:"",category:"Торты",weight:0,notes:"",lines:[]};
    if(fromOrder)draft={id:Studio.uid(),name:source.name,category:"Торты",weight:source.weight,notes:"",lines:Studio.clone(source.lines)};
    go("recipes");
  }
  function saveDraft() {
    const invalid=$("#main [aria-invalid=true]");if(invalid){invalid.focus();toast("Исправь значение в выделенном поле.");return;}
    if(!draft.name.trim() || !draft.category.trim() || !(draft.weight>0)) {toast("Укажи название, категорию и выход больше нуля.");return;}
    const r={...draft,name:draft.name.trim(),category:draft.category.trim()};
    patchRecord(state.recipes,r);draft=null;persist();render();toast("Рецепт сохранён.");
  }
  function replaceState(next,msg) {
    Studio.validate(next);
    try {
      localStorage.setItem(key,JSON.stringify(next));
      persistence="saved";invalidStorage=false;
    } catch {
      if(persistence!=="memory")throw Error("Не удалось сохранить замену в браузере. Текущие данные сохранены. Проверь свободное место.");
    }
    state=next;draft=null;scenario=null;search="";category="";render();
    toast(persistence==="memory"?msg+" Данные хранятся только до закрытия вкладки.":msg);
  }
  const handlers={
    menu:()=>menu(!document.body.classList.contains("menu-open")),
    dismiss:closeForm,
    "edit-order":()=>go("calculator"),
    new:()=>confirmAction("Начать новый расчёт?","Текущий заказ будет заменён. Сохранённые рецепты и справочник останутся в кабинете.","Начать расчёт",()=>{state.order=Studio.blankOrder(state.settings);scenario=0;persist();go("calculator");}),
    "product-add":()=>productDialog(), "product-edit":productDialog,
    "product-delete":id=>{
      const p=find(state.products,id), used=Studio.usage(state,id).length>0||draft?.lines.some(l=>l.productId===id);
      confirmAction("Удалить ингредиент?",used?`«${p.name}» используется в расчёте или рецептах. При удалении связанные строки сохранят текущую закупочную цену и перейдут на ручной ввод.`:`Удалить «${p.name}» из справочника?`,used?"Отвязать и удалить":"Удалить",()=>{
        if(draft)Studio.detachAndDelete({products:[p],recipes:[],order:draft},id);
        Studio.detachAndDelete(state,id);
        if(!state.products.some(p=>p.category===category))category="";
        persist();render();
      },true);
    },
    "line-add":()=>lineForm(),"line-edit":lineForm,
    "line-delete":id=>{const list=activeLines();list.splice(list.indexOf(find(list,id)),1);afterLines();},
    "expense-add":()=>expenseForm(),"expense-edit":expenseForm,
    "expense-delete":id=>{const list=state.order.extras;list.splice(list.indexOf(find(list,id)),1);persist();render();},
    "recipe-add":()=>startDraft(),"save-as-recipe":()=>startDraft(state.order,true),
    "recipe-edit":id=>startDraft(find(state.recipes,id)),
    "recipe-copy":id=>{const r=Studio.clone(find(state.recipes,id));r.id=Studio.uid();r.name+=" (копия)";state.recipes.push(r);persist();render();toast("Копия рецепта сохранена.");},
    "recipe-delete":id=>{const r=find(state.recipes,id);confirmAction("Удалить рецепт?",`Удалить рецепт «${r.name}»? Состав уже загруженного заказа сохранится.`,"Удалить",()=>{state.recipes=state.recipes.filter(r=>r.id!==id);persist();render();},true);},
    "recipe-save":saveDraft,"recipe-cancel":()=>{draft=null;render();},
    "recipe-load":loadDialog,"load-recipe":()=>loadDialog(),
    "apply-scenario":()=>{const input=$('[name="scenario"]');try{scenario=numberFrom(input);}catch(e){input.reportValidity();return;}state.order.price=scenario;persist();render();toast("Сценарная цена применена к заказу.");},
    export:()=>{
      const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json;charset=utf-8"});
      const url=URL.createObjectURL(blob),a=document.createElement("a");
      a.href=url;a.download="Моя-кондитерская-"+Studio.today()+".json";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
    },
    import:()=>$("#import-file").click(),
    restore:()=>confirmAction("Восстановить демопример?","Демонстрационные продукты, рецепт и заказ заменят текущие данные кабинета.","Восстановить",()=>replaceState(Studio.demo(),"Демопример восстановлен."),true),
    clear:()=>confirmAction("Удалить все данные?","Будут удалены продукты, рецепты, настройки и текущий расчёт на этом устройстве. Для восстановления понадобится сохранённая копия.","Удалить все данные",()=>replaceState(Studio.blank(),"Кабинет очищен."),true)
  };
  document.addEventListener("click",e=>{
    if(e.target.closest(".skip")) {e.preventDefault();$("#main").focus();return;}
    const b=e.target.closest("[data-action]");
    if(b && Object.hasOwn(handlers,b.dataset.action)) {
      try{handlers[b.dataset.action](b.dataset.id);}catch(err){errorBox(err.message);}
    }
    if(e.target.closest("#navigation a"))menu(false);
  });
  document.addEventListener("input",e=>{
    const el=e.target, bind=el.dataset.bind;
    if(dialog.contains(el)) {
      if($("#form-error"))$("#form-error").hidden=true;
      if(el.hasAttribute("data-numeric"))el.setCustomValidity("");
      if($("#line-cost"))updateLineForm();
      if($("#scale-preview")&&el.name==="weight")updateScale(false);
      return;
    }
    if(bind) {
      let v=el.value;
      if(el.hasAttribute("data-numeric"))try{v=numberFrom(el,true);}catch(err){el.reportValidity();return;}
      if(bind==="scenario"){scenario=v;updateResults();return;}
      const target=bind==="draft"?draft:bind==="order"?state.order:state.settings;target[el.name]=v;
      if(bind!=="draft")persist();
      if(bind==="order")updateResults();
      if(bind==="settings")warnSettings();
    }else if(el.name==="scenario-range") {
      scenario=Number(el.value);const input=$('[name="scenario"]');input.value=scenario;input.setCustomValidity("");input.removeAttribute("aria-invalid");updateResults();
    }else if(el.name==="search"){search=el.value;$("#products-list").innerHTML=Views.productRows(state,search,category);}
  });
  document.addEventListener("change",async e=>{
    const el=e.target;
    if(el.name==="filter-category"){category=el.value;$("#products-list").innerHTML=Views.productRows(state,search,category);}
    if(dialog.contains(el) && el.name==="recipeId")updateScale(true);
    if(el.id==="import-file" && el.files[0]) {
      const file=el.files[0];el.value="";
      try{
        if(file.size>Studio.MAX_BACKUP)throw Error("Файл превышает 12 МБ.");
        const raw=await file.text();let json;try{json=JSON.parse(raw);}catch{throw Error("Файл не является корректной копией JSON.");}
        const restored=Studio.validate(json);
        confirmAction("Заменить данные кабинета?",`В копии продуктов: ${restored.products.length}, рецептов: ${restored.recipes.length}. Импорт заменит текущий расчёт, справочник, рецепты и настройки.`,"Заменить данные",()=>replaceState(restored,"Резервная копия восстановлена."),true);
      }catch(err){toast("Не удалось загрузить копию. "+err.message);}
    }
  });
  window.addEventListener("hashchange",()=>{menu(false);if(dialog.open)closeForm();render();window.scrollTo(0,0);$("#main").focus({preventScroll:true});});
  window.addEventListener("storage",e=>{if(e.key!==key||!e.newValue)return;try{state=Studio.validate(JSON.parse(e.newValue));draft=null;scenario=null;if(dialog.open)closeForm();render();toast("Данные обновлены в другой вкладке.");}catch{toast("Не удалось прочитать изменения из другой вкладки.");}});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&document.body.classList.contains("menu-open")){menu(false);$(".mobile-nav").focus();}});
  matchMedia("(min-width:801px)").addEventListener("change",e=>{if(e.matches)menu(false);});
  $(".mobile-nav").innerHTML=icon("menu");$("#crumb-icon").innerHTML=icon("panel",17);
  $("#date").innerHTML=icon("calendar",16)+`<span>${new Intl.DateTimeFormat("ru-RU",{day:"numeric",month:"long",year:"numeric"}).format(new Date()).replace(/\s*г\.$/,"")}</span>`;
  render();
})();

