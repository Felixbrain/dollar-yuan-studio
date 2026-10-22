"use strict";

// Web adaptation of Currency.py: fetch the same Frankfurter exchange rate,
// multiply an amount by the rate, and display the rate's publication date.
const API_ROOT = "https://api.frankfurter.dev/v2/rate";
const CURRENCIES = {
  USD: { flag: "🇺🇸", label: "US dollar" },
  CNY: { flag: "🇨🇳", label: "Chinese yuan" },
};

const elements = {
  amount: document.querySelector("#amount"),
  fromFlag: document.querySelector("#from-flag"),
  fromCode: document.querySelector("#from-code"),
  toFlag: document.querySelector("#to-flag"),
  toCode: document.querySelector("#to-code"),
  converted: document.querySelector("#converted-amount"),
  rateDescription: document.querySelector("#rate-description"),
  rateDate: document.querySelector("#rate-date"),
  swapButton: document.querySelector("#swap-button"),
  refreshButton: document.querySelector("#refresh-button"),
  copyButton: document.querySelector("#copy-button"),
  copyLabel: document.querySelector("#copy-label"),
  status: document.querySelector("#status-message"),
};

let fromCurrency = "USD";
let toCurrency = "CNY";
let currentRate = null;
let publishedDate = null;
let requestController = null;
let requestId = 0;

function formatNumber(value, options = {}) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
}

function showStatus(message = "") {
  elements.status.textContent = message;
}

function updateLabels() {
  elements.fromCode.textContent = fromCurrency;
  elements.fromFlag.textContent = CURRENCIES[fromCurrency].flag;
  elements.toCode.textContent = toCurrency;
  elements.toFlag.textContent = CURRENCIES[toCurrency].flag;
  elements.amount.setAttribute("aria-label", `Amount in ${CURRENCIES[fromCurrency].label}`);
}

function updateConversion() {
  const text = elements.amount.value.trim();
  const amount = Number(text);
  const isValid = text !== "" && Number.isFinite(amount) && amount >= 0 && amount <= 1e12;

  if (!isValid) {
    elements.converted.textContent = "—";
    elements.copyButton.disabled = true;
    showStatus(text === "" ? "Enter an amount to convert." : "Enter an amount from 0 to 1 trillion.");
    return;
  }
  showStatus();
  if (currentRate === null) {
    elements.converted.textContent = "—";
    elements.copyButton.disabled = true;
    return;
  }

  const value = amount * currentRate;
  elements.converted.textContent = formatNumber(value);
  elements.copyButton.disabled = false;
}

function showRateInformation() {
  elements.rateDescription.textContent = `1 ${fromCurrency} = ${formatNumber(currentRate, { minimumFractionDigits: 4, maximumFractionDigits: 6 })} ${toCurrency}`;
  // Parse date at local noon to avoid shifting the day across time zones.
  const date = new Date(`${publishedDate}T12:00:00`);
  const formattedDate = Number.isNaN(date.getTime())
    ? publishedDate
    : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
  elements.rateDate.textContent = `Published rate · ${formattedDate}`;
}

async function loadRate() {
  // Abort the old request so a fast currency swap cannot show stale values.
  if (requestController) requestController.abort();
  requestController = new AbortController();
  const id = ++requestId;
  const timeout = setTimeout(() => requestController.abort(), 12000);
  currentRate = null;
  publishedDate = null;
  elements.converted.textContent = "—";
  elements.copyButton.disabled = true;
  elements.rateDescription.textContent = "Fetching the latest available rate…";
  elements.rateDate.textContent = "Checking published rate…";
  elements.refreshButton.classList.add("is-loading");
  elements.refreshButton.disabled = true;
  showStatus();

  try {
    const response = await fetch(`${API_ROOT}/${fromCurrency}/${toCurrency}`, {
      signal: requestController.signal,
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Exchange-rate service returned ${response.status}`);
    const data = await response.json();
    if (typeof data.rate !== "number" || !Number.isFinite(data.rate) || data.rate <= 0 ||
        typeof data.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
      throw new Error("Unexpected rate data");
    }
    if (id !== requestId) return;
    currentRate = data.rate;
    publishedDate = data.date;
    showRateInformation();
    updateConversion();
  } catch (error) {
    if (id !== requestId) return;
    elements.rateDescription.textContent = "Exchange rate unavailable";
    elements.rateDate.textContent = "Check your connection and try refresh";
    showStatus("We couldn't load a published rate. Please try again.");
    console.error("Unable to load currency rate:", error);
  } finally {
    clearTimeout(timeout);
    if (id === requestId) {
      elements.refreshButton.classList.remove("is-loading");
      elements.refreshButton.disabled = false;
    }
  }
}

async function copyResult() {
  const amount = Number(elements.amount.value);
  if (currentRate === null || elements.copyButton.disabled || !Number.isFinite(amount)) return;
  const text = `${formatNumber(amount)} ${fromCurrency} = ${formatNumber(amount * currentRate)} ${toCurrency} (1 ${fromCurrency} = ${formatNumber(currentRate, { minimumFractionDigits: 4, maximumFractionDigits: 6 })} ${toCurrency}; ${publishedDate} published rate)`;
  try {
    if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
    await navigator.clipboard.writeText(text);
    elements.copyLabel.textContent = "Copied!";
    setTimeout(() => { elements.copyLabel.textContent = "Copy result"; }, 2000);
  } catch {
    showStatus("Copy isn't available in this browser. You can select the result instead.");
  }
}

elements.amount.addEventListener("input", updateConversion);
elements.swapButton.addEventListener("click", () => {
  [fromCurrency, toCurrency] = [toCurrency, fromCurrency];
  updateLabels();
  loadRate();
});
elements.refreshButton.addEventListener("click", loadRate);
elements.copyButton.addEventListener("click", copyResult);
updateLabels();
loadRate();
