import { todayISO } from "./utils.js";

const STORAGE_KEY = "sarisaritrack/v1";

export const state = {
  sales: [],
  activeDate: "",
  editingId: null,
  sortBy: "tubo",
};

const buildSeed = () => {
  const today = todayISO();
  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const offset = d.getTimezoneOffset();
    return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
  })();

  return [
    { item: "Kape (3-in-1)", qty: 2, price: 12, cost: 8, date: today },
    { item: "Sardinas", qty: 3, price: 26, cost: 20, date: today },
    { item: "Load", qty: 1, price: 50, cost: 45, date: today },
    { item: "Sabon", qty: 2, price: 35, cost: 27, date: today },
    { item: "Kape (3-in-1)", qty: 4, price: 12, cost: 8, date: yesterday },
    { item: "Biskwit", qty: 1, price: 18, cost: 13, date: yesterday },
  ];
};

let idCounter = Date.now();

const nextId = () => {
  idCounter += 1;
  return `s-${idCounter}`;
};

const persist = () => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      sales: state.sales,
      activeDate: state.activeDate,
      sortBy: state.sortBy,
    }),
  );
};

export const loadFromStorage = () => {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (raw === null) {
    state.sales = buildSeed().map((sale) => ({ id: nextId(), ...sale }));
    state.activeDate = todayISO();
    state.sortBy = "tubo";
    persist();
    return;
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    data = null;
  }

  // Stored data can be corrupt, or edited by hand in devtools. Treat that the
  // same as a first visit instead of crashing on load.
  if (!data || !Array.isArray(data.sales)) {
    localStorage.removeItem(STORAGE_KEY);
    loadFromStorage();
    return;
  }

  state.sales = data.sales;
  state.activeDate = data.activeDate ?? todayISO();
  state.sortBy = data.sortBy ?? "tubo";
};

const validateSale = (input) => {
  const item = String(input.item ?? "").trim();
  if (item === "") return "Item name is required.";

  const rawQty = String(input.qty ?? "").trim();
  if (rawQty === "") return "Enter a quantity.";
  const qty = Number(rawQty);
  if (!Number.isInteger(qty)) return "Quantity must be a whole number.";
  if (qty < 1) return "Quantity must be at least 1.";

  const rawPrice = String(input.price ?? "").trim();
  if (rawPrice === "") return "Enter a price.";
  const price = Number(rawPrice);
  if (!Number.isFinite(price)) return "Price must be a number.";
  if (price <= 0) return "Price must be more than zero.";

  const rawCost = String(input.cost ?? "").trim();
  if (rawCost === "") return "Enter a cost.";
  const cost = Number(rawCost);
  if (!Number.isFinite(cost)) return "Cost must be a number.";
  if (cost < 0) return "Cost cannot be negative.";

  if (String(input.date ?? "").trim() === "") return "Pick a date.";

  return "";
};

const toNumbers = (input) => ({
  item: String(input.item).trim(),
  qty: Number(input.qty),
  price: Number(input.price),
  cost: Number(input.cost),
  date: String(input.date),
});

export const addSale = (input) => {
  const error = validateSale(input);
  if (error) return { ok: false, error };

  state.sales.push({ id: nextId(), ...toNumbers(input) });
  persist();
  return { ok: true, error: "" };
};

export const updateSale = (id, input) => {
  const sale = state.sales.find((s) => s.id === id);
  if (!sale) return { ok: false, error: "That sale no longer exists." };

  const error = validateSale(input);
  if (error) return { ok: false, error };

  Object.assign(sale, toNumbers(input));
  state.editingId = null;
  persist();
  return { ok: true, error: "" };
};

export const deleteSale = (id) => {
  const before = state.sales.length;
  state.sales = state.sales.filter((s) => s.id !== id);
  if (state.sales.length === before) {
    return { ok: false, error: "That sale no longer exists." };
  }

  if (state.editingId === id) state.editingId = null;
  persist();
  return { ok: true, error: "" };
};

export const startEditSale = (id) => {
  if (!state.sales.some((s) => s.id === id)) {
    return { ok: false, error: "That sale no longer exists." };
  }
  state.editingId = id;
  return { ok: true, error: "" };
};

export const cancelEditSale = () => {
  state.editingId = null;
  return { ok: true, error: "" };
};

export const getSalesForDate = (date = state.activeDate) =>
  state.sales.filter((sale) => sale.date === date);

export const getTotals = (date = state.activeDate) => {
  const sales = getSalesForDate(date);

  // A Map keyed by item name is what turns three separate Kape sales into one
  // row. tubo is summed per sale rather than from the grouped totals, because
  // the same item can be sold at different prices on the same day.
  const byItem = new Map();

  sales.forEach(({ item, qty, price, cost }) => {
    const lineBenta = qty * price;
    const lineTubo = qty * (price - cost);

    if (!byItem.has(item)) {
      byItem.set(item, { item, qty: 0, benta: 0, tubo: 0 });
    }

    const row = byItem.get(item);
    row.qty += qty;
    row.benta += lineBenta;
    row.tubo += lineTubo;
  });

  const items = [...byItem.values()].sort((a, b) => {
    if (state.sortBy === "qty") return b.qty - a.qty;
    if (state.sortBy === "benta") return b.benta - a.benta;
    return b.tubo - a.tubo;
  });

  const benta = sales.reduce((sum, s) => sum + s.qty * s.price, 0);
  const tubo = sales.reduce((sum, s) => sum + s.qty * (s.price - s.cost), 0);

  return {
    date,
    count: sales.length,
    benta,
    tubo,
    margin: benta === 0 ? 0 : (tubo / benta) * 100,
    items,
  };
};

export const getLinePreview = (input) => {
  const item = String(input.item ?? "").trim();
  const rawQty = String(input.qty ?? "").trim();
  const rawPrice = String(input.price ?? "").trim();
  const rawCost = String(input.cost ?? "").trim();

  if (rawQty === "" || rawPrice === "") {
    return { valid: false, reason: "" };
  }

  const qty = Number(rawQty);
  const price = Number(rawPrice);
  const cost = rawCost === "" ? 0 : Number(rawCost);

  if (!Number.isInteger(qty) || qty < 1) {
    return { valid: false, reason: "Quantity must be a whole number, at least 1." };
  }
  if (!Number.isFinite(price) || price <= 0) {
    return { valid: false, reason: "Price must be more than zero." };
  }
  if (!Number.isFinite(cost) || cost < 0) {
    return { valid: false, reason: "Cost cannot be negative." };
  }

  return {
    valid: true,
    item,
    qty,
    benta: qty * price,
    tubo: qty * (price - cost),
    reason: "",
  };
};

export const getSummary = (date = state.activeDate) => {
  const totals = getTotals(date);
  const days = new Set(state.sales.map((s) => s.date));
  return { ...totals, dayCount: days.size };
};

export const setActiveDate = (date) => {
  if (!date) return { ok: false, error: "Pick a date." };
  state.activeDate = date;
  state.editingId = null;
  persist();
  return { ok: true, error: "" };
};

export const setSortBy = (key) => {
  if (!["tubo", "benta", "qty"].includes(key)) {
    return { ok: false, error: "Unknown sort order." };
  }
  state.sortBy = key;
  persist();
  return { ok: true, error: "" };
};
