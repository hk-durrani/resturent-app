// Contact Page Functionality
class ContactManager {
    constructor() {
        this.app = window.bellaVistaApp;
        this.mapLoaded = false;
        this.formSubmitting = false;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupFormValidation();
        this.initializeMap();
        this.setupContactCards();
    }
    
    setupEventListeners() {
        // Contact form submission
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitContactForm();
            });
        }
        
        // Real-time form validation
        const formInputs = document.querySelectorAll('#contactForm input, #contactForm select, #contactForm textarea');
        formInputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
            
            input.addEventListener('input', () => {
                this.clearFieldError(input);
            });
        });
        
        // Phone number formatting
        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                this.formatPhoneNumber(e.target);
            });
        }
        
        // Contact card interactions
        this.setupContactCardActions();
    }
    
    setupFormValidation() {
        this.validationRules = {
            firstName: {
                required: true,
                minLength: 2,
                pattern: /^[a-zA-Z\s'-]+$/,
                message: 'Please enter a valid first name'
            },
            lastName: {
                required: true,
                minLength: 2,
                pattern: /^[a-zA-Z\s'-]+$/,
                message: 'Please enter a valid last name'
            },
            email: {
                required: true,
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Please enter a valid email address'
            },
            phone: {
                pattern: /^[\+]?[1-9][\d\s\-\(\)]{8,15}$/,
                message: 'Please enter a valid phone number'
            },
            subject: {
                required: true,
                message: 'Please select a subject'
            },
            message: {
                required: true,
                minLength: 10,
                maxLength: 1000,
                message: 'Please enter a message (10-1000 characters)'
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
        
        // Length checks
        if (rules.minLength && value.length < rules.minLength) {
            this.showFieldError(field, `Minimum ${rules.minLength} characters required`);
            return false;
        }
        
        if (rules.maxLength && value.length > rules.maxLength) {
            this.showFieldError(field, `Maximum ${rules.maxLength} characters allowed`);
            return false;
        }
        
        // Pattern check
        if (rules.pattern && !rules.pattern.test(value)) {
            this.showFieldError(field, rules.message);
            return false;
        }
        
        // Mark field as valid
        field.classList.add('valid');
        return true;
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
        errorElement.style.color = 'var(--error-color)';
        errorElement.style.fontSize = 'var(--font-size-sm)';
        errorElement.style.marginTop = 'var(--spacing-xs)';
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
        const form = document.getElementById('contactForm');
        const formInputs = form.querySelectorAll('input, select, textarea');
        let isValid = true;
        
        formInputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    submitContactForm() {
        if (this.formSubmitting) return;
        
        if (!this.validateForm()) {
            this.scrollToFirstError();
            return;
        }
        
        this.formSubmitting = true;
        this.showSubmissionState();
        
        // Collect form data
        const formData = this.collectFormData();
        
        // Simulate form submission (in real app, this would be an API call)
        setTimeout(() => {
            this.handleSubmissionSuccess(formData);
        }, 2000);
    }
    
    collectFormData() {
        const form = document.getElementById('contactForm');
        const formData = new FormData(form);
        
        return {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            phone: formData.get('phone') || '',
            subject: formData.get('subject'),
            message: formData.get('message'),
            timestamp: new Date().toISOString(),
            id: this.generateMessageId()
        };
    }
    
    generateMessageId() {
        return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    showSubmissionState() {
        const submitBtn = document.querySelector('#contactForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<div class="loading"></div> Sending Message...';
        }
        
        // Disable form inputs
        const inputs = document.querySelectorAll('#contactForm input, #contactForm select, #contactForm textarea');
        inputs.forEach(input => {
            input.disabled = true;
        });
    }
    
    handleSubmissionSuccess(formData) {
        // Save message to local storage (for demo purposes)
        this.saveContactMessage(formData);
        
        // Show success message
        this.app.showSuccessMessage('Message sent successfully! We\'ll get back to you soon.');
        
        // Reset form
        this.resetForm();
        
        // Re-enable form
        this.resetSubmissionState();
        
        this.formSubmitting = false;
    }
    
    handleSubmissionError() {
        this.app.showNotification('Failed to send message. Please try again.', 'cart-notification');
        this.resetSubmissionState();
        this.formSubmitting = false;
    }
    
    saveContactMessage(formData) {
        let messages = JSON.parse(localStorage.getItem('contactMessages') || '[]');
        messages.unshift(formData);
        
        // Keep only last 50 messages
        if (messages.length > 50) {
            messages = messages.slice(0, 50);
        }
        
        localStorage.setItem('contactMessages', JSON.stringify(messages));
    }
    
    resetForm() {
        const form = document.getElementById('contactForm');
        form.reset();
        
        // Clear validation classes
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.classList.remove('valid', 'error');
            this.clearFieldError(input);
        });
    }
    
    resetSubmissionState() {
        const submitBtn = document.querySelector('#contactForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i data-feather="send"></i> Send Message';
            if (window.feather) {
                feather.replace();
            }
        }
        
        // Re-enable form inputs
        const inputs = document.querySelectorAll('#contactForm input, #contactForm select, #contactForm textarea');
        inputs.forEach(input => {
            input.disabled = false;
        });
    }
    
    scrollToFirstError() {
        const firstError = document.querySelector('#contactForm .error');
        if (firstError) {
            firstError.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
            firstError.focus();
        }
    }
    
    formatPhoneNumber(input) {
        let value = input.value.replace(/\D/g, '');
        
        if (value.length >= 6) {
            value = value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
        } else if (value.length >= 3) {
            value = value.replace(/(\d{3})(\d{0,3})/, '($1) $2');
        }
        
        input.value = value;
    }
    
    setupContactCardActions() {
        // Phone number click to call
        const phoneCards = document.querySelectorAll('.contact-card');
        phoneCards.forEach(card => {
            const phoneIcon = card.querySelector('[data-feather="phone"]');
            if (phoneIcon) {
                card.style.cursor = 'pointer';
                card.addEventListener('click', () => {
                    window.location.href = 'tel:+15551234567';
                });
            }
            
            // Email click to compose
            const emailIcon = card.querySelector('[data-feather="mail"]');
            if (emailIcon) {
                card.style.cursor = 'pointer';
                card.addEventListener('click', () => {
                    window.location.href = 'mailto:info@bellavista.com?subject=Inquiry from Website';
                });
            }
            
            // Address click to maps
            const mapIcon = card.querySelector('[data-feather="map-pin"]');
            if (mapIcon) {
                card.style.cursor = 'pointer';
                card.addEventListener('click', () => {
                    this.openInMaps();
                });
            }
        });
    }
    
    openInMaps() {
        const address = '123 Italian Street, Food City, FC 12345';
        const encodedAddress = encodeURIComponent(address);
        
        // Try to open in native maps app
        if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
            window.open(`maps://maps.google.com/maps?q=${encodedAddress}`);
        } else if (/Android/.test(navigator.userAgent)) {
            window.open(`geo:0,0?q=${encodedAddress}`);
        } else {
            window.open(`https://www.google.com/maps/search/${encodedAddress}`);
        }
    }
    
    initializeMap() {
        const mapContainer = document.querySelector('.map-container iframe');
        if (mapContainer) {
            // Add loading state
            mapContainer.style.filter = 'blur(2px)';
            
            // Simulate map loading
            mapContainer.addEventListener('load', () => {
                mapContainer.style.filter = 'none';
                mapContainer.style.transition = 'filter 0.5s ease-out';
                this.mapLoaded = true;
            });
            
            // Add map interaction enhancements
            this.enhanceMapInteraction(mapContainer);
        }
    }
    
    enhanceMapInteraction(mapContainer) {
        const mapWrapper = mapContainer.parentNode;
        
        // Add fullscreen toggle
        const fullscreenBtn = document.createElement('button');
        fullscreenBtn.className = 'map-fullscreen-btn';
        fullscreenBtn.innerHTML = '<i data-feather="maximize"></i>';
        fullscreenBtn.style.position = 'absolute';
        fullscreenBtn.style.top = '10px';
        fullscreenBtn.style.right = '10px';
        fullscreenBtn.style.background = 'var(--bg-primary)';
        fullscreenBtn.style.border = '1px solid var(--border-color)';
        fullscreenBtn.style.borderRadius = 'var(--radius-md)';
        fullscreenBtn.style.padding = 'var(--spacing-sm)';
        fullscreenBtn.style.cursor = 'pointer';
        fullscreenBtn.style.zIndex = '10';
        
        fullscreenBtn.addEventListener('click', () => {
            this.toggleMapFullscreen(mapWrapper);
        });
        
        mapWrapper.style.position = 'relative';
        mapWrapper.appendChild(fullscreenBtn);
        
        if (window.feather) {
            feather.replace();
        }
    }
    
    toggleMapFullscreen(mapWrapper) {
        if (mapWrapper.classList.contains('fullscreen')) {
            mapWrapper.classList.remove('fullscreen');
            mapWrapper.style.position = 'relative';
            mapWrapper.style.zIndex = 'auto';
            mapWrapper.style.top = 'auto';
            mapWrapper.style.left = 'auto';
            mapWrapper.style.width = '100%';
            mapWrapper.style.height = '400px';
            document.body.style.overflow = 'auto';
        } else {
            mapWrapper.classList.add('fullscreen');
            mapWrapper.style.position = 'fixed';
            mapWrapper.style.zIndex = 'var(--z-modal)';
            mapWrapper.style.top = '0';
            mapWrapper.style.left = '0';
            mapWrapper.style.width = '100vw';
            mapWrapper.style.height = '100vh';
            document.body.style.overflow = 'hidden';
        }
    }
    
    setupContactCards() {
        const cards = document.querySelectorAll('.contact-card');
        
        cards.forEach((card, index) => {
            // Add hover effects
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-5px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
            });
            
            // Add staggered animation on load
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.5s ease-out';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }
    
    // Business hours functionality
    updateBusinessHours() {
        const now = new Date();
        const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        const businessHours = {
            0: { open: 12 * 60, close: 21 * 60 }, // Sunday: 12 PM - 9 PM
            1: { open: 11 * 60, close: 22 * 60 }, // Monday: 11 AM - 10 PM
            2: { open: 11 * 60, close: 22 * 60 }, // Tuesday: 11 AM - 10 PM
            3: { open: 11 * 60, close: 22 * 60 }, // Wednesday: 11 AM - 10 PM
            4: { open: 11 * 60, close: 22 * 60 }, // Thursday: 11 AM - 10 PM
            5: { open: 11 * 60, close: 23 * 60 }, // Friday: 11 AM - 11 PM
            6: { open: 11 * 60, close: 23 * 60 }  // Saturday: 11 AM - 11 PM
        };
        
        const todayHours = businessHours[currentDay];
        const isOpen = currentTime >= todayHours.open && currentTime <= todayHours.close;
        
        // Update UI to show open/closed status
        this.updateOpenStatus(isOpen, todayHours);
    }
    
    updateOpenStatus(isOpen, hours) {
        const statusElements = document.querySelectorAll('.business-status');
        
        statusElements.forEach(element => {
            element.textContent = isOpen ? 'Open Now' : 'Closed';
            element.style.color = isOpen ? 'var(--success-color)' : 'var(--error-color)';
        });
        
        // Add next opening time for closed status
        if (!isOpen) {
            const nextOpen = this.getNextOpenTime();
            const nextOpenElement = document.querySelector('.next-open');
            if (nextOpenElement && nextOpen) {
                nextOpenElement.textContent = `Opens ${nextOpen}`;
            }
        }
    }
    
    getNextOpenTime() {
        // Simplified logic - in real app, this would be more sophisticated
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        if (now.getDay() === 0) { // Sunday
            return 'tomorrow at 11:00 AM';
        } else {
            return 'tomorrow at 11:00 AM';
        }
    }
    
    // Social media sharing
    shareLocation() {
        if (navigator.share) {
            navigator.share({
                title: 'Bella Vista Restaurant',
                text: 'Check out this amazing Italian restaurant!',
                url: window.location.href
            });
        } else {
            // Fallback for browsers without Web Share API
            this.copyLocationToClipboard();
        }
    }
    
    copyLocationToClipboard() {
        const address = '123 Italian Street, Food City, FC 12345';
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(address).then(() => {
                this.app.showSuccessMessage('Address copied to clipboard!');
            });
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = address;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.app.showSuccessMessage('Address copied to clipboard!');
        }
    }
}

// Initialize contact manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (window.bellaVistaApp) {
        window.contactManager = new ContactManager();
    }
});

// Global function
function initializeContactForm() {
    if (window.contactManager) {
        window.contactManager.setupFormValidation();
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContactManager;
}
