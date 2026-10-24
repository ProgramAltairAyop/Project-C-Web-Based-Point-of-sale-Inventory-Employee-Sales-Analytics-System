// ===== data.js =====
// Default data, settings, and helper functions used by every page.

// Items with this quantity or less are shown as "Low stock".
var LOW_STOCK_LIMIT = 5;

// Each employee gets this many leave days per year.
var LEAVE_ALLOWANCE = 10;

// Default accounts.
// NOTE: Passwords are stored in plain text ONLY because this is a school
// project with no backend. Real systems must never do this.
var DEFAULT_ACCOUNTS = [
  { username: "Jade Marco Ayop", password: "AyopTest123", role: "Admin" },
  { username: "Ada Joffer", password: "Joffer123", role: "Cashier" }
];

// Default products.
var DEFAULT_PRODUCTS = [
  // Bodysuits / Onesies
  { id: 1, name: "Basic Onesie", category: "Bodysuits / Onesies", size: "NB", color: "White", design: "Plain", price: 150, quantity: 20 },
  { id: 2, name: "Striped Bodysuit", category: "Bodysuits / Onesies", size: "0-3M", color: "Gray", design: "Stripes", price: 220, quantity: 15 },
  { id: 3, name: "Animal Print Onesie", category: "Bodysuits / Onesies", size: "3-6M", color: "Yellow", design: "Animals", price: 280, quantity: 10 },
  { id: 4, name: "Button Bodysuit", category: "Bodysuits / Onesies", size: "6-12M", color: "White", design: "Plain", price: 190, quantity: 4 },

  // Sleepsuits / Pajama
  { id: 5, name: "Zip Sleepsuit", category: "Sleepsuits / Pajama", size: "NB", color: "Gray", design: "Plain", price: 250, quantity: 12 },
  { id: 6, name: "Star Pajama Set", category: "Sleepsuits / Pajama", size: "0-3M", color: "Blue", design: "Stars", price: 320, quantity: 9 },
  { id: 7, name: "Bear Sleepsuit", category: "Sleepsuits / Pajama", size: "3-6M", color: "Brown", design: "Animals", price: 380, quantity: 6 },

  // Crew Neck T-Shirts
  { id: 8, name: "Plain Crew Tee", category: "Crew Neck T-Shirts", size: "0-3M", color: "White", design: "Plain", price: 120, quantity: 25 },
  { id: 9, name: "Striped Crew Tee", category: "Crew Neck T-Shirts", size: "3-6M", color: "Black", design: "Stripes", price: 180, quantity: 14 },
  { id: 10, name: "Dino Crew Tee", category: "Crew Neck T-Shirts", size: "6-12M", color: "Green", design: "Animals", price: 240, quantity: 8 },

  // Leggings & Pull-on Pants
  { id: 11, name: "Cotton Leggings", category: "Leggings & Pull-on Pants", size: "NB", color: "Black", design: "Plain", price: 130, quantity: 18 },
  { id: 12, name: "Jogger Pants", category: "Leggings & Pull-on Pants", size: "3-6M", color: "Gray", design: "Plain", price: 210, quantity: 11 },
  { id: 13, name: "Printed Leggings", category: "Leggings & Pull-on Pants", size: "6-12M", color: "Pink", design: "Stripes", price: 270, quantity: 5 },

  // Terno Sets & Outfit Kits
  { id: 14, name: "Terno Set Basic", category: "Terno Sets & Outfit Kits", size: "0-3M", color: "White", design: "Plain", price: 300, quantity: 10 },
  { id: 15, name: "Animal Terno Set", category: "Terno Sets & Outfit Kits", size: "3-6M", color: "Yellow", design: "Animals", price: 450, quantity: 7 },
  { id: 16, name: "Gift Outfit Kit", category: "Terno Sets & Outfit Kits", size: "NB", color: "Blue", design: "Stars", price: 550, quantity: 3 },

  // Outerwear & Hoodies
  { id: 17, name: "Zip Hoodie", category: "Outerwear & Hoodies", size: "6-12M", color: "Gray", design: "Plain", price: 450, quantity: 9 },
  { id: 18, name: "Bear Ear Hoodie", category: "Outerwear & Hoodies", size: "3-6M", color: "Brown", design: "Animals", price: 600, quantity: 6 },
  { id: 19, name: "Knit Cardigan", category: "Outerwear & Hoodies", size: "0-3M", color: "White", design: "Plain", price: 700, quantity: 2 }
];

// ---------- localStorage helpers ----------

// Get data from localStorage. If nothing is saved yet, return defaultValue.
function loadData(key, defaultValue) {
  var saved = localStorage.getItem(key);
  if (saved === null) {
    return defaultValue;
  }
  return JSON.parse(saved);
}

// Save data to localStorage (as text).
function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Put the default accounts and products in localStorage the first time only.
function setupDefaultData() {
  if (localStorage.getItem("accounts") === null) {
    saveData("accounts", DEFAULT_ACCOUNTS);
  }
  if (localStorage.getItem("products") === null) {
    saveData("products", DEFAULT_PRODUCTS);
  }
}

// ---------- Shared helper functions ----------

// Format a number as Philippine Peso. Example: 150 -> ₱150.00
function peso(amount) {
  return "₱" + Number(amount).toFixed(2);
}

// Turn a saved date into a local date text like "2026-10-16".
function getLocalDate(dateValue) {
  var d = new Date(dateValue);
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

// Today's date as text, like "2026-10-16".
function getToday() {
  return getLocalDate(new Date());
}

// Show a saved time as a readable time. Returns "-" if there is none.
function formatTime(isoText) {
  if (!isoText) {
    return "-";
  }
  return new Date(isoText).toLocaleTimeString("en-PH");
}

// Count the days from a start date to an end date (both days included).
function countDays(startDate, endDate) {
  var start = new Date(startDate + "T00:00:00");
  var end = new Date(endDate + "T00:00:00");
  return Math.round((end - start) / 86400000) + 1;
}

// Approved leave days an employee used this year.
function getLeaveDaysUsed(employee, leaves) {
  var year = String(new Date().getFullYear());
  var used = 0;

  for (var i = 0; i < leaves.length; i++) {
    if (leaves[i].employee === employee &&
        leaves[i].status === "Approved" &&
        leaves[i].startDate.substring(0, 4) === year) {
      used = used + leaves[i].days;
    }
  }
  return used;
}

// Attendance rate (0 to 100) for the last 30 days.
// Rate = days with a Time In / working days (Monday to Saturday).
function getAttendanceRate(employee, attendance) {
  var presentDates = {};
  for (var i = 0; i < attendance.length; i++) {
    if (attendance[i].employee === employee) {
      presentDates[attendance[i].date] = true;
    }
  }

  var workDays = 0;
  var present = 0;
  for (var j = 0; j < 30; j++) {
    var d = new Date();
    d.setDate(d.getDate() - j);

    if (d.getDay() !== 0) { // 0 = Sunday (store is closed)
      workDays = workDays + 1;
      if (presentDates[getLocalDate(d)] === true) {
        present = present + 1;
      }
    }
  }

  if (workDays === 0) {
    return 0;
  }
  return Math.round((present / workDays) * 100);
}

// Run once every time a page loads.
setupDefaultData();