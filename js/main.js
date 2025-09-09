// TartanShips Kiosk Main JavaScript

// Global state management
const KioskApp = {
  currentScreen: 'welcome-screen',
  selectedPaymentMethod: 'saved',
  orderData: {
    weight: 3.0,
    destination: '100 Main St\nZIP 15213',
    service: 'overnight',
    price: 12.00,
    trackingNumber: null
  },
  
  // Pricing structure based on weight
  pricingTiers: {
    overnight: {
      base: 7.50,
      perKg: 1.50
    },
    '2day': {
      base: 5.00,
      perKg: 1.00
    },
    ground: {
      base: 2.99,
      perKg: 0.50
    }
  },
  
  init() {
    this.setupEventListeners();
    this.showScreen('welcome-screen');
    this.generateTrackingNumber();
    this.updateAllPricing();
  },
  
  generateTrackingNumber() {
    const date = new Date();
    const dateStr = date.getFullYear().toString().slice(-2) + 
                   String(date.getMonth() + 1).padStart(2, '0') + 
                   String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 999) + 1;
    this.orderData.trackingNumber = `TS${dateStr}${String(random).padStart(3, '0')}`;
  },
  
  setupEventListeners() {
    // Weight slider
    const weightSlider = document.getElementById('weight-slider');
    if (weightSlider) {
      weightSlider.addEventListener('input', (e) => {
        this.updateWeight(parseFloat(e.target.value));
      });
    }
    
    // Service selection
    document.querySelectorAll('.service-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (!card.classList.contains('disabled')) {
          this.selectService(card.dataset.service);
        }
      });
    });
    
    // Form validation on input
    document.querySelectorAll('input[type="text"], input[type="number"]').forEach(input => {
      input.addEventListener('input', () => {
        this.clearFieldError(input);
      });
    });
    
    // Card number formatting
    const cardNumberInput = document.getElementById('card-number');
    if (cardNumberInput) {
      cardNumberInput.addEventListener('input', this.formatCardNumber);
    }
    
    // Expiry date formatting
    const expiryInput = document.getElementById('expiry');
    if (expiryInput) {
      expiryInput.addEventListener('input', this.formatExpiry);
    }
    
    // CVV validation
    const cvvInput = document.getElementById('cvv');
    if (cvvInput) {
      cvvInput.addEventListener('input', this.formatCVV);
    }
    
    // Saved card CVV validation
    const savedCvvInput = document.getElementById('saved-cvv');
    if (savedCvvInput) {
      savedCvvInput.addEventListener('input', this.formatCVV);
      savedCvvInput.addEventListener('input', () => {
        this.clearFieldError(savedCvvInput);
      });
    }
  },
  
  updateWeight(weight) {
    this.orderData.weight = weight;
    
    // Update weight display
    const weightValue = document.getElementById('weight-value');
    if (weightValue) {
      weightValue.textContent = weight.toFixed(1);
    }
    
    // Update pricing for all services
    this.updateAllPricing();
  },
  
  calculatePrice(service, weight) {
    const tier = this.pricingTiers[service];
    if (!tier) return 0;
    
    return tier.base + (weight * tier.perKg);
  },
  
  updateAllPricing() {
    const weight = this.orderData.weight;
    
    // Update service card prices
    Object.keys(this.pricingTiers).forEach(service => {
      const price = this.calculatePrice(service, weight);
      const priceElement = document.querySelector(`[data-service="${service}"] .service-price`);
      if (priceElement) {
        priceElement.textContent = `$${price.toFixed(2)}`;
      }
    });
    
    // Update current order price
    this.orderData.price = this.calculatePrice(this.orderData.service, weight);
  },

  selectService(service) {
    // Update UI
    document.querySelectorAll('.service-card').forEach(card => {
      card.classList.remove('selected');
    });
    document.querySelector(`[data-service="${service}"]`).classList.add('selected');
    
    // Update order data
    this.orderData.service = service;
    this.orderData.price = this.calculatePrice(service, this.orderData.weight);
  },
  
  formatCardNumber(e) {
    let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
    let formattedValue = value.match(/.{1,4}/g)?.join(' ');
    if (formattedValue) {
      e.target.value = formattedValue;
    }
  },
  
  formatExpiry(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    e.target.value = value;
  },
  
  formatCVV(e) {
    e.target.value = e.target.value.replace(/[^0-9]/g, '').substring(0, 4);
  },
  
  clearFieldError(field) {
    field.classList.remove('error');
    const errorMsg = field.parentNode.querySelector('.error-message');
    if (errorMsg) {
      errorMsg.remove();
    }
  },
  
  showFieldError(field, message) {
    field.classList.add('error');
    
    // Remove existing error message
    const existingError = field.parentNode.querySelector('.error-message');
    if (existingError) {
      existingError.remove();
    }
    
    // Add new error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    field.parentNode.appendChild(errorDiv);
  }
};

// Screen navigation functions
function nextScreen(screenId) {
  // Validate current screen before proceeding
  if (KioskApp.currentScreen === 'payment' && screenId === 'confirmation') {
    if (!validatePaymentForm()) {
      return;
    }
  }
  
  showScreen(screenId);
}

function previousScreen(screenId) {
  showScreen(screenId);
}

function showScreen(screenId) {
  // Hide all screens
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });
  
  // Show target screen
  const targetScreen = document.getElementById(screenId);
  if (targetScreen) {
    targetScreen.classList.add('active');
    KioskApp.currentScreen = screenId;
    
    // Screen-specific setup
    if (screenId === 'service-selection') {
      KioskApp.updateAllPricing();
    } else if (screenId === 'payment') {
      updatePaymentScreen();
    } else if (screenId === 'confirmation') {
      updateConfirmationScreen();
    }
  }
}


function updatePaymentScreen() {
  // Update order summary with current weight and service
  const summaryItem = document.querySelector('.summary-item span:first-child');
  if (summaryItem) {
    const serviceName = KioskApp.orderData.service.charAt(0).toUpperCase() + KioskApp.orderData.service.slice(1);
    const displayName = serviceName === '2day' ? '2-Day' : serviceName;
    summaryItem.textContent = `${displayName} Shipping (${KioskApp.orderData.weight.toFixed(1)}kg)`;
  }
  
  const summaryPrice = document.querySelector('.summary-item span:last-child');
  if (summaryPrice) {
    summaryPrice.textContent = `$${KioskApp.orderData.price.toFixed(2)}`;
  }
  
  const totalPrice = document.querySelector('.summary-total span:last-child');
  if (totalPrice) {
    totalPrice.textContent = `$${KioskApp.orderData.price.toFixed(2)}`;
  }
}

function updateConfirmationScreen() {
  // Update tracking number
  document.querySelector('.tracking-code').textContent = KioskApp.orderData.trackingNumber;
  
  // Update estimated delivery
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const deliveryDate = tomorrow.toLocaleDateString('en-US', { 
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });
  document.querySelector('.estimated-delivery span:last-child').textContent = 
    `${deliveryDate} by 10:30 AM`;
  
  // Update receipt with current weight and price
  const weightSpan = document.querySelector('.receipt-item:nth-child(2) span:last-child');
  if (weightSpan) {
    weightSpan.textContent = `${KioskApp.orderData.weight.toFixed(1)}kg`;
  }
  
  const totalSpan = document.querySelector('.receipt-item.total span:last-child');
  if (totalSpan) {
    totalSpan.textContent = `$${KioskApp.orderData.price.toFixed(2)}`;
  }
}

function processPayment() {
  if (!validatePaymentForm()) {
    return;
  }
  
  // Show loading state
  const button = event.target;
  button.classList.add('loading');
  button.textContent = 'Processing...';
  button.disabled = true;
  
  // Simulate payment processing
  setTimeout(() => {
    button.classList.remove('loading');
    button.textContent = 'Process Payment';
    button.disabled = false;
    
    // Proceed to confirmation
    showScreen('confirmation');
  }, 2000);
}

function printReceipt() {
  // In a real kiosk, this would trigger the printer
  window.print();
}

function startNew() {
  // Reset form data
  document.querySelectorAll('input[type="text"]').forEach(input => {
    if (input.id !== 'weight' && input.id !== 'destination') {
      input.value = '';
    }
  });
  
  // Clear any errors
  document.querySelectorAll('.error').forEach(field => {
    KioskApp.clearFieldError(field);
  });
  
  // Reset payment method to saved card
  KioskApp.selectedPaymentMethod = 'saved';
  selectPaymentMethod('saved');
  
  // Generate new tracking number
  KioskApp.generateTrackingNumber();
  
  // Return to welcome screen
  showScreen('welcome-screen');
}

// Keyboard navigation support
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    // Go back to previous screen or welcome
    const screens = ['welcome-screen', 'package-details', 'service-selection', 'payment', 'confirmation'];
    const currentIndex = screens.indexOf(KioskApp.currentScreen);
    if (currentIndex > 0) {
      showScreen(screens[currentIndex - 1]);
    }
  }
  
  if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') {
    // Find next button and click it
    const activeScreen = document.querySelector('.screen.active');
    const primaryBtn = activeScreen.querySelector('.primary-btn');
    if (primaryBtn && !primaryBtn.disabled) {
      primaryBtn.click();
    }
  }
});

// Touch and accessibility improvements
document.addEventListener('focusin', (e) => {
  if (e.target.classList.contains('glass-btn')) {
    e.target.style.outline = '2px solid var(--primary-light)';
  }
});

document.addEventListener('focusout', (e) => {
  if (e.target.classList.contains('glass-btn')) {
    e.target.style.outline = '';
  }
});

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  KioskApp.init();
});

// Handle page visibility for kiosk timeout
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Page is hidden - in a real kiosk, might want to reset after timeout
    console.log('Kiosk screen hidden');
  } else {
    // Page is visible
    console.log('Kiosk screen visible');
  }
});

// Payment method selection
function selectPaymentMethod(method) {
  KioskApp.selectedPaymentMethod = method;
  
  // Update UI
  document.querySelectorAll('.payment-method').forEach(element => {
    element.classList.remove('active');
  });
  document.querySelector(`[data-method="${method}"]`).classList.add('active');
  
  // Show/hide appropriate payment forms
  const savedCardSection = document.getElementById('saved-card-section');
  const newCardForm = document.getElementById('new-card-form');
  
  if (method === 'saved') {
    savedCardSection.style.display = 'block';
    newCardForm.style.display = 'none';
  } else {
    savedCardSection.style.display = 'none';
    newCardForm.style.display = 'block';
  }
}

// Enhanced payment validation for both saved and new cards
function validatePaymentForm() {
  if (KioskApp.selectedPaymentMethod === 'saved') {
    // Validate saved card (only CVV needed)
    const cvvInput = document.getElementById('saved-cvv');
    const cvv = cvvInput.value.trim();
    
    if (!cvv) {
      KioskApp.showFieldError(cvvInput, 'CVV is required');
      return false;
    } else if (!/^\d{3}$/.test(cvv)) {
      KioskApp.showFieldError(cvvInput, 'CVV must be 3 digits');
      return false;
    } else {
      KioskApp.clearFieldError(cvvInput);
      return true;
    }
  } else {
    // Validate new card (existing validation)
    const fields = [
      { id: 'card-number', name: 'Card number', pattern: /^\d{4}\s\d{4}\s\d{4}\s\d{4}$/ },
      { id: 'expiry', name: 'Expiry date', pattern: /^\d{2}\/\d{2}$/ },
      { id: 'cvv', name: 'CVV', pattern: /^\d{3,4}$/ },
      { id: 'cardholder', name: 'Cardholder name', pattern: /^[a-zA-Z\s]{2,}$/ }
    ];
    
    let isValid = true;
    
    fields.forEach(field => {
      const input = document.getElementById(field.id);
      const value = input.value.trim();
      
      if (!value) {
        KioskApp.showFieldError(input, `${field.name} is required`);
        isValid = false;
      } else if (!field.pattern.test(value)) {
        let message = `Please enter a valid ${field.name.toLowerCase()}`;
        if (field.id === 'card-number') {
          message = 'Card number must be 16 digits';
        } else if (field.id === 'expiry') {
          message = 'Expiry date must be MM/YY format';
        } else if (field.id === 'cvv') {
          message = 'CVV must be 3-4 digits';
        }
        KioskApp.showFieldError(input, message);
        isValid = false;
      } else {
        KioskApp.clearFieldError(input);
      }
    });
    
    return isValid;
  }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { KioskApp, validatePaymentForm, selectPaymentMethod };
}