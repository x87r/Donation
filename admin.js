// ==================== FIREBASE CONFIGURATION ====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    getDocs, 
    query, 
    orderBy, 
    doc, 
    updateDoc,
    deleteDoc,
    where,
    serverTimestamp,
    addDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// ==================== ADMIN CREDENTIALS ====================
const ADMIN_CREDENTIALS = {
    email: 'radheyjii@outlook.in',
    password: 'Sunradhey#123'
};

// ==================== GLOBAL VARIABLES ====================
let allDonations = [];
let currentFilter = 'all';
let currentSearch = '';

// ==================== DOM ELEMENTS ====================
const loginForm = document.getElementById('loginForm');
const adminPanel = document.getElementById('adminPanel');
const adminLoginForm = document.getElementById('adminLoginForm');
const donationsTable = document.getElementById('donationsTable');
const logoutBtn = document.getElementById('logoutBtn');
const exportBtn = document.getElementById('exportBtn');
const searchInput = document.getElementById('searchInput');
const filterSelect = document.getElementById('filterType');
const dateFilter = document.getElementById('filterDate');

// ==================== STATS ELEMENTS ====================
const stats = {
    total: document.getElementById('totalDonations'),
    amount: document.getElementById('totalAmount'),
    child: document.getElementById('childDonations'),
    dog: document.getElementById('dogDonations'),
    both: document.getElementById('bothDonations'),
    owner: document.getElementById('ownerDonations'),
    verified: document.getElementById('verifiedDonations'),
    pending: document.getElementById('pendingDonations'),
    today: document.getElementById('todayDonations')
};

// ==================== EVENT LISTENERS ====================
document.addEventListener('DOMContentLoaded', function() {
    // Check if already logged in
    if (localStorage.getItem('adminLoggedIn') === 'true') {
        showAdminPanel();
    }
    
    // Setup event listeners
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', handleLogin);
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    if (exportBtn) {
        exportBtn.addEventListener('click', exportToCSV);
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    if (filterSelect) {
        filterSelect.addEventListener('change', handleFilter);
    }
    
    if (dateFilter) {
        dateFilter.addEventListener('change', handleDateFilter);
    }
    
    // Set today's date as default filter
    const today = new Date().toISOString().split('T')[0];
    if (dateFilter) {
        dateFilter.value = today;
        dateFilter.max = today;
    }
});

// ==================== LOGIN HANDLER ====================
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value;
    
    if (!email || !password) {
        showAlert('Please enter email and password', 'error');
        return;
    }
    
    // Show loading
    showLoading('Logging in...');
    
    // Simple validation (in production, use Firebase Auth)
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
        // Save login state
        localStorage.setItem('adminLoggedIn', 'true');
        localStorage.setItem('adminEmail', email);
        
        // Show admin panel
        showAdminPanel();
        hideLoading();
        
        showAlert('Login successful!', 'success');
    } else {
        hideLoading();
        showAlert('Invalid credentials. Please try again.', 'error');
    }
}

// ==================== SHOW ADMIN PANEL ====================
function showAdminPanel() {
    if (loginForm) loginForm.style.display = 'none';
    if (adminPanel) adminPanel.style.display = 'block';
    
    // Load donations
    loadDonations();
    
    // Start auto-refresh
    startAutoRefresh();
}

// ==================== LOAD DONATIONS ====================
async function loadDonations() {
    try {
        showLoading('Loading donations...');
        
        // Load from Firebase
        const firebaseDonations = await loadFromFirebase();
        
        // Load from localStorage
        const localDonations = loadFromLocalStorage();
        
        // Combine donations (Firebase first, then local)
        allDonations = [...firebaseDonations, ...localDonations];
        
        // Sort by date (newest first)
        allDonations.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });
        
        // Update statistics
        updateStatistics(allDonations);
        
        // Populate table
        populateDonationsTable(allDonations);
        
        hideLoading();
        
    } catch (error) {
        console.error('Error loading donations:', error);
        hideLoading();
        showAlert('Error loading data. Using local storage data.', 'warning');
        
        // Fallback to local data only
        allDonations = loadFromLocalStorage();
        updateStatistics(allDonations);
        populateDonationsTable(allDonations);
    }
}

// ==================== LOAD FROM FIREBASE ====================
async function loadFromFirebase() {
    try {
        const donationsRef = collection(db, "donations");
        const q = query(donationsRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        const donations = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            donations.push({
                id: doc.id,
                ...data,
                source: 'firebase',
                // Convert Firestore timestamp to Date
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt
            });
        });
        
        return donations;
    } catch (error) {
        console.error('Firebase load error:', error);
        return [];
    }
}

// ==================== LOAD FROM LOCAL STORAGE ====================
function loadFromLocalStorage() {
    try {
        const donations = JSON.parse(localStorage.getItem('helperHandsDonations') || '[]');
        
        return donations.map(donation => ({
            ...donation,
            source: 'local',
            createdAt: donation.createdAt || donation.timestamp
        }));
    } catch (error) {
        console.error('Local storage load error:', error);
        return [];
    }
}

// ==================== UPDATE STATISTICS ====================
function updateStatistics(donations) {
    if (!donations.length) return;
    
    // Calculate today's date
    const today = new Date().toDateString();
    
    const statsData = {
        total: donations.length,
        amount: donations.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0),
        child: donations.filter(d => d.type === 'child').length,
        dog: donations.filter(d => d.type === 'dog').length,
        both: donations.filter(d => d.type === 'both').length,
        owner: donations.filter(d => d.type === 'owner').length,
        verified: donations.filter(d => d.status === 'verified').length,
        pending: donations.filter(d => d.status === 'pending' || d.status === 'pending_local').length,
        today: donations.filter(d => {
            const donationDate = d.createdAt ? new Date(d.createdAt).toDateString() : '';
            return donationDate === today;
        }).length
    };
    
    // Update DOM
    for (const [key, element] of Object.entries(stats)) {
        if (element && statsData[key] !== undefined) {
            if (key === 'amount') {
                element.textContent = `₹${statsData[key].toLocaleString('en-IN')}`;
            } else {
                element.textContent = statsData[key].toLocaleString('en-IN');
            }
        }
    }
}

// ==================== POPULATE DONATIONS TABLE ====================
function populateDonationsTable(donations) {
    if (!donationsTable) return;
    
    // Apply filters
    let filteredDonations = [...donations];
    
    // Apply type filter
    if (currentFilter !== 'all') {
        filteredDonations = filteredDonations.filter(d => d.type === currentFilter);
    }
    
    // Apply search filter
    if (currentSearch) {
        const searchTerm = currentSearch.toLowerCase();
        filteredDonations = filteredDonations.filter(d => 
            (d.name && d.name.toLowerCase().includes(searchTerm)) ||
            (d.email && d.email.toLowerCase().includes(searchTerm)) ||
            (d.phone && d.phone.includes(searchTerm)) ||
            (d.instagram && d.instagram.toLowerCase().includes(searchTerm))
        );
    }
    
    // Apply date filter
    if (dateFilter && dateFilter.value) {
        const selectedDate = new Date(dateFilter.value).toDateString();
        filteredDonations = filteredDonations.filter(d => {
            const donationDate = d.createdAt ? new Date(d.createdAt).toDateString() : '';
            return donationDate === selectedDate;
        });
    }
    
    // Clear table
    donationsTable.innerHTML = '';
    
    if (filteredDonations.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="10" style="text-align: center; padding: 40px; color: #7f8c8d;">
                <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 15px; display: block; color: #bdc3c7;"></i>
                No donations found
            </td>
        `;
        donationsTable.appendChild(row);
        return;
    }
    
    // Add rows
    filteredDonations.forEach(donation => {
        const row = document.createElement('tr');
        
        // Format date
        let dateStr = 'N/A';
        if (donation.createdAt) {
            const date = new Date(donation.createdAt);
            dateStr = date.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            }) + '<br>' + 
            date.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
        // Type icon
        let typeIcon = '';
        let typeText = '';
        switch(donation.type) {
            case 'child':
                typeIcon = '<i class="fas fa-child"></i>';
                typeText = 'Child';
                break;
            case 'dog':
                typeIcon = '<i class="fas fa-paw"></i>';
                typeText = 'Dog';
                break;
            case 'both':
                typeIcon = '<i class="fas fa-hands-helping"></i>';
                typeText = 'Both';
                break;
            case 'owner':
                typeIcon = '<i class="fas fa-user-tie"></i>';
                typeText = 'Owner';
                break;
            default:
                typeIcon = '<i class="fas fa-heart"></i>';
                typeText = donation.type || 'General';
        }
        
        // Status badge
        let statusBadge = '';
        let statusColor = '';
        switch(donation.status) {
            case 'verified':
                statusBadge = '<i class="fas fa-check-circle"></i> Verified';
                statusColor = '#27ae60';
                break;
            case 'pending':
                statusBadge = '<i class="fas fa-clock"></i> Pending';
                statusColor = '#f39c12';
                break;
            case 'pending_local':
                statusBadge = '<i class="fas fa-mobile-alt"></i> Local';
                statusColor = '#95a5a6';
                break;
            case 'received':
                statusBadge = '<i class="fas fa-check"></i> Received';
                statusColor = '#3498db';
                break;
            default:
                statusBadge = donation.status || 'Unknown';
                statusColor = '#7f8c8d';
        }
        
        // Source badge
        const sourceBadge = donation.source === 'firebase' 
            ? '<span style="color: #4285f4;"><i class="fas fa-cloud"></i> Cloud</span>'
            : '<span style="color: #f39c12;"><i class="fas fa-mobile-alt"></i> Local</span>';
        
        row.innerHTML = `
            <td>${dateStr}</td>
            <td><strong>${donation.name || 'N/A'}</strong></td>
            <td>${donation.email || 'N/A'}</td>
            <td>${donation.phone || 'N/A'}</td>
            <td>${typeIcon} ${typeText}</td>
            <td style="font-weight: bold; color: #27ae60;">₹${donation.amount || 0}</td>
            <td>${donation.instagram || 'N/A'}</td>
            <td style="color: ${statusColor};">${statusBadge}</td>
            <td>${sourceBadge}</td>
            <td>
                <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                    <button onclick="viewDonationDetails('${donation.id}', '${donation.source}')" 
                            class="action-btn small-btn" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    
                    <button onclick="contactDonor('${donation.email}', '${donation.phone}', '${donation.name}')" 
                            class="action-btn small-btn" title="Contact" style="background: #3498db;">
                        <i class="fas fa-comment"></i>
                    </button>
                    
                    ${donation.status !== 'verified' ? `
                    <button onclick="verifyDonation('${donation.id}', '${donation.source}')" 
                            class="action-btn small-btn" title="Verify Payment" style="background: #27ae60;">
                        <i class="fas fa-check"></i>
                    </button>` : ''}
                    
                    ${donation.source === 'local' ? `
                    <button onclick="deleteDonation('${donation.id}', '${donation.source}')" 
                            class="action-btn small-btn" title="Delete" style="background: #e74c3c;">
                        <i class="fas fa-trash"></i>
                    </button>` : ''}
                </div>
            </td>
        `;
        
        donationsTable.appendChild(row);
    });
}

// ==================== VIEW DONATION DETAILS ====================
window.viewDonationDetails = async function(id, source) {
    try {
        let donation;
        
        if (source === 'firebase') {
            // Get from Firebase
            const donationsRef = collection(db, "donations");
            const querySnapshot = await getDocs(donationsRef);
            
            querySnapshot.forEach((doc) => {
                if (doc.id === id) {
                    donation = { id: doc.id, ...doc.data() };
                }
            });
        } else {
            // Get from localStorage
            const donations = JSON.parse(localStorage.getItem('helperHandsDonations') || '[]');
            donation = donations.find(d => d.id === id);
        }
        
        if (!donation) {
            showAlert('Donation not found!', 'error');
            return;
        }
        
        // Format date
        let dateStr = 'N/A';
        if (donation.createdAt) {
            const date = donation.createdAt?.toDate ? donation.createdAt.toDate() : new Date(donation.createdAt);
            dateStr = date.toLocaleString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }
        
        // Create modal with details
        const modalHtml = `
            <div class="modal-overlay" id="detailsModal" style="
                position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                background: rgba(0,0,0,0.7); display: flex; justify-content: center; 
                align-items: center; z-index: 10000; padding: 20px;">
                <div style="background: white; border-radius: 10px; padding: 30px; 
                     max-width: 500px; width: 100%; max-height: 80vh; overflow-y: auto;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h2 style="margin: 0; color: #2c3e50;">Donation Details</h2>
                        <button onclick="closeModal()" style="
                            background: none; border: none; font-size: 24px; 
                            cursor: pointer; color: #7f8c8d;">&times;</button>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div>
                                <label style="color: #7f8c8d; font-size: 0.9rem;">Donor Name</label>
                                <p style="margin: 5px 0; font-weight: bold;">${donation.name || 'N/A'}</p>
                            </div>
                            <div>
                                <label style="color: #7f8c8d; font-size: 0.9rem;">Amount</label>
                                <p style="margin: 5px 0; color: #27ae60; font-weight: bold;">₹${donation.amount || 0}</p>
                            </div>
                            <div>
                                <label style="color: #7f8c8d; font-size: 0.9rem;">Email</label>
                                <p style="margin: 5px 0;">${donation.email || 'N/A'}</p>
                            </div>
                            <div>
                                <label style="color: #7f8c8d; font-size: 0.9rem;">Phone</label>
                                <p style="margin: 5px 0;">${donation.phone || 'N/A'}</p>
                            </div>
                            <div>
                                <label style="color: #7f8c8d; font-size: 0.9rem;">Type</label>
                                <p style="margin: 5px 0;">${donation.type || 'N/A'}</p>
                            </div>
                            <div>
                                <label style="color: #7f8c8d; font-size: 0.9rem;">Status</label>
                                <p style="margin: 5px 0; color: ${donation.status === 'verified' ? '#27ae60' : '#f39c12'};">
                                    ${donation.status || 'pending'}
                                </p>
                            </div>
                        </div>
                        
                        <div style="margin-top: 20px;">
                            <label style="color: #7f8c8d; font-size: 0.9rem;">Instagram</label>
                            <p style="margin: 5px 0;">${donation.instagram || 'N/A'}</p>
                        </div>
                        
                        <div style="margin-top: 20px;">
                            <label style="color: #7f8c8d; font-size: 0.9rem;">WhatsApp</label>
                            <p style="margin: 5px 0;">${donation.whatsapp ? 'Yes' : 'No'}</p>
                        </div>
                        
                        ${donation.message ? `
                        <div style="margin-top: 20px;">
                            <label style="color: #7f8c8d; font-size: 0.9rem;">Message</label>
                            <p style="margin: 5px 0; padding: 10px; background: #f8f9fa; border-radius: 5px;">
                                ${donation.message}
                            </p>
                        </div>` : ''}
                        
                        <div style="margin-top: 20px;">
                            <label style="color: #7f8c8d; font-size: 0.9rem;">Date & Time</label>
                            <p style="margin: 5px 0;">${dateStr}</p>
                        </div>
                        
                        <div style="margin-top: 20px;">
                            <label style="color: #7f8c8d; font-size: 0.9rem;">Source</label>
                            <p style="margin: 5px 0;">${source === 'firebase' ? 'Firebase Cloud' : 'Local Storage'}</p>
                        </div>
                        
                        <div style="margin-top: 20px;">
                            <label style="color: #7f8c8d; font-size: 0.9rem;">ID</label>
                            <p style="margin: 5px 0; font-family: monospace; font-size: 0.9rem; color: #7f8c8d;">
                                ${donation.id}
                            </p>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 10px; margin-top: 30px;">
                        <button onclick="closeModal()" style="
                            flex: 1; padding: 10px; background: #95a5a6; 
                            color: white; border: none; border-radius: 5px; cursor: pointer;">
                            Close
                        </button>
                        
                        ${donation.phone ? `
                        <button onclick="contactDonor('${donation.email}', '${donation.phone}', '${donation.name}'); closeModal();" style="
                            flex: 1; padding: 10px; background: #25D366; 
                            color: white; border: none; border-radius: 5px; cursor: pointer;">
                            <i class="fab fa-whatsapp"></i> WhatsApp
                        </button>` : ''}
                        
                        ${donation.email ? `
                        <button onclick="window.open('mailto:${donation.email}?subject=Helper Hands Donation&body=Dear ${donation.name},%0D%0A%0D%0AThank you for your donation!'); closeModal();" style="
                            flex: 1; padding: 10px; background: #3498db; 
                            color: white; border: none; border-radius: 5px; cursor: pointer;">
                            <i class="fas fa-envelope"></i> Email
                        </button>` : ''}
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Close modal on escape key
        document.addEventListener('keydown', function closeOnEscape(e) {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', closeOnEscape);
            }
        });
        
    } catch (error) {
        console.error('Error viewing details:', error);
        showAlert('Error loading donation details', 'error');
    }
};

// ==================== CONTACT DONOR ====================
window.contactDonor = function(email, phone, name) {
    if (phone) {
        const message = encodeURIComponent(
            `Namaste ${name || 'Donor'}! 🙏\n\n` +
            `This is Helper Hands Team. Thank you for your generous donation!\n\n` +
            `We'll send you pictures of the meals within 6-7 days.\n` +
            `For any queries, contact: +91 7304937349\n\n` +
            `Jai Shree Krishna! 🙏\n` +
            `#RADHEY - Helper Hands\n` +
            `"WE FOR YOU" 💙`
        );
        window.open(`https://wa.me/${phone.replace('+', '')}?text=${message}`, '_blank');
    } else if (email) {
        const subject = encodeURIComponent('Thank you for your donation - Helper Hands');
        const body = encodeURIComponent(
            `Dear ${name || 'Donor'},\n\n` +
            `Thank you for your generous contribution to Helper Hands!\n\n` +
            `We appreciate your support in helping us provide meals to children and dogs.\n` +
            `We'll send you pictures and updates within 6-7 days.\n\n` +
            `Best regards,\n` +
            `Helper Hands Team\n` +
            `Phone: +91 7304937349\n` +
            `Email: radheyjii@outlook.in\n\n` +
            `#RADHEY - "WE FOR YOU"`
        );
        window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
    } else {
        showAlert('No contact information available for this donor.', 'warning');
    }
};

// ==================== VERIFY DONATION ====================
window.verifyDonation = async function(id, source) {
    const verificationCode = prompt('Enter verification code (6 digits):');
    
    if (!verificationCode || verificationCode.length < 4) {
        showAlert('Verification code is required (min 4 characters)', 'error');
        return;
    }
    
    try {
        if (source === 'firebase') {
            // Update in Firebase
            const donationRef = doc(db, "donations", id);
            await updateDoc(donationRef, {
                status: 'verified',
                paymentVerified: true,
                verificationCode: verificationCode,
                verifiedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        } else {
            // Update in localStorage
            const donations = JSON.parse(localStorage.getItem('helperHandsDonations') || '[]');
            const index = donations.findIndex(d => d.id === id);
            
            if (index !== -1) {
                donations[index].status = 'verified';
                donations[index].paymentVerified = true;
                donations[index].verificationCode = verificationCode;
                donations[index].verifiedAt = new Date().toISOString();
                localStorage.setItem('helperHandsDonations', JSON.stringify(donations));
            }
        }
        
        showAlert('✅ Payment verified successfully!', 'success');
        
        // Reload donations
        loadDonations();
        
        // Get donor details for WhatsApp notification
        let donation;
        if (source === 'firebase') {
            const donationsRef = collection(db, "donations");
            const querySnapshot = await getDocs(donationsRef);
            querySnapshot.forEach((doc) => {
                if (doc.id === id) {
                    donation = { id: doc.id, ...doc.data() };
                }
            });
        } else {
            const donations = JSON.parse(localStorage.getItem('helperHandsDonations') || '[]');
            donation = donations.find(d => d.id === id);
        }
        
        // Send WhatsApp notification if phone exists
        if (donation && donation.phone) {
            const whatsappMsg = encodeURIComponent(
                `Namaste ${donation.name}! 🙏\n\n` +
                `Your donation of ₹${donation.amount} has been VERIFIED!\n` +
                `Verification Code: ${verificationCode}\n\n` +
                `We'll send you pictures within 6-7 days.\n` +
                `Contact: +91 7304937349\n\n` +
                `Jai Shree Krishna! 🙏\n` +
                `#RADHEY - Helper Hands Team`
            );
            
            const sendWhatsApp = confirm('Send WhatsApp verification to donor?');
            if (sendWhatsApp) {
                window.open(`https://wa.me/${donation.phone.replace('+', '')}?text=${whatsappMsg}`, '_blank');
            }
        }
        
    } catch (error) {
        console.error('Error verifying donation:', error);
        showAlert('Error verifying payment: ' + error.message, 'error');
    }
};

// ==================== DELETE DONATION ====================
window.deleteDonation = function(id, source) {
    if (!confirm('Are you sure you want to delete this donation?')) {
        return;
    }
    
    try {
        if (source === 'local') {
            // Delete from localStorage
            const donations = JSON.parse(localStorage.getItem('helperHandsDonations') || '[]');
            const filteredDonations = donations.filter(d => d.id !== id);
            localStorage.setItem('helperHandsDonations', JSON.stringify(filteredDonations));
            
            showAlert('Donation deleted from local storage', 'success');
            loadDonations();
        } else {
            showAlert('Cannot delete Firebase donations from here', 'error');
        }
    } catch (error) {
        console.error('Error deleting donation:', error);
        showAlert('Error deleting donation', 'error');
    }
};

// ==================== EXPORT TO CSV ====================
async function exportToCSV() {
    try {
        showLoading('Preparing export...');
        
        // Prepare data
        const exportData = allDonations.map(donation => ({
            'Receipt No': donation.id || 'N/A',
            'Donor Name': donation.name || 'N/A',
            'Email': donation.email || 'N/A',
            'Phone': donation.phone || 'N/A',
            'Amount': donation.amount || 0,
            'Type': donation.type || 'N/A',
            'Instagram': donation.instagram || 'N/A',
            'WhatsApp': donation.whatsapp ? 'Yes' : 'No',
            'Status': donation.status || 'pending',
            'Verification Code': donation.verificationCode || 'N/A',
            'Message': (donation.message || '').replace(/"/g, '""'),
            'Date': donation.createdAt ? new Date(donation.createdAt).toLocaleString('en-IN') : 'N/A',
            'Source': donation.source === 'firebase' ? 'Cloud' : 'Local',
            'Payment Verified': donation.paymentVerified ? 'Yes' : 'No'
        }));
        
        if (exportData.length === 0) {
            hideLoading();
            showAlert('No data to export', 'warning');
            return;
        }
        
        // Convert to CSV
        const headers = Object.keys(exportData[0]);
        const csvRows = [
            headers.join(','),
            ...exportData.map(row => 
                headers.map(header => {
                    const cell = row[header] !== null ? row[header] : '';
                    return `"${cell.toString().replace(/"/g, '""')}"`;
                }).join(',')
            )
        ];
        
        const csvString = csvRows.join('\n');
        
        // Create download link
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `helper-hands-donations-${timestamp}.csv`;
        
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        hideLoading();
        showAlert(`Exported ${exportData.length} donations to CSV`, 'success');
        
    } catch (error) {
        hideLoading();
        console.error('Export error:', error);
        showAlert('Error exporting data: ' + error.message, 'error');
    }
}

// ==================== FILTER HANDLERS ====================
function handleSearch(e) {
    currentSearch = e.target.value.toLowerCase();
    populateDonationsTable(allDonations);
}

function handleFilter(e) {
    currentFilter = e.target.value;
    populateDonationsTable(allDonations);
}

function handleDateFilter() {
    populateDonationsTable(allDonations);
}

// ==================== LOGOUT HANDLER ====================
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('adminEmail');
        
        if (loginForm) loginForm.style.display = 'block';
        if (adminPanel) adminPanel.style.display = 'none';
        
        // Reset form
        if (adminLoginForm) {
            adminLoginForm.reset();
        }
        
        showAlert('Logged out successfully', 'success');
    }
}

// ==================== AUTO REFRESH ====================
function startAutoRefresh() {
    // Refresh every 30 seconds
    setInterval(() => {
        if (adminPanel && adminPanel.style.display === 'block') {
            loadDonations();
        }
    }, 30000);
}

// ==================== UTILITY FUNCTIONS ====================
function showLoading(message = 'Loading...') {
    // Remove existing loader
    hideLoading();
    
    const loader = document.createElement('div');
    loader.id = 'loadingOverlay';
    loader.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        color: white;
    `;
    
    loader.innerHTML = `
        <div class="spinner" style="
            width: 50px;
            height: 50px;
            border: 5px solid #f3f3f3;
            border-top: 5px solid #3498db;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;">
        </div>
        <p>${message}</p>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    
    document.body.appendChild(loader);
}

function hideLoading() {
    const loader = document.getElementById('loadingOverlay');
    if (loader) {
        loader.remove();
    }
}

function showAlert(message, type = 'info') {
    // Remove existing alerts
    const existingAlert = document.querySelector('.alert-message');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    const colors = {
        success: '#27ae60',
        error: '#e74c3c',
        warning: '#f39c12',
        info: '#3498db'
    };
    
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert-message';
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.info};
        color: white;
        padding: 15px 25px;
        border-radius: 5px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease;
        max-width: 400px;
    `;
    
    alertDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            ${type === 'success' ? '<i class="fas fa-check-circle"></i>' : ''}
            ${type === 'error' ? '<i class="fas fa-exclamation-circle"></i>' : ''}
            ${type === 'warning' ? '<i class="fas fa-exclamation-triangle"></i>' : ''}
            ${type === 'info' ? '<i class="fas fa-info-circle"></i>' : ''}
            <span>${message}</span>
        </div>
        <style>
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        </style>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => alertDiv.remove(), 300);
        }
    }, 5000);
}

// Close modal function
window.closeModal = function() {
    const modal = document.getElementById('detailsModal');
    if (modal) {
        modal.remove();
    }
};

// Add CSS for action buttons
const style = document.createElement('style');
style.textContent = `
    .action-btn {
        padding: 8px 15px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        color: white;
        font-weight: 500;
        transition: all 0.3s ease;
        display: inline-flex;
        align-items: center;
        gap: 5px;
    }
    
    .action-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    
    .action-btn:active {
        transform: translateY(0);
    }
    
    .small-btn {
        padding: 5px 10px;
        font-size: 0.9rem;
    }
    
    .modal-overlay {
        animation: fadeIn 0.3s ease;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
