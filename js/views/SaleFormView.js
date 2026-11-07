import View from "./View.js";
import { peso } from "../utils.js";

// The parent element here is the preview line, not the form. The inputs are
// handled by syncForm below; render() and _generateMarkup() own the preview.
class SaleFormView extends View {
  _parentElement = document.querySelector("#line-preview");
  _errorMessage = "Enter quantity and price to see the line total.";

  _form = document.querySelector("#sale-form");
  _itemInput = document.querySelector("#sale-item");
  _qtyInput = document.querySelector("#sale-qty");
  _priceInput = document.querySelector("#sale-price");
  _costInput = document.querySelector("#sale-cost");
  _dateInput = document.querySelector("#sale-date");
  _submitButton = document.querySelector("#sale-submit");
  _cancelButton = document.querySelector("#sale-cancel");
  _errorElement = document.querySelector("#sale-error");

  _generateMarkup() {
    const { valid, item, qty, benta, tubo, reason } = this._data;

    if (!valid) {
      if (reason) {
        return `<span class="preview preview--warn">${reason}</span>`;
      }
      return `<span class="preview">${this._errorMessage}</span>`;
    }

    const label = item || "This item";
    const cls = tubo < 0 ? "preview preview--warn" : "preview preview--ok";

    return `<span class="${cls}">${label} x${qty} = Sales: ${peso(benta)}, Profit: ${peso(tubo)}</span>`;
  }

  syncForm({ editingId, sales, activeDate }) {
    const editing = sales.find((sale) => sale.id === editingId);

    this._itemInput.value = editing ? editing.item : "";
    this._qtyInput.value = editing ? editing.qty : "";
    this._priceInput.value = editing ? editing.price : "";
    this._costInput.value = editing ? editing.cost : "";
    this._dateInput.value = editing ? editing.date : activeDate;

    this._submitButton.textContent = editing ? "Save changes" : "Add sale";
    this._cancelButton.hidden = !editing;

    this.clearFormError();

    // The inputs were just cleared, so the preview must be reset too. Clearing
    // an input does not re-render anything that depends on it.
    if (!editing) {
      this.render({ valid: false, reason: "" });
    }
    if (editing) this._itemInput.focus({ preventScroll: true });
  }

  renderFormError(message) {
    this._errorElement.textContent = message;
    this._errorElement.hidden = false;
    this.render({ valid: false, reason: "" });
  }

  clearFormError() {
    this._errorElement.textContent = "";
    this._errorElement.hidden = true;
  }

  getFormValues() {
    return {
      item: this._itemInput.value,
      qty: this._qtyInput.value,
      price: this._priceInput.value,
      cost: this._costInput.value,
      date: this._dateInput.value,
    };
  }

  addHandlerSubmit(handler) {
    this._form.addEventListener("submit", (event) => {
      event.preventDefault();
      handler(this.getFormValues());
    });
  }

  addHandlerInput(handler) {
    const notify = () => handler(this.getFormValues());

    this._itemInput.addEventListener("input", notify);
    this._qtyInput.addEventListener("input", notify);
    this._priceInput.addEventListener("input", notify);
    this._costInput.addEventListener("input", notify);
  }

  addHandlerCancel(handler) {
    this._cancelButton.addEventListener("click", () => handler());
  }
}

export default new SaleFormView();
