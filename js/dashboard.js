// ===== dashboard.js =====
// Admin dashboard: inventory, sales activity, charts, leaderboard, employees.

var salesChart = null;    // the bar chart (kept so we can redraw it)
var categoryChart = null; // the doughnut chart

// ---------- Small helper functions ----------

// Get a list of dates (oldest first) for the last N days, including today.
// Example: ["2026-10-10", ..., "2026-10-16"]
function getLastDays(count) {
  var days = [];
  for (var i = count - 1; i >= 0; i--) {
    var d = new Date();
    d.setDate(d.getDate() - i);
    days.push(getLocalDate(d));
  }
  return days;
}

// Turn "2026-10-16" into a short label like "Oct 16".
function shortDate(dateText) {
  var d = new Date(dateText + "T00:00:00");
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

// Turn an object into an array of its values.
function objectToArray(obj) {
  var list = [];
  for (var key in obj) {
    list.push(obj[key]);
  }
  return list;
}

// ---------- 1. Inventory tracking ----------

// Make a small table for a list of products.
function makeStockTable(list, emptyText) {
  if (list.length === 0) {
    return "<p>" + emptyText + "</p>";
  }
  var html = "<table>";
  html += "<tr><th>Item</th><th>Size</th><th>Color</th><th>Qty</th></tr>";
  for (var i = 0; i < list.length; i++) {
    html += "<tr>";
    html += "<td>" + list[i].name + "</td>";
    html += "<td>" + list[i].size + "</td>";
    html += "<td>" + list[i].color + "</td>";
    html += "<td>" + list[i].quantity + "</td>";
    html += "</tr>";
  }
  html += "</table>";
  return html;
}

function showInventory() {
  var products = loadData("products", []);
  var totalUnits = 0;
  var lowList = [];
  var outList = [];

  for (var i = 0; i < products.length; i++) {
    totalUnits = totalUnits + products[i].quantity;

    if (products[i].quantity <= 0) {
      outList.push(products[i]);
    } else if (products[i].quantity <= LOW_STOCK_LIMIT) {
      lowList.push(products[i]);
    }
  }

  document.getElementById("totalProducts").textContent = products.length;
  document.getElementById("totalUnits").textContent = totalUnits;
  document.getElementById("lowCount").textContent = lowList.length;
  document.getElementById("outCount").textContent = outList.length;

  document.getElementById("lowStockList").innerHTML =
    makeStockTable(lowList, "No low-stock items.");
  document.getElementById("outStockList").innerHTML =
    makeStockTable(outList, "No out-of-stock items.");
}

// ---------- 2. Sales activity (daily and weekly) ----------

// Make a list with one entry per day: { date, count, total }
function getDailyTotals(sales, days) {
  var result = [];
  for (var i = 0; i < days.length; i++) {
    result.push({ date: days[i], count: 0, total: 0 });
  }

  for (var j = 0; j < sales.length; j++) {
    var saleDate = getLocalDate(sales[j].date);
    for (var k = 0; k < result.length; k++) {
      if (result[k].date === saleDate) {
        result[k].count = result[k].count + 1;
        result[k].total = result[k].total + sales[j].total;
      }
    }
  }
  return result;
}

function showSalesActivity(daily) {
  var today = daily[daily.length - 1]; // last item = today
  var weekTotal = 0;
  var weekCount = 0;

  for (var i = 0; i < daily.length; i++) {
    weekTotal = weekTotal + daily[i].total;
    weekCount = weekCount + daily[i].count;
  }

  document.getElementById("todayTotal").textContent = peso(today.total);
  document.getElementById("todayCount").textContent = today.count;
  document.getElementById("weekTotal").textContent = peso(weekTotal);
  document.getElementById("weekCount").textContent = weekCount;

  // Table: newest day first
  var html = "<table>";
  html += "<tr><th>Date</th><th>Transactions</th><th>Total Sales</th></tr>";
  for (var j = daily.length - 1; j >= 0; j--) {
    html += "<tr>";
    html += "<td>" + shortDate(daily[j].date) + "</td>";
    html += "<td>" + daily[j].count + "</td>";
    html += "<td>" + peso(daily[j].total) + "</td>";
    html += "</tr>";
  }
  html += '<tr class="total-line">';
  html += "<td>Last 7 days</td><td>" + weekCount + "</td><td>" + peso(weekTotal) + "</td>";
  html += "</tr>";
  html += "</table>";

  document.getElementById("dailyTable").innerHTML = html;
}

// ---------- 3. Charts ----------

// Bar chart: sales per day
function showSalesChart(daily) {
  var message = document.getElementById("salesChartMessage");

  if (typeof Chart === "undefined") {
    message.textContent = "Charts could not load. Please check your internet connection.";
    return;
  }

  var labels = [];
  var totals = [];
  for (var i = 0; i < daily.length; i++) {
    labels.push(shortDate(daily[i].date));
    totals.push(daily[i].total);
  }

  // Remove the old chart before drawing a new one
  if (salesChart !== null) {
    salesChart.destroy();
  }

  salesChart = new Chart(document.getElementById("salesChart"), {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Sales (₱)",
        data: totals,
        backgroundColor: "#000000"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

// Doughnut chart: sales per category
function showCategoryChart(sales) {
  var message = document.getElementById("categoryChartMessage");
  var canvas = document.getElementById("categoryChart");

  if (typeof Chart === "undefined") {
    message.textContent = "Charts could not load. Please check your internet connection.";
    return;
  }

  // Add up the sales amount for each category
  var byCategory = {};
  for (var i = 0; i < sales.length; i++) {
    for (var j = 0; j < sales[i].items.length; j++) {
      var item = sales[i].items[j];
      if (byCategory[item.category] === undefined) {
        byCategory[item.category] = 0;
      }
      byCategory[item.category] = byCategory[item.category] + item.price * item.qty;
    }
  }

  var labels = [];
  var totals = [];
  for (var name in byCategory) {
    labels.push(name);
    totals.push(byCategory[name]);
  }

  if (categoryChart !== null) {
    categoryChart.destroy();
    categoryChart = null;
  }

  // No sales yet: hide the chart and show a message
  if (labels.length === 0) {
    canvas.style.display = "none";
    message.textContent = "No sales yet.";
    return;
  }
  canvas.style.display = "block";
  message.textContent = "";

  categoryChart = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [{
        data: totals,
        // Black, white, and gray only
        backgroundColor: ["#000000", "#333333", "#666666", "#999999", "#cccccc", "#e6e6e6"],
        borderColor: "#ffffff",
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } }
    }
  });
}

// ---------- 4. Leaderboard ----------

function showLeaderboard(sales) {
  var byProduct = {};
  var byCashier = {};

  for (var i = 0; i < sales.length; i++) {
    var sale = sales[i];

    // Count sales per cashier
    if (byCashier[sale.cashier] === undefined) {
      byCashier[sale.cashier] = { name: sale.cashier, count: 0, total: 0 };
    }
    byCashier[sale.cashier].count = byCashier[sale.cashier].count + 1;
    byCashier[sale.cashier].total = byCashier[sale.cashier].total + sale.total;

    // Count units sold per product
    for (var j = 0; j < sale.items.length; j++) {
      var item = sale.items[j];
      if (byProduct[item.id] === undefined) {
        byProduct[item.id] = {
          name: item.name + " (" + item.size + ", " + item.color + ")",
          qty: 0,
          total: 0
        };
      }
      byProduct[item.id].qty = byProduct[item.id].qty + item.qty;
      byProduct[item.id].total = byProduct[item.id].total + item.price * item.qty;
    }
  }

  // Turn into lists and sort the biggest first
  var productList = objectToArray(byProduct);
  productList.sort(function (a, b) { return b.qty - a.qty; });

  var cashierList = objectToArray(byCashier);
  cashierList.sort(function (a, b) { return b.total - a.total; });

  // Top 5 products table
  var html = "";
  if (productList.length === 0) {
    html = "<p>No sales yet.</p>";
  } else {
    html = "<table><tr><th>#</th><th>Product</th><th>Units Sold</th><th>Sales</th></tr>";
    for (var p = 0; p < productList.length && p < 5; p++) {
      html += "<tr>";
      html += "<td>" + (p + 1) + "</td>";
      html += "<td>" + productList[p].name + "</td>";
      html += "<td>" + productList[p].qty + "</td>";
      html += "<td>" + peso(productList[p].total) + "</td>";
      html += "</tr>";
    }
    html += "</table>";
  }
  document.getElementById("topProducts").innerHTML = html;

  // Top 5 cashiers table
  html = "";
  if (cashierList.length === 0) {
    html = "<p>No sales yet.</p>";
  } else {
    html = "<table><tr><th>#</th><th>Cashier</th><th>Transactions</th><th>Sales</th></tr>";
    for (var c = 0; c < cashierList.length && c < 5; c++) {
      html += "<tr>";
      html += "<td>" + (c + 1) + "</td>";
      html += "<td>" + cashierList[c].name + "</td>";
      html += "<td>" + cashierList[c].count + "</td>";
      html += "<td>" + peso(cashierList[c].total) + "</td>";
      html += "</tr>";
    }
    html += "</table>";
  }
  document.getElementById("topCashiers").innerHTML = html;
}

// ---------- 5. Employees ----------

function showEmployees(sales) {
  var accounts = loadData("accounts", []);
  var attendance = loadData("attendance", []);
  var leaves = loadData("leaves", []);
  var today = getToday();

  var html = "<table><tr><th>Name</th><th>Role</th><th>Today</th><th>Attendance Rate (30 days)</th>";
  html += "<th>Leaves Taken</th><th>Transactions</th><th>Total Sales</th></tr>";

  for (var i = 0; i < accounts.length; i++) {
    var name = accounts[i].username;

    // Today's Time In / Time Out status
    var todayText = "Not timed in";
    for (var a = 0; a < attendance.length; a++) {
      if (attendance[a].employee === name && attendance[a].date === today) {
        if (attendance[a].timeOut === null) {
          todayText = "In since " + formatTime(attendance[a].timeIn);
        } else {
          todayText = "Out (" + formatTime(attendance[a].timeIn) + " to " + formatTime(attendance[a].timeOut) + ")";
        }
      }
    }

    // Sales by this employee
    var count = 0;
    var total = 0;
    for (var j = 0; j < sales.length; j++) {
      if (sales[j].cashier === name) {
        count = count + 1;
        total = total + sales[j].total;
      }
    }

    html += "<tr>";
    html += "<td>" + name + "</td>";
    html += "<td>" + accounts[i].role + "</td>";
    html += "<td>" + todayText + "</td>";
    html += "<td>" + getAttendanceRate(name, attendance) + "%</td>";
    html += "<td>" + getLeaveDaysUsed(name, leaves) + " days</td>";
    html += "<td>" + count + "</td>";
    html += "<td>" + peso(total) + "</td>";
    html += "</tr>";
  }
  html += "</table>";
  document.getElementById("employeeTable").innerHTML = html;

  // Pending leave requests
  var pending = 0;
  for (var k = 0; k < leaves.length; k++) {
    if (leaves[k].status === "Pending") {
      pending = pending + 1;
    }
  }
  document.getElementById("pendingLeaves").innerHTML =
    "Pending leave requests: <strong>" + pending + "</strong>. Approve or decline them on the Employees page.";
}

// ---------- Load everything ----------

function loadDashboard() {
  var sales = loadData("sales", []);
  var daily = getDailyTotals(sales, getLastDays(7));

  showInventory();
  showSalesActivity(daily);
  showSalesChart(daily);
  showCategoryChart(sales);
  showLeaderboard(sales);
  showEmployees(sales);

  document.getElementById("lastUpdated").textContent =
    "Last updated: " + new Date().toLocaleTimeString("en-PH") + " ";
}

// Run when the page loads
loadDashboard();

// Update automatically when a sale is made in another tab,
// and when you come back to this tab.
window.addEventListener("storage", loadDashboard);
window.addEventListener("focus", loadDashboard);