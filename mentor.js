document.addEventListener('DOMContentLoaded', () => {

  /* ==========================================================================
     Mentor Authentication
     ========================================================================== */
  const loginForm = document.getElementById('loginForm');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const loginError = document.getElementById('loginError');
  const loginSection = document.getElementById('loginSection');
  const dashboardShell = document.getElementById('dashboardShell');
  
  if (sessionStorage.getItem('mentor_authenticated') === 'true') {
    initDashboard();
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const u = usernameInput.value.trim();
    const p = passwordInput.value;
    
    try {
      const res = await fetch('/api/mentor/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p })
      });
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem('mentor_authenticated', 'true');
        sessionStorage.setItem('mentor_user', u);
        sessionStorage.setItem('mentor_pass', p);
        initDashboard();
      } else {
        passwordInput.classList.add('is-invalid');
        loginError.textContent = data.error || 'Invalid username or password.';
        passwordInput.focus();
      }
    } catch (err) {
      loginError.textContent = 'Server connection error.';
    }
  });

  /* ==========================================================================
     Dashboard Initialization
     ========================================================================== */
  let registryList = [];
  
  async function initDashboard() {
    loginSection.style.display = 'none';
    dashboardShell.classList.add('active');
    await fetchRegistrations();
  }

  async function fetchRegistrations() {
    const u = sessionStorage.getItem('mentor_user');
    const p = sessionStorage.getItem('mentor_pass');
    
    try {
      const res = await fetch('/api/mentor/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p })
      });
      const data = await res.json();
      if (data.success) {
        registryList = data.registrations;
        renderMetrics();
        renderTable(registryList);
      } else {
        sessionStorage.clear();
        window.location.reload();
      }
    } catch (err) {
      console.error('Failed to fetch registrations', err);
    }
  }

  /* ==========================================================================
     Metric Cards Computations
     ========================================================================== */
  const valTotalStudents = document.getElementById('valTotalStudents');
  const valTotalRevenue = document.getElementById('valTotalRevenue');
  
  function renderMetrics() {
    valTotalStudents.textContent = registryList.length;
    const approvedCount = registryList.filter(s => s.status === 'Approved').length;
    const totalRevenue = approvedCount * 7500;
    valTotalRevenue.textContent = '₹' + totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /* ==========================================================================
     Table Rendering & Actions
     ========================================================================== */
  const studentTableBody = document.getElementById('studentTableBody');
  const tableSearch = document.getElementById('tableSearch');
  
  function renderTable(list) {
    studentTableBody.innerHTML = '';
    
    if (list.length === 0) {
      studentTableBody.innerHTML = `<tr><td colspan="9" class="text-center" style="color: #64748b; padding: 30px;">No registered students found matching search.</td></tr>`;
      return;
    }

    list.forEach((student, index) => {
      const tr = document.createElement('tr');
      const statusClass = student.status === 'Approved' ? 'status-approved' : 'status-pending';
      const collegeTypeLabel = student.collegeType === 'bce' ? 'BCE (Bahubali)' : 'Other College';
      
      let detailsLabel = '';
      if (student.collegeType === 'bce') {
        detailsLabel = `<strong>USN:</strong> ${student.usn}<br><strong>Branch:</strong> ${student.branch.toUpperCase()} (${student.course || 'B.E.'})<br><strong>Year:</strong> ${student.year}`;
      } else {
        detailsLabel = `<strong>College:</strong> ${student.institution}<br><strong>Branch:</strong> ${student.branch}`;
      }
      
      let actionButtons = '';
      if (student.status === 'Pending') {
        actionButtons = `
          <button class="btn-action btn-action-approve" onclick="updateStatus(${index}, 'Approved')">Approve</button>
          <button class="btn-action btn-action-reject" onclick="updateStatus(${index}, 'Rejected')">Reject</button>
        `;
      } else {
        actionButtons = `<span style="color:#64748b;">Approved</span>`;
      }

      tr.innerHTML = `
        <td>${student.date}</td>
        <td><strong>${student.name}</strong></td>
        <td>${student.mobile}</td>
        <td style="text-transform: capitalize;">${student.category}</td>
        <td>${collegeTypeLabel}</td>
        <td>${detailsLabel}</td>
        <td style="color:#10b981; font-weight:600;">${student.amount || '₹7,500.00'}</td>
        <td><span class="badge-status ${statusClass}">${student.status}</span></td>
        <td class="actions-cell">${actionButtons}</td>
      `;
      studentTableBody.appendChild(tr);
    });
  }

  tableSearch.addEventListener('input', () => {
    const query = tableSearch.value.trim().toLowerCase();
    const filtered = registryList.filter(student => 
      student.name.toLowerCase().includes(query) || 
      (student.institution && student.institution.toLowerCase().includes(query)) ||
      (student.usn && student.usn.toLowerCase().includes(query)) ||
      student.mobile.includes(query)
    );
    renderTable(filtered);
  });

  window.updateStatus = async function(index, newStatus) {
    const u = sessionStorage.getItem('mentor_user');
    const p = sessionStorage.getItem('mentor_pass');
    
    try {
      const res = await fetch('/api/mentor/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p, index, status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        registryList = data.registrations;
        renderMetrics();
        renderTable(registryList);
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Failed to connect to server.');
    }
  };

  const btnExport = document.getElementById('btnExport');
  btnExport.addEventListener('click', () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Name,Mobile,Category,College Option,Institution Details / USN,Amount,Status\n";
    
    registryList.forEach(s => {
      const collegeLabel = s.collegeType === 'bce' ? 'BCE' : 'Other';
      const details = s.collegeType === 'bce' ? `${s.usn} | ${s.branch.toUpperCase()}` : `${s.institution} | ${s.branch}`;
      csvContent += `${s.date},"${s.name}",${s.mobile},${s.category},${collegeLabel},"${details}",${s.amount},${s.status}\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BCE_CCNA_GoogleSheetsSim_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

});
