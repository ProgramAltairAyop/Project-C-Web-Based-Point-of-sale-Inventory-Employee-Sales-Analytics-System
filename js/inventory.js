// ===== inventory.js =====
// Admin inventory page: add, edit, delete, search, and low-stock warning.

// Lists used by the dropdowns
var CATEGORIES = [
  "Bodysuits / Onesies",
  "Sleepsuits / Pajama",
  "Crew Neck T-Shirts",
  "Leggings & Pull-on Pants",
  "Terno Sets & Outfit Kits",
  "Outerwear & Hoodies"
];
var SIZES = ["NB", "0-3M", "3-6M", "6-12M"];

var products = [];   // all products from localStorage
var editingId = null; // id of the item being edited (null = adding a new item)

// Fill a <select> dropdown with options.
// firstText is optional (example: "All categories" for the filter).
function fillDropdown(selectId, options, firstText) {
  var html = "";
  if (firstText) {
    html += '<option value="">' + firstText + "</option>";
  }
  for (var i = 0; i < options.length; i++) {
    html += '<option value="' + options[i] + '">' + options[i] + "</option>";
  }
  document.getElementById(selectId).innerHTML = html;
}

// Return the stock status text for a quantity.
function getStatus(qty) {
  if (qty <= 0) {
    return "Out of stock";
  }
  if (qty <= LOW_STOCK_LIMIT) {
    return "Low stock";
  }
  return "In stock";
}

// Show a message under the form.
function showFormMessage(text) {
  document.getElementById("formMessage").textContent = text;
}

// Draw the inventory table (uses the search box and category filter).
function showTable() {
  products = loadData("products", []);

  var search = document.getElementById("searchBox").value.toLowerCase().trim();
  var category = document.getElementById("filterCategory").value;

  var html = "<table>";
  html += "<tr><th>Name</th><th>Category</th><th>Size</th><th>Color</th>";
  html += "<th>Design</th><th>Price</th><th>Qty</th><th>Status</th><th>Actions</th></tr>";

  var shown = 0;
  var warningCount = 0;

  for (var i = 0; i < products.length; i++) {
    var p = products[i];

    // Count low / out-of-stock items for the warning at the top
    if (p.quantity <= LOW_STOCK_LIMIT) {
      warningCount++;
    }

    // Skip items that do not match the filters
    var text = (p.name + " " + p.category + " " + p.size + " " + p.color + " " + p.design).toLowerCase();
    if (search !== "" && text.indexOf(search) === -1) {
      continue;
    }
    if (category !== "" && p.category !== category) {
      continue;
    }
    shown++;

    var status = getStatus(p.quantity);
    var tagClass = "tag";
    if (status !== "In stock") {
      tagClass = "tag tag-warn"; // black label for low / out of stock
    }

    html += "<tr>";
    html += "<td>" + p.name + "</td>";
    html += "<td>" + p.category + "</td>";
    html += "<td>" + p.size + "</td>";
    html += "<td>" + p.color + "</td>";
    html += "<td>" + p.design + "</td>";
    html += "<td>₱" + p.price.toFixed(2) + "</td>";
    html += "<td>" + p.quantity + "</td>";
    html += '<td><span class="' + tagClass + '">' + status + "</span></td>";
    html += '<td class="qty-cell">';
    html += '<button class="qty-btn" onclick="editProduct(' + p.id + ')">Edit</button> ';
    html += '<button class="qty-btn" onclick="deleteProduct(' + p.id + ')">Delete</button>';
    html += "</td>";
    html += "</tr>";
  }

  html += "</table>";

  if (shown === 0) {
    html = "<p>No items found.</p>";
  }

  document.getElementById("inventoryTable").innerHTML = html;
  document.getElementById("tableInfo").textContent =
    "Showing " + shown + " of " + products.length + " items.";

  // Low-stock warning box
  var warning = document.getElementById("stockWarning");
  if (warningCount > 0) {
    warning.textContent = "Warning: " + warningCount + " item(s) are low on stock or out of stock.";
    warning.style.display = "block";
  } else {
    warning.style.display = "none";
  }
}

// Empty the form and go back to "Add" mode.
function clearForm() {
  editingId = null;
  document.getElementById("itemName").value = "";
  document.getElementById("itemCategory").selectedIndex = 0;
  document.getElementById("itemSize").selectedIndex = 0;
  document.getElementById("itemColor").value = "";
  document.getElementById("itemDesign").value = "";
  document.getElementById("itemPrice").value = "";
  document.getElementById("itemQty").value = "";
  document.getElementById("formTitle").textContent = "Add New Item";
  document.getElementById("saveBtn").textContent = "Add Item";
  document.getElementById("cancelBtn").style.display = "none";
  showFormMessage("");
}

// Save the form: add a new item, or update the item being edited.
function saveProduct() {
  products = loadData("products", []);

  // Read the form
  var name = document.getElementById("itemName").value.trim();
  var category = document.getElementById("itemCategory").value;
  var size = document.getElementById("itemSize").value;
  var color = document.getElementById("itemColor").value.trim();
  var design = document.getElementById("itemDesign").value.trim();
  var price = parseFloat(document.getElementById("itemPrice").value);
  var quantity = parseFloat(document.getElementById("itemQty").value);

  // Check the input
  if (name === "" || color === "" || design === "") {
    showFormMessage("Please fill in the name, color, and design.");
    return;
  }
  if (isNaN(price) || price <= 0) {
    showFormMessage("Price must be a number greater than 0.");
    return;
  }
  if (isNaN(quantity) || quantity < 0 || quantity % 1 !== 0) {
    showFormMessage("Quantity must be a whole number (0 or more).");
    return;
  }

  if (editingId === null) {
    // ADD: new id = highest id + 1
    var newId = 1;
    for (var i = 0; i < products.length; i++) {
      if (products[i].id >= newId) {
        newId = products[i].id + 1;
      }
    }
    products.push({
      id: newId,
      name: name,
      category: category,
      size: size,
      color: color,
      design: design,
      price: price,
      quantity: quantity
    });
    saveData("products", products);
    clearForm();
    showFormMessage("Item added.");
  } else {
    // EDIT: find the item and update it
    for (var j = 0; j < products.length; j++) {
      if (products[j].id === editingId) {
        products[j].name = name;
        products[j].category = category;
        products[j].size = size;
        products[j].color = color;
        products[j].design = design;
        products[j].price = price;
        products[j].quantity = quantity;
      }
    }
    saveData("products", products);
    clearForm();
    showFormMessage("Item updated.");
  }

  showTable();
}

// Put an item into the form so it can be edited.
function editProduct(id) {
  for (var i = 0; i < products.length; i++) {
    if (products[i].id === id) {
      var p = products[i];
      editingId = id;

      document.getElementById("itemName").value = p.name;
      document.getElementById("itemCategory").value = p.category;
      document.getElementById("itemSize").value = p.size;
      document.getElementById("itemColor").value = p.color;
      document.getElementById("itemDesign").value = p.design;
      document.getElementById("itemPrice").value = p.price;
      document.getElementById("itemQty").value = p.quantity;

      document.getElementById("formTitle").textContent = "Edit Item";
      document.getElementById("saveBtn").textContent = "Update Item";
      document.getElementById("cancelBtn").style.display = "inline-block";
      showFormMessage("");

      window.scrollTo(0, 0); // go to the top where the form is
      return;
    }
  }
}

// Delete an item (asks for confirmation first).
function deleteProduct(id) {
  if (!confirm("Delete this item? This cannot be undone.")) {
    return;
  }

  products = loadData("products", []);
  var newList = [];
  for (var i = 0; i < products.length; i++) {
    if (products[i].id !== id) {
      newList.push(products[i]);
    }
  }
  saveData("products", newList);

  // If the deleted item was being edited, reset the form
  if (editingId === id) {
    clearForm();
  }
  showTable();
}

// ===== Run when the page loads =====
fillDropdown("itemCategory", CATEGORIES);
fillDropdown("itemSize", SIZES);
fillDropdown("filterCategory", CATEGORIES, "All categories");
showTable();

// Update the table while typing or changing the filter
document.getElementById("searchBox").addEventListener("input", showTable);
document.getElementById("filterCategory").addEventListener("change", showTable);