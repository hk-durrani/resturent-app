// Cart Page Functionality
class CartManager {
    constructor() {
        this.app = window.bellaVistaApp;
        this.deliveryFee = 3.99;
        this.taxRate = 0.08;
        
        this.init();
    }
    
    init() {
        if (this.app) {
            this.loadCartItems();
            this.calculateTotals();
            this.setupEventListeners();
        }
    }
    
    loadCartItems() {
        const cartItemsContainer = document.getElementById('cartItems');
        const emptyCartContainer = document.getElementById('emptyCart');
        const cartSummaryContainer = document.getElementById('cartSummary');
        
        if (!cartItemsContainer) return;
        
        const cart = this.app.cart;
        
        if (cart.length === 0) {
            cartItemsContainer.style.display = 'none';
            if (emptyCartContainer) emptyCartContainer.style.display = 'block';
            if (cartSummaryContainer) cartSummaryContainer.style.display = 'none';
            return;
        }
        
        cartItemsContainer.style.display = 'block';
        if (emptyCartContainer) emptyCartContainer.style.display = 'none';
        if (cartSummaryContainer) cartSummaryContainer.style.display = 'block';
        
        cartItemsContainer.innerHTML = cart.map(item => this.createCartItemHTML(item)).join('');
        
        // Replace feather icons
        if (window.feather) {
            feather.replace();
        }
    }
    
    createCartItemHTML(item) {
        return `
            <div class="cart-item animate-fade-in" data-item-id="${item.id}">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image" loading="lazy">
                <div class="cart-item-details">
                    <h4 class="cart-item-name">${item.name}</h4>
                    <p class="cart-item-price">$${item.price.toFixed(2)} each</p>
                    <div class="cart-item-controls">
                        <button class="quantity-btn" onclick="cartManager.decreaseQuantity(${item.id})" aria-label="Decrease quantity">
                            <i data-feather="minus"></i>
                        </button>
                        <input type="number" class="quantity-input" value="${item.quantity}" min="1" 
                               onchange="cartManager.updateQuantity(${item.id}, this.value)" aria-label="Quantity">
                        <button class="quantity-btn" onclick="cartManager.increaseQuantity(${item.id})" aria-label="Increase quantity">
                            <i data-feather="plus"></i>
                        </button>
                        <button class="remove-btn" onclick="cartManager.removeItem(${item.id})" aria-label="Remove item">
                            <i data-feather="trash-2"></i>
                            Remove
                        </button>
                    </div>
                    <div class="cart-item-total">
                        <strong>Subtotal: $${(item.price * item.quantity).toFixed(2)}</strong>
                    </div>
                </div>
            </div>
        `;
    }
    
    setupEventListeners() {
        // Checkout button
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', (e) => {
                if (this.app.cart.length === 0) {
                    e.preventDefault();
                    this.app.showNotification('Your cart is empty!', 'cart-notification');
                } else {
                    // Save cart total for checkout page
                    const total = this.calculateTotal();
                    localStorage.setItem('cartTotal', total.toFixed(2));
                }
            });
        }
        
        // Continue shopping button
        const continueShoppingBtns = document.querySelectorAll('a[href="menu.html"]');
        continueShoppingBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Add animation when leaving the page
                document.body.style.transition = 'opacity 0.3s ease-out';
                document.body.style.opacity = '0.8';
            });
        });
    }
    
    increaseQuantity(itemId) {
        const item = this.app.cart.find(cartItem => cartItem.id === itemId);
        if (item) {
            item.quantity += 1;
            this.app.saveCart();
            this.updateItemDisplay(itemId);
            this.calculateTotals();
            this.animateQuantityChange(itemId);
        }
    }
    
    decreaseQuantity(itemId) {
        const item = this.app.cart.find(cartItem => cartItem.id === itemId);
        if (item && item.quantity > 1) {
            item.quantity -= 1;
            this.app.saveCart();
            this.updateItemDisplay(itemId);
            this.calculateTotals();
            this.animateQuantityChange(itemId);
        }
    }
    
    updateQuantity(itemId, newQuantity) {
        const quantity = parseInt(newQuantity);
        if (quantity > 0) {
            this.app.updateCartItemQuantity(itemId, quantity);
            this.updateItemDisplay(itemId);
            this.calculateTotals();
            this.animateQuantityChange(itemId);
        }
    }
    
    removeItem(itemId) {
        // Add confirmation dialog
        if (confirm('Are you sure you want to remove this item from your cart?')) {
            const itemElement = document.querySelector(`[data-item-id="${itemId}"]`);
            if (itemElement) {
                itemElement.style.transition = 'all 0.3s ease-out';
                itemElement.style.transform = 'translateX(-100%)';
                itemElement.style.opacity = '0';
                
                setTimeout(() => {
                    this.app.removeFromCart(itemId);
                    this.loadCartItems();
                    this.calculateTotals();
                    this.app.showNotification('Item removed from cart', 'cart-notification');
                }, 300);
            }
        }
    }
    
    updateItemDisplay(itemId) {
        const item = this.app.cart.find(cartItem => cartItem.id === itemId);
        const itemElement = document.querySelector(`[data-item-id="${itemId}"]`);
        
        if (item && itemElement) {
            const quantityInput = itemElement.querySelector('.quantity-input');
            const subtotalElement = itemElement.querySelector('.cart-item-total strong');
            
            if (quantityInput) {
                quantityInput.value = item.quantity;
            }
            
            if (subtotalElement) {
                subtotalElement.textContent = `Subtotal: $${(item.price * item.quantity).toFixed(2)}`;
            }
        }
    }
    
    animateQuantityChange(itemId) {
        const itemElement = document.querySelector(`[data-item-id="${itemId}"]`);
        if (itemElement) {
            itemElement.style.transform = 'scale(1.02)';
            itemElement.style.transition = 'transform 0.2s ease-out';
            
            setTimeout(() => {
                itemElement.style.transform = 'scale(1)';
            }, 200);
        }
    }
    
    calculateTotals() {
        const subtotal = this.app.getCartTotal();
        const tax = subtotal * this.taxRate;
        const total = subtotal + this.deliveryFee + tax;
        
        this.updateTotalDisplay(subtotal, tax, total);
        
        return total;
    }
    
    calculateTotal() {
        const subtotal = this.app.getCartTotal();
        const tax = subtotal * this.taxRate;
        return subtotal + this.deliveryFee + tax;
    }
    
    updateTotalDisplay(subtotal, tax, total) {
        const subtotalElement = document.getElementById('subtotal');
        const taxElement = document.getElementById('tax');
        const totalElement = document.getElementById('total');
        const deliveryFeeElement = document.getElementById('deliveryFee');
        
        if (subtotalElement) {
            subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
        }
        
        if (taxElement) {
            taxElement.textContent = `$${tax.toFixed(2)}`;
        }
        
        if (totalElement) {
            totalElement.textContent = `$${total.toFixed(2)}`;
            
            // Animate total change
            totalElement.style.transform = 'scale(1.1)';
            totalElement.style.color = 'var(--primary-color)';
            setTimeout(() => {
                totalElement.style.transform = 'scale(1)';
                totalElement.style.color = '';
            }, 300);
        }
        
        if (deliveryFeeElement) {
            deliveryFeeElement.textContent = `$${this.deliveryFee.toFixed(2)}`;
        }
    }
    
    // Discount and coupon functionality
    applyCoupon(couponCode) {
        const validCoupons = {
            'WELCOME10': { discount: 0.10, type: 'percentage', description: '10% off' },
            'FREESHIP': { discount: this.deliveryFee, type: 'fixed', description: 'Free shipping' },
            'SAVE5': { discount: 5.00, type: 'fixed', description: '$5 off' }
        };
        
        const coupon = validCoupons[couponCode.toUpperCase()];
        if (coupon) {
            this.appliedCoupon = coupon;
            this.calculateTotals();
            this.app.showSuccessMessage(`Coupon applied: ${coupon.description}`);
            return true;
        } else {
            this.app.showNotification('Invalid coupon code', 'cart-notification');
            return false;
        }
    }
    
    removeCoupon() {
        this.appliedCoupon = null;
        this.calculateTotals();
        this.app.showNotification('Coupon removed', 'cart-notification');
    }
    
    // Save cart state for offline access
    saveCartState() {
        const cartState = {
            items: this.app.cart,
            subtotal: this.app.getCartTotal(),
            deliveryFee: this.deliveryFee,
            tax: this.app.getCartTotal() * this.taxRate,
            total: this.calculateTotal(),
            appliedCoupon: this.appliedCoupon,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('cartState', JSON.stringify(cartState));
    }
    
    // Load cart state from storage
    loadCartState() {
        const savedState = localStorage.getItem('cartState');
        if (savedState) {
            const cartState = JSON.parse(savedState);
            
            // Check if cart state is recent (within 24 hours)
            const timestamp = new Date(cartState.timestamp);
            const now = new Date();
            const hoursDiff = (now - timestamp) / (1000 * 60 * 60);
            
            if (hoursDiff < 24) {
                this.appliedCoupon = cartState.appliedCoupon;
                return cartState;
            }
        }
        
        return null;
    }
    
    // Clear cart with confirmation
    clearCart() {
        if (this.app.cart.length === 0) {
            this.app.showNotification('Cart is already empty', 'cart-notification');
            return;
        }
        
        if (confirm('Are you sure you want to clear your entire cart?')) {
            this.app.clearCart();
            this.loadCartItems();
            this.calculateTotals();
            this.app.showNotification('Cart cleared', 'cart-notification');
        }
    }
}

// Initialize cart manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (window.bellaVistaApp) {
        window.cartManager = new CartManager();
    }
});

// Global function for loading cart items
function loadCartItems() {
    if (window.cartManager) {
        window.cartManager.loadCartItems();
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CartManager;
}
