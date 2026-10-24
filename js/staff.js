// ===== staff.js =====
// "My Attendance" and "My Leave" boxes on the home page (Admin and Cashier).

// Find today's attendance record for an employee. Returns null if none.
function findTodayRecord(attendance, name) {
  var today = getToday();
  for (var i = 0; i < attendance.length; i++) {
    if (attendance[i].employee === name && attendance[i].date === today) {
      return attendance[i];
    }
  }
  return null;
}

function showAttendanceMessage(text) {
  document.getElementById("attendanceMessage").textContent = text;
}

function showLeaveMessage(text) {
  document.getElementById("leaveMessage").textContent = text;
}

// ---------- Attendance ----------

function showMyAttendance() {
  var name = getCurrentUser().username;
  var attendance = loadData("attendance", []);
  var record = findTodayRecord(attendance, name);

  // Status text
  var status = "You have not timed in today.";
  if (record !== null && record.timeOut === null) {
    status = "Timed in at " + formatTime(record.timeIn) + ". Remember to time out.";
  } else if (record !== null) {
    status = "Timed in at " + formatTime(record.timeIn) + " and timed out at " + formatTime(record.timeOut) + ".";
  }
  document.getElementById("attendanceStatus").textContent = status;

  // My last 5 records, newest first
  var mine = [];
  for (var i = 0; i < attendance.length; i++) {
    if (attendance[i].employee === name) {
      mine.push(attendance[i]);
    }
  }
  mine.sort(function (a, b) {
    return new Date(b.timeIn) - new Date(a.timeIn);
  });

  var html = "";
  if (mine.length === 0) {
    html = '<p class="muted">No attendance records yet.</p>';
  } else {
    html = "<table><tr><th>Date</th><th>Time In</th><th>Time Out</th></tr>";
    for (var j = 0; j < mine.length && j < 5; j++) {
      html += "<tr>";
      html += "<td>" + mine[j].date + "</td>";
      html += "<td>" + formatTime(mine[j].timeIn) + "</td>";
      html += "<td>" + formatTime(mine[j].timeOut) + "</td>";
      html += "</tr>";
    }
    html += "</table>";
  }
  document.getElementById("myAttendanceTable").innerHTML = html;
}

function timeIn() {
  var name = getCurrentUser().username;
  var attendance = loadData("attendance", []);

  if (findTodayRecord(attendance, name) !== null) {
    showAttendanceMessage("You already timed in today.");
    return;
  }

  attendance.push({
    id: attendance.length + 1,
    employee: name,
    date: getToday(),
    timeIn: new Date().toISOString(),
    timeOut: null
  });
  saveData("attendance", attendance);

  showAttendanceMessage("Time In recorded.");
  showMyAttendance();
}

function timeOut() {
  var name = getCurrentUser().username;
  var attendance = loadData("attendance", []);
  var record = findTodayRecord(attendance, name);

  if (record === null) {
    showAttendanceMessage("You have not timed in today.");
    return;
  }
  if (record.timeOut !== null) {
    showAttendanceMessage("You already timed out today.");
    return;
  }

  record.timeOut = new Date().toISOString();
  saveData("attendance", attendance);

  showAttendanceMessage("Time Out recorded.");
  showMyAttendance();
}

// ---------- Leave ----------

function showMyLeave() {
  var name = getCurrentUser().username;
  var leaves = loadData("leaves", []);
  var used = getLeaveDaysUsed(name, leaves);

  document.getElementById("leaveBalanceText").textContent =
    "Leave balance: " + (LEAVE_ALLOWANCE - used) + " of " + LEAVE_ALLOWANCE + " days left this year.";

  // My requests, newest first
  var mine = [];
  for (var i = 0; i < leaves.length; i++) {
    if (leaves[i].employee === name) {
      mine.push(leaves[i]);
    }
  }
  mine.sort(function (a, b) {
    return new Date(b.requested) - new Date(a.requested);
  });

  var html = "";
  if (mine.length === 0) {
    html = '<p class="muted">No leave requests yet.</p>';
  } else {
    html = "<table><tr><th>From</th><th>To</th><th>Days</th><th>Status</th></tr>";
    for (var j = 0; j < mine.length; j++) {
      html += "<tr>";
      html += "<td>" + mine[j].startDate + "</td>";
      html += "<td>" + mine[j].endDate + "</td>";
      html += "<td>" + mine[j].days + "</td>";
      html += "<td>" + mine[j].status + "</td>";
      html += "</tr>";
    }
    html += "</table>";
  }
  document.getElementById("myLeaveTable").innerHTML = html;
}

function requestLeave() {
  var name = getCurrentUser().username;
  var start = document.getElementById("leaveStart").value;
  var end = document.getElementById("leaveEnd").value;
  var reason = document.getElementById("leaveReason").value.trim();

  // Check the input
  if (start === "" || end === "") {
    showLeaveMessage("Please choose the start and end dates.");
    return;
  }
  if (end < start) {
    showLeaveMessage("The end date cannot be before the start date.");
    return;
  }
  if (start < getToday()) {
    showLeaveMessage("The start date cannot be in the past.");
    return;
  }
  if (reason === "") {
    showLeaveMessage("Please write a reason.");
    return;
  }

  // Check the leave balance
  var leaves = loadData("leaves", []);
  var days = countDays(start, end);
  var remaining = LEAVE_ALLOWANCE - getLeaveDaysUsed(name, leaves);

  if (days > remaining) {
    showLeaveMessage("You asked for " + days + " day(s) but only have " + remaining + " left.");
    return;
  }

  leaves.push({
    id: leaves.length + 1,
    employee: name,
    startDate: start,
    endDate: end,
    days: days,
    reason: reason,
    status: "Pending",
    requested: new Date().toISOString()
  });
  saveData("leaves", leaves);

  document.getElementById("leaveStart").value = "";
  document.getElementById("leaveEnd").value = "";
  document.getElementById("leaveReason").value = "";
  showLeaveMessage("Leave request sent. Wait for the admin to approve it.");
  showMyLeave();
}

// ===== Run when the page loads =====
showMyAttendance();
showMyLeave();