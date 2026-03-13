let cart = [];
let total = 0;

function addToCart(productName, productPrice) {
  cart.push({ name: productName, price: productPrice });
  total += productPrice;

  document.getElementById("cart-count").innerText = cart.length;
  document.getElementById("cart-total").innerText = total;

  updateCartDisplay();
}

function updateCartDisplay() {
  const cartItems = document.getElementById("cart-items");
  cartItems.innerHTML = "";

  cart.forEach((item, index) => {
    let li = document.createElement("li");
    li.innerHTML = `${item.name} - ₹${item.price} 
      <button onclick="removeFromCart(${index})" style="margin-left:10px; background:red; color:white; border:none; padding:5px 8px; border-radius:4px; cursor:pointer;">Remove</button>`;
    cartItems.appendChild(li);
  });
}

function removeFromCart(index) {
  total -= cart[index].price;
  cart.splice(index, 1);

  document.getElementById("cart-count").innerText = cart.length;
  document.getElementById("cart-total").innerText = total;

  updateCartDisplay();
}