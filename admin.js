// Admin credentials
const ADMIN_CREDENTIALS = {
    email: 'radheyjii@outlook.in',
    password: 'Sunradhey#123'
};

// Mock data for demonstration
// In production, you would fetch this from your database
let mockDonations = [
    {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+919876543210',
        type: 'child',
        amount: 300,
        instagram: '@johndoe',
        whatsapp: true,
        message: 'Keep up the good work!',
        timestamp: '2024-01-15T10:30:00Z',
        status: 'verified'
    },
    {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: null,
        type: 'dog',
        amount: 200,
        instagram: null,
        whatsapp: false,
        message: null,
        timestamp: '2024-01-14T15:45:00Z',
        status: 'pending'
    },
    {
        id: '3',
        name: 'Bob Wilson',
        email: 'bob@example.com',
        phone: '+919876543211',
        type: 'both',
        amount: 500,
        instagram: '@bobwilson',
        whatsapp: true,
        message: 'For children and dogs',
        timestamp: '2024-01-13T09:15:00Z',
        status: 'verified'
    },
    {
        id: '4',
        name: 'Alice Johnson',
        email: 'alice@example.com',
        phone: '+919876543212',
        type: 'owner',
        amount: 100,
        instagram: '@alicej',
        whatsapp: true,
        message: 'Support your work',
        timestamp: '2024-01-12T14:20:00Z',
        status: 'verified'
    }
];

// DOM Elements
const loginForm = document.getElementById('loginForm');
const adminPanel = document.getElementById('adminPanel');
const adminLoginForm = document.getElementById('adminLoginForm');
const donationsTable = document.getElementById('donationsTable');

// Login Handler
adminLoginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
        // Successful login
        loginForm.style.display = 'none';
        adminPanel.style.display = 'block';
        loadDonations();
    } else {
        alert('Invalid credentials. Please try again.');
    }
});

// Load and display donations
function loadDonations() {
    // In production, fetch from your API
    // const response = await fetch(`${API_ENDPOINT}/donations`);
    // const donations = await response.json();
    
    const donations = mockDonations; // Using mock data for demo
    
    // Update stats
    updateStats(donations);
    
    // Populate table
    populateTable(donations);
}

function updateStats(donations) {
    const totalDonations = donations.length;
    const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);
    const childDonations = donations.filter(d => d.type === 'child').length;
    const dogDonations = donations.filter(d => d.type === 'dog').length;
    const ownerDonations = donations.filter(d => d.type === 'owner').length;
    
    document.getElementById('totalDonations').textContent = totalDonations;
    document.getElementById('totalAmount').textContent = `₹${totalAmount}`;
    document.getElementById('childDonations').textContent = childDonations;
    document.getElementById('dogDonations').textContent = dogDonations;
    document.getElementById('ownerDonations').textContent = ownerDonations;
}

function populateTable(donations) {
    donationsTable.innerHTML = '';
    
    donations.forEach(donation => {
        const row = document.createElement('tr');
        
        // Format date
        const date = new Date(donation.timestamp);
        const formattedDate = date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
        
        // Status badge
        const statusBadge = donation.status === 'verified' 
            ? `<span style="color: #27ae60;"><i class="fas fa-check-circle"></i> Verified</span>`
            : `<span style="color: #f39c12;"><i class="fas fa-clock"></i> Pending</span>`;
        
        // WhatsApp badge
        const whatsappBadge = donation.whatsapp
            ? `<i class="fab fa-whatsapp" style="color: #25D366;"></i> Yes`
            : `<i class="fas fa-times" style="color: #e74c3c;"></i> No`;
        
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${donation.name}</td>
            <td>${donation.email}</td>
            <td>${donation.phone || 'N/A'}</td>
            <td>
                ${donation.type === 'child' ? '<i class="fas fa-child"></i> Child' : ''}
                ${donation.type === 'dog' ? '<i class="fas fa-paw"></i> Dog' : ''}
                ${donation.type === 'both' ? '<i class="fas fa-hands-helping"></i> Both' : ''}
                ${donation.type === 'owner' ? '<i class="fas fa-user-tie"></i> Owner' : ''}
            </td>
            <td><strong>₹${donation.amount}</strong></td>
            <td>${donation.instagram || 'N/A'}</td>
            <td>${whatsappBadge}</td>
            <td>${statusBadge}</td>
            <td>
                <button onclick="viewDetails('${donation.id}')" class="donate-btn" style="padding: 5px 10px; font-size: 0.9rem;">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="contactDonor('${donation.email}', '${donation.phone}')" class="donate-btn" style="padding: 5px 10px; font-size: 0.9rem; background: #3498db;">
                    <i class="fas fa-comment"></i>
                </button>
            </td>
        `;
        
        donationsTable.appendChild(row);
    });
}

// Filter donations
function filterDonations() {
    const typeFilter = document.getElementById('filterType').value;
    const dateFilter = document.getElementById('filterDate').value;
    const searchFilter = document.getElementById('searchInput').value.toLowerCase();
    
    let filtered = [...mockDonations];
    
    // Filter by type
    if (typeFilter !== 'all') {
        filtered = filtered.filter(d => d.type === typeFilter);
    }
    
    // Filter by date
    if (dateFilter) {
        filtered = filtered.filter(d => {
            const donationDate = new Date(d.timestamp).toISOString().split('T')[0];
            return donationDate === dateFilter;
        });
    }
    
    // Filter by search
    if (searchFilter) {
        filtered = filtered.filter(d => 
            d.name.toLowerCase().includes(searchFilter) ||
            d.email.toLowerCase().includes(searchFilter) ||
            (d.instagram && d.instagram.toLowerCase().includes(searchFilter))
        );
    }
    
    populateTable(filtered);
    updateStats(filtered);
}

// View donor details
function viewDetails(id) {
    const donation = mockDonations.find(d => d.id === id);
    if (donation) {
        const details = `
Name: ${donation.name}
Email: ${donation.email}
Phone: ${donation.phone || 'Not provided'}
Type: ${donation.type}
Amount: ₹${donation.amount}
Instagram: ${donation.instagram || 'Not provided'}
WhatsApp: ${donation.whatsapp ? 'Yes' : 'No'}
Date: ${new Date(donation.timestamp).toLocaleString()}
Message: ${donation.message || 'No message'}
Status: ${donation.status}
        `;
        alert(details);
    }
}

// Contact donor
function contactDonor(email, phone) {
    const message = encodeURIComponent(`Hello, this is Helper Hands. Thank you for your donation! We'll send you updates within 6-7 days. For any queries, contact +917304937349.`);
    
    if (phone) {
        // Open WhatsApp
        window.open(`https://wa.me/${phone.replace('+', '')}?text=${message}`, '_blank');
    } else if (email) {
        // Open email client
        window.open(`mailto:${email}?subject=Thank you for your donation!&body=Dear donor,%0D%0A%0D%0AThank you for your generous contribution to Helper Hands. We'll send you pictures and updates within 6-7 days.%0D%0A%0D%0ABest regards,%0D%0AHelper Hands Team%0D%0A+91 7304937349`, '_blank');
    } else {
        alert('No contact information available for this donor.');
    }
}

// Export data to CSV
function exportData() {
    const headers = ['Date', 'Name', 'Email', 'Phone', 'Type', 'Amount', 'Instagram', 'WhatsApp', 'Status', 'Message'];
    const csvData = mockDonations.map(d => [
        new Date(d.timestamp).toLocaleDateString(),
        d.name,
        d.email,
        d.phone || '',
        d.type,
        d.amount,
        d.instagram || '',
        d.whatsapp ? 'Yes' : 'No',
        d.status,
        d.message || ''
    ]);
    
    let csvContent = headers.join(',') + '\n';
    csvData.forEach(row => {
        csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `helper-hands-donations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
}

// Logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        adminPanel.style.display = 'none';
        loginForm.style.display = 'block';
        adminLoginForm.reset();
    }
}

// Auto-refresh data every 30 seconds
setInterval(() => {
    if (adminPanel.style.display === 'block') {
        loadDonations();
    }
}, 30000);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('filterDate').value = today;
});
