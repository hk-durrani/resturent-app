// Menu Page Functionality
class MenuManager {
    constructor() {
        this.app = window.bellaVistaApp;
        this.currentFilter = 'all';
        this.menuData = [];
        this.searchTerm = '';
        
        this.init();
    }
    
    init() {
        if (this.app) {
            this.menuData = this.app.getMenuData();
            this.loadMenuItems();
            this.setupEventListeners();
        }
    }
    
    setupEventListeners() {
        // Category filter buttons
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                const category = button.getAttribute('data-category');
                this.filterByCategory(category);
                this.updateActiveFilter(button);
            });
        });
        
        // Search functionality (if search input exists)
        const searchInput = document.getElementById('menuSearch');
        if (searchInput) {
            searchInput.addEventListener('input', this.app.debounce((e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.loadMenuItems();
            }, 300));
        }
        
        // Sort functionality (if sort select exists)
        const sortSelect = document.getElementById('menuSort');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortMenuItems(e.target.value);
            });
        }
    }
    
    filterByCategory(category) {
        this.currentFilter = category;
        this.loadMenuItems();
        
        // Add animation to menu items
        this.animateMenuItems();
    }
    
    updateActiveFilter(activeButton) {
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(button => button.classList.remove('active'));
        activeButton.classList.add('active');
    }
    
    loadMenuItems() {
        const container = document.getElementById('menuItems');
        if (!container) return;
        
        let filteredItems = this.getFilteredItems();
        
        if (filteredItems.length === 0) {
            container.innerHTML = this.createEmptyStateHTML();
            return;
        }
        
        container.innerHTML = filteredItems.map(item => this.createMenuItemHTML(item)).join('');
        
        // Replace feather icons
        if (window.feather) {
            feather.replace();
        }
        
        // Add intersection observer for lazy loading and animations
        this.setupIntersectionObserver();
    }
    
    getFilteredItems() {
        let items = [...this.menuData];
        
        // Filter by category
        if (this.currentFilter !== 'all') {
            items = items.filter(item => item.category === this.currentFilter);
        }
        
        // Filter by search term
        if (this.searchTerm) {
            items = items.filter(item => 
                item.name.toLowerCase().includes(this.searchTerm) ||
                item.description.toLowerCase().includes(this.searchTerm)
            );
        }
        
        return items;
    }
    
    createMenuItemHTML(item) {
        const isPopular = item.popular ? '<span class="popular-badge">Popular</span>' : '';
        
        return `
            <div class="menu-item animate-fade-in" data-category="${item.category}" data-item-id="${item.id}">
                ${isPopular}
                <img src="${item.image}" alt="${item.name}" class="menu-item-image" loading="lazy">
                <div class="menu-item-content">
                    <h3 class="menu-item-name">${item.name}</h3>
                    <p class="menu-item-description">${item.description}</p>
                    <div class="menu-item-footer">
                        <span class="menu-item-price">$${item.price.toFixed(2)}</span>
                        <div class="menu-item-actions">
                            <button class="btn-icon" onclick="menuManager.viewItemDetails(${item.id})" aria-label="View details">
                                <i data-feather="info"></i>
                            </button>
                            <button class="add-to-cart-btn" onclick="menuManager.addToCart(${JSON.stringify(item).replace(/"/g, '&quot;')})" data-item-id="${item.id}">
                                <i data-feather="plus"></i>
                                Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    createEmptyStateHTML() {
        return `
            <div class="empty-menu-state">
                <div class="empty-icon">
                    <i data-feather="search"></i>
                </div>
                <h3>No items found</h3>
                <p>Try adjusting your filters or search terms</p>
                <button class="btn btn-outline" onclick="menuManager.clearFilters()">
                    Clear Filters
                </button>
            </div>
        `;
    }
    
    addToCart(item) {
        this.app.addToCart(item);
        
        // Add visual feedback
        const button = document.querySelector(`[data-item-id="${item.id}"] .add-to-cart-btn`);
        if (button) {
            const originalText = button.innerHTML;
            button.innerHTML = '<i data-feather="check"></i> Added!';
            button.classList.add('added');
            
            if (window.feather) {
                feather.replace();
            }
            
            setTimeout(() => {
                button.innerHTML = originalText;
                button.classList.remove('added');
                if (window.feather) {
                    feather.replace();
                }
            }, 2000);
        }
        
        // Animate the menu item
        const menuItem = document.querySelector(`[data-item-id="${item.id}"]`);
        if (menuItem) {
            menuItem.style.transform = 'scale(1.05)';
            menuItem.style.transition = 'transform 0.3s ease-out';
            
            setTimeout(() => {
                menuItem.style.transform = 'scale(1)';
            }, 300);
        }
    }
    
    viewItemDetails(itemId) {
        const item = this.menuData.find(menuItem => menuItem.id === itemId);
        if (item) {
            this.showItemModal(item);
        }
    }
    
    showItemModal(item) {
        // Create modal if it doesn't exist
        let modal = document.getElementById('itemModal');
        if (!modal) {
            modal = this.createItemModal();
            document.body.appendChild(modal);
        }
        
        // Update modal content
        this.updateModalContent(modal, item);
        
        // Show modal
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Close modal events
        this.setupModalEvents(modal);
    }
    
    createItemModal() {
        const modal = document.createElement('div');
        modal.id = 'itemModal';
        modal.className = 'item-modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <button class="modal-close" aria-label="Close modal">
                    <i data-feather="x"></i>
                </button>
                <div class="modal-body">
                    <img src="" alt="" class="modal-image">
                    <div class="modal-details">
                        <h2 class="modal-title"></h2>
                        <p class="modal-description"></p>
                        <div class="modal-price"></div>
                        <div class="modal-actions">
                            <div class="quantity-selector">
                                <button class="quantity-btn" id="modalDecreaseBtn">
                                    <i data-feather="minus"></i>
                                </button>
                                <input type="number" class="quantity-input" id="modalQuantity" value="1" min="1">
                                <button class="quantity-btn" id="modalIncreaseBtn">
                                    <i data-feather="plus"></i>
                                </button>
                            </div>
                            <button class="btn btn-primary" id="modalAddToCart">
                                <i data-feather="plus"></i>
                                Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        return modal;
    }
    
    updateModalContent(modal, item) {
        modal.querySelector('.modal-image').src = item.image;
        modal.querySelector('.modal-image').alt = item.name;
        modal.querySelector('.modal-title').textContent = item.name;
        modal.querySelector('.modal-description').textContent = item.description;
        modal.querySelector('.modal-price').textContent = `$${item.price.toFixed(2)}`;
        
        // Reset quantity
        modal.querySelector('#modalQuantity').value = 1;
        
        // Update add to cart button
        const addButton = modal.querySelector('#modalAddToCart');
        addButton.onclick = () => {
            const quantity = parseInt(modal.querySelector('#modalQuantity').value);
            for (let i = 0; i < quantity; i++) {
                this.app.addToCart(item);
            }
            this.closeModal(modal);
        };
        
        // Setup quantity controls
        modal.querySelector('#modalDecreaseBtn').onclick = () => {
            const input = modal.querySelector('#modalQuantity');
            const value = parseInt(input.value);
            if (value > 1) {
                input.value = value - 1;
            }
        };
        
        modal.querySelector('#modalIncreaseBtn').onclick = () => {
            const input = modal.querySelector('#modalQuantity');
            const value = parseInt(input.value);
            input.value = value + 1;
        };
        
        if (window.feather) {
            feather.replace();
        }
    }
    
    setupModalEvents(modal) {
        const closeBtn = modal.querySelector('.modal-close');
        const overlay = modal.querySelector('.modal-overlay');
        
        closeBtn.onclick = () => this.closeModal(modal);
        overlay.onclick = () => this.closeModal(modal);
        
        // Close on escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeModal(modal);
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        
        document.addEventListener('keydown', escapeHandler);
    }
    
    closeModal(modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
        
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }
    
    sortMenuItems(sortBy) {
        let sortedItems = [...this.getFilteredItems()];
        
        switch (sortBy) {
            case 'name':
                sortedItems.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'price-low':
                sortedItems.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                sortedItems.sort((a, b) => b.price - a.price);
                break;
            case 'popular':
                sortedItems.sort((a, b) => b.popular - a.popular);
                break;
            default:
                // Default order
                break;
        }
        
        this.displaySortedItems(sortedItems);
    }
    
    displaySortedItems(items) {
        const container = document.getElementById('menuItems');
        if (!container) return;
        
        // Add fade out animation
        container.style.opacity = '0.5';
        
        setTimeout(() => {
            container.innerHTML = items.map(item => this.createMenuItemHTML(item)).join('');
            
            if (window.feather) {
                feather.replace();
            }
            
            // Fade back in
            container.style.opacity = '1';
            this.animateMenuItems();
        }, 150);
    }
    
    animateMenuItems() {
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                item.style.transition = 'all 0.3s ease-out';
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }
    
    clearFilters() {
        this.currentFilter = 'all';
        this.searchTerm = '';
        
        // Reset filter buttons
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(button => button.classList.remove('active'));
        document.querySelector('[data-category="all"]').classList.add('active');
        
        // Reset search input
        const searchInput = document.getElementById('menuSearch');
        if (searchInput) {
            searchInput.value = '';
        }
        
        // Reset sort select
        const sortSelect = document.getElementById('menuSort');
        if (sortSelect) {
            sortSelect.value = '';
        }
        
        this.loadMenuItems();
    }
    
    setupIntersectionObserver() {
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fade-in');
                    observer.unobserve(entry.target);
                }
            });
        }, options);
        
        document.querySelectorAll('.menu-item').forEach(item => {
            observer.observe(item);
        });
    }
    
    // Advanced filtering
    filterByPriceRange(min, max) {
        this.priceRange = { min, max };
        this.loadMenuItems();
    }
    
    filterByDietaryRestrictions(restrictions) {
        this.dietaryRestrictions = restrictions;
        this.loadMenuItems();
    }
    
    // Favorites functionality
    toggleFavorite(itemId) {
        let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        
        if (favorites.includes(itemId)) {
            favorites = favorites.filter(id => id !== itemId);
            this.app.showNotification('Removed from favorites', 'cart-notification');
        } else {
            favorites.push(itemId);
            this.app.showSuccessMessage('Added to favorites!');
        }
        
        localStorage.setItem('favorites', JSON.stringify(favorites));
        this.updateFavoriteButtons();
    }
    
    updateFavoriteButtons() {
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            const itemId = parseInt(btn.getAttribute('data-item-id'));
            const icon = btn.querySelector('i');
            
            if (favorites.includes(itemId)) {
                icon.setAttribute('data-feather', 'heart');
                btn.classList.add('favorited');
            } else {
                icon.setAttribute('data-feather', 'heart');
                btn.classList.remove('favorited');
            }
        });
        
        if (window.feather) {
            feather.replace();
        }
    }
}

// Initialize menu manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (window.bellaVistaApp) {
        window.menuManager = new MenuManager();
    }
});

// Global functions
function loadMenuItems() {
    if (window.menuManager) {
        window.menuManager.loadMenuItems();
    }
}

function initializeMenuFilters() {
    if (window.menuManager) {
        window.menuManager.setupEventListeners();
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MenuManager;
}
