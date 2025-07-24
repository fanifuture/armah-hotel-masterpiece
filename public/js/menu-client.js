document.addEventListener("DOMContentLoaded", () => {
  const get = (id) => document.getElementById(id);
  const urlParams = new URLSearchParams(window.location.search);
  const roomNumber = urlParams.get("room");
  const tableNumber = urlParams.get("table");
  const location = roomNumber || tableNumber || "N/A";
  const locationType = roomNumber ? "room" : "table";
  let cart = {};
  let allMenuItems = [];

  const welcomeMessage = get("welcomeMessage"),
    callWaiterBtn = get("callWaiterBtn"),
    searchInput = get("searchInput");
  const menuContainer = get("menuContainer"),
    cartItemsContainer = get("cartItems"),
    cartTotalElement = get("cartTotal"),
    orderForm = get("orderForm");

  function setupUIForLocation() {
    if (locationType === "room")
      welcomeMessage.innerHTML = `ክፍል ${location} / Room ${location}`;
    else {
      welcomeMessage.innerHTML = `ጠረጴዛ ${location} / Table ${location}`;
      callWaiterBtn.style.display = "block";
    }
  }
  async function loadMenu() {
    try {
      allMenuItems = await (await fetch("/api/menu")).json();
      renderMenu(allMenuItems);
    } catch (error) {
      menuContainer.innerHTML = "<p>Could not load menu.</p>";
    }
  }

  function renderMenu(items) {
    menuContainer.innerHTML = "";
    let currentCategory = "";
    if (items.length === 0) {
      menuContainer.innerHTML =
        '<p style="text-align: center;">No items match your search.</p>';
      return;
    }
    items.forEach((item) => {
      if (item.category !== currentCategory) {
        currentCategory = item.category;
        const h2 = document.createElement("h2");
        h2.textContent = currentCategory;
        menuContainer.appendChild(h2);
      }
      const itemCard = document.createElement("div");
      itemCard.className = `card menu-item ${
        !item.isAvailable ? "unavailable" : ""
      }`;
      // Add all necessary data to the dataset
      itemCard.dataset.name = item.name;
      itemCard.dataset.name_am = item.name_am;
      itemCard.dataset.price = item.price;

      itemCard.innerHTML = `<img src="${item.image}" alt="${
        item.name
      }" class="menu-item-image" /><div class="menu-item-details"><h3><span class="amharic-name">${
        item.name_am || ""
      }</span><br><small>${item.name}</small></h3><p><strong>${parseFloat(
        item.price
      ).toFixed(2)} ETB</strong></p><button class="btn add-to-cart-btn">${
        !item.isAvailable ? "አይገኝም / Not Available" : "ይዘዙ / ADD ORDER"
      }</button></div>`;
      if (!item.isAvailable) itemCard.querySelector("button").disabled = true;
      menuContainer.appendChild(itemCard);
    });
  }

  menuContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("add-to-cart-btn")) {
      const card = e.target.closest(".menu-item");
      const { name, name_am, price } = card.dataset;
      // Now we store the Amharic name too
      if (cart[name]) {
        cart[name].quantity++;
      } else {
        cart[name] = {
          name_am: name_am,
          quantity: 1,
          price: parseFloat(price),
        };
      }
      updateCartDisplay();
    }
  });

  searchInput.addEventListener("input", () => {
    const term = searchInput.value.toLowerCase();
    renderMenu(
      allMenuItems.filter(
        (i) =>
          (i.name && i.name.toLowerCase().includes(term)) ||
          (i.name_am && i.name_am.includes(term))
      )
    );
  });

  function updateCartDisplay() {
    if (Object.keys(cart).length === 0) {
      cartItemsContainer.innerHTML =
        "<p>ትዕዛዝዎ ባዶ ነው። / Your order is empty.</p>";
      orderForm.style.display = "none";
    } else {
      const ul = document.createElement("ul");
      for (const [name, details] of Object.entries(cart)) {
        const li = document.createElement("li");
        li.style.marginBottom = "5px";
        // Display both names in the cart
        li.innerHTML = `${details.quantity}x <strong>${details.name_am}</strong> (${name})`;
        ul.appendChild(li);
      }
      cartItemsContainer.innerHTML = "";
      cartItemsContainer.appendChild(ul);
      orderForm.style.display = "block";
    }
    let total = 0;
    for (const details of Object.values(cart)) {
      total += details.quantity * details.price;
    }
    cartTotalElement.textContent = `${total.toFixed(2)} ETB`;
  }

  orderForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (Object.keys(cart).length === 0)
      return alert("ትዕዛዝዎ ባዶ ነው! / Your order is empty!");

    // We only need to send the English name to the server for consistency
    const itemsForServer = {};
    for (const [name, details] of Object.entries(cart)) {
      itemsForServer[name] = {
        quantity: details.quantity,
        price: details.price,
      };
    }

    const orderData = { items: itemsForServer };
    orderData[locationType] = location;
    try {
      const response = await fetch("/place-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });
      const result = await response.json();
      alert(result.message);
      if (result.success) {
        cart = {};
        updateCartDisplay();
      }
    } catch (error) {
      alert("Could not connect to the server.");
    }
  });

  callWaiterBtn.addEventListener("click", async () => {
    if (!confirm("አስተናጋጅ ይጥሩ? / Call a waiter to this table?")) return;
    try {
      await fetch("/call-waiter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: location }),
      });
      alert("አስተናጋጁ እንዲያውቅ ተደርጓል። / A waiter has been notified.");
    } catch (e) {
      alert("Could not send signal.");
    }
  });

  setupUIForLocation();
  loadMenu();
  updateCartDisplay();
});
