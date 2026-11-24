"use strict";
const Studio = (() => {
  const units = { "г": ["масса", 1], "кг": ["масса", 1000], "мл": ["объём", 1], "л": ["объём", 1000], "шт": ["штуки", 1] };
  const defaults = { rate: 450, tax: 4, margin: 20 };
  const expenseNames = ["Декор", "Упаковка", "Электроэнергия", "Расходные материалы", "Доставка за счёт кондитера", "Прочие расходы"];
  const clone = value => JSON.parse(JSON.stringify(value));
  const uid = () => globalThis.crypto?.randomUUID?.() || "id-" + Date.now().toString(36) + Math.random().toString(36).slice(2);
  const today = () => {
    const date = new Date();
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
  };
  const compatible = (a, b) => Object.hasOwn(units, a) && Object.hasOwn(units, b) && units[a][0] === units[b][0];
  const unitList = unit => Object.keys(units).filter(other => compatible(unit, other));
  function decimal(input) {
    const value = String(input).trim().replace(",", ".");
    return /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(value) && Number.isFinite(Number(value)) ? Number(value) : null;
  }
  function blankOrder(settings = defaults) {
    return { name: "", weight: 0, price: 0, hours: 0, ...settings, lines: [], extras: [], demo: false };
  }
  function blank() {
    return { version: 1, settings: { ...defaults }, products: [], recipes: [], order: blankOrder() };
  }
  function demo() {
    const state = blank();
    const data = [
      ["cheese","Сливочный сыр","Молочные продукты",1000,"г",850,1000],
      ["chocolate","Шоколад","Шоколад и какао",500,"г",700,300],
      ["cream","Сливки","Молочные продукты",1000,"г",650,600],
      ["flour","Мука","Бакалея",2000,"г",180,500],
      ["sugar","Сахар","Бакалея",1000,"г",100,500],
      ["eggs","Яйца","Яйца",10,"шт",190,5]
    ];
    state.products = data.map(([id,name,category,pack,unit,price]) => ({ id,name,category,pack,unit,price,date:today() }));
    const lines = data.map(([productId,,,,unit,,qty]) => ({ id:uid(), productId, qty, unit }));
    state.order = { ...blankOrder(), name:"Шоколадный торт", weight:3, price:6000, hours:6, demo:true, lines,
      extras:[["Декор",450],["Упаковка",350],["Прочие расходы",250]].map(([name,amount]) => ({ id:uid(),name,amount })) };
    state.recipes = [{ id:uid(), name:state.order.name, category:"Торты", weight:3, lines:clone(lines),
      notes:"Демонстрационный пример для проверки расчётов. Пропорции условные." }];
    return state;
  }
  const productFor = (line, products) => line.productId ? products.find(p => p.id === line.productId) : line.manual;
  function lineCost(line, products) {
    const p = productFor(line, products);
    if (!p || !compatible(p.unit, line.unit) || p.pack <= 0) throw Error("Проверь упаковку и единицы ингредиента.");
    return p.price * (line.qty * units[line.unit][1]) / (p.pack * units[p.unit][1]);
  }
  const ingredientCost = (lines, products) => lines.reduce((sum, line) => sum + lineCost(line, products), 0);
  function up(value) {
    const near = Math.round(value);
    return Math.abs(value - near) <= Number.EPSILON * Math.max(1, Math.abs(value)) * 4 ? near : Math.ceil(value);
  }
  function calculate(order, products, price = order.price) {
    const ingredients = ingredientCost(order.lines, products);
    const extras = order.extras.reduce((sum, e) => sum + e.amount, 0);
    const cash = ingredients + extras, labor = order.hours * order.rate, base = cash + labor;
    const tax = price * order.tax / 100, total = base + tax, balance = price - cash - tax;
    const raw = balance - labor;
    const profit = Math.abs(raw) <= Number.EPSILON * Math.max(1, total, price) * 4 ? 0 : raw;
    const minimum = order.tax < 100 ? up(base * 100 / (100 - order.tax)) : null;
    const denominator = 100 - (order.tax + order.margin);
    const recommended = denominator > 0 ? up(base * 100 / denominator) : null;
    return { price, ingredients, extras, cash, cashWithTax: cash + tax, labor, base, tax, total, balance, profit,
      hourly: order.hours > 0 ? balance / order.hours : null,
      margin: price > 0 ? profit / price * 100 : null, markup: base > 0 ? profit / base * 100 : null,
      minimum, recommended, perKg: recommended !== null && order.weight > 0 ? recommended / order.weight : null };
  }
  function scale(recipe, weight) {
    if (!(recipe.weight > 0 && weight > 0)) throw Error("Для масштабирования укажи исходный и желаемый вес больше нуля.");
    const ratio = weight / recipe.weight;
    const lines = recipe.lines.map(line => ({ ...clone(line), id:uid(), qty:line.qty * ratio }));
    if (lines.some(line => !numeric(line.qty))) throw Error("Количество после пересчёта выходит за допустимый диапазон.");
    return lines;
  }
  function loadRecipe(order, recipe, weight = recipe.weight) {
    const lines = weight === recipe.weight ? clone(recipe.lines) : scale(recipe, weight);
    return { ...order, name:recipe.name, weight, lines, demo:false };
  }
  const usage = (state,id) => [state.order, ...state.recipes].filter(r => r.lines.some(l => l.productId === id));
  function detachAndDelete(state, id) {
    const p = state.products.find(p => p.id === id);
    for (const record of usage(state,id)) {
      for (const line of record.lines.filter(l => l.productId === id)) {
        delete line.productId;
        line.manual = { name:p.name, pack:p.pack, price:p.price, unit:p.unit };
      }
    }
    state.products = state.products.filter(p => p.id !== id);
  }
  const LIMIT = 1000000000;
  const MAX_BACKUP = 12 * 1024 * 1024;
  const numeric = (n, max = LIMIT) => typeof n === "number" && Number.isFinite(n) && (n === 0 || n >= 1e-9) && n <= max;
  function validate(state) {
    const check = (condition, message) => { if (!condition) throw Error(message); };
    const text = (s, empty = false) => typeof s === "string" && s.length <= 10000 && (empty || s.trim().length > 0);
    const idOk = id => typeof id === "string" && /^[a-zA-Z0-9_-]{1,128}$/.test(id);
    const list = arr => Array.isArray(arr) && arr.length <= 10000;
    function records(arr, msg) {
      check(list(arr) && arr.every(item => item && idOk(item.id)) && new Set(arr.map(r => r.id)).size === arr.length, msg);
    }
    const financial = f => f && numeric(f.rate) && numeric(f.tax,100) && numeric(f.margin,100);
    const packOk = p => p && text(p.name) && numeric(p.pack) && p.pack > 0 && numeric(p.price) && Object.hasOwn(units,p.unit);
    check(state && state.version === 1 && financial(state.settings), "Неизвестный формат файла или неверные настройки.");
    records(state.products, "Проверь список и идентификаторы продуктов.");
    const byId = new Map();
    for (const p of state.products) {
      check(packOk(p) && text(p.category) && typeof p.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(p.date) && Number.isFinite(Date.parse(p.date)) && new Date(p.date).toISOString().slice(0,10) === p.date, "В справочнике есть некорректный продукт.");
      byId.set(p.id,p);
    }
    function rows(lines) {
      records(lines, "Некорректные строки ингредиентов.");
      for (const l of lines) {
        const linked = Object.hasOwn(l,"productId");
        const p = linked ? byId.get(l.productId) : l.manual;
        check(linked !== Object.hasOwn(l,"manual") && (linked ? p : packOk(p)) && numeric(l.qty) && compatible(l.unit,p.unit), "Проверь связь, количество и единицы ингредиентов.");
      }
    }
    records(state.recipes, "Некорректный список рецептов.");
    for (const r of state.recipes) {
      check(text(r.name) && text(r.category) && numeric(r.weight) && r.weight > 0 && text(r.notes,true), "Проверь название, выход и описание рецепта.");
      rows(r.lines);
    }
    const o = state.order;
    check(financial(o) && text(o.name,true) && numeric(o.price) && numeric(o.weight) && numeric(o.hours) && typeof o.demo === "boolean", "Некорректные параметры текущего расчёта.");
    rows(o.lines);
    records(o.extras,"Некорректный список расходов.");
    check(o.extras.every(e => text(e.name) && numeric(e.amount)) && new Set(o.extras.map(e => e.name.trim().toLocaleLowerCase("ru"))).size === o.extras.length, "Статья расходов повторяется или содержит неверную сумму.");
    return state;
  }
  return { units, defaults, expenseNames, clone, uid, today, decimal, compatible, unitList, blank, blankOrder, demo, productFor, lineCost, ingredientCost, calculate, scale, loadRecipe, usage, detachAndDelete, validate, LIMIT, MAX_BACKUP };
})();
if (typeof module !== "undefined" && module.exports) module.exports = Studio;

