document.addEventListener('DOMContentLoaded', () => {

  /* ==========================================================================
     AI Chatbot UI Injection
     ========================================================================== */
  const chatbotHTML = `
    <!-- AI Chatbot Bubble Toggle -->
    <div id="chatbotToggle" class="chatbot-toggle" title="Ask AI Assistant">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="icon-svg"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
    </div>

    <!-- Chat Window Container -->
    <div id="chatbotWindow" class="chatbot-window hidden">
      <div class="chatbot-header">
        <div class="chatbot-header-logo">
          <img src="assets/logo.jpg" alt="BCE">
          <div>
            <h4>BCE Networking AI</h4>
            <span>Online Course Assistant</span>
          </div>
        </div>
        <button id="chatbotClose" class="chatbot-close-btn">&times;</button>
      </div>

      <!-- Messages Body -->
      <div class="chatbot-messages" id="chatbotMessages">
        <div class="chat-msg bot">
          <div class="msg-bubble">
            Hello! I am your BCE CCNA AI Assistant. I can help answer questions about our 150-hour practical CCNA course, the ₹7,500 fee, class timings, or explain networking topics (like Subnetting, OSPF, and VLANs). Feel free to ask or use the Voice Assistant mic at the top!
          </div>
        </div>
      </div>

      <!-- Quick Option Chips -->
      <div class="chatbot-quick-chips">
        <button class="quick-chip-btn" data-query="Course Fee">Course Fee?</button>
        <button class="quick-chip-btn" data-query="Class Schedule">Class Schedule?</button>
        <button class="quick-chip-btn" data-query="Who is Mr. S. Deepak?">Who is Coordinator?</button>
        <button class="quick-chip-btn" data-query="What is VLSM Subnetting?">What is Subnetting?</button>
      </div>

      <!-- Chat Input Area -->
      <form id="chatbotInputForm" class="chatbot-input-area">
        <input type="text" id="chatbotInput" class="form-control" placeholder="Ask your doubts..." autocomplete="off">
        <button type="submit" class="chatbot-send-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </form>
    </div>
  `;

  const div = document.createElement('div');
  div.innerHTML = chatbotHTML;
  document.body.appendChild(div);

  /* ==========================================================================
     Knowledge Base Rules Engine
     ========================================================================== */
  const KNOWLEDGE_BASE = [
    {
      keywords: ['fee', 'cost', 'price', 'payment', 'charge', 'money', '7500'],
      answer: "The total enrolment fee for the CCNA program is a flat rate of ₹7,500.00 (inclusive of registration, lab resources, and GST). Payment is simulator-hosted using Razorpay UPI via the PhonePe QR code."
    },
    {
      keywords: ['schedule', 'days', 'hours', 'when', 'timings', 'training', 'classes', 'starts', 'july'],
      answer: "The program begins on July 17th, 2026. Weekly core lab and theory sessions are held on Fridays and Saturdays (Offline) with extended hours to accommodate engineers, engineering students, and professionals."
    },
    {
      keywords: ['duration', 'long', 'total hours', '150'],
      answer: "The CCNA Certification Training Program contains 150 hours of intensive physical routing and switching practical lab sessions, mapped to VTU standards."
    },
    {
      keywords: ['coordinator', 'deepak', 'instructor', 'teacher', 'deepak.s', 'deepak s'],
      answer: "The Program Coordinator is Mr. S. Deepak, Assistant Professor & Head of the Centre of Excellence for Networking. You can contact him at +91 7875936836 or email deepak.bce@gmail.com."
    },
    {
      keywords: ['student coordinator', 'madan', 'madan kumar'],
      answer: "The Student Coordinator is Madan Kumar, a Third-Year ECE student at BCE."
    },
    {
      keywords: ['principal', 'sunil', 'sunil kumar'],
      answer: "The Chief Patron of the CCNA CoE program is Dr. Sunil Kumar D, Principal of Bahubali College of Engineering (BCE)."
    },
    {
      keywords: ['convenor', 'shobha'],
      answer: "The Convenor is Dr. Shobha Y K, HoD of the Department of Electronics & Communication Engineering."
    },
    {
      keywords: ['patron', 'rajkiran'],
      answer: "The CAO is Dr. Rajkiran Ballal, Chief Administrative Officer of BCE."
    },
    {
      keywords: ['where', 'location', 'address', 'venue', 'campus'],
      answer: "The course is conducted offline at the Centre of Excellence for Networking, Bahubali College of Engineering, Shravanabelagola, Channarayapatna Taluk, Hassan District, Karnataka - 573135."
    },
    {
      keywords: ['subnetting', 'subnet', 'vlsm', 'variable length'],
      answer: "Subnetting is the process of partitioning a single physical network into smaller subnetworks (subnets). Master it in Module 3 (VLSM Addressing schemas and route optimization) during our lab sessions."
    },
    {
      keywords: ['ospf', 'routing', 'dynamic routing'],
      answer: "OSPF (Open Shortest Path First) is a link-state routing protocol used to find the best path for packets. You will configure OSPFv2 and OSPFv3 topographies on real Cisco hardware in Module 5."
    },
    {
      keywords: ['vlan', 'vlan Trunking', 'switch'],
      answer: "VLAN (Virtual Local Area Network) allows segmenting a physical switch into distinct logical broadcast domains. In Module 4, you will configure VLAN trunking, Inter-VLAN routing, and STP protocols."
    },
    {
      keywords: ['real hardware', 'routers', 'switches', 'cisco'],
      answer: "You will practice on real physical Cisco ISR 2900/1900 Series Routers and Cisco Catalyst 2960/3560 Layer 2 & Layer 3 Managed Switches inside the BCE COE lab racks."
    },
    {
      keywords: ['vtu', 'affiliation', 'college name'],
      answer: "Bahubali College of Engineering (BCE) is located in Shravanabelagola, affiliated with VTU Belagavi, and approved by AICTE, New Delhi."
    }
  ];

  function getBotResponse(userQuery) {
    const query = userQuery.toLowerCase().trim();
    
    for (const item of KNOWLEDGE_BASE) {
      for (const kw of item.keywords) {
        if (query.includes(kw)) {
          return item.answer;
        }
      }
    }
    
    return "I'm a specialized BCE CCNA AI Assistant. I can help you with details about the CCNA course curriculum, scheduling, ₹7,500 fee, coordinator details, or general networking topics like OSPF, subnetting, and VLANs. Try asking 'What is the course fee?' or 'Who is the program coordinator?'";
  }

  const chatbotToggle = document.getElementById('chatbotToggle');
  const chatbotWindow = document.getElementById('chatbotWindow');
  const chatbotClose = document.getElementById('chatbotClose');
  const chatbotInputForm = document.getElementById('chatbotInputForm');
  const chatbotInput = document.getElementById('chatbotInput');
  const chatbotMessages = document.getElementById('chatbotMessages');
  const quickChips = document.querySelectorAll('.quick-chip-btn');
  const aiVoiceBtn = document.getElementById('aiVoiceBtn');

  chatbotToggle.addEventListener('click', () => {
    chatbotWindow.classList.toggle('hidden');
    chatbotInput.focus();
    chatbotToggle.classList.add('hidden');
  });

  chatbotClose.addEventListener('click', () => {
    chatbotWindow.classList.add('hidden');
    chatbotToggle.classList.remove('hidden');
  });

  chatbotInputForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const txt = chatbotInput.value.trim();
    if (!txt) return;
    
    appendMessage(txt, 'user');
    chatbotInput.value = '';
    
    setTimeout(() => {
      const resp = getBotResponse(txt);
      appendMessage(resp, 'bot');
    }, 500);
  });

  quickChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const txt = chip.getAttribute('data-query');
      appendMessage(txt, 'user');
      setTimeout(() => {
        const resp = getBotResponse(txt);
        appendMessage(resp, 'bot');
      }, 500);
    });
  });

  function appendMessage(text, sender) {
    const bubble = document.createElement('div');
    bubble.className = `chat-msg ${sender}`;
    bubble.innerHTML = `<div class="msg-bubble">${text}</div>`;
    chatbotMessages.appendChild(bubble);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  }

  /* ==========================================================================
     Voice Assistant & Text-to-Speech Engine
     ========================================================================== */
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    
    let isListening = false;

    recognition.onstart = () => {
      isListening = true;
      aiVoiceBtn.classList.add('recording-active');
      aiVoiceBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" class="icon-svg animate-pulse"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg>
      `;
      chatbotWindow.classList.remove('hidden');
      chatbotToggle.classList.add('hidden');
      appendMessage("Listening to your voice...", "bot");
    };

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      appendMessage(transcript, 'user');
      
      const response = getBotResponse(transcript);
      setTimeout(() => {
        appendMessage(response, 'bot');
        speakText(response);
      }, 500);
    };

    recognition.onerror = () => {
      appendMessage("Speech recognition error. Please try typing instead.", "bot");
      resetVoiceBtn();
    };

    recognition.onend = () => {
      isListening = false;
      resetVoiceBtn();
    };

    aiVoiceBtn.addEventListener('click', () => {
      if (isListening) {
        recognition.stop();
      } else {
        recognition.start();
      }
    });

    function resetVoiceBtn() {
      aiVoiceBtn.classList.remove('recording-active');
      aiVoiceBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-svg"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>
      `;
    }

    function speakText(text) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        
        const voices = window.speechSynthesis.getVoices();
        const englishVoice = voices.find(voice => voice.lang.includes('en'));
        if (englishVoice) {
          utterance.voice = englishVoice;
        }
        
        window.speechSynthesis.speak(utterance);
      }
    }
    
  } else {
    aiVoiceBtn.addEventListener('click', () => {
      alert("Speech recognition is not supported in this browser. Please use the chat bubble in the bottom right corner.");
    });
  }

});
