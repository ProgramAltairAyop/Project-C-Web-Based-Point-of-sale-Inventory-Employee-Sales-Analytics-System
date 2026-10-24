// ===== auth.js =====
// Login, logout, page protection (role checking), and the navigation bar.

// Get the logged-in user, or null if nobody is logged in.
function getCurrentUser() {
  var saved = sessionStorage.getItem("currentUser");
  if (saved === null) {
    return null;
  }
  return JSON.parse(saved);
}

// Check username and password. Returns true if correct.
function login(username, password) {
  var accounts = loadData("accounts", []);

  for (var i = 0; i < accounts.length; i++) {
    if (accounts[i].username === username && accounts[i].password === password) {
      // Save the user and role (sessionStorage clears when the tab closes)
      var user = { username: accounts[i].username, role: accounts[i].role };
      sessionStorage.setItem("currentUser", JSON.stringify(user));
      return true;
    }
  }
  return false;
}

// Log out and go back to the login page.
function logout() {
  sessionStorage.removeItem("currentUser");
  window.location.href = "index.html";
}

// Protect the page based on <body data-access="...">
//   "public" = login page (logged-in users skip to home)
//   "user"   = any logged-in user
//   "admin"  = Admin only
function checkAccess() {
  var access = document.body.getAttribute("data-access");
  var user = getCurrentUser();

  if (access === "public") {
    if (user !== null) {
      window.location.href = "home.html";
    }
    return;
  }

  // Not logged in? Send back to the login page.
  if (user === null) {
    window.location.href = "index.html";
    return;
  }

  // Cashier trying to open an admin page? Send to home.
  if (access === "admin" && user.role !== "Admin") {
    window.location.href = "home.html";
  }
}

// Build the navigation bar. The menu depends on the user's role.
function buildNavbar() {
  var navBox = document.getElementById("navbar");
  var user = getCurrentUser();

  // Stop if this page has no navbar box, or nobody is logged in.
  if (navBox === null || user === null) {
    return;
  }

  // Links that both Cashier and Admin can see
  var links = [
    { text: "Home", page: "home.html" },
    { text: "POS", page: "pos.html" },
    { text: "Products", page: "products.html" },
    { text: "About", page: "about.html" },
    { text: "Contact", page: "contact.html" }
  ];

  // Extra links for Admin only
  if (user.role === "Admin") {
    links.push({ text: "Dashboard", page: "dashboard.html" });
    links.push({ text: "Inventory", page: "inventory.html" });
    links.push({ text: "Employees", page: "employees.html" });
    links.push({ text: "Reports", page: "reports.html" });
  }

  // Find the file name of the current page (example: "about.html")
  var currentPage = window.location.pathname.split("/").pop();

  // Build the HTML text for the menu
  var html = '<div class="navbar">';
  html += '<span class="brand">Baby Clothes Store</span>';
  html += '<ul class="nav-links">';

  for (var i = 0; i < links.length; i++) {
    var activeClass = "";
    if (links[i].page === currentPage) {
      activeClass = ' class="active"';
    }
    html += '<li><a href="' + links[i].page + '"' + activeClass + '>' + links[i].text + '</a></li>';
  }

  html += '</ul>';
  html += '<div class="nav-user">';
  html += '<span>' + user.username + ' (' + user.role + ')</span>';
  html += '<button class="btn btn-small" onclick="logout()">Logout</button>';
  html += '</div>';
  html += '</div>';

  navBox.innerHTML = html;
}

// Hide anything with class="admin-only" if the user is not an Admin.
function hideAdminOnly() {
  var user = getCurrentUser();
  if (user !== null && user.role === "Admin") {
    return; // Admin can see everything
  }

  var items = document.getElementsByClassName("admin-only");
  // Go backwards because removing an item changes the list
  for (var i = items.length - 1; i >= 0; i--) {
    items[i].parentNode.removeChild(items[i]);
  }
}

// Show "Name (Role)" in any element with id="welcomeText".
function showWelcome() {
  var user = getCurrentUser();
  var welcome = document.getElementById("welcomeText");
  if (user !== null && welcome !== null) {
    welcome.textContent = user.username + " (" + user.role + ")";
  }
}

// Handle the login form (only exists on index.html).
function setupLoginForm() {
  var form = document.getElementById("loginForm");
  if (form === null) {
    return;
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault(); // stop the page from reloading

    var username = document.getElementById("username").value.trim();
    var password = document.getElementById("password").value;
    var errorBox = document.getElementById("errorMessage");

    if (login(username, password)) {
      window.location.href = "home.html";
    } else {
      errorBox.textContent = "Wrong username or password. Please try again.";
    }
  });
}

// Run these when the page loads.
checkAccess();
buildNavbar();
hideAdminOnly();
showWelcome();
setupLoginForm();