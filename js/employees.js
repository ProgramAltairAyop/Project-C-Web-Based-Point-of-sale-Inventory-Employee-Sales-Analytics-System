// ===== employees.js =====
// Admin page: employees, attendance records, leave approval, analytics.

// ---------- Messages ----------
function showEmployeeMessage(text) {
  document.getElementById("employeeMessage").textContent = text;
}

function showLeaveMessage(text) {
  document.getElementById("leaveMessage").textContent = text;
}

// ---------- 1. Employee list ----------

function showEmployeeList() {
  var accounts = loadData("accounts", []);
  var me = getCurrentUser();

  var html = "<table><tr><th>Name</th><th>Role</th><th>Action</th></tr>";
  for (var i = 0; i < accounts.length; i++) {
    html += "<tr>";
    html += "<td>" + accounts[i].username + "</td>";
    html += "<td>" + accounts[i].role + "</td>";

    if (accounts[i].username === me.username) {
      html += "<td>(you)</td>"; // you cannot delete yourself
    } else {
      html += '<td><button class="qty-btn" onclick="deleteEmployee(' + i + ')">Delete</button></td>';
    }
    html += "</tr>";
  }
  html += "</table>";

  document.getElementById("employeeList").innerHTML = html;
}

function addEmployee() {
  var username = document.getElementById("newUsername").value.trim();
  var password = document.getElementById("newPassword").value;
  var role = document.getElementById("newRole").value;

  if (username === "" || password === "") {
    showEmployeeMessage("Please enter a name and a password.");
    return;
  }

  // The name must be new (not case sensitive)
  var accounts = loadData("accounts", []);
  for (var i = 0; i < accounts.length; i++) {
    if (accounts[i].username.toLowerCase() === username.toLowerCase()) {
      showEmployeeMessage("That name is already used.");
      return;
    }
  }

  accounts.push({ username: username, password: password, role: role });
  saveData("accounts", accounts);

  document.getElementById("newUsername").value = "";
  document.getElementById("newPassword").value = "";
  showEmployeeMessage("Employee added.");
  refreshAll();
}

function deleteEmployee(index) {
  var accounts = loadData("accounts", []);
  var person = accounts[index];

  if (person === undefined) {
    return;
  }
  if (!confirm("Delete " + person.username + "? Their sales and attendance records are kept.")) {
    return;
  }

  var newList = [];
  for (var i = 0; i < accounts.length; i++) {
    if (i !== index) {
      newList.push(accounts[i]);
    }
  }
  saveData("accounts", newList);
  showEmployeeMessage("Employee deleted.");
  refreshAll();
}

// ---------- 2. Attendance records ----------

// Fill the employee dropdown (keeps the current choice).
function fillEmployeeFilter() {
  var select = document.getElementById("attEmployee");
  var chosen = select.value;
  var accounts = loadData("accounts", []);

  var html = '<option value="">All employees</option>';
  for (var i = 0; i < accounts.length; i++) {
    html += '<option value="' + accounts[i].username + '">' + accounts[i].username + "</option>";
  }
  select.innerHTML = html;
  select.value = chosen;
}

function showAttendance() {
  var attendance = loadData("attendance", []);
  var dateFilter = document.getElementById("attDate").value;
  var employeeFilter = document.getElementById("attEmployee").value;

  // Keep only the records that match the filters
  var matches = [];
  for (var i = 0; i < attendance.length; i++) {
    if (dateFilter !== "" && attendance[i].date !== dateFilter) {
      continue;
    }
    if (employeeFilter !== "" && attendance[i].employee !== employeeFilter) {
      continue;
    }
    matches.push(attendance[i]);
  }

  // Newest first
  matches.sort(function (a, b) {
    return new Date(b.timeIn) - new Date(a.timeIn);
  });

  if (matches.length === 0) {
    document.getElementById("attendanceTable").innerHTML = "<p>No attendance records found.</p>";
    return;
  }

  var html = "<table><tr><th>Date</th><th>Employee</th><th>Time In</th><th>Time Out</th><th>Hours</th></tr>";
  for (var j = 0; j < matches.length; j++) {
    var rec = matches[j];
    var hours = "-";
    if (rec.timeOut !== null) {
      hours = ((new Date(rec.timeOut) - new Date(rec.timeIn)) / 3600000).toFixed(2);
    }

    html += "<tr>";
    html += "<td>" + rec.date + "</td>";
    html += "<td>" + rec.employee + "</td>";
    html += "<td>" + formatTime(rec.timeIn) + "</td>";
    html += "<td>" + formatTime(rec.timeOut) + "</td>";
    html += "<td>" + hours + "</td>";
    html += "</tr>";
  }
  html += "</table>";

  document.getElementById("attendanceTable").innerHTML = html;
}

function clearAttendanceFilters() {
  document.getElementById("attDate").value = "";
  document.getElementById("attEmployee").value = "";
  showAttendance();
}

// ---------- 3. Leave requests ----------

function showLeaves() {
  var leaves = loadData("leaves", []);

  if (leaves.length === 0) {
    document.getElementById("leaveTable").innerHTML = "<p>No leave requests yet.</p>";
    return;
  }

  // Newest request first
  var list = leaves.slice(); // make a copy so the saved order stays the same
  list.sort(function (a, b) {
    return new Date(b.requested) - new Date(a.requested);
  });

  var html = "<table><tr><th>Employee</th><th>From</th><th>To</th><th>Days</th>";
  html += "<th>Reason</th><th>Status</th><th>Action</th></tr>";

  for (var i = 0; i < list.length; i++) {
    var leave = list[i];
    var tagClass = "tag";
    if (leave.status === "Pending") {
      tagClass = "tag tag-warn";
    }

    html += "<tr>";
    html += "<td>" + leave.employee + "</td>";
    html += "<td>" + leave.startDate + "</td>";
    html += "<td>" + leave.endDate + "</td>";
    html += "<td>" + leave.days + "</td>";
    html += "<td>" + leave.reason + "</td>";
    html += '<td><span class="' + tagClass + '">' + leave.status + "</span></td>";

    if (leave.status === "Pending") {
      html += '<td class="qty-cell">';
      html += '<button class="qty-btn" onclick="setLeaveStatus(' + leave.id + ', \'Approved\')">Approve</button> ';
      html += '<button class="qty-btn" onclick="setLeaveStatus(' + leave.id + ', \'Declined\')">Decline</button>';
      html += "</td>";
    } else {
      html += "<td>-</td>";
    }
    html += "</tr>";
  }
  html += "</table>";

  document.getElementById("leaveTable").innerHTML = html;
}

// Approve or decline a leave request.
function setLeaveStatus(id, newStatus) {
  var leaves = loadData("leaves", []);
  showLeaveMessage("");

  for (var i = 0; i < leaves.length; i++) {
    if (leaves[i].id === id) {

      if (leaves[i].status !== "Pending") {
        showLeaveMessage("This request was already answered.");
        showLeaves();
        return;
      }

      // Before approving, check the employee still has enough leave days
      if (newStatus === "Approved") {
        var used = getLeaveDaysUsed(leaves[i].employee, leaves);
        if (used + leaves[i].days > LEAVE_ALLOWANCE) {
          showLeaveMessage("Cannot approve: " + leaves[i].employee + " does not have enough leave days left.");
          return;
        }
      }

      leaves[i].status = newStatus;
      saveData("leaves", leaves);
      refreshAll();
      return;
    }
  }
}

// ---------- 4. Leave balances ----------

function showBalances() {
  var accounts = loadData("accounts", []);
  var leaves = loadData("leaves", []);

  var html = "<table><tr><th>Employee</th><th>Yearly Allowance</th><th>Used</th><th>Remaining</th><th>Pending Requests</th></tr>";

  for (var i = 0; i < accounts.length; i++) {
    var name = accounts[i].username;
    var used = getLeaveDaysUsed(name, leaves);

    var pending = 0;
    for (var j = 0; j < leaves.length; j++) {
      if (leaves[j].employee === name && leaves[j].status === "Pending") {
        pending = pending + 1;
      }
    }

    html += "<tr>";
    html += "<td>" + name + "</td>";
    html += "<td>" + LEAVE_ALLOWANCE + " days</td>";
    html += "<td>" + used + " days</td>";
    html += "<td>" + (LEAVE_ALLOWANCE - used) + " days</td>";
    html += "<td>" + pending + "</td>";
    html += "</tr>";
  }
  html += "</table>";

  document.getElementById("balanceTable").innerHTML = html;
}

// ---------- 5. People analytics ----------

function showAnalytics() {
  var accounts = loadData("accounts", []);
  var attendance = loadData("attendance", []);
  var leaves = loadData("leaves", []);
  var sales = loadData("sales", []);

  var html = "<table><tr><th>Employee</th><th>Role</th><th>Attendance Rate (30 days)</th>";
  html += "<th>Leaves Taken</th><th>Transactions</th><th>Total Sales</th></tr>";

  for (var i = 0; i < accounts.length; i++) {
    var name = accounts[i].username;

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
    html += "<td>" + getAttendanceRate(name, attendance) + "%</td>";
    html += "<td>" + getLeaveDaysUsed(name, leaves) + " days</td>";
    html += "<td>" + count + "</td>";
    html += "<td>" + peso(total) + "</td>";
    html += "</tr>";
  }
  html += "</table>";

  document.getElementById("analyticsTable").innerHTML = html;
}

// ---------- Run everything ----------

function refreshAll() {
  showEmployeeList();
  fillEmployeeFilter();
  showAttendance();
  showLeaves();
  showBalances();
  showAnalytics();
}

refreshAll();

document.getElementById("attDate").addEventListener("change", showAttendance);
document.getElementById("attEmployee").addEventListener("change", showAttendance);