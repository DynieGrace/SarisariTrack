import View from "./View.js";
import { escapeHtml, peso } from "../utils.js";

class SalesLogView extends View {
  _parentElement = document.querySelector("#sales-body");
  _errorMessage = "No sales recorded for this day yet.";

  _generateMarkupRow = (sale, isEditing) => {
    const { id, item, qty, price, cost } = sale;
    const benta = qty * price;
    const tubo = qty * (price - cost);
    const lossClass = tubo < 0 ? " row__tubo--neg" : "";

    return `
      <tr class="row${isEditing ? " row--editing" : ""}" data-id="${id}">
        <td class="row__item">${escapeHtml(item)}</td>
        <td class="num">${qty}</td>
        <td class="num">${peso(price)}</td>
        <td class="num">${peso(benta)}</td>
        <td class="num row__tubo${lossClass}">${peso(tubo)}</td>
        <td class="row__actions">
          <button class="link" type="button" data-action="edit" data-id="${id}">Edit</button>
          <button class="link link--danger" type="button" data-action="delete" data-id="${id}">Delete</button>
        </td>
      </tr>`;
  };

  _generateMarkup = () => {
    const { sales, editingId } = this._data;

    if (sales.length === 0) {
      return `<tr><td colspan="6" class="empty-cell">${this._errorMessage}</td></tr>`;
    }

    return sales
      .map((sale) => this._generateMarkupRow(sale, sale.id === editingId))
      .join("");
  };

  addHandlerRowAction(handler) {
    // Event delegation. render() replaces the tbody contents on every update,
    // so a listener attached to a row would be destroyed each time. One listener
    // on the stable tbody survives, and data-action / data-id say which button
    // was pressed.
    this._parentElement.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action]");
      if (!button) return;

      handler({ action: button.dataset.action, id: button.dataset.id });
    });
  }
}

export default new SalesLogView();

