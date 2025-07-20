// This event listener ensures our code runs only after the entire HTML page has been loaded.
document.addEventListener("DOMContentLoaded", () => {
  // --- PART 1: DYNAMIC TABLE NUMBER ---

  // Create a URLSearchParams object from the current page's URL.
  // This lets us easily read parameters like '?table=12'.
  const urlParams = new URLSearchParams(window.location.search);

  // Get the value of the 'table' parameter from the URL.
  // If it doesn't exist, default to 'N/A'.
  const tableNumber = urlParams.get("table") || "N/A";

  // Find the HTML element with the id 'tableNumberDisplay' and update its text.
  const tableNumberElement = document.getElementById("tableNumberDisplay");
  if (tableNumberElement) {
    tableNumberElement.textContent = tableNumber;
  }

  // --- PART 2: SHOPPING CART LOGIC ---

  // A JavaScript object to store the items in our cart.
  // e.g., { "Doro Wat": { quantity: 1, price: 18.99 }, ... }
  const cart = {};

  // Get references to the HTML elements we need to interact with.
  const addToCartButtons = document.querySelectorAll(".add-to-cart-btn");
  const cartItemsContainer = document.getElementById("cartItems");
  const cartTotalElement = document.getElementById("cartTotal");

  // Loop through every "Add to Order" button on the page.
  addToCartButtons.forEach((button) => {
    // Add a click event listener to each button.
    button.addEventListener("click", () => {
      // Find the parent '.menu-item' card of the button that was clicked.
      const menuItem = button.closest(".menu-item");

      // Get the item's name and price from the data attributes we set in the HTML.
      const name = menuItem.dataset.name;
      const price = parseFloat(menuItem.dataset.price);

      // If the item is already in the cart, just increase its quantity.
      if (cart[name]) {
        cart[name].quantity++;
      } else {
        // Otherwise, add it to the cart for the first time.
        cart[name] = {
          quantity: 1,
          price: price,
        };
      }

      // Announce what was added (good for user feedback).
      console.log(`Added ${name} to cart. Cart is now:`, cart);

      // Update the display to show the new cart contents.
      updateCartDisplay();
    });
  });

  // This function redraws the cart display based on the current state of the 'cart' object.
  function updateCartDisplay() {
    // Clear the current display.
    cartItemsContainer.innerHTML = "";

    let total = 0;

    // Check if the cart is empty.
    if (Object.keys(cart).length === 0) {
      cartItemsContainer.innerHTML = "<p>Your cart is empty.</p>";
      cartTotalElement.textContent = "$0.00";
      return;
    }

    // Loop through each item in the cart object.
    for (const [name, details] of Object.entries(cart)) {
      // Create a new paragraph element for each item.
      const itemElement = document.createElement("p");
      itemElement.textContent = `${details.quantity}x ${name}`;
      cartItemsContainer.appendChild(itemElement);

      // Add the item's cost to the total.
      total += details.quantity * details.price;
    }

    // Update the total price display, formatted to 2 decimal places.
    cartTotalElement.textContent = `$${total.toFixed(2)}`;
  }

  // Initialize the cart display when the page loads.
  updateCartDisplay();
});
// --- PART 1.5: REAL-TIME MENU SEARCH ---

// --- PART 1.5: BILINGUAL REAL-TIME MENU SEARCH ---

const searchInput = document.getElementById('menuSearchInput');
const allMenuItems = document.querySelectorAll('.menu-item');

if (searchInput) {
    searchInput.addEventListener('keyup', () => {
        // Get the search query. We don't convert to lower case here because
        // Tigrinya script is case-sensitive in its own way.
        const searchQuery = searchInput.value.trim();

        // If the search bar is empty, show all items and stop.
        if (searchQuery === "") {
            allMenuItems.forEach(item => {
                item.style.display = 'flex';
            });
            return; // Exit the function early
        }

        allMenuItems.forEach(item => {
            // Get both the English and Tigrinya names from the data attributes.
            const englishName = item.dataset.name.toLowerCase(); // English can be lowercased
            const tigrinyaName = item.dataset.nameTg; // Keep Tigrinya as is

            // Check if either the English name (in lowercase) contains the lowercase search query
            // OR if the Tigrinya name contains the search query as-is.
            if (englishName.includes(searchQuery.toLowerCase()) || tigrinyaName.includes(searchQuery)) {
                // If there's a match in EITHER language, show the item.
                item.style.display = 'flex';
            } else {
                // If no match in either language, hide the item.
                item.style.display = 'none';
            }
        });
    });
}
// --- PART 3: CALL WAITER FUNCTIONALITY ---

// --- PART 3 & 4 Combined: ACCORDION FOR SERVICES ---

const accordionHeaders = document.querySelectorAll('.accordion-header');

accordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
        // First, handle the special case for the "Call Waiter" button
        if (header.id === 'callWaiterHeader') {
            if (confirm("Are you sure you want to call a waiter to your table?")) {
                alert(`A waiter has been notified and will be with you shortly at Table ${tableNumber}.`);
                // Note: We don't need to disable this visually since it doesn't stay "open".
                // The real spam prevention will be on the server side.
            }
            return; // Stop the function here so it doesn't try to open/close
        }

        // For all other accordion items (like Wi-Fi)
        const content = header.nextElementSibling;
        
        // Toggle the 'active' class on the header (for the arrow)
        header.classList.toggle('active');

        // Check if the content is open or closed
        if (content.style.maxHeight) {
            // If it has a maxHeight, it's open. Close it.
            content.style.maxHeight = null;
            content.style.padding = '0 20px'; // Animate padding out
        } else {
            // If it's closed, open it.
            content.style.padding = '0 20px 15px 20px'; // Animate padding in
            content.style.maxHeight = content.scrollHeight + "px"; // Set max-height to its natural full height
        }
    });
});