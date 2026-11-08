import * as model from "./model.js";
import saleFormView from "./views/SaleFormView.js";
import salesLogView from "./views/SalesLogView.js";
import totalsView from "./views/TotalsView.js";

const controlSaleSubmit = (input) => {
  const editingId = model.state.editingId;

  const result = editingId
    ? model.updateSale(editingId, input)
    : model.addSale(input);

  if (!result.ok) {
    saleFormView.renderFormError(result.error);
    return;
  }

  saleFormView.clearFormError();

  if (input.date && input.date !== model.state.activeDate) {
    model.setActiveDate(input.date);
  }

  refreshAll();
};

const controlSaleInput = (input) => {
  saleFormView.render(model.getLinePreview(input));
};

const controlSaleCancel = () => {
  model.cancelEditSale();
  refreshAll();
};

const controlSaleRowAction = ({ action, id }) => {
  if (action === "edit") {
    const result = model.startEditSale(id);
    if (!result.ok) {
      saleFormView.renderFormError(result.error);
      return;
    }
    refreshAll();
    return;
  }

  if (action === "delete") {
    const sale = model.state.sales.find((s) => s.id === id);
    const ok = window.confirm(`Delete "${sale?.item ?? "this sale"}"?`);
    if (!ok) return;

    const result = model.deleteSale(id);
    if (!result.ok) {
      saleFormView.renderFormError(result.error);
      return;
    }
    refreshAll();
  }
};

const controlDateChange = (date) => {
  model.setActiveDate(date);
  refreshAll();
};

const controlTotalsSort = (key) => {
  model.setSortBy(key);
  renderTotals();
};

const controlTotalsRefresh = () => {
  model.loadFromStorage();
  model.cancelEditSale();
  refreshAll();
};


const renderTotals = () => {
  const totals = model.getTotals();
  totalsView.render({ items: totals.items, sortBy: model.state.sortBy });
  totalsView.renderSummary(model.getSummary());
  totalsView.syncControls({
    activeDate: model.state.activeDate,
    sortBy: model.state.sortBy,
  });
};

// The single re-render path. Every action that changes state ends here, so the
// screen cannot drift out of sync with the data.
const refreshAll = () => {
  const { sales, activeDate, editingId } = model.state;
  const todaysSales = model.getSalesForDate(activeDate);

  salesLogView.render({ sales: todaysSales, editingId });
  saleFormView.syncForm({ editingId, sales, activeDate });
  renderTotals();
};

const init = () => {
  model.loadFromStorage();

  // Handlers are subscribed once, because the containers are stable and only
  // their contents get replaced. Subscribing inside refreshAll would stack
  // duplicate listeners on every action.
  saleFormView.addHandlerSubmit(controlSaleSubmit);
  saleFormView.addHandlerInput(controlSaleInput);
  saleFormView.addHandlerCancel(controlSaleCancel);

  salesLogView.addHandlerRowAction(controlSaleRowAction);

  totalsView.addHandlerDateChange(controlDateChange);
  totalsView.addHandlerSort(controlTotalsSort);
  totalsView.addHandlerRefresh(controlTotalsRefresh);

  refreshAll();
};

init();
