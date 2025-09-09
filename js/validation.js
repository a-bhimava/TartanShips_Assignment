// TartanShips Form Validation Utilities

const ValidationUtils = {
  // Common validation patterns
  patterns: {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[\+]?[\d\s\-\(\)]{10,}$/,
    zipCode: /^\d{5}(-\d{4})?$/,
    name: /^[a-zA-Z\s\'-]{2,}$/,
    address: /^[a-zA-Z0-9\s\,\.\-\#]{5,}$/,
    cardNumber: /^[\d\s]{13,19}$/,
    cvv: /^\d{3,4}$/,
    expiry: /^\d{2}\/\d{2}$/
  },

  // Validation rules
  rules: {
    required: (value) => ({
      valid: value && value.toString().trim().length > 0,
      message: 'This field is required'
    }),

    minLength: (value, min) => ({
      valid: value && value.length >= min,
      message: `Must be at least ${min} characters`
    }),

    maxLength: (value, max) => ({
      valid: !value || value.length <= max,
      message: `Must be no more than ${max} characters`
    }),

    pattern: (value, pattern, message = 'Invalid format') => ({
      valid: !value || pattern.test(value),
      message
    }),

    email: (value) => ({
      valid: !value || ValidationUtils.patterns.email.test(value),
      message: 'Please enter a valid email address'
    }),

    phone: (value) => ({
      valid: !value || ValidationUtils.patterns.phone.test(value),
      message: 'Please enter a valid phone number'
    }),

    zipCode: (value) => ({
      valid: !value || ValidationUtils.patterns.zipCode.test(value),
      message: 'Please enter a valid ZIP code'
    }),

    name: (value) => ({
      valid: !value || ValidationUtils.patterns.name.test(value),
      message: 'Please enter a valid name'
    }),

    address: (value) => ({
      valid: !value || ValidationUtils.patterns.address.test(value),
      message: 'Please enter a valid address'
    }),

    numeric: (value) => ({
      valid: !value || /^\d+(\.\d+)?$/.test(value),
      message: 'Please enter a valid number'
    }),

    positiveNumber: (value) => ({
      valid: !value || (parseFloat(value) > 0),
      message: 'Must be a positive number'
    }),

    weight: (value) => {
      const weight = parseFloat(value);
      return {
        valid: !isNaN(weight) && weight > 0 && weight <= 70, // Max 70kg for shipping
        message: 'Weight must be between 0.1 and 70 kg'
      };
    }
  },

  // Field validation configurations
  fieldConfigs: {
    'package-weight': [
      { rule: 'required' },
      { rule: 'numeric' },
      { rule: 'weight' }
    ],
    
    'destination-address': [
      { rule: 'required' },
      { rule: 'minLength', value: 10 },
      { rule: 'address' }
    ],
    
    'card-number': [
      { rule: 'required' },
      { rule: 'pattern', value: ValidationUtils.patterns.cardNumber, message: 'Please enter a valid card number' }
    ],
    
    'expiry': [
      { rule: 'required' },
      { rule: 'pattern', value: ValidationUtils.patterns.expiry, message: 'Please enter expiry as MM/YY' }
    ],
    
    'cvv': [
      { rule: 'required' },
      { rule: 'pattern', value: ValidationUtils.patterns.cvv, message: 'Please enter a valid CVV' }
    ],
    
    'cardholder': [
      { rule: 'required' },
      { rule: 'minLength', value: 2 },
      { rule: 'name' }
    ]
  },

  // Validate a single field
  validateField(fieldId, value) {
    const config = this.fieldConfigs[fieldId];
    if (!config) return { valid: true, errors: [] };

    const errors = [];
    
    for (const validation of config) {
      const ruleName = validation.rule;
      const rule = this.rules[ruleName];
      
      if (rule) {
        const result = validation.value !== undefined 
          ? rule(value, validation.value)
          : rule(value);
          
        if (!result.valid) {
          errors.push(validation.message || result.message);
          break; // Stop at first error for better UX
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  // Validate multiple fields
  validateForm(formData) {
    const results = {};
    let isValid = true;

    for (const [fieldId, value] of Object.entries(formData)) {
      const result = this.validateField(fieldId, value);
      results[fieldId] = result;
      
      if (!result.valid) {
        isValid = false;
      }
    }

    return {
      valid: isValid,
      fieldResults: results
    };
  },

  // Real-time validation setup
  setupRealTimeValidation(formElement) {
    if (!formElement) return;

    const inputs = formElement.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
      // Validate on blur (when user leaves field)
      input.addEventListener('blur', () => {
        const result = this.validateField(input.id, input.value);
        this.displayFieldValidation(input, result);
      });

      // Clear errors on input (as user types)
      input.addEventListener('input', () => {
        this.clearFieldValidation(input);
      });
    });
  },

  // Display field validation results
  displayFieldValidation(field, result) {
    this.clearFieldValidation(field);
    
    if (!result.valid && result.errors.length > 0) {
      field.classList.add('error');
      
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.textContent = result.errors[0];
      
      field.parentNode.appendChild(errorDiv);
    } else {
      field.classList.remove('error');
      field.classList.add('success');
      
      // Remove success class after a short delay
      setTimeout(() => {
        field.classList.remove('success');
      }, 2000);
    }
  },

  // Clear field validation display
  clearFieldValidation(field) {
    field.classList.remove('error', 'success');
    
    const existingError = field.parentNode.querySelector('.error-message');
    if (existingError) {
      existingError.remove();
    }
  },

  // Sanitize input values
  sanitizeInput(value, type = 'text') {
    if (!value) return '';
    
    let sanitized = value.toString().trim();
    
    switch (type) {
      case 'name':
        // Remove extra spaces and non-name characters
        sanitized = sanitized.replace(/[^a-zA-Z\s\'-]/g, '').replace(/\s+/g, ' ');
        break;
      
      case 'phone':
        // Remove non-numeric characters except common phone symbols
        sanitized = sanitized.replace(/[^\d\+\-\s\(\)]/g, '');
        break;
      
      case 'numeric':
        // Keep only numbers and decimal points
        sanitized = sanitized.replace(/[^\d\.]/g, '');
        break;
      
      case 'address':
        // Allow alphanumeric, spaces, and common address characters
        sanitized = sanitized.replace(/[^a-zA-Z0-9\s\,\.\-\#]/g, '');
        break;
      
      case 'zip':
        // Keep only numbers and hyphens
        sanitized = sanitized.replace(/[^\d\-]/g, '');
        break;
      
      default:
        // Basic HTML escape for text inputs
        sanitized = sanitized
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;');
    }
    
    return sanitized;
  },

  // Format input values for display
  formatInput(value, type = 'text') {
    if (!value) return '';
    
    switch (type) {
      case 'phone':
        // Format as (XXX) XXX-XXXX
        const cleaned = value.replace(/\D/g, '');
        if (cleaned.length === 10) {
          return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
        }
        return value;
      
      case 'zip':
        // Format as XXXXX-XXXX if 9 digits
        const digits = value.replace(/\D/g, '');
        if (digits.length === 9) {
          return `${digits.slice(0, 5)}-${digits.slice(5)}`;
        }
        return digits;
      
      case 'currency':
        // Format as currency
        const amount = parseFloat(value);
        if (!isNaN(amount)) {
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(amount);
        }
        return value;
      
      default:
        return value;
    }
  }
};

// Auto-setup validation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Setup validation for all forms with .validate class
  document.querySelectorAll('form.validate').forEach(form => {
    ValidationUtils.setupRealTimeValidation(form);
  });
  
  // Setup validation for payment form specifically
  const paymentForm = document.querySelector('.payment-form');
  if (paymentForm) {
    ValidationUtils.setupRealTimeValidation(paymentForm);
  }
});

// Accessibility improvements
function enhanceAccessibility() {
  // Add aria-describedby to inputs with validation
  document.querySelectorAll('input, textarea').forEach(input => {
    if (ValidationUtils.fieldConfigs[input.id]) {
      input.setAttribute('aria-describedby', `${input.id}-error`);
    }
  });
  
  // Announce validation errors to screen readers
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE && 
              node.classList.contains('error-message')) {
            node.setAttribute('role', 'alert');
            node.setAttribute('aria-live', 'polite');
          }
        });
      }
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Initialize accessibility enhancements
document.addEventListener('DOMContentLoaded', enhanceAccessibility);

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.ValidationUtils = ValidationUtils;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ValidationUtils;
}