// Bella Vista Restaurant PWA - Main Application
class BellaVistaApp {
    constructor() {
        this.cart = [];
        this.theme = 'light';
        this.installPrompt = null;
        
        this.init();
    }
    
    init() {
        this.loadCart();
        this.loadTheme();
        this.setupEventListeners();
        this.setupPWA();
        this.updateCartCount();
        this.initThemeToggle();
        this.setupMobileMenu();
    }
    
    // Theme Management
    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);
    }
    
    setTheme(theme) {
        this.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        this.updateThemeIcon();
    }
    
    toggleTheme() {
        const newTheme = this.theme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }
    
    updateThemeIcon() {
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.setAttribute('data-feather', this.theme === 'light' ? 'moon' : 'sun');
            if (window.feather) {
                feather.replace();
            }
        }
    }
    
    initThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    }
    
    // Mobile Menu
    setupMobileMenu() {
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        const navMenu = document.getElementById('navMenu');
        
        if (mobileMenuToggle && navMenu) {
            mobileMenuToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                this.updateMobileMenuIcon();
            });
            
            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!mobileMenuToggle.contains(e.target) && !navMenu.contains(e.target)) {
                    navMenu.classList.remove('active');
                    this.updateMobileMenuIcon();
                }
            });
            
            // Close menu when clicking on a link
            navMenu.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    navMenu.classList.remove('active');
                    this.updateMobileMenuIcon();
                });
            });
        }
    }
    
    updateMobileMenuIcon() {
        const navMenu = document.getElementById('navMenu');
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        
        if (mobileMenuToggle && navMenu) {
            const icon = mobileMenuToggle.querySelector('svg');
            if (icon) {
                icon.setAttribute('data-feather', navMenu.classList.contains('active') ? 'x' : 'menu');
                if (window.feather) {
                    feather.replace();
                }
            }
        }
    }
    
    // Cart Management
    loadCart() {
        const savedCart = localStorage.getItem('cart');
        this.cart = savedCart ? JSON.parse(savedCart) : [];
    }
    
    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
        this.updateCartCount();
    }
    
    addToCart(item) {
        const existingItem = this.cart.find(cartItem => cartItem.id === item.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({
                ...item,
                quantity: 1
            });
        }
        
        this.saveCart();
        this.showCartNotification('Item added to cart!');
        this.animateCartIcon();
    }
    
    removeFromCart(itemId) {
        this.cart = this.cart.filter(item => item.id !== itemId);
        this.saveCart();
    }
    
    updateCartItemQuantity(itemId, quantity) {
        const item = this.cart.find(cartItem => cartItem.id === itemId);
        if (item) {
            if (quantity <= 0) {
                this.removeFromCart(itemId);
            } else {
                item.quantity = quantity;
                this.saveCart();
            }
        }
    }
    
    getCartTotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }
    
    getCartItemCount() {
        return this.cart.reduce((total, item) => total + item.quantity, 0);
    }
    
    updateCartCount() {
        const cartCounts = document.querySelectorAll('.cart-count, #cartCount');
        const count = this.getCartItemCount();
        
        cartCounts.forEach(element => {
            if (element) {
                element.textContent = count;
                element.style.display = count > 0 ? 'block' : 'none';
            }
        });
    }
    
    animateCartIcon() {
        const cartLinks = document.querySelectorAll('a[href="cart.html"]');
        cartLinks.forEach(link => {
            link.style.transform = 'scale(1.1)';
            setTimeout(() => {
                link.style.transform = 'scale(1)';
            }, 200);
        });
    }
    
    clearCart() {
        this.cart = [];
        this.saveCart();
    }
    
    // Notifications
    showCartNotification(message) {
        this.showNotification(message, 'cart-notification');
    }
    
    showSuccessMessage(message) {
        this.showNotification(message, 'success-message');
    }
    
    showNotification(message, elementId) {
        let notification = document.getElementById(elementId);
        
        if (!notification) {
            // Create notification element if it doesn't exist
            notification = document.createElement('div');
            notification.id = elementId;
            notification.className = elementId;
            notification.innerHTML = `
                <div class="notification-content">
                    <i data-feather="check-circle"></i>
                    <span class="notification-text">${message}</span>
                </div>
            `;
            document.body.appendChild(notification);
            
            if (window.feather) {
                feather.replace();
            }
        } else {
            notification.querySelector('.notification-text').textContent = message;
        }
        
        // Show notification
        notification.classList.add('show');
        
        // Hide after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    // PWA Installation
    setupPWA() {
        // Register service worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                        console.log('Service Worker registered successfully:', registration.scope);
                    })
                    .catch(error => {
                        console.log('Service Worker registration failed:', error);
                    });
            });
        }
        
        // Handle install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.installPrompt = e;
            this.showInstallPrompt();
        });
        
        // Handle successful installation
        window.addEventListener('appinstalled', () => {
            console.log('PWA installed successfully');
            this.hideInstallPrompt();
            this.showSuccessMessage('App installed successfully!');
        });
    }
    
    showInstallPrompt() {
        const installPrompt = document.getElementById('installPrompt');
        const installButton = document.getElementById('installButton');
        const dismissButton = document.getElementById('dismissInstall');
        
        if (installPrompt && this.installPrompt) {
            // Check if user has dismissed the prompt before
            const dismissed = localStorage.getItem('installPromptDismissed');
            if (dismissed) return;
            
            // Show prompt after a delay
            setTimeout(() => {
                installPrompt.classList.add('show');
            }, 5000);
            
            if (installButton) {
                installButton.addEventListener('click', () => {
                    this.triggerInstall();
                });
            }
            
            if (dismissButton) {
                dismissButton.addEventListener('click', () => {
                    this.dismissInstallPrompt();
                });
            }
        }
    }
    
    triggerInstall() {
        if (this.installPrompt) {
            this.installPrompt.prompt();
            
            this.installPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                } else {
                    console.log('User dismissed the install prompt');
                }
                this.installPrompt = null;
                this.hideInstallPrompt();
            });
        }
    }
    
    dismissInstallPrompt() {
        localStorage.setItem('installPromptDismissed', 'true');
        this.hideInstallPrompt();
    }
    
    hideInstallPrompt() {
        const installPrompt = document.getElementById('installPrompt');
        if (installPrompt) {
            installPrompt.classList.remove('show');
        }
    }
    
    // Event Listeners
    setupEventListeners() {
        // Handle page navigation
        window.addEventListener('popstate', () => {
            this.updateCartCount();
        });
        
        // Handle online/offline status
        window.addEventListener('online', () => {
            this.showSuccessMessage('Connection restored!');
        });
        
        window.addEventListener('offline', () => {
            this.showNotification('You are offline. Some features may be limited.', 'offline-notification');
        });
        
        // Handle form submissions
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (form.classList.contains('needs-validation')) {
                e.preventDefault();
                this.validateForm(form);
            }
        });
    }
    
    // Form Validation
    validateForm(form) {
        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!this.validateInput(input)) {
                isValid = false;
            }
        });
        
        if (isValid) {
            form.submit();
        }
    }
    
    validateInput(input) {
        const value = input.value.trim();
        let isValid = true;
        let errorMessage = '';
        
        // Remove existing error styling
        input.classList.remove('error');
        this.removeErrorMessage(input);
        
        // Required field validation
        if (input.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        }
        
        // Email validation
        if (input.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
            }
        }
        
        // Phone validation
        if (input.type === 'tel' && value) {
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
            if (!phoneRegex.test(value.replace(/\s/g, ''))) {
                isValid = false;
                errorMessage = 'Please enter a valid phone number';
            }
        }
        
        // Show error if validation failed
        if (!isValid) {
            input.classList.add('error');
            this.showInputError(input, errorMessage);
        }
        
        return isValid;
    }
    
    showInputError(input, message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'input-error';
        errorElement.textContent = message;
        errorElement.style.color = 'var(--error-color)';
        errorElement.style.fontSize = 'var(--font-size-sm)';
        errorElement.style.marginTop = 'var(--spacing-xs)';
        
        input.parentNode.appendChild(errorElement);
    }
    
    removeErrorMessage(input) {
        const errorElement = input.parentNode.querySelector('.input-error');
        if (errorElement) {
            errorElement.remove();
        }
    }
    
    // Utility Methods
    formatPrice(price) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(price);
    }
    
    formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Menu Data
    getMenuData() {
        return [
            // Pizza
            {
                id: 1,
                name: "Margherita Pizza",
                description: "Fresh mozzarella, tomato sauce, and basil on our signature wood-fired crust",
                price: 16.99,
                category: "pizza",
                image: "https://pixabay.com/get/g12b6488914e13e7c07d2b6128c6107f82038c0f01f03a0e16796ee10fd8d194ec886af09e447c100fd82aa9f26d90ae0a571307c7a8656ee40110806679055e7_1280.jpg",
                popular: true
            },
            {
                id: 2,
                name: "Pepperoni Supreme",
                description: "Premium pepperoni with extra cheese and our special herb blend",
                price: 19.99,
                category: "pizza",
                image: "https://pixabay.com/get/g1ce92b2b4a06dfcb185c5c9606e7b1c65d7e69d71390b46bb452b77916c66a465691577f6debf29e966e38ba729c3182bc1f279b1ff53257e8845fd4c6a62e72_1280.jpg",
                popular: true
            },
            {
                id: 3,
                name: "Quattro Stagioni",
                description: "Four seasons pizza with mushrooms, artichokes, ham, and olives",
                price: 22.99,
                category: "pizza",
                image: "https://pixabay.com/get/g1f98db6615ac0453e6dfd2edc7ff12aa0ca47f0bcbb100e36976cffddccd838bca256667791d2519d4d983b28eb93c72f7abaeed67f5f9995580df6fd5b8c653_1280.jpg",
                popular: false
            },
            
            // Burgers
            {
                id: 4,
                name: "Classic Bella Burger",
                description: "Juicy beef patty with lettuce, tomato, onion, and our signature sauce",
                price: 14.99,
                category: "burgers",
                image: "https://pixabay.com/get/g1039dde13d51353d751a0663ed26a1ab0e06b3be027b218a6ac589e0c622b4911d369f5cc6bca6651b71f7b847184cea7e00b8e6a2ab6cc8093b2e15907812f9_1280.jpg",
                popular: true
            },
            {
                id: 5,
                name: "Italian Chicken Burger",
                description: "Grilled chicken breast with pesto, mozzarella, and sun-dried tomatoes",
                price: 16.99,
                category: "burgers",
                image: "https://pixabay.com/get/g41c2b26493ada7ffe7631cffdc928a250234341aa1a706671ba82b8e7520ec0a128069799a8839b562106abbc6c47e0685870e009621805d1b7f2e3830e70ee6_1280.jpg",
                popular: false
            },
            {
                id: 6,
                name: "Mushroom Swiss Burger",
                description: "Beef patty topped with sautéed mushrooms and melted Swiss cheese",
                price: 17.99,
                category: "burgers",
                image: "https://pixabay.com/get/gf747a4b3f16fd735dceacd9320f06df2970f5071206101c34b289a26f1c572d10d1856530a93e740b411824bde78959a8598580c2ae99ddc507d900da2d18490_1280.jpg",
                popular: false
            },
            
            // Drinks
            {
                id: 7,
                name: "Italian Soda",
                description: "Refreshing sparkling water with natural fruit flavors",
                price: 4.99,
                category: "drinks",
                image: "https://pixabay.com/get/gb11b2c8357f59fefdd65c828e7cf135e0ec6201972d57676fca2b529a5821725074d2a68b51f3dae718f416140763101823a811ab3b84516fadf6ddd94daaeaf_1280.jpg",
                popular: false
            },
            {
                id: 8,
                name: "Fresh Lemonade",
                description: "House-made lemonade with fresh lemons and mint",
                price: 5.99,
                category: "drinks",
                image: "https://pixabay.com/get/g337aed303c267e47dd83ac92f5cd170f620773b6d67cd789772ab0f3103ad811eb419bd165748e739a68c1e8d424e51620426e8295556acbfeb8e77313634eab_1280.jpg",
                popular: true
            },
            
            // Desserts
            {
                id: 9,
                name: "Tiramisu",
                description: "Classic Italian dessert with coffee-soaked ladyfingers and mascarpone",
                price: 8.99,
                category: "desserts",
                image: "https://pixabay.com/get/g12b6488914e13e7c07d2b6128c6107f82038c0f01f03a0e16796ee10fd8d194ec886af09e447c100fd82aa9f26d90ae0a571307c7a8656ee40110806679055e7_1280.jpg",
                popular: true
            },
            {
                id: 10,
                name: "Gelato Trio",
                description: "Three scoops of artisanal gelato: vanilla, chocolate, and pistachio",
                price: 7.99,
                category: "desserts",
                image: "https://pixabay.com/get/g1ce92b2b4a06dfcb185c5c9606e7b1c65d7e69d71390b46bb452b77916c66a465691577f6debf29e966e38ba729c3182bc1f279b1ff53257e8845fd4c6a62e72_1280.jpg",
                popular: false
            }
        ];
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.bellaVistaApp = new BellaVistaApp();
});

// Global functions for backward compatibility
function addToCart(item) {
    if (window.bellaVistaApp) {
        window.bellaVistaApp.addToCart(item);
    }
}

function updateCartCount() {
    if (window.bellaVistaApp) {
        window.bellaVistaApp.updateCartCount();
    }
}

function loadPopularItems() {
    if (!window.bellaVistaApp) return;
    
    const container = document.getElementById('popularItems');
    if (!container) return;
    
    const menuData = window.bellaVistaApp.getMenuData();
    const popularItems = menuData.filter(item => item.popular);
    
    container.innerHTML = popularItems.map(item => `
        <div class="menu-item animate-fade-in">
            <img src="${item.image}" alt="${item.name}" class="menu-item-image" loading="lazy">
            <div class="menu-item-content">
                <h3 class="menu-item-name">${item.name}</h3>
                <p class="menu-item-description">${item.description}</p>
                <div class="menu-item-footer">
                    <span class="menu-item-price">$${item.price.toFixed(2)}</span>
                    <button class="add-to-cart-btn" onclick="addToCart(${JSON.stringify(item).replace(/"/g, '&quot;')})">
                        <i data-feather="plus"></i>
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    // Replace feather icons
    if (window.feather) {
        feather.replace();
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BellaVistaApp;
}
