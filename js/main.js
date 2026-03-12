/**
 * De Automation Systems - Main JavaScript
 * Form validation, navigation, and Google Forms integration
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initNavigation();
    initContactForm();
    initScrollEffects();
});

/**
 * Navigation functionality
 */
function initNavigation() {
    const navbar = document.querySelector('.navbar');
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    // Navbar scroll effect
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // Mobile menu toggle
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', function() {
            navLinks.classList.toggle('show');
            const icon = mobileMenuBtn.querySelector('i');
            if (icon) {
                if (navLinks.classList.contains('show')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                } else {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });

        // Close mobile menu when clicking a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('show');
                const icon = mobileMenuBtn.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            });
        });
    }

    // Set active nav link based on current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    navLinks?.querySelectorAll('a').forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage || (currentPage === '' && linkPage === 'index.html')) {
            link.classList.add('active');
        }
    });
}

/**
 * ============================================
 * GOOGLE FORMS CONFIGURATION
 * ============================================
 * 
 * Your Google Form: https://docs.google.com/forms/d/e/1FAIpQLSfZ8j6KGtonTLpgyIrsqgeqjGLMf3ZroC6MOaD4fqp53SYMKA/viewform
 * 
 * Entry IDs from your URL:
 * - entry.854395559 = Email
 * - entry.950756950 = Name
 * - entry.1580803922 = Phone Number
 * - entry.1251906713 = Business Type
 */

const GOOGLE_FORM_CONFIG = {
    formId: '1FAIpQLSfZ8j6KGtonTLpgyIrsqgeqjGLMf3ZroC6MOaD4fqp53SYMKA',
    entries: {
        email: 'entry.854395559',
        name: 'entry.950756950',
        phone: 'entry.1580803922',
        businessType: 'entry.1251906713'
    }
};

/**
 * Contact Form Validation and Submission to Google Forms
 */
function initContactForm() {
    const form = document.getElementById('leadForm');
    const successMessage = document.getElementById('successMessage');

    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Clear previous errors
        clearErrors();

        // Validate form
        const isValid = validateForm();

        if (isValid) {
            // Show loading state
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
            submitBtn.disabled = true;

            try {
                // Collect form data
                const formData = {
                    name: document.getElementById('name').value.trim(),
                    email: document.getElementById('email').value.trim(),
                    phone: document.getElementById('phone').value.trim(),
                    businessType: document.getElementById('businessType').value
                };

                // Submit to Google Forms
                await submitToGoogleForm(formData);

                // Show success message
                showSuccessMessage();

                // Reset form
                form.reset();

                console.log('Form submitted successfully to Google Forms!');

            } catch (error) {
                console.error('Submission error:', error);
                alert('There was an error submitting the form. Please try again.');
            } finally {
                // Restore button state
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            }
        }
    });

    // Real-time validation
    const inputs = form.querySelectorAll('.form-control');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });

        input.addEventListener('input', function() {
            if (this.classList.contains('error')) {
                validateField(this);
            }
        });
    });
}

/**
 * Submit form data to Google Forms
 * Uses a hidden iframe technique to bypass CORS restrictions
 */
function submitToGoogleForm(data) {
    return new Promise((resolve, reject) => {
        // Create a unique callback name
        const callbackName = 'googleFormCallback_' + Date.now();

        // Create hidden iframe for submission
        const iframe = document.createElement('iframe');
        iframe.name = 'googleFormIframe_' + Date.now();
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        // Create form element
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `https://docs.google.com/forms/d/e/${GOOGLE_FORM_CONFIG.formId}/formResponse`;
        form.target = iframe.name;

        // Map and append form fields
        const fieldMappings = [
            { name: GOOGLE_FORM_CONFIG.entries.name, value: data.name },
            { name: GOOGLE_FORM_CONFIG.entries.email, value: data.email },
            { name: GOOGLE_FORM_CONFIG.entries.phone, value: data.phone },
            { name: GOOGLE_FORM_CONFIG.entries.businessType, value: formatBusinessType(data.businessType) }
        ];

        fieldMappings.forEach(field => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = field.name;
            input.value = field.value;
            form.appendChild(input);
        });

        // Append form to body and submit
        document.body.appendChild(form);

        // Handle iframe load event
        iframe.addEventListener('load', function() {
            // Clean up
            setTimeout(() => {
                document.body.removeChild(form);
                document.body.removeChild(iframe);
            }, 1000);
            resolve();
        });

        // Handle errors
        iframe.addEventListener('error', function() {
            document.body.removeChild(form);
            document.body.removeChild(iframe);
            reject(new Error('Form submission failed'));
        });

        // Submit the form
        form.submit();

        // Fallback: resolve after 3 seconds even if iframe doesn't load
        setTimeout(() => {
            if (document.body.contains(form)) {
                document.body.removeChild(form);
            }
            if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
            }
            resolve();
        }, 3000);
    });
}

/**
 * Format business type value for display in Google Form
 */
function formatBusinessType(value) {
    const businessTypes = {
        'real-estate': 'Real Estate',
        'ecommerce': 'E-commerce',
        'healthcare': 'Healthcare',
        'finance': 'Finance & Insurance',
        'technology': 'Technology',
        'consulting': 'Consulting',
        'retail': 'Retail',
        'manufacturing': 'Manufacturing',
        'education': 'Education',
        'other': 'Other'
    };
    return businessTypes[value] || value;
}

/**
 * Alternative: Submit using fetch with no-cors mode
 * Note: This won't give us response data due to CORS, but submission will work
 */
async function submitToGoogleFormFetch(data) {
    const formData = new FormData();
    formData.append(GOOGLE_FORM_CONFIG.entries.name, data.name);
    formData.append(GOOGLE_FORM_CONFIG.entries.email, data.email);
    formData.append(GOOGLE_FORM_CONFIG.entries.phone, data.phone);
    formData.append(GOOGLE_FORM_CONFIG.entries.businessType, formatBusinessType(data.businessType));

    const response = await fetch(
        `https://docs.google.com/forms/d/e/${GOOGLE_FORM_CONFIG.formId}/formResponse`,
        {
            method: 'POST',
            mode: 'no-cors',
            body: formData
        }
    );

    // With no-cors, we can't read the response, but the submission goes through
    return response;
}

/**
 * Validate entire form
 */
function validateForm() {
    let isValid = true;

    const fields = ['name', 'email', 'phone', 'businessType'];
    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (!validateField(field)) {
            isValid = false;
        }
    });

    return isValid;
}

/**
 * Validate a single field
 */
function validateField(field) {
    if (!field) return true;

    const value = field.value.trim();
    const fieldName = field.getAttribute('name');
    let isValid = true;
    let errorMessage = '';

    // Remove previous states
    field.classList.remove('error', 'success');

    // Validation rules
    switch (fieldName) {
        case 'name':
            if (!value) {
                isValid = false;
                errorMessage = 'Please enter your name';
            } else if (value.length < 2) {
                isValid = false;
                errorMessage = 'Name must be at least 2 characters';
            } else if (!/^[a-zA-Z\s]+$/.test(value)) {
                isValid = false;
                errorMessage = 'Name should only contain letters';
            }
            break;

        case 'email':
            if (!value) {
                isValid = false;
                errorMessage = 'Please enter your email';
            } else if (!isValidEmail(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
            }
            break;

        case 'phone':
            if (!value) {
                isValid = false;
                errorMessage = 'Please enter your phone number';
            } else if (!isValidPhone(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid phone number';
            }
            break;

        case 'businessType':
            if (!value) {
                isValid = false;
                errorMessage = 'Please select your business type';
            }
            break;
    }

    // Apply validation state
    if (!isValid) {
        field.classList.add('error');
        showError(field, errorMessage);
    } else {
        field.classList.add('success');
        hideError(field);
    }

    return isValid;
}

/**
 * Email validation regex
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Phone validation regex (flexible for international)
 */
function isValidPhone(phone) {
    // Allows: +1234567890, (123) 456-7890, 123-456-7890, etc.
    const phoneRegex = /^[\d\s\-\+\(\)]{10,20}$/;
    const digitsOnly = phone.replace(/\D/g, '');
    return phoneRegex.test(phone) && digitsOnly.length >= 10;
}

/**
 * Show error message for a field
 */
function showError(field, message) {
    const formGroup = field.closest('.form-group');
    if (formGroup) {
        const errorElement = formGroup.querySelector('.error-message');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }
}

/**
 * Hide error message for a field
 */
function hideError(field) {
    const formGroup = field.closest('.form-group');
    if (formGroup) {
        const errorElement = formGroup.querySelector('.error-message');
        if (errorElement) {
            errorElement.classList.remove('show');
        }
    }
}

/**
 * Clear all errors
 */
function clearErrors() {
    document.querySelectorAll('.form-control').forEach(field => {
        field.classList.remove('error', 'success');
    });
    document.querySelectorAll('.error-message').forEach(error => {
        error.classList.remove('show');
    });
}

/**
 * Show success message after form submission
 */
function showSuccessMessage() {
    const form = document.getElementById('leadForm');
    const successMessage = document.getElementById('successMessage');

    if (form && successMessage) {
        form.style.display = 'none';
        successMessage.classList.add('show');

        // Scroll to success message
        successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

/**
 * Scroll effects
 */
function initScrollEffects() {
    // Add fade-in animation to elements as they scroll into view
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe feature cards, service items, etc.
    document.querySelectorAll('.feature-card, .service-item, .about-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Add fade-in class styles dynamically
const style = document.createElement('style');
style.textContent = `
    .fade-in {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }
`;
document.head.appendChild(style);
