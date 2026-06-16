/* ============================================================================
   BCE CCNA TRAINING PORTAL - MAIN APPLICATION LOGIC
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ==========================================================================
     Toast Notification System
     ========================================================================== */
  function showToast(message, type = 'success') {
    const container = document.querySelector('.toast-container') || (() => {
      const div = document.createElement('div');
      div.className = 'toast-container';
      document.body.appendChild(div);
      return div;
    })();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => toast.remove(), 4000);
  }

  /* ==========================================================================
     Authentication Gate (Sign In / Sign Up)
     ========================================================================== */
  const authGate = document.querySelector('.auth-gate');
  const gateSignInForm = authGate?.querySelector('form');
  const gateSignUpForm = authGate?.querySelector('form:nth-of-type(2)');
  const signInTabBtn = authGate?.querySelector('[data-tab="signin"]');
  const signUpTabBtn = authGate?.querySelector('[data-tab="signup"]');

  if (signInTabBtn) {
    signInTabBtn.addEventListener('click', () => {
      authGate.classList.add('show-signin');
      authGate.classList.remove('show-signup');
      signInTabBtn.classList.add('active');
      signUpTabBtn.classList.remove('active');
    });
  }

  if (signUpTabBtn) {
    signUpTabBtn.addEventListener('click', () => {
      authGate.classList.remove('show-signin');
      authGate.classList.add('show-signup');
      signUpTabBtn.classList.add('active');
      signInTabBtn.classList.remove('active');
    });
  }

  if (gateSignInForm) {
    gateSignInForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = gateSignInForm.querySelector('input[type="email"]').value;
      const password = gateSignInForm.querySelector('input[type="password"]').value;

      try {
        const res = await fetch('/api/signin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.success) {
          sessionStorage.setItem('user_email', email);
          sessionStorage.setItem('user_authenticated', 'true');
          authGate.style.display = 'none';
          showToast('✓ Welcome back! Portal unlocked.', 'success');
        } else {
          showToast(data.error || 'Invalid credentials.', 'error');
        }
      } catch (err) {
        showToast('Connection error. Please try again.', 'error');
      }
    });
  }

  if (gateSignUpForm) {
    gateSignUpForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = gateSignUpForm.querySelector('input[type="email"]').value;
      const password = gateSignUpForm.querySelector('input[type="password"]').value;
      const confirm = gateSignUpForm.querySelector('input[name="confirm-password"]').value;

      if (password !== confirm) {
        showToast('Passwords do not match.', 'error');
        return;
      }

      try {
        const res = await fetch('/api/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.success) {
          sessionStorage.setItem('user_email', email);
          sessionStorage.setItem('user_authenticated', 'true');
          authGate.style.display = 'none';
          showToast('✓ Account created successfully!', 'success');
        } else {
          showToast(data.error || 'Failed to create account.', 'error');
        }
      } catch (err) {
        showToast('Connection error. Please try again.', 'error');
      }
    });
  }

  /* ==========================================================================
     Registration Wizard
     ========================================================================== */
  const wizardTabs = document.querySelectorAll('.wizard-tab');
  const wizardContents = document.querySelectorAll('.wizard-content');
  const registrationForm = document.querySelector('form[data-wizard="registration"]');
  let currentStep = 0;

  function showStep(step) {
    wizardContents.forEach((content, i) => {
      if (i === step) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });

    wizardTabs.forEach((tab, i) => {
      if (i === step) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  }

  wizardTabs.forEach((tab, i) => {
    tab.addEventListener('click', () => {
      currentStep = i;
      showStep(currentStep);
    });
  });

  if (registrationForm) {
    const prevBtn = registrationForm.querySelector('button[data-action="prev"]');
    const nextBtn = registrationForm.querySelector('button[data-action="next"]');
    const submitBtn = registrationForm.querySelector('button[type="submit"]');

    prevBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      if (currentStep > 0) {
        currentStep--;
        showStep(currentStep);
      }
    });

    nextBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      if (validateStep(currentStep)) {
        if (currentStep < 2) {
          currentStep++;
          showStep(currentStep);
        }
      }
    });

    registrationForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(registrationForm);
      const payload = {
        date: new Date().toLocaleDateString(),
        name: formData.get('name'),
        mobile: formData.get('mobile'),
        category: formData.get('category'),
        collegeType: formData.get('college-type'),
        usn: formData.get('usn'),
        institution: formData.get('institution'),
        branch: formData.get('branch'),
        year: formData.get('year'),
        course: formData.get('course'),
        amount: '₹7,500.00',
        status: 'Pending'
      };

      try {
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          showToast('✓ Registration submitted successfully!', 'success');
          registrationForm.reset();
          currentStep = 0;
          showStep(0);
          
          // Display invoice
          const invoiceSection = registrationForm.closest('section').querySelector('.invoice-template');
          if (invoiceSection) {
            invoiceSection.style.display = 'block';
            invoiceSection.querySelector('[data-field="student-name"]').textContent = payload.name;
            invoiceSection.querySelector('[data-field="student-mobile"]').textContent = payload.mobile;
            invoiceSection.querySelector('[data-field="student-category"]').textContent = payload.category;
          }
        } else {
          showToast(data.error || 'Registration failed.', 'error');
        }
      } catch (err) {
        showToast('Connection error. Please try again.', 'error');
      }
    });
  }

  function validateStep(step) {
    const inputs = wizardContents[step]?.querySelectorAll('input[required], select[required]') || [];
    for (let input of inputs) {
      if (!input.value.trim()) {
        showToast(`Please fill in all required fields in Step ${step + 1}.`, 'error');
        return false;
      }
    }
    return true;
  }

  /* ==========================================================================
     FAQ Accordion
     ========================================================================== */
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question?.addEventListener('click', () => {
      faqItems.forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove('active');
        }
      });
      item.classList.toggle('active');
    });
  });

  /* ==========================================================================
     Modal Dialog for Poster Preview
     ========================================================================== */
  const posterBtn = document.querySelector('[data-modal="poster"]');
  const posterModal = document.querySelector('.modal-dialog[data-modal="poster"]');
  const posterCloseBtn = posterModal?.querySelector('.modal-close');

  posterBtn?.addEventListener('click', () => {
    posterModal.classList.add('show');
  });

  posterCloseBtn?.addEventListener('click', () => {
    posterModal.classList.remove('show');
  });

  posterModal?.addEventListener('click', (e) => {
    if (e.target === posterModal) {
      posterModal.classList.remove('show');
    }
  });

  /* ==========================================================================
     Contact Form
     ========================================================================== */
  const contactForm = document.querySelector('form[data-form="contact"]');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = contactForm.querySelector('input[name="name"]').value;
      const email = contactForm.querySelector('input[name="email"]').value;
      const message = contactForm.querySelector('textarea[name="message"]').value;

      showToast('✓ Message sent! We will contact you shortly.', 'success');
      contactForm.reset();
    });
  }

  /* ==========================================================================
     Smooth Scroll & Active Nav Link Highlighting
     ========================================================================== */
  const navLinks = document.querySelectorAll('nav a[href^="#"]');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      }
    });
  });

  /* ==========================================================================
     Payment Integration (Simulated)
     ========================================================================== */
  const paymentBtn = document.querySelector('[data-action="payment"]');
  const qrModal = document.querySelector('.modal-dialog[data-modal="qr"]');
  const qrClose = qrModal?.querySelector('.modal-close');

  paymentBtn?.addEventListener('click', () => {
    if (validateStep(currentStep)) {
      qrModal.classList.add('show');
    }
  });

  qrClose?.addEventListener('click', () => {
    qrModal.classList.remove('show');
  });

  qrModal?.addEventListener('click', (e) => {
    if (e.target === qrModal) {
      qrModal.classList.remove('show');
    }
  });

  /* ==========================================================================
     Certificate Generation Simulator
     ========================================================================== */
  const certBtn = document.querySelector('[data-action="certificate"]');
  certBtn?.addEventListener('click', () => {
    const studentName = sessionStorage.getItem('user_email')?.split('@')[0] || 'Student';
    const certContent = `
      <div style="border: 3px solid gold; padding: 40px; text-align: center; font-family: Georgia; background: linear-gradient(135deg, rgba(37, 99, 235, 0.05), rgba(217, 119, 6, 0.05)); margin: 20px; border-radius: 10px;">
        <h1 style="color: #2563eb; font-size: 2.5rem; margin-bottom: 10px;">CERTIFICATE OF COMPLETION</h1>
        <p style="color: #666; font-size: 0.9rem; letter-spacing: 2px; text-transform: uppercase;">Awarded to</p>
        <h2 style="color: #d97706; font-size: 2rem; font-weight: bold; margin: 20px 0;">${studentName}</h2>
        <p style="color: #666; font-size: 1rem;">For successful completion of the</p>
        <p style="color: #2563eb; font-size: 1.1rem; font-weight: bold;">BCE CCNA Certification Training Program</p>
        <p style="color: #666; margin-top: 30px;">150 Hours of Practical Networking Training</p>
        <p style="color: #666; font-size: 0.9rem;">Date: ${new Date().toLocaleDateString()}</p>
        <p style="margin-top: 40px; border-top: 2px solid #2563eb; padding-top: 20px; color: #666; font-size: 0.85rem;">Issued by Bahubali College of Engineering Centre of Excellence</p>
      </div>
    `;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(certContent);
    printWindow.document.close();
    printWindow.print();
  });

  /* ==========================================================================
     Service Worker Registration (PWA Support)
     ========================================================================== */
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {
      console.log('Service Worker registration failed (offline mode may be limited)');
    });
  }

  /* ==========================================================================
     Voice Command Assistant (Web Speech API)
     ========================================================================== */
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      
      if (transcript.includes('fees') || transcript.includes('cost')) {
        showToast('The CCNA course fee is ₹7,500. Click "Register Now" to enroll.', 'success');
      } else if (transcript.includes('schedule') || transcript.includes('when')) {
        showToast('Training starts July 17th, 2026. Fridays & Saturdays (Offline). Contact coordinator for exact timings.', 'success');
      } else if (transcript.includes('contact') || transcript.includes('phone')) {
        showToast('Coordinator: Mr. S. Deepak | Phone: +91 7875936836 | Email: deepak.bce@gmail.com', 'success');
      } else if (transcript.includes('mentor')) {
        window.location.href = 'mentor.html';
      } else {
        showToast(`Voice Command: "${transcript}" - Please try "What is the fee?" or "When are classes?"`, 'info');
      }
    };

    const voiceBtn = document.querySelector('[data-action="voice"]');
    voiceBtn?.addEventListener('click', () => {
      recognition.start();
    });
  }

  /* ==========================================================================
     Scroll Animation Triggers
     ========================================================================== */
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animation = 'fadeIn 0.8s ease-out forwards';
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.card, section > *').forEach(el => {
    observer.observe(el);
  });

  /* ==========================================================================
     Responsive Header Toggle
     ========================================================================== */
  const menuToggle = document.querySelector('[data-toggle="menu"]');
  const navMenu = document.querySelector('nav');

  menuToggle?.addEventListener('click', () => {
    navMenu?.classList.toggle('mobile-open');
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('nav') && !e.target.closest('[data-toggle="menu"]')) {
      navMenu?.classList.remove('mobile-open');
    }
  });

});
