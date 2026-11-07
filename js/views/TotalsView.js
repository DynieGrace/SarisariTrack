import View from "./View.js";
import { escapeHtml, peso, formatDate } from "../utils.js";

class TotalsView extends View {
  _parentElement = document.querySelector("#totals-body");
  _errorMessage = "No items to break down for this day.";

  _bentaEl = document.querySelector("#total-benta");
  _tuboEl = document.querySelector("#total-tubo");
  _bestSellingProductEl = document.querySelector("#total-best-selling-product");
  _countEl = document.querySelector("#total-count");
  _dateLabel = document.querySelector("#viewing-date");
  _dateInput = document.querySelector("#active-date");
  _sortSelect = document.querySelector("#totals-sort");
  _refreshButton = document.querySelector("#totals-refresh");

  _generateMarkupRow = (row) => {
    const { item, qty, benta, tubo } = row;
    const lossClass = tubo < 0 ? " row__tubo--neg" : "";

    return `
      <tr class="row">
        <td class="row__item">${escapeHtml(item)}</td>
        <td class="num">${qty}</td>
        <td class="num">${peso(benta)}</td>
        <td class="num row__tubo${lossClass}">${peso(tubo)}</td>
      </tr>`;
  };

  _generateMarkup = () => {
    const { items } = this._data;

    if (items.length === 0) {
      return `<tr><td colspan="4" class="empty-cell">${this._errorMessage}</td></tr>`;
    }

    return items.map((row) => this._generateMarkupRow(row)).join("");
  };

  renderSummary({ benta, tubo, bestSellingProduct, count, date }) {
    this._bentaEl.textContent = peso(benta);
    this._tuboEl.textContent = peso(tubo);
    this._bestSellingProductEl.textContent = bestSellingProduct
      ? `${bestSellingProduct.item} (${bestSellingProduct.qty})`
      : "—";
    this._countEl.textContent =
      count === 1 ? "1 sale" : `${count} sales`;
    this._dateLabel.textContent = formatDate(date);

    this._tuboEl.classList.toggle("stat--neg", tubo < 0);
  }

  syncControls({ activeDate, sortBy }) {
    this._dateInput.value = activeDate;
    this._sortSelect.value = sortBy;
  }

  addHandlerDateChange(handler) {
    this._dateInput.addEventListener("change", (event) => {
      handler(event.target.value);
    });
  }

  addHandlerSort(handler) {
    this._sortSelect.addEventListener("change", (event) => {
      handler(event.target.value);
    });
  }

  addHandlerRefresh(handler) {
    this._refreshButton.addEventListener("click", () => handler());
  }
}

export default new TotalsView();
