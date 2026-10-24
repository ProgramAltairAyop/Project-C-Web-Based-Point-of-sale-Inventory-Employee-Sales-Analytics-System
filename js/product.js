// ===== products.js =====
// Shows all products on products.html, grouped by category.

// Show the products in the #productList box.
function showProducts() {
  var box = document.getElementById("productList");
  if (box === null) {
    return;
  }

  var products = loadData("products", []);

  // Step 1: make a list of the different categories
  var categories = [];
  for (var i = 0; i < products.length; i++) {
    if (categories.indexOf(products[i].category) === -1) {
      categories.push(products[i].category);
    }
  }

  // Step 2: build one table for each category
  var html = "";
  for (var c = 0; c < categories.length; c++) {
    html += "<h3>" + categories[c] + "</h3>";
    html += "<table>";
    html += "<tr><th>Name</th><th>Size</th><th>Color</th><th>Design</th><th>Price</th></tr>";

    for (var p = 0; p < products.length; p++) {
      if (products[p].category === categories[c]) {
        html += "<tr>";
        html += "<td>" + products[p].name + "</td>";
        html += "<td>" + products[p].size + "</td>";
        html += "<td>" + products[p].color + "</td>";
        html += "<td>" + products[p].design + "</td>";
        html += "<td>₱" + products[p].price.toFixed(2) + "</td>";
        html += "</tr>";
      }
    }

    html += "</table>";
  }

  box.innerHTML = html;
}

showProducts();