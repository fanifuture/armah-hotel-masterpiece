document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomNumber = urlParams.get("room");
    const tableNumber = urlParams.get("table");
    const location = roomNumber || tableNumber || "N/A";
    const locationType = roomNumber ? "room" : "table";
    let cart = {};
    let allMenuItems = []; // Store all menu items for searching

    // Get all DOM elements
    const welcomeMessage = document.getElementById("welcomeMessage");
    const codeLabel = document.getElementById("codeLabel");
    const callWaiterBtn = document.getElementById('callWaiterBtn');
    const searchInput = document.getElementById('searchInput');
    const menuContainer = document.getElementById('menuContainer');
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotalElement = document.getElementById('cartTotal');
    const orderForm = document.getElementById('orderForm');
    const passwordEye = document.getElementById('passwordEye');
    const codeInput = document.getElementById('code');

    function setupUIForLocation() {
        if (locationType === 'room') {
            welcomeMessage.innerHTML = `Welcome, Room ${location} / እንኳን ደህና መጡ, ክፍል ${location}`;
            codeLabel.textContent = "Room Code / የክፍል ኮድ";
        } else {
            welcomeMessage.innerHTML = `Welcome, Table ${location} / እንኳን ደህና መጡ, ጠረጴዛ ${location}`;
            codeLabel.textContent = "Table Code / የጠረጴዛ ኮድ";
            callWaiterBtn.style.display = 'block'; // Only show for tables
        }
    }

    async function loadMenu() {
        try {
            allMenuItems = await (await fetch('/api/menu')).json();
            renderMenu(allMenuItems); // Initial render of all items
        } catch (error) { 
            menuContainer.innerHTML = '<p>Could not load menu. Please try again later.</p>'; 
        }
    }
    
    function renderMenu(items) {
        menuContainer.innerHTML = "";
        let currentCategory = "";
        if (items.length === 0) {
            menuContainer.innerHTML = '<p style="text-align: center;">No items match your search.</p>';
            return;
        }
        items.forEach(item => {
            if (item.category !== currentCategory) {
                currentCategory = item.category;
                const categoryHeader = document.createElement("h2");
                categoryHeader.textContent = currentCategory;
                menuContainer.appendChild(categoryHeader);
            }
            const itemCard = document.createElement("div");
            itemCard.className = `card menu-item ${!item.isAvailable ? 'unavailable' : ''}`;
            itemCard.dataset.name = item.name;
            itemCard.dataset.price = item.price;

            itemCard.innerHTML = `
                <img src="${item.image}" alt="${item.name}" class="menu-item-image" />
                <div class="menu-item-details">
                    <h3>${item.name} <span class="amharic-name">${item.name_am || ''}</span></h3>
                    <p>${item.description}<br><em>${item.description_am || ''}</em></p>
                    <p><strong>$${parseFloat(item.price).toFixed(2)}</strong></p>
                    <button class="btn add-to-cart-btn">
                        ${!item.isAvailable ? 'Not Available / አይገኝም' : 'Add to Order / ወደ ጋሪ הוסף'}
                    </button>
                </div>`;

            if (!item.isAvailable) itemCard.querySelector('button').disabled = true;
            menuContainer.appendChild(itemCard);
        });
    }
    
    menuContainer.addEventListener('click', e => {
        if (e.target && e.target.classList.contains('add-to-cart-btn')) {
            const card = e.target.closest('.menu-item');
            const { name, price } = card.dataset;
            
            if (cart[name]) {
                cart[name].quantity++;
            } else {
                cart[name] = { quantity: 1, price: parseFloat(price) };
            }
            updateCartDisplay();
        }
    });

    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredItems = allMenuItems.filter(item => 
            (item.name && item.name.toLowerCase().includes(searchTerm)) || 
            (item.name_am && item.name_am.includes(searchTerm))
        );
        renderMenu(filteredItems);
    });

    function updateCartDisplay() {
        if (Object.keys(cart).length === 0) { 
            cartItemsContainer.innerHTML = "<p>Your cart is empty. / ጋሪዎ ባዶ ነው።</p>"; 
        } else { 
            const ul = document.createElement('ul'); 
            for (const [name, details] of Object.entries(cart)) { 
                const li = document.createElement("li"); 
                li.style.marginBottom = '5px';
                li.textContent = `${details.quantity}x ${name}`; 
                ul.appendChild(li); 
            } 
            cartItemsContainer.innerHTML = ''; 
            cartItemsContainer.appendChild(ul); 
        }
        let total = 0;
        for (const details of Object.values(cart)) { total += details.quantity * details.price; }
        cartTotalElement.textContent = `$${parseFloat(total).toFixed(2)}`;
    }

    orderForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (Object.keys(cart).length === 0) return alert("Your cart is empty! / ጋሪዎ ባዶ ነው!");
        const orderData = { items: cart, code: codeInput.value };
        orderData[locationType] = location;
        try {
            const response = await fetch("/place-order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(orderData) });
            const result = await response.json();
            alert(result.message);
            if (result.success) { cart = {}; codeInput.value = ""; updateCartDisplay(); }
        } catch (error) { alert("Could not connect to the server."); }
    });
    
    callWaiterBtn.addEventListener('click', async () => {
        if (!confirm('Call a waiter to this table? / ወደዚህ ጠረጴዛ አስተናጋጅ መጥራት ይፈልጋሉ?')) return;
        try {
            await fetch('/call-waiter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ table: location }) });
            alert('A waiter has been notified. / አስተናጋጁ እንዲያውቅ ተደርጓል።');
        } catch(e) { alert('Could not send signal. / ምልክቱን መላክ አልተቻለም።'); }
    });

    passwordEye.addEventListener('click', () => { const isPassword = codeInput.type === 'password'; codeInput.type = isPassword ? 'text' : 'password'; passwordEye.classList.toggle('bi-eye'); passwordEye.classList.toggle('bi-eye-slash'); });

    setupUIForLocation();
    loadMenu();
    updateCartDisplay();
});