# Bella Vista Restaurant PWA

## Overview

Bella Vista Restaurant is a Progressive Web App (PWA) for an Italian restaurant that provides customers with a complete digital dining experience. The application allows users to browse the menu, add items to cart, place orders, and contact the restaurant. Built as a PWA, it offers native app-like functionality including offline capability, push notifications, and mobile installation options.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The application follows a **multi-page architecture** with vanilla JavaScript and CSS, optimized for PWA functionality:

- **Static HTML pages**: Separate pages for home, menu, cart, order checkout, contact, and confirmation
- **Modular JavaScript**: Each page has its own dedicated JS module (app.js, menu.js, cart.js, order.js, contact.js)
- **Component-based CSS**: Centralized styling with CSS custom properties for theme management
- **PWA compliance**: Includes manifest.json, service worker, and proper meta tags for installability

### Client-Side State Management

- **LocalStorage**: Used for cart persistence, theme preferences, and order data
- **In-memory cart**: Managed through the main BellaVistaApp class
- **Theme system**: Light/dark mode toggle with persistent storage

### Progressive Web App Features

- **Service Worker (sw.js)**: Implements caching strategies for offline functionality
- **App Manifest**: Defines installation behavior, icons, and app metadata
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Theme Support**: System-wide dark/light mode with CSS custom properties

### Cart and Order System

- **Client-side cart management**: Items stored in localStorage with real-time updates
- **Order calculation**: Includes tax calculation, delivery fees, and total computation
- **Form validation**: Real-time validation for checkout and contact forms
- **Order confirmation**: Complete order flow from cart to confirmation

### Navigation and UX

- **Single-page navigation**: Smooth transitions between sections
- **Mobile-responsive menu**: Collapsible navigation for mobile devices
- **Accessibility features**: ARIA labels, semantic HTML, and keyboard navigation
- **Loading states**: Visual feedback for user interactions

## External Dependencies

### CDN Resources
- **Google Fonts**: Playfair Display and Inter font families for typography
- **Feather Icons**: Icon library for UI elements and navigation

### Development Tools
- **Capacitor**: Recommended for native app conversion (mentioned in APK_CONVERSION_GUIDE.md)
- **Android Studio**: For APK building and testing
- **Node.js**: Required for development and build processes

### Browser APIs
- **Service Worker API**: For offline functionality and caching
- **Web App Manifest**: For PWA installation capabilities
- **LocalStorage API**: For data persistence
- **Fetch API**: For potential future backend integration

The application is designed as a self-contained PWA with no current backend dependencies, making it easy to deploy on any static hosting platform while maintaining full functionality through client-side technologies.