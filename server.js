const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

const DB_USERS_FILE = path.join(__dirname, 'users.json');
const DB_REGS_FILE = path.join(__dirname, 'registrations.json');
const GOOGLE_SHEET_FILE = path.join(__dirname, 'google_sheets_sim.csv');

// Initialize database files if they don't exist
if (!fs.existsSync(DB_USERS_FILE)) {
  fs.writeFileSync(DB_USERS_FILE, JSON.stringify([]));
}

if (!fs.existsSync(DB_REGS_FILE)) {
  const SEED_DATA = [
    {
      date: '10-Jun-2026',
      name: 'Rahul Sharma',
      mobile: '9876543210',
      category: 'student',
      collegeType: 'bce',
      usn: '4BD22CS045',
      year: '3rd Year',
      branch: 'cs',
      course: 'B.E.',
      institution: 'Bahubali College of Engineering',
      amount: '₹7,500.00',
      status: 'Approved'
    },
    {
      date: '11-Jun-2026',
      name: 'Priya Patel',
      mobile: '8765432109',
      category: 'student',
      collegeType: 'bce',
      usn: '4BD23EC012',
      year: '2nd Year',
      branch: 'ec',
      course: 'B.E.',
      institution: 'Bahubali College of Engineering',
      amount: '₹7,500.00',
      status: 'Approved'
    },
    {
      date: '12-Jun-2026',
      name: 'Amit Kumar',
      mobile: '7654321098',
      category: 'professional',
      collegeType: 'other',
      institution: 'Wipro Technologies Bangalore',
      branch: 'Infrastructure Support',
      amount: '₹7,500.00',
      status: 'Approved'
    },
    {
      date: '14-Jun-2026',
      name: 'Sneha Nair',
      mobile: '9123456780',
      category: 'jobseeker',
      collegeType: 'other',
      institution: 'Self-Employed',
      branch: 'Information Technology',
      amount: '₹7,500.00',
      status: 'Pending'
    }
  ];
  fs.writeFileSync(DB_REGS_FILE, JSON.stringify(SEED_DATA, null, 2));
  updateGoogleSheetCSV(SEED_DATA);
}

// Utility to sync database state with mock Google Sheets CSV
function updateGoogleSheetCSV(registrations) {
  let csvContent = 'Date,Name,Mobile,Category,College Type,USN/College Name,Year,Branch,Course,Amount,Status\n';
  registrations.forEach(r => {
    const institutionInfo = r.collegeType === 'bce' ? r.institution : r.institution;
    csvContent += `"${r.date}","${r.name}","${r.mobile}","${r.category}","${r.collegeType}","${institutionInfo}","${r.year || ''}","${r.branch || ''}","${r.course || ''}","${r.amount}","${r.status}"\n`;
  });
  fs.writeFileSync(GOOGLE_SHEET_FILE, csvContent);
}

// Helper to parse JSON request body
function parseJsonBody(req, res, callback) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  req.on('end', () => {
    try {
      if (!body) {
        callback(null, {});
        return;
      }
      callback(null, JSON.parse(body));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Invalid JSON payload' }));
    }
  });
}

const server = http.createServer((req, res) => {
  const decodedUrl = decodeURIComponent(req.url);
  const parsedUrl = new URL(decodedUrl, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // 1. API: Sign Up
  if (pathname === '/api/signup' && req.method === 'POST') {
    parseJsonBody(req, res, (err, data) => {
      if (err || !data.email || !data.password) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Email and password are required' }));
        return;
      }
      
      const email = data.email.trim().toLowerCase();
      const password = data.password;
      
      const users = JSON.parse(fs.readFileSync(DB_USERS_FILE, 'utf8'));
      const exists = users.find(u => u.email === email);
      
      if (exists) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Email is already registered. Please sign in instead.' }));
        return;
      }
      
      users.push({ email, password });
      fs.writeFileSync(DB_USERS_FILE, JSON.stringify(users, null, 2));
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Account registered successfully!' }));
    });
    return;
  }

  // 2. API: Sign In
  if (pathname === '/api/signin' && req.method === 'POST') {
    parseJsonBody(req, res, (err, data) => {
      if (err || !data.email || !data.password) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Email and password are required' }));
        return;
      }
      
      const email = data.email.trim().toLowerCase();
      const password = data.password;
      
      const users = JSON.parse(fs.readFileSync(DB_USERS_FILE, 'utf8'));
      const user = users.find(u => u.email === email);
      
      if (!user) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Account not found. Please sign up first.' }));
        return;
      }
      
      if (user.password !== password) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Incorrect password. Access denied.' }));
        return;
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Signed in successfully!' }));
    });
    return;
  }

  // 3. API: Submit course registration
  if (pathname === '/api/register' && req.method === 'POST') {
    parseJsonBody(req, res, (err, registration) => {
      if (err || !registration.name || !registration.mobile) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Incomplete registration details.' }));
        return;
      }
      
      const regs = JSON.parse(fs.readFileSync(DB_REGS_FILE, 'utf8'));
      regs.push(registration);
      fs.writeFileSync(DB_REGS_FILE, JSON.stringify(regs, null, 2));
      updateGoogleSheetCSV(regs);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Registration recorded in database.' }));
    });
    return;
  }

  // 4. API: Mentor login & get registrations
  if (pathname === '/api/mentor/data' && req.method === 'POST') {
    parseJsonBody(req, res, (err, data) => {
      if (err || data.username !== 'deepak.s' || data.password !== 'CCNA@BCE2026') {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Unauthorized mentor access.' }));
        return;
      }
      
      const regs = JSON.parse(fs.readFileSync(DB_REGS_FILE, 'utf8'));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, registrations: regs }));
    });
    return;
  }

  // 5. API: Mentor approve/reject action
  if (pathname === '/api/mentor/update' && req.method === 'POST') {
    parseJsonBody(req, res, (err, data) => {
      if (err || data.username !== 'deepak.s' || data.password !== 'CCNA@BCE2026') {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Unauthorized mentor access.' }));
        return;
      }
      
      const regs = JSON.parse(fs.readFileSync(DB_REGS_FILE, 'utf8'));
      const index = data.index;
      const newStatus = data.status;
      
      if (index >= 0 && index < regs.length) {
        if (newStatus === 'Rejected') {
          regs.splice(index, 1);
        } else {
          regs[index].status = newStatus;
        }
        fs.writeFileSync(DB_REGS_FILE, JSON.stringify(regs, null, 2));
        updateGoogleSheetCSV(regs);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, registrations: regs }));
      } else {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid record index.' }));
      }
    });
    return;
  }

  // 6. Serve static files
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }
  
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Server Error: ' + err.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
