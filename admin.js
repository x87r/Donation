// === FIREBASE CONFIGURATION ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCP-uKQ7rZqNvT1CnW5QiWnkzclHGix_5Q",
  authDomain: "vasudevdonations.firebaseapp.com",
  projectId: "vasudevdonations",
  storageBucket: "vasudevdonations.firebasestorage.app",
  messagingSenderId: "219370651633",
  appId: "1:219370651633:web:98146244613a1e50f90e50"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// === Admin Credentials ===
const ADMIN_CREDENTIALS = {
    email: 'radheyjii@outlook.in',
    password: 'Sunradhey#123'
};

// === DOM Elements ===
const loginForm = document.getElementById('loginForm');
const adminPanel = document.getElementById('adminPanel');
const adminLoginForm = document.getElementById('adminLoginForm');
const donationsTable = document.getElementById('donationsTable');

// === Login Handler ===
if (adminLoginForm) {
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
            alert('❌ Invalid credentials. Please try again.');
        }
    });
}

// === Load Donations from Firebase ===
async function loadDonations() {
    try {
        showLoadingAdmin();
        
        const donationsQuery = query(
            collection(db, "donations"),
            orderBy("createdAt", "desc")
        );
        
        const querySnapshot = await getDocs(donationsQuery);
        
        const donations = [];
        querySnapshot.forEach((doc) => {
            donations.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Update stats
        updateStats(donations);
        
        // Populate table
        populateTable(donations);
        
        hideLoadingAdmin();
        
    } catch (error) {
        console.error('Error loading donations:', error);
        hideLoadingAdmin();
        
        // Fallback to localStorage
        useLocalData();
    }
}

// === Update Statistics ===
function updateStats(donations) {
    const totalDonations = donations.length;
    const totalAmount = donations.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
    
    const childDonations = donations.filter(d => d.type === 'child').length;
    const dogDonations = donations.filter(d => d.type === 'dog').length;
    const bothDonations = donations.filter(d => d.type === 'both').length;
    const ownerDonations = donations.filter(d => d.type === 'owner').length;
    
    const verifiedDonations = donations.filter(d => d.status === 'verified').length;
    const pendingDonations = donations.filter(d => d.status === 'pending' || d.status === 'pending_local').length;
    
    // Update DOM elements
    if (document.getElementById('totalDonations')) {
        document.getElementById('totalDonations').textContent = totalDonations;
    }
    if (document.getElementById('totalAmount')) {
        document.getElementById('totalAmount').textContent = `₹${totalAmount}`;
    }
    if (document.getElementById('childDonations')) {
        document.getElementById('childDonations').textContent = childDonations;
    }
    if (document.getElementById('dogDonations')) {
        document.getElementById('dogDonations').textContent = dogDonations;
    }
    if (document.getElementById('ownerDonations')) {
        document.getElementById('ownerDonations').textContent = ownerDonations;
    }
    if (document.getElementById('verifiedDonations')) {
        document.getElementById('verifiedDonations').textContent = verifiedDonations;
    }
    if (document.getElementById('pendingDonations')) {
        document.getElementById('pendingDonations').textContent = pendingDonations;
    }
}

// === Populate Donations Table ===
function populateTable(donations) {
    if (!donationsTable) return;
    
    donationsTable.innerHTML = '';
    
    donations.forEach(donation => {
        const row = document.createElement('tr');
        
        // Format date
        let formattedDate = 'N/A';
        if (donation.createdAt) {
            if (donation.createdAt.toDate) {
                const date = donation.createdAt.toDate();
                formattedDate = date.toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                });
            } else if (typeof donation.createdAt === 'string') {
                formattedDate = new Date(donation.createdAt).toLocaleDateString('en-IN');
            }
        }
        
        // Status badge
        let statusBadge = '';
        if (donation.status === 'verified') {
            statusBadge = `<span style="color: #27ae60; font-weight: bold;">
                <i class="fas fa-check-circle"></i> Verified
            </span>`;
        } else if (donation.status === 'pending_local') {
            statusBadge = `<span style="color: #f39c12; font-weight: bold;">
                <i class="fas fa-exclamation-triangle"></i> Local Save
            </span>`;
        } else {
            statusBadge = `<span style="color: #f39c12; font-weight: bold;">
                <i class="fas fa-clock"></i> Pending
            </span>`;
        }
        
        // WhatsApp badge
        const whatsappBadge = donation.whatsapp
            ? `<i class="fab fa-whatsapp" style="color: #25D366;"></i> Yes`
            : `<i class="fas fa-times" style="color: #e74c3c;"></i> No`;
        
        // Type icon
        let typeIcon = '';
        switch(donation.type) {
            case 'child':
                typeIcon = '<i class="fas fa-child"></i> Child';
                break;
            case 'dog':
                typeIcon = '<i class="fas fa-paw"></i> Dog';
                break;
            case 'both':
                typeIcon = '<i class="fas fa-hands-helping"></i> Both';
                break;
            case 'owner':
                typeIcon = '<i class="fas fa-user-tie"></i> Owner';
                break;
            default:
                typeIcon = donation.type || 'N/A';
        }
        
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${donation.name || ''}</td>
            <td>${donation.email || ''}</td>
            <td>${donation.phone || 'N/A'}</td>
            <td>${typeIcon}</td>
            <td><strong>₹${donation.amount || 0}</strong></td>
            <td>${donation.instagram || 'N/A'}</td>
            <td>${whatsappBadge}</td>
            <td>${statusBadge}</td>
            <td>
                <button onclick="viewDetails('${donation.id}')" 
                        style="background: #3498db; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; margin: 2px;">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="contactDonor('${donation.email}', '${donation.phone}', '${donation.name}')" 
                        style="background: #2ecc71; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; margin: 2px;">
                    <i class="fas fa-comment"></i>
                </button>
                <button onclick="verifyPayment('${donation.id}')" 
                        style="background: #27ae60; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; margin: 2px;">
                    <i class="fas fa-check"></i>
                </button>
            </td>
        `;
        
        donationsTable.appendChild(row);
    });
}

// === View Donor Details ===
window.viewDetails = async function(id) {
    try {
        const donationsQuery = query(collection(db, "donations"));
        const querySnapshot = await getDocs(donationsQuery);
        
        let donation = null;
        querySnapshot.forEach((doc) => {
            if (doc.id === id) {
                donation = { id: doc.id, ...doc.data() };
            }
        });
        
        if (donation) {
            let formattedDate = 'N/A';
            if (donation.createdAt) {
                if (donation.createdAt.toDate) {
                    formattedDate = donation.createdAt.toDate().toLocaleString('en-IN');
                } else if (typeof donation.createdAt === 'string') {
                    formattedDate = new Date(donation.createdAt).toLocaleString('en-IN');
                }
            }
            
            const details = `
📋 DONATION DETAILS:
────────────────
👤 Name: ${donation.name || 'N/A'}
📧 Email: ${donation.email || 'N/A'}
📞 Phone: ${donation.phone || 'N/A'}
💰 Amount: ₹${donation.amount || 0}
🎯 Type: ${donation.type || 'N/A'}
📷 Instagram: ${donation.instagram || 'N/A'}
📱 WhatsApp: ${donation.whatsapp ? 'Yes' : 'No'}
📝 Message: ${donation.message || 'N/A'}
📊 Status: ${donation.status || 'pending'}
📅 Date: ${formattedDate}
✅ Verified: ${donation.paymentVerified ? 'Yes' : 'No'}
🆔 ID: ${donation.id}
────────────────
`;
            alert(details);
        } else {
            // Check localStorage
            const localDonations = JSON.parse(localStorage.getItem('helperHandsDonations') || '[]');
            const localDonation = localDonations.find(d => d.id === id);
            
            if (localDonation) {
                const details = `
📋 LOCAL DONATION DETAILS:
────────────────
👤 Name: ${localDonation.name || 'N/A'}
📧 Email: ${localDonation.email || 'N/A'}
📞 Phone: ${localDonation.phone || 'N/A'}
💰 Amount: ₹${localDonation.amount || 0}
🎯 Type: ${localDonation.type || 'N/A'}
📷 Instagram: ${localDonation.instagram || 'N/A'}
📱 WhatsApp: ${localDonation.whatsapp ? 'Yes' : 'No'}
📝 Message: ${localDonation.message || 'N/A'}
📊 Status: ${localDonation.status || 'pending_local'}
📅 Date: ${localDonation.timestamp || 'N/A'}
⚠️ Note: Saved locally (no internet)
────────────────
`;
                alert(details);
            } else {
                alert('Donation not found!');
            }
        }
    } catch (error) {
        console.error('Error viewing details:', error);
        alert('Error loading details');
    }
};

// === Contact Donor ===
window.contactDonor = function(email, phone, name) {
    if (phone) {
        const message = encodeURIComponent(`Namaste ${name || 'Donor'}! 🙏\n\nThank you for your donation to Helper Hands.\nWe'll send you pictures within 6-7 days.\n\nJai Shree Krishna! 🙏\n#RADHEY - Helper Hands Team`);
        window.open(`https://wa.me/${phone.replace('+', '')}?text=${message}`, '_blank');
    } else if (email) {
        const subject = encodeURIComponent('Thank you for your donation!');
        const body = encodeURIComponent(`Dear ${name || 'Donor'},\n\nThank you for your generous contribution to Helper Hands.\nWe'll send you pictures and updates within 6-7 days.\n\nBest regards,\nHelper Hands Team\n+91 7304937349`);
        window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
    } else {
        alert('No contact information available for this donor.');
    }
};

// === Verify Payment ===
window.verifyPayment = async function(donationId) {
    const verificationCode = prompt('Enter verification code:');
    if (!verificationCode) return;
    
    try {
        const donationRef = doc(db, "donations", donationId);
        await updateDoc(donationRef, {
            status: 'verified',
            paymentVerified: true,
            verificationCode: verificationCode,
            updatedAt: new Date().toISOString()
        });
        
        alert('✅ Payment verified successfully!');
        
        // Refresh donations
        loadDonations();
        
        // Get donor details for WhatsApp
        const donationsQuery = query(collection(db, "donations"));
        const querySnapshot = await getDocs(donationsQuery);
        
        let donation = null;
        querySnapshot.forEach((doc) => {
            if (doc.id === donationId) {
                donation = { id: doc.id, ...doc.data() };
            }
        });
        
        if (donation && donation.phone) {
            const whatsappMsg = encodeURIComponent(
                `Namaste ${donation.name}! 🙏\n\n` +
                `Thank you for donating ₹${donation.amount} to Helper Hands.\n` +
                `✅ Payment VERIFIED!\n` +
                `📋 Verification Code: ${verificationCode}\n` +
                `📸 Pictures will be sent within 6-7 days.\n` +
                `📞 Contact: +91 7304937349\n\n` +
                `Jai Shree Krishna! 🙏\n` +
                `#RADHEY - Helper Hands Team\n` +
                `"WE FOR YOU" 💙`
            );
            
            window.open(`https://wa.me/${donation.phone.replace('+', '')}?text=${whatsappMsg}`, '_blank');
        }
        
    } catch (error) {
        console.error('Error verifying payment:', error);
        alert('Error verifying payment: ' + error.message);
    }
};

// === Export Data to CSV ===
window.exportData = async function() {
    try {
        const donationsQuery = query(collection(db, "donations"));
        const querySnapshot = await getDocs(donationsQuery);
        
        const donations = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            donations.push({
                ID: doc.id,
                Name: data.name || '',
                Email: data.email || '',
                Phone: data.phone || '',
                Amount: data.amount || 0,
                Type: data.type || '',
                Status: data.status || 'pending',
                Instagram: data.instagram || '',
                WhatsApp: data.whatsapp ? 'Yes' : 'No',
                Message: (data.message || '').replace(/"/g, '""'),
                'Created At': data.createdAt ? 
                    (data.createdAt.toDate ? 
                        data.createdAt.toDate().toISOString() : 
                        data.createdAt) : ''
            });
        });
        
        // Also get local donations
        const localDonations = JSON.parse(localStorage.getItem('helperHandsDonations') || '[]');
        localDonations.forEach(donation => {
            donations.push({
                ID: donation.id,
                Name: donation.name || '',
                Email: donation.email || '',
                Phone: donation.phone || '',
                Amount: donation.amount || 0,
                Type: donation.type || '',
                Status: donation.status || 'pending_local',
                Instagram: donation.instagram || '',
                WhatsApp: donation.whatsapp ? 'Yes' : 'No',
                Message: (donation.message || '').replace(/"/g, '""'),
                'Created At': donation.timestamp || ''
            });
        });
        
        // Convert to CSV
        const csvData = convertToCSV(donations);
        downloadCSV(csvData, `helper-hands-donations-${new Date().toISOString().split('T')[0]}.csv`);
        
    } catch (error) {
        console.error('Export error:', error);
        alert('Error exporting data. Using local data...');
        exportLocalData();
    }
};

function convertToCSV(data) {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const rows = data.map(row => 
        headers.map(header => {
            const cell = row[header] !== null ? row[header] : '';
            return `"${cell.toString().replace(/"/g, '""')}"`;
        }).join(',')
    );
    
    return [headers.join(','), ...rows].join('\n');
}

function downloadCSV(csvData, filename) {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// === Export Local Data ===
function exportLocalData() {
    const donations = JSON.parse(localStorage.getItem('helperHandsDonations') || '[]');
    
    if (donations.length === 0) {
        alert('No local data to export!');
        return;
    }
    
    const csvData = convertToCSV(donations.map(d => ({
        ID: d.id,
        Name: d.name || '',
        Email: d.email || '',
        Phone: d.phone || '',
        Amount: d.amount || 0,
        Type: d.type || '',
        Status: d.status || 'pending_local',
        Instagram: d.instagram || '',
        WhatsApp: d.whatsapp ? 'Yes' : 'No',
        Message: (d.message || '').replace(/"/g, '""'),
        'Created At': d.timestamp || ''
    })));
    
    downloadCSV(csvData, `helper-hands-local-donations-${new Date().toISOString().split('T')[0]}.csv`);
}

// === Local Data Fallback ===
function useLocalData() {
    const donations = JSON.parse(localStorage.getItem('helperHandsDonations') || '[]');
    
    const stats = {
        total: donations.length,
        totalAmount: donations.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0),
        child: donations.filter(d => d.type === 'child').length,
        dog: donations.filter(d => d.type === 'dog').length,
        both: donations.filter(d => d.type === 'both').length,
        owner: donations.filter(d => d.type === 'owner').length,
        verified: donations.filter(d => d.status === 'verified').length,
        pending: donations.filter(d => d.status === 'pending' || d.status === 'pending_local').length
    };
    
    updateStatsForLocal(stats);
    populateTableForLocal(donations);
}

function updateStatsForLocal(stats) {
    if (document.getElementById('totalDonations')) {
        document.getElementById('totalDonations').textContent = stats.total;
    }
    if (document.getElementById('totalAmount')) {
        document.getElementById('totalAmount').textContent = `₹${stats.totalAmount}`;
    }
    if (document.getElementById('childDonations')) {
        document.getElementById('childDonations').textContent = stats.child;
    }
    if (document.getElementById('dogDonations')) {
        document.getElementById('dogDonations').textContent = stats.dog;
    }
    if (document.getElementById('ownerDonations')) {
        document.getElementById('ownerDonations').textContent = stats.owner;
    }
    if (document.getElementById('verifiedDonations')) {
        document.getElementById('verifiedDonations').textContent = stats.verified;
    }
    if (document.getElementById('pendingDonations')) {
        document.getElementById('pendingDonations').textContent = stats.pending;
    }
}

function populateTableForLocal(donations) {
    if (!donationsTable) return;
    
    donationsTable.innerHTML = '';
    
    donations.forEach(donation => {
        const row = document.createElement('tr');
        
        const formattedDate = donation.timestamp ? 
            new Date(donation.timestamp).toLocaleDateString('en-IN') : 'N/A';
        
        const statusBadge = donation.status === 'verified' 
            ? `<span style="color: #27ae60;"><i class="fas fa-check-circle"></i> Verified</span>`
            : `<span style="color: #f39c12;"><i class="fas fa-exclamation-triangle"></i> Local</span>`;
        
        const whatsappBadge = donation.whatsapp
            ? `<i class="fab fa-whatsapp" style="color: #25D366;"></i> Yes`
            : `<i class="fas fa-times" style="color: #e74c3c;"></i> No`;
        
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${donation.name || ''}</td>
            <td>${donation.email || ''}</td>
            <td>${donation.phone || 'N/A'}</td>
            <td>${donation.type || ''}</td>
            <td><strong>₹${donation.amount || 0}</strong></td>
            <td>${donation.instagram || 'N/A'}</td>
            <td>${whatsappBadge}</td>
            <td>${statusBadge}</td>
            <td>
                <button onclick="viewLocalDetails('${donation.id}')" 
                        style="background: #3498db; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        
        donationsTable.appendChild(row);
    });
}

window.viewLocalDetails = function(id) {
    const donations = JSON.parse(localStorage.getItem('helperHandsDonations') || '[]');
    const donation = donations.find(d => d.id === id);
    
    if (donation) {
        const details = `
📋 LOCAL DONATION DETAILS:
────────────────
👤 Name: ${donation.name || 'N/A'}
📧 Email: ${donation.email || 'N/A'}
📞 Phone: ${donation.phone || 'N/A'}
💰 Amount: ₹${donation.amount || 0}
🎯 Type: ${donation.type || 'N/A'}
📷 Instagram: ${donation.instagram || 'N/A'}
📱 WhatsApp: ${donation.whatsapp ? 'Yes' : 'No'}
📝 Message: ${donation.message || 'N/A'}
📊 Status: ${donation.status || 'pending_local'}
📅 Date: ${donation.timestamp || 'N/A'}
⚠️ Note: Saved locally
────────────────
`;
        alert(details);
    } else {
        alert('Donation not found!');
    }
};

// === Loading Functions ===
function showLoadingAdmin() {
    const loader = document.createElement('div');
    loader.id = 'adminLoader';
    loader.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                    background: rgba(0,0,0,0.5); display: flex; justify-content: center; 
                    align-items: center; z-index: 9999;">
            <div style="background: white; padding: 30px; border-radius: 10px; text-align: center;">
                <div class="spinner" style="width: 40px; height: 40px; border: 4px solid #f3f3f3;
                         border-top: 4px solid #3498db; border-radius: 50%; 
                         animation: spin 1s linear infinite; margin: 0 auto 15px;"></div>
                <p style="font-size: 16px; color: #333;">Loading donations...</p>
            </div>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    document.body.appendChild(loader);
}

function hideLoadingAdmin() {
    const loader = document.getElementById('adminLoader');
    if (loader) {
        loader.remove();
    }
}

// === Logout Function ===
window.logout = function() {
    if (confirm('Are you sure you want to logout?')) {
        adminPanel.style.display = 'none';
        loginForm.style.display = 'block';
        if (adminLoginForm) {
            adminLoginForm.reset();
        }
    }
};

// === Auto-refresh every 30 seconds ===
setInterval(() => {
    if (adminPanel && adminPanel.style.display === 'block') {
        loadDonations();
    }
}, 30000);
