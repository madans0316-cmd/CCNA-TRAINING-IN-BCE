/* ==========================================================================
   CCNA CERTIFICATION TRAINING PROGRAM WEBSITE - CONTROLLER SCRIPT
    Bahubali College of Engineering (BCE) - Center of Excellence for Networking
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    lucide.createIcons();

    // Application state
    let state = {
        candidateName: '',
        candidateEmail: '',
        candidatePhone: '',
        candidateRole: '',
        candidateCollege: '',
        candidateDept: '',
        registrationId: '',
        paymentMethod: 'card'
    };

    /* ==========================================================================
       Theme Toggle & Dark/Light Mode Memory
       ========================================================================== */
    const themeToggleBtn = document.getElementById('theme-toggle');
    
    // Check local storage or system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'light') {
        document.body.classList.remove('dark-theme');
    } else if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme'); // default fallback
    }

    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });

    /* ==========================================================================
       Responsive Drawer Navigation
       ========================================================================== */
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileDrawer = document.getElementById('mobile-drawer');
    const drawerOverlay = document.getElementById('drawer-overlay');
    const closeDrawerBtn = document.getElementById('close-drawer-btn');
    const mobileLinks = document.querySelectorAll('.mobile-link');

    function toggleDrawer(open) {
        if (open) {
            mobileDrawer.classList.add('active');
            drawerOverlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // prevent back-scroll
        } else {
            mobileDrawer.classList.remove('active');
            drawerOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    mobileMenuBtn.addEventListener('click', () => toggleDrawer(true));
    closeDrawerBtn.addEventListener('click', () => toggleDrawer(false));
    drawerOverlay.addEventListener('click', () => toggleDrawer(false));

    mobileLinks.forEach(link => {
        link.addEventListener('click', () => toggleDrawer(false));
    });

    /* ==========================================================================
       Syllabus & Curriculum Accordion Tabs
       ========================================================================== */
    const syllabusTabBtns = document.querySelectorAll('.syllabus-tab-btn');
    const moduleContents = document.querySelectorAll('.module-detail-content');

    syllabusTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active state from all buttons
            syllabusTabBtns.forEach(t => t.classList.remove('active'));
            // Hide all detail panels
            moduleContents.forEach(c => c.classList.remove('active'));

            // Set current active
            btn.classList.add('active');
            const targetModId = btn.getAttribute('data-module');
            const targetContent = document.getElementById(`mod-content-${targetModId}`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });

    /* ==========================================================================
       FAQ Accordions
       ========================================================================== */
    const faqTriggers = document.querySelectorAll('.faq-trigger');

    faqTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const parent = trigger.parentElement;
            const isOpen = parent.classList.contains('active');
            
            // Close other FAQs
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
                item.querySelector('.faq-answer').style.maxHeight = null;
            });

            if (!isOpen) {
                parent.classList.add('active');
                const answer = parent.querySelector('.faq-answer');
                answer.style.maxHeight = answer.scrollHeight + 'px';
            }
        });
    });

    /* ==========================================================================
       Scroll Spy / Navigation Links Highlight
       ========================================================================== */
    const navLinks = document.querySelectorAll('.desktop-nav .nav-link');
    const sections = document.querySelectorAll('.scroll-section');

    function scrollSpy() {
        let currentSectionId = '';
        const scrollPosition = window.scrollY + 200; // Offset for top header

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSectionId = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSectionId}`) {
                link.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', scrollSpy);

    /* ==========================================================================
       Form Validation Utility Functions
       ========================================================================== */
    function validateInput(inputElement, validationFn) {
        const formGroup = inputElement.closest('.form-group');
        const isValid = validationFn(inputElement.value.trim());

        if (isValid) {
            formGroup.classList.remove('invalid');
        } else {
            formGroup.classList.add('invalid');
        }
        return isValid;
    }

    // Add inline blur validations for better UX
    const regName = document.getElementById('reg-name');
    const regEmail = document.getElementById('reg-email');
    const regPhone = document.getElementById('reg-phone');
    const regRole = document.getElementById('reg-role');
    const regCollege = document.getElementById('reg-college');
    const regDept = document.getElementById('reg-dept');

    regName.addEventListener('blur', () => validateInput(regName, val => val.length >= 3));
    regEmail.addEventListener('blur', () => validateInput(regEmail, val => /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(val)));
    regPhone.addEventListener('blur', () => validateInput(regPhone, val => /^[0-9]{10}$/.test(val)));
    regRole.addEventListener('change', () => validateInput(regRole, val => val !== ''));
    regCollege.addEventListener('blur', () => validateInput(regCollege, val => val !== ''));
    regDept.addEventListener('blur', () => validateInput(regDept, val => val !== ''));

    /* ==========================================================================
       Wizard Multi-Step Controller & Submissions
       ========================================================================== */
    const registrationForm = document.getElementById('registration-form');
    const stepInd1 = document.getElementById('step-ind-1');
    const stepInd2 = document.getElementById('step-ind-2');
    const stepInd3 = document.getElementById('step-ind-3');

    const stepPane1 = document.getElementById('wizard-step-1');
    const stepPane2 = document.getElementById('wizard-step-2');
    const stepPane3 = document.getElementById('wizard-step-3');

    const backToStep1Btn = document.getElementById('back-to-step-1');
    const restartEnrollmentBtn = document.getElementById('restart-enrollment-btn');
    const printSlipBtn = document.getElementById('print-slip-btn');
    const paymentLoader = document.getElementById('payment-loader');
    const loaderStatus = document.getElementById('loader-status');

    // Transition wizard panels
    function gotoStep(stepNum) {
        // Remove active states
        stepPane1.classList.remove('active');
        stepPane2.classList.remove('active');
        stepPane3.classList.remove('active');

        stepInd1.classList.remove('active', 'completed');
        stepInd2.classList.remove('active', 'completed');
        stepInd3.classList.remove('active', 'completed');

        if (stepNum === 1) {
            stepPane1.classList.add('active');
            stepInd1.classList.add('active');
        } else if (stepNum === 2) {
            stepPane2.classList.add('active');
            stepInd1.classList.add('completed');
            stepInd2.classList.add('active');
        } else if (stepNum === 3) {
            stepPane3.classList.add('active');
            stepInd1.classList.add('completed');
            stepInd2.classList.add('completed');
            stepInd3.classList.add('active');
        }
    }

    // Submit Step 1: Form Validation
    registrationForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const isNameValid = validateInput(regName, val => val.length >= 3);
        const isEmailValid = validateInput(regEmail, val => /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(val));
        const isPhoneValid = validateInput(regPhone, val => /^[0-9]{10}$/.test(val));
        const isRoleValid = validateInput(regRole, val => val !== '');
        const isCollegeValid = validateInput(regCollege, val => val !== '');
        const isDeptValid = validateInput(regDept, val => val !== '');

        if (isNameValid && isEmailValid && isPhoneValid && isRoleValid && isCollegeValid && isDeptValid) {
            // Save state
            state.candidateName = regName.value.trim();
            state.candidateEmail = regEmail.value.trim();
            state.candidatePhone = regPhone.value.trim();
            state.candidateRole = regRole.value;
            state.candidateCollege = regCollege.value.trim();
            state.candidateDept = regDept.value.trim();

            // Transition to Step 2
            gotoStep(2);
            document.getElementById('register').scrollIntoView({ behavior: 'smooth' });
        } else {
            showToast('Please correct the validation errors in the form.', 'error');
        }
    });

    backToStep1Btn.addEventListener('click', () => {
        gotoStep(1);
    });

    /* ==========================================================================
       Payment Methods Switcher
       ========================================================================== */
    const payTabBtns = document.querySelectorAll('.pay-tab-btn');
    const payPanes = document.querySelectorAll('.pay-pane');

    payTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            payTabBtns.forEach(t => t.classList.remove('active'));
            payPanes.forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            const targetPayMethod = btn.getAttribute('data-paymethod');
            state.paymentMethod = targetPayMethod;

            const targetPane = document.getElementById(`pay-pane-${targetPayMethod}`);
            if (targetPane) {
                targetPane.classList.add('active');
            }
        });
    });

    /* ==========================================================================
       Payment Form Formatting & Validation
       ========================================================================== */
    const payCardNum = document.getElementById('pay-card-num');
    const payCardExp = document.getElementById('pay-card-exp');
    const payCardCvv = document.getElementById('pay-card-cvv');
    const payCardName = document.getElementById('pay-card-name');
    const payUpiId = document.getElementById('pay-upi-id');
    const payBankSelect = document.getElementById('pay-bank-select');

    // Autoformat card number with spaces (1234 5678 1234 5678)
    payCardNum.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        let formatted = '';
        for (let i = 0; i < val.length; i++) {
            if (i > 0 && i % 4 === 0) {
                formatted += ' ';
            }
            formatted += val[i];
        }
        e.target.value = formatted;
    });

    // Autoformat expiry with slash (MM/YY)
    payCardExp.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        if (val.length >= 2) {
            e.target.value = val.substring(0, 2) + '/' + val.substring(2, 4);
        } else {
            e.target.value = val;
        }
    });

    // Submissions forms
    const paymentCardForm = document.getElementById('payment-card-form');
    const paymentUpiForm = document.getElementById('payment-upi-form');
    const paymentBankForm = document.getElementById('payment-bank-form');

    paymentCardForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const cardNumValid = validateInput(payCardNum, val => /^\d{4}\s\d{4}\s\d{4}\s\d{4}$/.test(val));
        const cardExpValid = validateInput(payCardExp, val => /^(0[1-9]|1[0-2])\/\d{2}$/.test(val));
        const cardCvvValid = validateInput(payCardCvv, val => /^\d{3}$/.test(val));
        const cardNameValid = validateInput(payCardName, val => val.trim().length >= 3);

        if (cardNumValid && cardExpValid && cardCvvValid && cardNameValid) {
            processTransactionSimulation();
        }
    });

    paymentUpiForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const upiValid = validateInput(payUpiId, val => /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(val));
        if (upiValid) {
            processTransactionSimulation();
        }
    });

    paymentBankForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const bankValid = validateInput(payBankSelect, val => val !== '');
        if (bankValid) {
            processTransactionSimulation();
        }
    });

    /* ==========================================================================
       Secure Payment Gateway Simulation
       ========================================================================== */
    function processTransactionSimulation() {
        paymentLoader.classList.add('active');
        
        // Step 1: Connecting
        loaderStatus.textContent = "Connecting to Secure Bank Gateway...";
        
        // Step 2: Authorizing
        setTimeout(() => {
            loaderStatus.textContent = "Authorizing Transaction Amount...";
        }, 1200);

        // Step 3: Completing & Issuing Seat
        setTimeout(() => {
            loaderStatus.textContent = "Issuing Lab Admission Slip...";
        }, 2200);

        // Step 4: Finalize
        setTimeout(() => {
            paymentLoader.classList.remove('active');
            finalizeEnrollment();
        }, 3200);
    }

    function finalizeEnrollment() {
        // Generate registration details
        const randomRegNum = Math.floor(10000 + Math.random() * 90000);
        state.registrationId = `BCE-CCNA-${randomRegNum}`;
        
        const now = new Date();
        const formattedDate = now.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Set variables on the slip UI
        document.getElementById('slip-reg-id').textContent = state.registrationId;
        document.getElementById('slip-date').textContent = formattedDate;
        document.getElementById('slip-candidate-name').textContent = state.candidateName;
        document.getElementById('slip-candidate-phone').textContent = `+91 ${state.candidatePhone}`;
        document.getElementById('slip-candidate-college').textContent = state.candidateCollege;
        document.getElementById('slip-candidate-dept').textContent = state.candidateDept;

        // Persist to local storage
        let list = JSON.parse(localStorage.getItem('ccna_registrations') || '[]');
        list.push({
            id: state.registrationId,
            name: state.candidateName,
            email: state.candidateEmail,
            phone: state.candidatePhone,
            role: state.candidateRole,
            college: state.candidateCollege,
            department: state.candidateDept,
            paymentMethod: state.paymentMethod,
            timestamp: now.toISOString()
        });
        localStorage.setItem('ccna_registrations', JSON.stringify(list));

        // Advance to Step 3
        gotoStep(3);
        document.getElementById('register').scrollIntoView({ behavior: 'smooth' });
        showToast('Registration successfully verified. Seat reserved!', 'success');
    }

    // Print functionality
    printSlipBtn.addEventListener('click', () => {
        window.print();
    });

    // Reset flow
    restartEnrollmentBtn.addEventListener('click', () => {
        // Clear inputs
        registrationForm.reset();
        paymentCardForm.reset();
        paymentUpiForm.reset();
        paymentBankForm.reset();
        
        // Remove validation classes
        document.querySelectorAll('.form-group').forEach(group => {
            group.classList.remove('invalid');
        });

        gotoStep(1);
    });

    /* ==========================================================================
       Contact Form Validation & Processing
       ========================================================================== */
    const contactForm = document.getElementById('contact-inquiry-form');
    const contactName = document.getElementById('contact-name');
    const contactEmail = document.getElementById('contact-email');
    const contactMsg = document.getElementById('contact-msg');

    contactName.addEventListener('blur', () => validateInput(contactName, val => val.length >= 2));
    contactEmail.addEventListener('blur', () => validateInput(contactEmail, val => /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(val)));
    contactMsg.addEventListener('blur', () => validateInput(contactMsg, val => val.length >= 10));

    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const nameValid = validateInput(contactName, val => val.length >= 2);
        const emailValid = validateInput(contactEmail, val => /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(val));
        const msgValid = validateInput(contactMsg, val => val.length >= 10);

        if (nameValid && emailValid && msgValid) {
            // Save inquiry to local storage
            let inquiries = JSON.parse(localStorage.getItem('ccna_inquiries') || '[]');
            inquiries.push({
                name: contactName.value.trim(),
                email: contactEmail.value.trim(),
                message: contactMsg.value.trim(),
                timestamp: new Date().toISOString()
            });
            localStorage.setItem('ccna_inquiries', JSON.stringify(inquiries));

            contactForm.reset();
            showToast('Your inquiry has been sent to Mr. S. Deepak.', 'success');
        } else {
            showToast('Please correct validation issues before submitting.', 'error');
        }
    });

    /* ==========================================================================
       QR Code Download Script
       ========================================================================== */
    const downloadQrBtn = document.getElementById('download-qr-btn');
    
    downloadQrBtn.addEventListener('click', () => {
        const svgElement = document.getElementById('poster-qr-svg');
        const serializer = new XMLSerializer();
        let source = serializer.serializeToString(svgElement);

        // Add namespaces
        if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
            source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        if (!source.match(/^<svg[^>]+xmlns\:xlink="http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
            source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
        }

        // Add xml declaration
        source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

        // Convert svg source to URI data scheme
        const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);

        // Download trigger
        const downloadLink = document.createElement("a");
        downloadLink.href = url;
        downloadLink.download = "BCE_CCNA_Poster_QR_Access.svg";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        showToast('SVG QR code template downloaded successfully.', 'success');
    });

    /* ==========================================================================
       Aesthetic Micro-Interactions & Toast System
       ========================================================================== */
    const toast = document.getElementById('toast-alert');
    const toastIcon = document.getElementById('toast-icon');
    const toastMsg = document.getElementById('toast-message');
    let toastTimeout;

    function showToast(message, type = 'success') {
        clearTimeout(toastTimeout);
        toastMsg.textContent = message;
        toast.className = 'toast-alert'; // reset class
        
        if (type === 'success') {
            toast.classList.add('active', 'success');
            toastIcon.setAttribute('data-lucide', 'check-circle-2');
        } else if (type === 'error') {
            toast.classList.add('active', 'error');
            toastIcon.setAttribute('data-lucide', 'alert-circle');
        }

        // Redraw lucide icon for dynamic class shifts
        lucide.createIcons();

        toastTimeout = setTimeout(() => {
            toast.classList.remove('active');
        }, 4000);
    }
});
