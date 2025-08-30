// Order Page Functionality
class OrderManager {
    constructor() {
        this.app = window.bellaVistaApp;
        this.orderData = {};
        this.deliveryFee = 3.99;
        this.taxRate = 0.08;
        
        this.init();
    }
    
    init() {
        if (this.app) {
            this.loadOrderSummary();
            this.setupEventListeners();
            this.setupFormValidation();
        }
    }
    
    setupEventListeners() {
        // Form submission
        const checkoutForm = document.getElementById('checkoutForm');
        if (checkoutForm) {
            checkoutForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.processOrder();
            });
        }
        
        // Payment method changes
        const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
        paymentMethods.forEach(method => {
            method.addEventListener('change', () => {
                this.updatePaymentInfo(method.value);
            });
        });
        
        // Real-time validation
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
            
            input.addEventListener('input', () => {
                this.clearFieldError(input);
            });
        });
        
        // Auto-fill address features
        this.setupAddressAutofill();
    }
    
    loadOrderSummary() {
        const orderItemsContainer = document.getElementById('orderItems');
        const cart = this.app.cart;
        
        if (!orderItemsContainer || cart.length === 0) {
            this.redirectToCart();
            return;
        }
        
        // Display order items
        orderItemsContainer.innerHTML = cart.map(item => this.createOrderItemHTML(item)).join('');
        
        // Calculate and display totals
        this.calculateOrderTotals();
        
        if (window.feather) {
            feather.replace();
        }
    }
    
    createOrderItemHTML(item) {
        return `
            <div class="order-item">
                <div class="order-item-details">
                    <h4 class="order-item-name">${item.name}</h4>
                    <p class="order-item-quantity">Qty: ${item.quantity}</p>
                </div>
                <div class="order-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
            </div>
        `;
    }
    
    calculateOrderTotals() {
        const subtotal = this.app.getCartTotal();
        const tax = subtotal * this.taxRate;
        const total = subtotal + this.deliveryFee + tax;
        
        // Update display
        this.updateElement('orderSubtotal', `$${subtotal.toFixed(2)}`);
        this.updateElement('orderDeliveryFee', `$${this.deliveryFee.toFixed(2)}`);
        this.updateElement('orderTax', `$${tax.toFixed(2)}`);
        this.updateElement('orderTotal', `$${total.toFixed(2)}`);
        
        return { subtotal, tax, total };
    }
    
    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }
    
    setupFormValidation() {
        // Custom validation rules
        this.validationRules = {
            customerName: {
                required: true,
                minLength: 2,
                pattern: /^[a-zA-Z\s]+$/,
                message: 'Please enter a valid name (letters only)'
            },
            customerPhone: {
                required: true,
                pattern: /^[\+]?[1-9][\d]{0,15}$/,
                message: 'Please enter a valid phone number'
            },
            customerEmail: {
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Please enter a valid email address'
            },
            deliveryAddress: {
                required: true,
                minLength: 5,
                message: 'Please enter a complete delivery address'
            },
            city: {
                required: true,
                minLength: 2,
                pattern: /^[a-zA-Z\s]+$/,
                message: 'Please enter a valid city name'
            },
            zipCode: {
                required: true,
                pattern: /^\d{5}(-\d{4})?$/,
                message: 'Please enter a valid ZIP code'
            }
        };
    }
    
    validateField(field) {
        const fieldName = field.name;
        const value = field.value.trim();
        const rules = this.validationRules[fieldName];
        
        if (!rules) return true;
        
        // Clear previous errors
        this.clearFieldError(field);
        
        // Required field check
        if (rules.required && !value) {
            this.showFieldError(field, 'This field is required');
            return false;
        }
        
        // Skip other validations if field is not required and empty
        if (!rules.required && !value) {
            return true;
        }
        
        // Minimum length check
        if (rules.minLength && value.length < rules.minLength) {
            this.showFieldError(field, `Minimum ${rules.minLength} characters required`);
            return false;
        }
        
        // Pattern check
        if (rules.pattern && !rules.pattern.test(value)) {
            this.showFieldError(field, rules.message);
            return false;
        }
        
        // Field-specific validations
        if (fieldName === 'customerEmail' && value && !this.isValidEmail(value)) {
            this.showFieldError(field, rules.message);
            return false;
        }
        
        if (fieldName === 'customerPhone' && !this.isValidPhone(value)) {
            this.showFieldError(field, rules.message);
            return false;
        }
        
        // Mark field as valid
        field.classList.add('valid');
        return true;
    }
    
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    
    isValidPhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length >= 10 && cleaned.length <= 15;
    }
    
    showFieldError(field, message) {
        field.classList.add('error');
        field.classList.remove('valid');
        
        // Remove existing error message
        this.clearFieldError(field);
        
        // Add new error message
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        field.parentNode.appendChild(errorElement);
    }
    
    clearFieldError(field) {
        field.classList.remove('error');
        const errorElement = field.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }
    
    validateForm() {
        const form = document.getElementById('checkoutForm');
        const requiredFields = form.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    processOrder() {
        if (!this.validateForm()) {
            this.app.showNotification('Please fix the errors in the form', 'cart-notification');
            this.scrollToFirstError();
            return;
        }
        
        // Collect form data
        this.collectOrderData();
        
        // Show loading state
        this.showLoadingState();
        
        // Simulate order processing
        setTimeout(() => {
            this.submitOrder();
        }, 2000);
    }
    
    collectOrderData() {
        const form = document.getElementById('checkoutForm');
        const formData = new FormData(form);
        
        this.orderData = {
            customer: {
                name: formData.get('customerName'),
                phone: formData.get('customerPhone'),
                email: formData.get('customerEmail') || ''
            },
            delivery: {
                address: formData.get('deliveryAddress'),
                city: formData.get('city'),
                zipCode: formData.get('zipCode'),
                notes: formData.get('deliveryNotes') || ''
            },
            payment: {
                method: formData.get('paymentMethod')
            },
            items: [...this.app.cart],
            totals: this.calculateOrderTotals(),
            timestamp: new Date().toISOString(),
            orderNumber: this.generateOrderNumber()
        };
    }
    
    generateOrderNumber() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return `BV-${timestamp}-${random}`;
    }
    
    showLoadingState() {
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<div class="loading"></div> Processing Order...';
        }
        
        // Disable form inputs
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.disabled = true;
        });
    }
    
    submitOrder() {
        try {
            // Save order data
            this.saveOrderData();
            
            // Clear cart
            this.app.clearCart();
            
            // Redirect to confirmation page
            window.location.href = 'confirmation.html';
            
        } catch (error) {
            console.error('Order submission failed:', error);
            this.handleOrderError();
        }
    }
    
    saveOrderData() {
        // Save to localStorage for confirmation page
        localStorage.setItem('lastOrder', JSON.stringify(this.orderData));
        
        // Save order history
        let orderHistory = JSON.parse(localStorage.getItem('orderHistory') || '[]');
        orderHistory.unshift(this.orderData);
        
        // Keep only last 10 orders
        if (orderHistory.length > 10) {
            orderHistory = orderHistory.slice(0, 10);
        }
        
        localStorage.setItem('orderHistory', JSON.stringify(orderHistory));
    }
    
    handleOrderError() {
        this.app.showNotification('Order submission failed. Please try again.', 'cart-notification');
        
        // Re-enable form
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i data-feather="check"></i> Place Order';
            if (window.feather) {
                feather.replace();
            }
        }
        
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.disabled = false;
        });
    }
    
    scrollToFirstError() {
        const firstError = document.querySelector('.error');
        if (firstError) {
            firstError.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
            firstError.focus();
        }
    }
    
    updatePaymentInfo(paymentMethod) {
        // Update UI based on selected payment method
        const paymentInfo = document.getElementById('paymentInfo');
        if (paymentInfo) {
            let infoText = '';
            
            switch (paymentMethod) {
                case 'cash':
                    infoText = 'Please have exact change ready for delivery.';
                    break;
                case 'card':
                    infoText = 'You will be charged upon order confirmation.';
                    break;
                case 'digital':
                    infoText = 'Payment will be processed through your digital wallet.';
                    break;
            }
            
            paymentInfo.textContent = infoText;
        }
    }
    
    setupAddressAutofill() {
        // Simple address autocomplete (can be enhanced with Google Places API)
        const addressInput = document.getElementById('deliveryAddress');
        if (addressInput) {
            addressInput.addEventListener('input', this.app.debounce(() => {
                // Implement address suggestions here
                this.showAddressSuggestions(addressInput.value);
            }, 300));
        }
    }
    
    showAddressSuggestions(query) {
        // Placeholder for address suggestions
        // In a real app, this would call a geocoding service
        if (query.length < 3) return;
        
        console.log('Address suggestions for:', query);
    }
    
    redirectToCart() {
        this.app.showNotification('Your cart is empty. Redirecting...', 'cart-notification');
        setTimeout(() => {
            window.location.href = 'cart.html';
        }, 2000);
    }
    
    // Order tracking functionality
    trackOrder(orderNumber) {
        // Simulate order tracking
        const statuses = [
            { status: 'confirmed', time: '2 min ago', message: 'Order confirmed' },
            { status: 'preparing', time: '5 min ago', message: 'Kitchen started preparing' },
            { status: 'ready', time: '20 min ago', message: 'Order ready for delivery' },
            { status: 'delivered', time: '35 min ago', message: 'Order delivered' }
        ];
        
        return statuses;
    }
    
    // Estimated delivery time calculation
    calculateDeliveryTime() {
        const baseTime = 30; // minutes
        const cartItems = this.app.cart.length;
        const additionalTime = Math.floor(cartItems / 3) * 5; // 5 min per 3 items
        
        return baseTime + additionalTime;
    }
    
    // Order modification (before confirmation)
    modifyOrder() {
        if (confirm('Do you want to modify your order? You will be redirected to the cart.')) {
            window.location.href = 'cart.html';
        }
    }
}

// Initialize order manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (window.bellaVistaApp) {
        window.orderManager = new OrderManager();
    }
});

// Global functions
function loadOrderSummary() {
    if (window.orderManager) {
        window.orderManager.loadOrderSummary();
    }
}

function initializeOrderForm() {
    if (window.orderManager) {
        window.orderManager.setupFormValidation();
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OrderManager;
}
