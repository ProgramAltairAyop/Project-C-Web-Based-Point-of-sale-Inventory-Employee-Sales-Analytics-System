// ===== reports.js =====
// Sales report with filters (date, product, cashier), total, and print.

// Turn a saved date into a local date text like "2026-10-16".
// The date inputs use the same format, so they can be compared easily.
function getLocalDate(isoString) {
  var d = new Date(isoString);
  var month = d.getMonth() + 1;
  var day = d.getDate();

  if (month < 10) {
    month = "0" + month;
  }
  if (day < 10) {
    day = "0" + day;
  }
  return d.getFullYear() + "-" + month + "-" + day;
}

// If value is empty, return the default text instead.
function orDefault(value, defaultText) {
  if (value === "") {
    return defaultText;
  }
  return value;
}

// Fill the cashier dropdown with all accounts.
function fillCashierDropdown() {
  var accounts = loadData("accounts", []);
  var html = '<option value="">All cashiers</option>';

  for (var i = 0; i < accounts.length; i++) {
    html += '<option value="' + accounts[i].username + '">' + accounts[i].username + "</option>";
  }
  document.getElementById("cashierFilter").innerHTML = html;
}

// Turn the items of a sale into text, one line per item.
function itemsToText(items) {
  var lines = [];
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    lines.push(item.name + " (" + item.size + ", " + item.color + ") x" + item.qty);
  }
  return lines.join("<br>");
}

// Check if a sale has an item that matches the product search text.
function saleHasProduct(sale, searchText) {
  for (var i = 0; i < sale.items.length; i++) {
    var text = (sale.items[i].name + " " + sale.items[i].category).toLowerCase();
    if (text.indexOf(searchText) !== -1) {
      return true;
    }
  }
  return false;
}

// Build and show the report using the current filters.
function showReport() {
  var allSales = loadData("sales", []);

  var fromDate = document.getElementById("fromDate").value;
  var toDate = document.getElementById("toDate").value;
  var productText = document.getElementById("productSearch").value.toLowerCase().trim();
  var cashier = document.getElementById("cashierFilter").value;

  // Text that describes the filters (useful on the printed report)
  document.getElementById("reportRange").textContent =
    "Dates: " + orDefault(fromDate, "any") + " to " + orDefault(toDate, "any") +
    " | Product: " + orDefault(productText, "all") +
    " | Cashier: " + orDefault(cashier, "all");

  var table = document.getElementById("reportTable");
  var info = document.getElementById("reportInfo");

  // Check the dates
  if (fromDate !== "" && toDate !== "" && fromDate > toDate) {
    info.textContent = "The From date is after the To date. Please fix the dates.";
    table.innerHTML = "";
    return;
  }

  // Step 1: keep only the sales that match all filters
  var matches = [];
  for (var i = 0; i < allSales.length; i++) {
    var sale = allSales[i];
    var saleDate = getLocalDate(sale.date);

    if (fromDate !== "" && saleDate < fromDate) {
      continue;
    }
    if (toDate !== "" && saleDate > toDate) {
      continue;
    }
    if (cashier !== "" && sale.cashier !== cashier) {
      continue;
    }
    if (productText !== "" && !saleHasProduct(sale, productText)) {
      continue;
    }
    matches.push(sale);
  }

  // Step 2: newest sale first
  matches.sort(function (a, b) {
    return new Date(b.date) - new Date(a.date);
  });

  // Step 3: build the table and add up the total
  var totalSales = 0;
  var html = "<table>";
  html += "<tr><th>Receipt #</th><th>Date &amp; Time</th><th>Cashier</th><th>Items</th><th>Total</th></tr>";

  for (var j = 0; j < matches.length; j++) {
    var s = matches[j];
    totalSales = totalSales + s.total;

    html += "<tr>";
    html += "<td>" + s.id + "</td>";
    html += "<td>" + new Date(s.date).toLocaleString("en-PH") + "</td>";
    html += "<td>" + s.cashier + "</td>";
    html += '<td class="items-cell">' + itemsToText(s.items) + "</td>";
    html += "<td>" + peso(s.total) + "</td>";
    html += "</tr>";
  }

  // Total row at the bottom
  html += '<tr class="total-line">';
  html += '<td colspan="4">TOTAL SALES (' + matches.length + " transaction(s))</td>";
  html += "<td>" + peso(totalSales) + "</td>";
  html += "</tr>";
  html += "</table>";

  if (matches.length === 0) {
    html = "<p>No sales found.</p>";
  }

  table.innerHTML = html;

  info.textContent = "Showing " + matches.length + " of " + allSales.length + " sales.";
  if (productText !== "" && matches.length > 0) {
    info.textContent += " When searching by product, each total is the full amount of that sale.";
  }
}

// Reset all filters.
function clearFilters() {
  document.getElementById("fromDate").value = "";
  document.getElementById("toDate").value = "";
  document.getElementById("productSearch").value = "";
  document.getElementById("cashierFilter").value = "";
  showReport();
}

// Open the print window (the filters and navbar are hidden when printing).
function printReport() {
  window.print();
}

// ===== Run when the page loads =====
fillCashierDropdown();
showReport();

// Update the report whenever a filter changes
document.getElementById("fromDate").addEventListener("change", showReport);
document.getElementById("toDate").addEventListener("change", showReport);
document.getElementById("productSearch").addEventListener("input", showReport);
document.getElementById("cashierFilter").addEventListener("change", showReport);