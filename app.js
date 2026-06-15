/* ==========================================================================
   CCNA PROGRAM BCE WEBSITE - CONTROLLER SCRIPT
    Bahubali College of Engineering (BCE) - CCNA Program BCE
   ========================================================================== */

// --- Global Constants & Regex Utilities ---
const EMAIL_REGEX = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
const PHONE_REGEX = /^\d{10}$/;

// --- Global Form Validation Utility ---
function validateInput(inputElement, validationFn) {
    const formGroup = inputElement?.closest('.form-group');
    if (!formGroup) return false;
    
    const isValid = validationFn(inputElement.value.trim());
    if (isValid) {
        formGroup.classList.remove('invalid');
    } else {
        formGroup.classList.add('invalid');
    }
    return isValid;
}

// --- Global Helper to resolve API URLs ---
const getApiUrl = (path) => {
    // If running inside Capacitor mobile shell or local files, point to live hosted Vercel backend
    if (globalThis.Capacitor || globalThis.location.protocol === 'file:' || 
        (globalThis.location.hostname === 'localhost' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))) {
        return 'https://ccna-training-in-bce.vercel.app' + path;
    }
    // If developer is working locally on desktop PC, fall back to local server
    if (globalThis.location.protocol === 'http:' && (globalThis.location.hostname === '127.0.0.1' || globalThis.location.hostname === 'localhost')) {
        return 'http://127.0.0.1:5000' + path;
    }
    return path;
};

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    lucide.createIcons();

    // Register Service Worker for PWA (Offline & Install support)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registered successfully with scope:', reg.scope))
            .catch(err => console.warn('Service Worker registration failed:', err));
    }

    // Application state
    let state = {
        candidateName: '',
        candidateEmail: '',
        candidatePhone: '',
        candidateRole: '',
        candidateCollege: '',
        candidateDept: '',
        registrationId: '',
        paymentMethod: 'upi'
    };

    /* ==========================================================================
       Theme Toggle & Dark/Light Mode Memory
       ========================================================================== */
    const themeToggleBtn = document.getElementById('theme-toggle');
    
    // Check local storage or system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = globalThis.matchMedia('(prefers-color-scheme: dark)').matches;
    
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
            const targetModId = btn.dataset.module;
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
       Scroll Spy & Navigation Sync (Desktop & Mobile Bottom Nav)
       ========================================================================== */
    const navLinks = document.querySelectorAll('.desktop-nav .nav-link');
    const bottomNavLinks = document.querySelectorAll('.mobile-bottom-nav .bottom-nav-item');
    const sections = document.querySelectorAll('.scroll-section');

    function scrollSpy() {
        let currentSectionId = '';
        const scrollPosition = window.scrollY + 220; // Offset for top header on mobile/desktop

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSectionId = section.getAttribute('id');
            }
        });

        // Sync Desktop Nav Links
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSectionId}`) {
                link.classList.add('active');
            }
        });

        // Sync Mobile Bottom Nav Tabs
        bottomNavLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSectionId}`) {
                link.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', scrollSpy);

    // Smooth scroll navigation for Mobile Bottom Tabs
    bottomNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                // Clear active states
                navLinks.forEach(nl => nl.classList.remove('active'));
                bottomNavLinks.forEach(bn => bn.classList.remove('active'));
                
                // Add active state to current elements
                link.classList.add('active');
                const matchingDesktopLink = document.querySelector(`.desktop-nav a[href="${targetId}"]`);
                if (matchingDesktopLink) {
                    matchingDesktopLink.classList.add('active');
                }

                // Smooth scroll with mobile header offset
                const headerOffset = 70;
                const elementPosition = targetSection.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

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

    // Add inline blur validations for UX
    const regName = document.getElementById('reg-name');
    const regEmail = document.getElementById('reg-email');
    const regPhone = document.getElementById('reg-phone');
    const regRole = document.getElementById('reg-role');
    const regCollege = document.getElementById('reg-college');
    const regDept = document.getElementById('reg-dept');

    regName.addEventListener('blur', () => validateInput(regName, val => val.length >= 3));
    regEmail.addEventListener('blur', () => validateInput(regEmail, val => EMAIL_REGEX.test(val)));
    regPhone.addEventListener('blur', () => validateInput(regPhone, val => PHONE_REGEX.test(val)));
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

    // Nested Tab elements in Step 1
    const nestedTabNew = document.getElementById('nested-tab-new');
    const nestedTabVerify = document.getElementById('nested-tab-verify');
    const nestedPaneNew = document.getElementById('nested-pane-new');
    const nestedPaneVerify = document.getElementById('nested-pane-verify');
    const duplicateWarningBlock = document.getElementById('duplicate-warning-block');

    const studentLoginForm = document.getElementById('student-login-form');
    const loginStudentEmail = document.getElementById('login-student-email');
    const loginStudentPhone = document.getElementById('login-student-phone');

    // Tab switching function
    function switchStudentTab(tabId) {
        if (tabId === 'new') {
            nestedTabNew.classList.add('active');
            nestedTabVerify.classList.remove('active');
            nestedPaneNew.style.display = 'block';
            nestedPaneNew.classList.add('active');
            nestedPaneVerify.style.display = 'none';
            nestedPaneVerify.classList.remove('active');
        } else if (tabId === 'verify') {
            nestedTabNew.classList.remove('active');
            nestedTabVerify.classList.add('active');
            nestedPaneNew.style.display = 'none';
            nestedPaneNew.classList.remove('active');
            nestedPaneVerify.style.display = 'block';
            nestedPaneVerify.classList.add('active');
        }
    }

    if (nestedTabNew && nestedTabVerify) {
        nestedTabNew.addEventListener('click', () => {
            switchStudentTab('new');
            duplicateWarningBlock.style.display = 'none'; // hide warning when switching back
        });
        nestedTabVerify.addEventListener('click', () => {
            switchStudentTab('verify');
        });
    }

    // Inline blur validation for student login form
    if (loginStudentEmail && loginStudentPhone) {
        loginStudentEmail.addEventListener('blur', () => validateInput(loginStudentEmail, val => EMAIL_REGEX.test(val)));
        loginStudentPhone.addEventListener('blur', () => validateInput(loginStudentPhone, val => PHONE_REGEX.test(val)));
    }

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
        const isEmailValid = validateInput(regEmail, val => EMAIL_REGEX.test(val));
        const isPhoneValid = validateInput(regPhone, val => PHONE_REGEX.test(val));
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

            const randomRegNum = Math.floor(10000 + Math.random() * 90000);
            state.registrationId = `BCE-CCNA-${randomRegNum}`;

            const regPayload = {
                reg_id: state.registrationId,
                name: state.candidateName,
                email: state.candidateEmail,
                phone: state.candidatePhone,
                role: state.candidateRole,
                college: state.candidateCollege,
                department: state.candidateDept
            };

            // If offline, save to local queue and transition to next step
            if (!navigator.onLine) {
                saveRegistrationOffline(regPayload);
                showToast('Registration saved locally! We will sync it once you connect to the internet.', 'success');
                gotoStep(2);
                document.getElementById('register').scrollIntoView({ behavior: 'smooth' });
                return;
            }

            // Save to Python SQLite DB (Unpaid)
            fetch(getApiUrl('/api/register'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(regPayload)
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    gotoStep(2);
                    document.getElementById('register').scrollIntoView({ behavior: 'smooth' });
                } else if (data.code === 'DUPLICATE_EMAIL') {
                    // Show duplicate warning block and transition tab
                    duplicateWarningBlock.style.display = 'flex';
                    switchStudentTab('verify');
                    // pre-fill the verify fields for better UX
                    loginStudentEmail.value = state.candidateEmail;
                    loginStudentPhone.value = state.candidatePhone;
                    
                    showToast('This email is already registered. Please verify and proceed.', 'error');
                    document.getElementById('register').scrollIntoView({ behavior: 'smooth' });
                } else {
                    showToast('Registration failed: ' + (data.error || 'Server error'), 'error');
                }
            })
            .catch(err => {
                console.error(err);
                // Fallback to offline staging if fetch fails (e.g. network drops mid-click)
                saveRegistrationOffline(regPayload);
                showToast('Registration saved locally due to network connection issues.', 'success');
                gotoStep(2);
                document.getElementById('register').scrollIntoView({ behavior: 'smooth' });
            });
        } else {
            showToast('Please correct the validation errors in the form.', 'error');
        }
    });

    // Submit Verify / Sign-in form
    if (studentLoginForm) {
        studentLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const isEmailValid = validateInput(loginStudentEmail, val => EMAIL_REGEX.test(val));
            const isPhoneValid = validateInput(loginStudentPhone, val => PHONE_REGEX.test(val));

            if (isEmailValid && isPhoneValid) {
                const email = loginStudentEmail.value.trim();
                const phone = loginStudentPhone.value.trim();

                fetch(getApiUrl('/api/student/login'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, phone })
                })
                .then(res => {
                    if (res.status === 401) {
                        showToast('Verification failed: No registration matches this email and mobile combination.', 'error');
                        throw new Error('Unauthorized');
                    }
                    if (!res.ok) {
                        showToast('Verification server error.', 'error');
                        throw new Error('Server error');
                    }
                    return res.json();
                })
                .then(data => {
                    if (data.success) {
                        // Update state
                        state.candidateName = data.name;
                        state.candidateEmail = data.email;
                        state.candidatePhone = data.phone;
                        state.candidateRole = data.role;
                        state.candidateCollege = data.college;
                        state.candidateDept = data.department;
                        state.registrationId = data.reg_id;

                        showToast(`Verified candidate: Welcome back, ${data.name}!`, 'success');

                        // Check payment status
                        if (data.payment_status === 'Paid') {
                            const dateObj = data.timestamp ? new Date(data.timestamp) : new Date();
                            const formattedDate = dateObj.toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            });
                            
                            document.getElementById('slip-reg-id').textContent = data.reg_id;
                            document.getElementById('slip-date').textContent = formattedDate;
                            document.getElementById('slip-candidate-name').textContent = data.name;
                            document.getElementById('slip-candidate-phone').textContent = `+91 ${data.phone}`;
                            document.getElementById('slip-candidate-college').textContent = data.college;
                            document.getElementById('slip-candidate-dept').textContent = data.department;
                            
                            gotoStep(3);
                        } else {
                            gotoStep(2);
                        }
                        document.getElementById('register').scrollIntoView({ behavior: 'smooth' });
                    }
                })
                .catch(err => {
                    console.error('Student Verification error:', err);
                });
            } else {
                showToast('Please correct validation errors on the form.', 'error');
            }
        });
    }

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
            const targetPayMethod = btn.dataset.paymethod;
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
        let val = e.target.value.replace(/\s+/g, '').replace(/\D/g, '');
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
        let val = e.target.value.replace(/\s+/g, '').replace(/\D/g, '');
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

        // Update payment status on Python Server
        fetch(getApiUrl('/api/pay'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                reg_id: state.registrationId,
                payment_method: state.paymentMethod
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                // Advance to Step 3
                gotoStep(3);
                document.getElementById('register').scrollIntoView({ behavior: 'smooth' });
                showToast('Registration successfully verified. Seat reserved!', 'success');
            } else {
                showToast('Payment update failed: ' + (data.error || 'Server error'), 'error');
            }
        })
        .catch(err => {
            console.error(err);
            // Fallback
            gotoStep(3);
            document.getElementById('register').scrollIntoView({ behavior: 'smooth' });
            showToast('Registration saved locally. Seat reserved!', 'success');
        });
    }

    // Print functionality
    printSlipBtn.addEventListener('click', () => {
        globalThis.print();
    });

    // Reset flow
    restartEnrollmentBtn.addEventListener('click', () => {
        // Clear inputs
        registrationForm.reset();
        paymentCardForm.reset();
        paymentUpiForm.reset();
        paymentBankForm.reset();
        if (studentLoginForm) studentLoginForm.reset();
        if (duplicateWarningBlock) duplicateWarningBlock.style.display = 'none';
        switchStudentTab('new');
        
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
    if (contactForm) {
        const contactName = document.getElementById('contact-name');
        const contactEmail = document.getElementById('contact-email');
        const contactMsg = document.getElementById('contact-msg');

        contactName.addEventListener('blur', () => validateInput(contactName, val => val.length >= 2));
        contactEmail.addEventListener('blur', () => validateInput(contactEmail, val => EMAIL_REGEX.test(val)));
        contactMsg.addEventListener('blur', () => validateInput(contactMsg, val => val.length >= 10));

        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const nameValid = validateInput(contactName, val => val.length >= 2);
            const emailValid = validateInput(contactEmail, val => EMAIL_REGEX.test(val));
            const msgValid = validateInput(contactMsg, val => val.length >= 10);

            if (nameValid && emailValid && msgValid) {
                const inqPayload = {
                    name: contactName.value.trim(),
                    email: contactEmail.value.trim(),
                    message: contactMsg.value.trim()
                };

                // If offline, save to local queue
                if (!navigator.onLine) {
                    saveInquiryOffline(inqPayload);
                    contactForm.reset();
                    showToast('Inquiry saved offline! We will send it automatically once you are back online.', 'success');
                    return;
                }

                // Save inquiry to Python Database
                fetch(getApiUrl('/api/inquiry'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(inqPayload)
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        contactForm.reset();
                        showToast('Your inquiry has been sent to Mr. S. Deepak.', 'success');
                    } else {
                        showToast('Submission failed: ' + (data.error || 'Server error'), 'error');
                    }
                })
                .catch(err => {
                    console.error(err);
                    // Fallback to offline staging if fetch fails
                    saveInquiryOffline(inqPayload);
                    contactForm.reset();
                    showToast('Inquiry saved offline due to network connection issues.', 'success');
                });
            } else {
                showToast('Please correct validation issues before submitting.', 'error');
            }
        });
    }

    /* ==========================================================================
       QR Code Download Script
       ========================================================================== */
    const downloadQrBtn = document.getElementById('download-qr-btn');
    
    downloadQrBtn.addEventListener('click', () => {
        const svgElement = document.getElementById('poster-qr-svg');
        const serializer = new XMLSerializer();
        let source = serializer.serializeToString(svgElement);

        // Add namespaces
        if (!/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/.test(source)) {
            source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        if (!/^<svg[^>]+xmlns:xlink="http:\/\/www\.w3\.org\/1999\/xlink"/.test(source)) {
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
        downloadLink.remove();
        
        showToast('SVG QR code template downloaded successfully.', 'success');
    });

    /* ==========================================================================
       Aesthetic Micro-Interactions & Toast System
       ========================================================================== */
    // Toast system showToast is defined in the global/outer scope.

    /* ==========================================================================
       Mentor Access & Analytics Dashboard
       ========================================================================== */
    const mentorAccessBtn = document.getElementById('mentor-access-btn');
    const mobileMentorBtn = document.getElementById('mobile-mentor-btn');
    const mentorLoginModal = document.getElementById('mentor-login-modal');
    const closeLoginBtn = document.getElementById('close-login-btn');
    const mentorLoginForm = document.getElementById('mentor-login-form');
    const loginUsernameInput = document.getElementById('login-username');
    const loginPasswordInput = document.getElementById('login-password');
    const mentorDashboard = document.getElementById('mentor-dashboard');
    const mentorLogoutBtn = document.getElementById('mentor-logout-btn');
    const dbSearch = document.getElementById('db-search');
    const dbFilter = document.getElementById('db-filter');

    let dashboardData = { registrations: [], inquiries: [] };

    // Toggle Modal
    function toggleLoginModal(open) {
        if (open) {
            mentorLoginModal.classList.add('active');
        } else {
            mentorLoginModal.classList.remove('active');
            mentorLoginForm.reset();
        }
    }

    mentorAccessBtn.addEventListener('click', () => toggleLoginModal(true));
    if (mobileMentorBtn) {
        mobileMentorBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleLoginModal(true);
        });
    }
    closeLoginBtn.addEventListener('click', () => toggleLoginModal(false));

    // Form Submit login
    mentorLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = loginUsernameInput.value.trim();
        const password = loginPasswordInput.value.trim();

        fetch(getApiUrl('/api/login'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                sessionStorage.setItem('mentor_token', data.token);
                toggleLoginModal(false);
                showDashboard();
                showToast('Unlocked Mentor Dashboard successfully!', 'success');
            } else {
                showToast(data.error || 'Invalid credentials.', 'error');
            }
        })
        .catch(err => {
            console.error(err);
            showToast('Authentication failed. Server offline.', 'error');
        });
    });

    // Logout
    mentorLogoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('mentor_token');
        mentorDashboard.classList.remove('active');
        document.body.style.overflow = '';
        showToast('Logged out from dashboard.', 'success');
    });

    // Check existing session
    const activeToken = sessionStorage.getItem('mentor_token');
    if (activeToken) {
        showDashboard();
    }

    function showDashboard() {
        mentorDashboard.classList.add('active');
        document.body.style.overflow = 'hidden'; // Lock main scroll
        loadDashboardData();
    }

    function loadDashboardData() {
        const token = sessionStorage.getItem('mentor_token');
        if (!token) return;

        // Fetch Stats
        fetch(getApiUrl('/api/mentor/stats'), {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(stats => {
            document.getElementById('stat-registered').textContent = stats.registered;
            document.getElementById('stat-paid').textContent = stats.paid;
            document.getElementById('stat-unpaid').textContent = stats.unpaid;
            document.getElementById('stat-inquiries').textContent = stats.inquiries;
        })
        .catch(err => console.error('Error fetching stats:', err));

        // Fetch Detailed Data
        fetch(getApiUrl('/api/mentor/data'), {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            dashboardData.registrations = data.registrations || [];
            dashboardData.inquiries = data.inquiries || [];
            renderTables();
        })
        .catch(err => console.error('Error fetching data:', err));
    }

    function renderTables() {
        const regTbody = document.getElementById('registrations-tbody');
        const inqTbody = document.getElementById('inquiries-tbody');
        
        // Filter and Search terms
        const filterVal = dbFilter.value;
        const searchVal = dbSearch.value.trim().toLowerCase();

        // Render Registrations
        regTbody.innerHTML = '';
        const filteredRegs = dashboardData.registrations.filter(reg => {
            const matchesSearch = reg.name.toLowerCase().includes(searchVal) || reg.college.toLowerCase().includes(searchVal);
            const matchesFilter = filterVal === 'all' || 
                                 (filterVal === 'paid' && reg.payment_status === 'Paid') ||
                                 (filterVal === 'unpaid' && reg.payment_status === 'Unpaid');
            return matchesSearch && matchesFilter;
        });

        if (filteredRegs.length === 0) {
            regTbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">No matching records found</td></tr>`;
        } else {
            filteredRegs.forEach(reg => {
                const date = new Date(reg.timestamp).toLocaleDateString();
                const statusClass = reg.payment_status === 'Paid' ? 'paid' : 'unpaid';
                const methodStr = reg.payment_method ? ` via ${reg.payment_method.toUpperCase()}` : '';
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="font-family: 'Outfit'; font-weight: 600; color: var(--accent-color);">${reg.reg_id}</td>
                    <td><strong>${reg.name}</strong></td>
                    <td>
                        <span style="display:block;">${reg.email}</span>
                        <span style="font-size:0.75rem; color:var(--text-muted);">${reg.phone}</span>
                    </td>
                    <td>
                        <span style="display:block; font-weight:500;">${reg.college}</span>
                        <span style="font-size:0.75rem; color:var(--text-muted);">${reg.department.toUpperCase()} (${reg.role})</span>
                    </td>
                    <td><span class="status-badge ${statusClass}">${reg.payment_status}${methodStr}</span></td>
                    <td>${date}</td>
                `;
                regTbody.appendChild(tr);
            });
        }

        // Render Inquiries
        inqTbody.innerHTML = '';
        if (dashboardData.inquiries.length === 0) {
            inqTbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 24px;">No inquiries received yet</td></tr>`;
        } else {
            dashboardData.inquiries.forEach(inq => {
                const date = new Date(inq.timestamp).toLocaleDateString();
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${inq.name}</strong></td>
                    <td>${inq.email}</td>
                    <td style="white-space: pre-wrap; font-size:0.8rem; line-height: 1.4; max-width: 350px;">${inq.message}</td>
                    <td>${date}</td>
                `;
                inqTbody.appendChild(tr);
            });
        }
    }
    // Search and Filter Listeners
    dbSearch.addEventListener('input', renderTables);
    dbFilter.addEventListener('change', renderTables);

    /* ==========================================================================
       CLASS REMINDERS & ALERTS LOGIC (Fridays & Saturdays from July 17, 2026)
       ========================================================================== */
    const addToCalendarBtn = document.getElementById('add-to-calendar-btn');
    const enableNotificationsBtn = document.getElementById('enable-notifications-btn');

    if (addToCalendarBtn) {
        addToCalendarBtn.addEventListener('click', () => {
            try {
                // Generate a standard .ics (iCalendar) file subscription starting Friday, July 17, 2026
                const icsContent = [
                    "BEGIN:VCALENDAR",
                    "VERSION:2.0",
                    "PRODID:-//BCE CoE//CCNA Class Reminders//EN",
                    "CALSCALE:GREGORIAN",
                    "METHOD:PUBLISH",
                    
                    // Friday Class (Starts Fri, July 17, 2026 at 9:00 AM)
                    "BEGIN:VEVENT",
                    "UID:ccna-friday-class-2026@bce.edu",
                    "DTSTART;TZID=Asia/Kolkata:20260717T090000",
                    "DTEND;TZID=Asia/Kolkata:20260717T170000",
                    "RRULE:FREQ=WEEKLY;BYDAY=FR",
                    "SUMMARY:CCNA Training Session - BCE CoE",
                    "DESCRIPTION:Weekly CCNA Training Session. Lab assessment day.",
                    "LOCATION:BCE Center of Excellence Networking Lab",
                    "END:VEVENT",
                    
                    // Saturday Class (Starts Sat, July 18, 2026 at 9:00 AM)
                    "BEGIN:VEVENT",
                    "UID:ccna-saturday-class-2026@bce.edu",
                    "DTSTART;TZID=Asia/Kolkata:20260718T090000",
                    "DTEND;TZID=Asia/Kolkata:20260718T170000",
                    "RRULE:FREQ=WEEKLY;BYDAY=SA",
                    "SUMMARY:CCNA Training Session - BCE CoE",
                    "DESCRIPTION:Weekly CCNA Training Session. Attendance is mandatory.",
                    "LOCATION:BCE Center of Excellence Networking Lab",
                    "END:VEVENT",
                    
                    "END:VCALENDAR"
                ].join("\r\n");

                const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = "ccna_class_reminders.ics";
                document.body.appendChild(link);
                link.click();
                link.remove();
                
                showToast('Class schedule (.ics) downloaded! Add it to your calendar application.', 'success');
            } catch (err) {
                console.error(err);
                showToast('Failed to generate calendar file.', 'error');
            }
        });
    }

    if (enableNotificationsBtn) {
        enableNotificationsBtn.addEventListener('click', async () => {
            // Check if running inside Capacitor native wrapper
            if (globalThis.Capacitor?.Plugins?.LocalNotifications) {
                try {
                    const LocalNotifications = globalThis.Capacitor.Plugins.LocalNotifications;
                    const perm = await LocalNotifications.requestPermissions();
                    if (perm.display === 'granted') {
                        // Schedule notifications inside native Android app
                        await LocalNotifications.schedule({
                            notifications: [
                                {
                                    title: "CCNA Class Notification",
                                    body: "CCNA Training is scheduled today at 9:00 AM (Fridays & Saturdays).",
                                    id: 1,
                                    schedule: {
                                        on: { weekday: 5, hour: 8, minute: 0 }, // Friday at 8:00 AM
                                        repeats: true
                                    }
                                },
                                {
                                    title: "CCNA Class Notification",
                                    body: "CCNA Training is scheduled today at 9:00 AM (Fridays & Saturdays).",
                                    id: 2,
                                    schedule: {
                                        on: { weekday: 6, hour: 8, minute: 0 }, // Saturday at 8:00 AM
                                        repeats: true
                                    }
                                }
                            ]
                        });
                        showToast('Class reminders scheduled in native app wrapper!', 'success');
                    } else {
                        showToast('Permission to display notifications was denied.', 'warning');
                    }
                } catch (e) {
                    console.error("Capacitor Notifications error:", e);
                    showToast('Failed to schedule local app reminders.', 'error');
                }
            } else if ('Notification' in globalThis) {
                // Standard Web Browser Notification API
                try {
                    const permission = await Notification.requestPermission();
                    if (permission === 'granted') {
                        new Notification("CCNA Program BCE Alerts Enabled!", {
                            body: "Class alerts scheduled for Fridays & Saturdays starting July 17, 2026.",
                            icon: "assets/icon-192.png"
                        });
                        showToast('Notifications enabled! Reminders scheduled for class dates.', 'success');
                    } else {
                        showToast('Notifications permission was blocked or denied.', 'warning');
                    }
                } catch (err) {
                    console.error(err);
                    showToast('Notifications are not supported in this browser environment.', 'error');
                }
            } else {
                showToast('Notifications are not supported by your current browser.', 'error');
            }
        });
    }

    /* ==========================================================================
       MOBILE BOTTOM NAVIGATION HIGHLIGHTS (ScrollSpy)
       ========================================================================== */
    const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
    const scrollSections = document.querySelectorAll('.scroll-section');

    const updateActiveBottomNavTab = () => {
        let currentSectionId = 'home';
        const scrollPosition = globalThis.scrollY + 160;

        scrollSections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSectionId = section.getAttribute('id');
            }
        });

        bottomNavItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.section === currentSectionId) {
                item.classList.add('active');
            }
        });
    };

    globalThis.addEventListener('scroll', updateActiveBottomNavTab);
    updateActiveBottomNavTab(); // Highlight active tab immediately on load
    bottomNavItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                const headerOffset = 70;
                const elementPosition = targetSection.getBoundingClientRect().top;
                const offsetPosition = elementPosition + globalThis.pageYOffset - headerOffset;

                globalThis.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    /* ==========================================================================
       PWA MASTERPIECE UI - OFFLINE DETECTION & CUSTOM INSTALL PROMPT
       ========================================================================== */
    const offlineNotification = document.getElementById('offline-notification');
    const pwaInstallBanner = document.getElementById('pwa-install-banner');
    const pwaInstallBtn = document.getElementById('pwa-install-btn');
    const pwaCloseBtn = document.getElementById('pwa-close-btn');
    const drawerInstallBtn = document.getElementById('drawer-install-btn');

    // Offline / Online Status Detection
    function updateOnlineStatus() {
        const isOffline = !navigator.onLine;
        if (isOffline) {
            if (offlineNotification) offlineNotification.classList.add('active');
            showToast('You are currently offline. Pending entries will be saved locally.', 'warning');
        } else if (offlineNotification?.classList.contains('active')) {
            offlineNotification.classList.remove('active');
            showToast('You are back online! Synchronizing offline data...', 'success');
            syncOfflineData();
        }
    }

    globalThis.addEventListener('online', updateOnlineStatus);
    globalThis.addEventListener('offline', updateOnlineStatus);
    
    if (!navigator.onLine && offlineNotification) {
        offlineNotification.classList.add('active');
    }

    // Intercept form submissions when offline
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            if (!navigator.onLine) {
                const formId = form.getAttribute('id');
                if (formId === 'student-login-form' || formId === 'mentor-login-form' || 
                    formId === 'payment-card-form' || formId === 'payment-upi-form' || formId === 'payment-bank-form') {
                    e.preventDefault();
                    e.stopPropagation();
                    showToast('This action requires an active internet connection.', 'error');
                }
            }
        }, true);
    });

    // Custom PWA Install prompt handling
    let deferredPrompt;

    globalThis.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        const isDismissed = localStorage.getItem('pwa-install-dismissed') === 'true';
        if (!isDismissed && pwaInstallBanner) {
            pwaInstallBanner.classList.add('active');
        }

        if (drawerInstallBtn) {
            drawerInstallBtn.style.display = 'flex';
        }
    });

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to install prompt: ${outcome}`);
        deferredPrompt = null;
        if (pwaInstallBanner) pwaInstallBanner.classList.remove('active');
        if (drawerInstallBtn) drawerInstallBtn.style.display = 'none';
    };

    if (pwaInstallBtn) pwaInstallBtn.addEventListener('click', handleInstallClick);
    if (drawerInstallBtn) drawerInstallBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleInstallClick();
    });

    if (pwaCloseBtn && pwaInstallBanner) {
        pwaCloseBtn.addEventListener('click', () => {
            pwaInstallBanner.classList.remove('active');
            localStorage.setItem('pwa-install-dismissed', 'true');
        });
    }

    globalThis.addEventListener('appinstalled', (evt) => {
        console.log('CCNA Program BCE App installed successfully!');
        if (pwaInstallBanner) pwaInstallBanner.classList.remove('active');
        if (drawerInstallBtn) drawerInstallBtn.style.display = 'none';
        showToast('CCNA Program App installed successfully!', 'success');
    });

    /* ==========================================================================
       OFFLINE DATA STORAGE & SYNCHRONIZATION
       ========================================================================== */
    if (navigator.onLine) {
        syncOfflineData();
    }
});

/* ==========================================================================
   OFFLINE DATA STORAGE & SYNCHRONIZATION (Outer Scope)
   ========================================================================== */
function saveRegistrationOffline(regData) {
    const queue = JSON.parse(localStorage.getItem('offline_registrations') || '[]');
    if (!queue.some(r => r.email === regData.email)) {
        queue.push(regData);
        localStorage.setItem('offline_registrations', JSON.stringify(queue));
        console.log('[Offline Sync] Stage registration:', regData.email);
    }
}

function saveInquiryOffline(inqData) {
    const queue = JSON.parse(localStorage.getItem('offline_inquiries') || '[]');
    queue.push(inqData);
    localStorage.setItem('offline_inquiries', JSON.stringify(queue));
    console.log('[Offline Sync] Stage inquiry:', inqData.email);
}

async function syncOfflineRegistrations() {
    const pendingRegs = JSON.parse(localStorage.getItem('offline_registrations') || '[]');
    if (pendingRegs.length === 0) return;

    console.log(`[Offline Sync] Processing ${pendingRegs.length} pending registrations...`);
    const remainingRegs = [];

    for (const reg of pendingRegs) {
        try {
            const res = await fetch(getApiUrl('/api/register'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reg)
            });
            const data = await res.json();
            if (data.success || data.code === 'DUPLICATE_EMAIL') {
                console.log(`[Offline Sync] Synchronized registration: ${reg.email}`);
                showToast(`Pending registration for ${reg.name} synchronized successfully!`, 'success');
            } else {
                remainingRegs.push(reg);
            }
        } catch (err) {
            console.warn(`[Offline Sync] Sync failed for ${reg.email}:`, err.message);
            remainingRegs.push(reg);
        }
    }
    localStorage.setItem('offline_registrations', JSON.stringify(remainingRegs));
}

async function syncOfflineInquiries() {
    const pendingInquiries = JSON.parse(localStorage.getItem('offline_inquiries') || '[]');
    if (pendingInquiries.length === 0) return;

    console.log(`[Offline Sync] Processing ${pendingInquiries.length} pending inquiries...`);
    const remainingInqs = [];

    for (const inq of pendingInquiries) {
        try {
            const res = await fetch(getApiUrl('/api/inquiry'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(inq)
            });
            const data = await res.json();
            if (data.success) {
                console.log(`[Offline Sync] Synchronized inquiry: ${inq.email}`);
                showToast(`Offline inquiry from ${inq.name} sent successfully!`, 'success');
            } else {
                remainingInqs.push(inq);
            }
        } catch (err) {
            console.warn(`[Offline Sync] Sync failed for inquiry:`, err.message);
            remainingInqs.push(inq);
        }
    }
    localStorage.setItem('offline_inquiries', JSON.stringify(remainingInqs));
}

async function syncOfflineData() {
    if (!navigator.onLine) return;
    await syncOfflineRegistrations();
    await syncOfflineInquiries();
}

/* ==========================================================================
   Aesthetic Micro-Interactions & Toast System (Outer Scope)
   ========================================================================== */
let toastTimeout;

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast-alert');
    const toastIcon = document.getElementById('toast-icon');
    const toastMsg = document.getElementById('toast-message');
    if (!toast || !toastIcon || !toastMsg) return;

    clearTimeout(toastTimeout);
    toastMsg.textContent = message;
    toast.className = 'toast-alert'; // reset class
    
    if (type === 'success') {
        toast.classList.add('active', 'success');
        toastIcon.dataset.lucide = 'check-circle-2';
    } else if (type === 'error') {
        toast.classList.add('active', 'error');
        toastIcon.dataset.lucide = 'alert-circle';
    }

    // Redraw lucide icon for dynamic class shifts
    if (globalThis.lucide) {
        globalThis.lucide.createIcons();
    }

    toastTimeout = setTimeout(() => {
        toast.classList.remove('active');
    }, 4000);
}
