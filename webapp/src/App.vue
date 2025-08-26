<script setup>
// App.vue now just serves as a container for the router
</script>

<template>
  <router-view />
</template>

<style>
/* Global mobile-friendly styles */
* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
}

/* Mobile viewport optimization */

/* Touch-friendly button improvements */
button {
  min-height: 44px;
  min-width: 44px;
  touch-action: manipulation;
}

/* Better scrolling on mobile */
* {
  -webkit-overflow-scrolling: touch;
}

/* Prevent zoom on input focus on iOS */

/* Better modal handling on mobile */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
}

/* Improved form elements for mobile */
input, textarea, select {
  -webkit-appearance: none;
  border-radius: 8px;
}

/* Better focus states for accessibility */
button:focus, input:focus, textarea:focus, select:focus {
  outline: 2px solid #667eea;
  outline-offset: 2px;
}
</style>
