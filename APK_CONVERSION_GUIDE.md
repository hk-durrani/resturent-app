# Bella Vista Restaurant PWA to APK Conversion Guide

This comprehensive guide will walk you through converting the Bella Vista Restaurant Progressive Web App (PWA) into an Android APK file that can be published on Google Play Store.

## Prerequisites

Before starting the conversion process, ensure you have:

- ✅ A working PWA (Bella Vista Restaurant app)
- ✅ Node.js (version 14 or higher) installed
- ✅ Android Studio installed (for APK signing and testing)
- ✅ A Google Play Console developer account ($25 one-time fee)
- ✅ Basic command line knowledge

## Method 1: Using Capacitor (Recommended)

Capacitor is Ionic's official solution for building native apps from web applications.

### Step 1: Install Capacitor

```bash
# Navigate to your PWA directory
cd bella-vista-restaurant

# Install Capacitor CLI globally
npm install -g @capacitor/cli

# Initialize Capacitor in your project
npx cap init "Bella Vista Restaurant" "com.bellavista.restaurant"
