// TartanShips Payment Processing Module

const PaymentProcessor = {
  // Supported card types with validation patterns
  cardTypes: {
    visa: {
      pattern: /^4[0-9]{12}(?:[0-9]{3})?$/,
      cvvLength: 3,
      name: 'Visa'
    },
    mastercard: {
      pattern: /^5[1-5][0-9]{14}$/,
      cvvLength: 3,
      name: 'MasterCard'
    },
    amex: {
      pattern: /^3[47][0-9]{13}$/,
      cvvLength: 4,
      name: 'American Express'
    },
    discover: {
      pattern: /^6(?:011|5[0-9]{2})[0-9]{12}$/,
      cvvLength: 3,
      name: 'Discover'
    }
  },

  // Detect card type from number
  detectCardType(cardNumber) {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    
    for (const [type, config] of Object.entries(this.cardTypes)) {
      if (config.pattern.test(cleanNumber)) {
        return { type, ...config };
      }
    }
    
    return null;
  },

  // Validate card number using Luhn algorithm
  validateCardNumber(cardNumber) {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    
    // Check if it's all digits
    if (!/^\d+$/.test(cleanNumber)) {
      return false;
    }
    
    // Luhn algorithm
    let sum = 0;
    let isEven = false;
    
    for (let i = cleanNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNumber.charAt(i));
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  },

  // Validate expiry date
  validateExpiryDate(expiryString) {
    const match = expiryString.match(/^(\d{2})\/(\d{2})$/);
    if (!match) {
      return { valid: false, message: 'Invalid format' };
    }
    
    const month = parseInt(match[1]);
    const year = parseInt('20' + match[2]);
    
    if (month < 1 || month > 12) {
      return { valid: false, message: 'Invalid month' };
    }
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return { valid: false, message: 'Card has expired' };
    }
    
    if (year > currentYear + 10) {
      return { valid: false, message: 'Invalid year' };
    }
    
    return { valid: true };
  },

  // Validate CVV
  validateCVV(cvv, cardType = null) {
    if (!/^\d+$/.test(cvv)) {
      return { valid: false, message: 'CVV must be numeric' };
    }
    
    const expectedLength = cardType?.cvvLength || 3;
    
    if (cvv.length !== expectedLength) {
      return { 
        valid: false, 
        message: `CVV must be ${expectedLength} digits for ${cardType?.name || 'this card type'}` 
      };
    }
    
    return { valid: true };
  },

  // Comprehensive payment validation
  validatePaymentData(paymentData) {
    const errors = {};
    
    // Validate card number
    if (!paymentData.cardNumber) {
      errors.cardNumber = 'Card number is required';
    } else {
      const cardType = this.detectCardType(paymentData.cardNumber);
      if (!cardType) {
        errors.cardNumber = 'Unsupported card type';
      } else if (!this.validateCardNumber(paymentData.cardNumber)) {
        errors.cardNumber = 'Invalid card number';
      }
    }
    
    // Validate expiry date
    if (!paymentData.expiry) {
      errors.expiry = 'Expiry date is required';
    } else {
      const expiryValidation = this.validateExpiryDate(paymentData.expiry);
      if (!expiryValidation.valid) {
        errors.expiry = expiryValidation.message;
      }
    }
    
    // Validate CVV
    if (!paymentData.cvv) {
      errors.cvv = 'CVV is required';
    } else {
      const cardType = this.detectCardType(paymentData.cardNumber);
      const cvvValidation = this.validateCVV(paymentData.cvv, cardType);
      if (!cvvValidation.valid) {
        errors.cvv = cvvValidation.message;
      }
    }
    
    // Validate cardholder name
    if (!paymentData.cardholder) {
      errors.cardholder = 'Cardholder name is required';
    } else if (paymentData.cardholder.length < 2) {
      errors.cardholder = 'Cardholder name is too short';
    } else if (!/^[a-zA-Z\s\'-]+$/.test(paymentData.cardholder)) {
      errors.cardholder = 'Invalid characters in cardholder name';
    }
    
    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  },

  // Simulate payment processing
  async processPayment(paymentData, orderData) {
    return new Promise((resolve, reject) => {
      // Simulate network delay
      setTimeout(() => {
        // Validate payment data
        const validation = this.validatePaymentData(paymentData);
        
        if (!validation.valid) {
          reject({
            success: false,
            message: 'Payment validation failed',
            errors: validation.errors
          });
          return;
        }
        
        // Simulate random success/failure for demo
        const success = Math.random() > 0.1; // 90% success rate
        
        if (success) {
          resolve({
            success: true,
            transactionId: this.generateTransactionId(),
            message: 'Payment processed successfully',
            amount: orderData.price,
            timestamp: new Date().toISOString()
          });
        } else {
          reject({
            success: false,
            message: 'Payment declined. Please try another card.',
            errorCode: 'DECLINED'
          });
        }
      }, 1500 + Math.random() * 1000); // 1.5-2.5 second delay
    });
  },

  // Generate transaction ID
  generateTransactionId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `TXN${timestamp}${random}`.toUpperCase();
  },

  // Mask card number for display
  maskCardNumber(cardNumber) {
    const clean = cardNumber.replace(/\s/g, '');
    if (clean.length < 4) return cardNumber;
    
    const masked = '*'.repeat(clean.length - 4) + clean.slice(-4);
    return masked.match(/.{1,4}/g)?.join(' ') || masked;
  },

  // Format amount for display
  formatAmount(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
};

// Real-time card input enhancements
function enhanceCardInputs() {
  const cardNumberInput = document.getElementById('card-number');
  const expiryInput = document.getElementById('expiry');
  const cvvInput = document.getElementById('cvv');
  
  if (cardNumberInput) {
    cardNumberInput.addEventListener('input', function(e) {
      const cardType = PaymentProcessor.detectCardType(e.target.value);
      
      // Update UI to show detected card type
      const cardTypeIndicator = document.querySelector('.card-type-indicator');
      if (cardTypeIndicator) {
        cardTypeIndicator.textContent = cardType ? cardType.name : '';
      }
      
      // Adjust CVV field based on card type
      if (cvvInput && cardType) {
        cvvInput.maxLength = cardType.cvvLength;
        cvvInput.placeholder = cardType.cvvLength === 4 ? '1234' : '123';
      }
    });
  }
  
  if (expiryInput) {
    expiryInput.addEventListener('blur', function(e) {
      const validation = PaymentProcessor.validateExpiryDate(e.target.value);
      if (!validation.valid && e.target.value) {
        console.log('Expiry validation:', validation.message);
      }
    });
  }
}

// Initialize payment enhancements when DOM is loaded
document.addEventListener('DOMContentLoaded', enhanceCardInputs);

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.PaymentProcessor = PaymentProcessor;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PaymentProcessor;
}