// ===== pos.js =====
// Point of Sale: product list, cart, payment, and receipt.

var products = []; // all products from localStorage
var cart = [];     // items the customer wants to buy

// Format a number as Philippine Peso. Example: 150 -> ₱150.00
function peso(amount) {
  return "₱" + Number(amount).toFixed(2);
}

// Show a message under the cart (pass "" to clear it).
function showMessage(text) {
  document.getElementById("cartMessage").textContent = text;
}

// Find a product by its id. Returns null if not found.
function findProduct(id) {
  for (var i = 0; i < products.length; i++) {
    if (products[i].id === id) {
      return products[i];
    }
  }
  return null;
}

// Show product cards. Only products that match the search box are shown.
function showProducts() {
  var grid = document.getElementById("productGrid");
  var search = document.getElementById("searchBox").value.toLowerCase().trim();
  var html = "";
  var count = 0;

  for (var i = 0; i < products.length; i++) {
    var p = products[i];

    // Search by name, category, size, or color
    var text = (p.name + " " + p.category + " " + p.size + " " + p.color).toLowerCase();
    if (search !== "" && text.indexOf(search) === -1) {
      continue; // skip products that do not match
    }
    count++;

    // Out of stock items cannot be clicked
    if (p.quantity <= 0) {
      html += '<div class="product-card disabled">';
    } else {
      html += '<div class="product-card" onclick="addToCart(' + p.id + ')">';
    }

    html += "<h4>" + p.name + "</h4>";
    html += '<p class="muted">' + p.category + "</p>";
    html += "<p>" + p.size + " | " + p.color + " | " + p.design + "</p>";
    html += "<p><strong>" + peso(p.price) + "</strong></p>";

    if (p.quantity <= 0) {
      html += '<p class="muted">Out of stock</p>';
    } else {
      html += '<p class="muted">Stock: ' + p.quantity + "</p>";
    }

    html += "</div>";
  }

  if (count === 0) {
    html = "<p>No products found.</p>";
  }

  grid.innerHTML = html;
}

// Add one item to the cart (called when a product card is clicked).
function addToCart(id) {
  var product = findProduct(id);
  if (product === null) {
    return;
  }
  showMessage("");

  // If the item is already in the cart, add 1 to its quantity
  for (var i = 0; i < cart.length; i++) {
    if (cart[i].id === id) {
      if (cart[i].qty >= product.quantity) {
        showMessage("Only " + product.quantity + " in stock for " + product.name + ".");
        return;
      }
      cart[i].qty = cart[i].qty + 1;
      showCart();
      return;
    }
  }

  // Not in the cart yet, so add it as a new line
  cart.push({
    id: product.id,
    name: product.name,
    category: product.category,
    size: product.size,
    color: product.color,
    price: product.price,
    qty: 1
  });
  showCart();
}

// Change the quantity of a cart item (change is +1 or -1).
function changeQty(id, change) {
  showMessage("");

  for (var i = 0; i < cart.length; i++) {
    if (cart[i].id === id) {
      var newQty = cart[i].qty + change;
      var product = findProduct(id);

      if (newQty < 1) {
        removeFromCart(id); // quantity 0 means remove
        return;
      }
      if (newQty > product.quantity) {
        showMessage("Only " + product.quantity + " in stock for " + product.name + ".");
        return;
      }
      cart[i].qty = newQty;
      showCart();
      return;
    }
  }
}

// Remove one item from the cart.
function removeFromCart(id) {
  var newCart = [];
  for (var i = 0; i < cart.length; i++) {
    if (cart[i].id !== id) {
      newCart.push(cart[i]);
    }
  }
  cart = newCart;
  showCart();
}

// Remove everything from the cart.
function clearCart() {
  cart = [];
  showMessage("");
  showCart();
}

// Calculate the total price of the cart.
function getTotal() {
  var total = 0;
  for (var i = 0; i < cart.length; i++) {
    total = total + cart[i].price * cart[i].qty;
  }
  return total;
}

// Draw the cart table and update the total.
function showCart() {
  var box = document.getElementById("cartBox");

  if (cart.length === 0) {
    box.innerHTML = '<p class="muted">Cart is empty. Click a product to add it.</p>';
  } else {
    var html = "<table>";
    html += "<tr><th>Item</th><th>Size</th><th>Color</th><th>Qty</th><th>Price</th><th>Subtotal</th><th></th></tr>";

    for (var i = 0; i < cart.length; i++) {
      var item = cart[i];
      html += "<tr>";
      html += "<td>" + item.name + "</td>";
      html += "<td>" + item.size + "</td>";
      html += "<td>" + item.color + "</td>";
      html += '<td class="qty-cell">';
      html += '<button class="qty-btn" onclick="changeQty(' + item.id + ', -1)">-</button> ';
      html += item.qty;
      html += ' <button class="qty-btn" onclick="changeQty(' + item.id + ', 1)">+</button>';
      html += "</td>";
      html += "<td>" + peso(item.price) + "</td>";
      html += "<td>" + peso(item.price * item.qty) + "</td>";
      html += '<td><button class="qty-btn" onclick="removeFromCart(' + item.id + ')">Remove</button></td>';
      html += "</tr>";
    }

    html += "</table>";
    box.innerHTML = html;
  }

  document.getElementById("totalAmount").textContent = peso(getTotal());
  updateChange();
}

// Calculate the change while the cashier types the amount paid.
function updateChange() {
  var paid = parseFloat(document.getElementById("amountPaid").value);
  var total = getTotal();
  var changeBox = document.getElementById("changeAmount");

  if (isNaN(paid) || paid < total) {
    changeBox.textContent = "₱0.00";
  } else {
    changeBox.textContent = peso(paid - total);
  }
}


// Find a product by id inside any list of products. Returns null if not found.
function findProductIn(list, id) {
  for (var i = 0; i < list.length; i++) {
    if (list[i].id === id) {
      return list[i];
    }
  }
  return null;
}


// Finish the sale: check everything, deduct stock, save the record, show the receipt.
function completeSale() {
  var total = getTotal();
  var paid = parseFloat(document.getElementById("amountPaid").value);

  // Check 1: the cart must not be empty
  if (cart.length === 0) {
    showMessage("The cart is empty. Add at least one item.");
    return;
  }

  // Check 2: the amount paid must be a number
  if (isNaN(paid)) {
    showMessage("Please enter the amount paid.");
    return;
  }

  // Check 3: the amount paid must cover the total
  if (paid < total) {
    showMessage("Amount paid is less than the total. Short by " + peso(total - paid) + ".");
    return;
  }

  // Check 4: make sure there is still enough stock.
  // We load the latest stock from localStorage in case it changed.
  var allProducts = loadData("products", []);
  for (var i = 0; i < cart.length; i++) {
    var stockItem = findProductIn(allProducts, cart[i].id);
    if (stockItem === null || cart[i].qty > stockItem.quantity) {
      showMessage("Not enough stock for " + cart[i].name + ". Please adjust the cart.");
      products = allProducts;
      showProducts();
      return;
    }
  }

  // Deduct the sold quantities from the inventory
  for (var j = 0; j < cart.length; j++) {
    var soldItem = findProductIn(allProducts, cart[j].id);
    soldItem.quantity = soldItem.quantity - cart[j].qty;
  }
  saveData("products", allProducts);
  products = allProducts;

  // Build and save the sale record
  var user = getCurrentUser();
  var sales = loadData("sales", []);

  var sale = {
    id: sales.length + 1,
    date: new Date().toISOString(),
    cashier: user.username,
    items: cart,
    total: total,
    paid: paid,
    change: paid - total
  };

  sales.push(sale);
  saveData("sales", sales);

  // Start a fresh cart and refresh the product cards (new stock numbers)
  cart = [];
  showProducts();

  showReceipt(sale);
}

// Show the receipt after a sale.
function showReceipt(sale) {
  var dateText = new Date(sale.date).toLocaleString("en-PH");

  var html = '<div class="receipt">';
  html += "<h2>Baby Clothes Store</h2>";
  html += '<p class="center muted">Official Receipt</p>';
  html += "<p>Receipt #: " + sale.id + "<br>";
  html += "Date: " + dateText + "<br>";
  html += "Cashier: " + sale.cashier + "</p>";
  html += "<hr>";

  html += "<table>";
  html += "<tr><th>Item</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr>";
  for (var i = 0; i < sale.items.length; i++) {
    var item = sale.items[i];
    html += "<tr>";
    html += "<td>" + item.name + " (" + item.size + ", " + item.color + ")</td>";
    html += "<td>" + item.qty + "</td>";
    html += "<td>" + peso(item.price) + "</td>";
    html += "<td>" + peso(item.price * item.qty) + "</td>";
    html += "</tr>";
  }
  html += "</table>";

  html += '<p class="total-row">Total: ' + peso(sale.total) + "</p>";
  html += "<p>Amount Paid: " + peso(sale.paid) + "<br>";
  html += "Change: " + peso(sale.change) + "</p>";
  html += '<p class="center">Thank you for shopping with us!</p>';
  html += "</div>";

  html += '<div class="no-print">';
  html += '<button class="btn" onclick="window.print()">Print Receipt</button> ';
  html += '<button class="btn btn-light" onclick="newSale()">New Sale</button>';
  html += "</div>";

  // Hide the cart and show the receipt
  document.getElementById("checkoutPanel").style.display = "none";
  var receiptPanel = document.getElementById("receiptPanel");
  receiptPanel.innerHTML = html;
  receiptPanel.style.display = "block";
}

// Start a new sale: clear everything and go back to the cart.
function newSale() {
  cart = [];
  document.getElementById("amountPaid").value = "";
  showMessage("");

  document.getElementById("receiptPanel").style.display = "none";
  document.getElementById("checkoutPanel").style.display = "block";

  products = loadData("products", []);
  showProducts();
  showCart();
}

// ===== Run when the page loads =====
products = loadData("products", []);
showProducts();
showCart();

// Update the product list while typing in the search box
document.getElementById("searchBox").addEventListener("input", showProducts);

// Update the change while typing the amount paid
document.getElementById("amountPaid").addEventListener("input", updateChange);