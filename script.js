// === FIREBASE CONFIGURATION ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, getDocs, orderBy, query, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Your Firebase configuration
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

// === DOM Elements ===
const donationModal = document.getElementById('donationModal');
const ownerModal = document.getElementById('ownerModal');
const donationForm = document.getElementById('donationForm');
const ownerDonationForm = document.getElementById('ownerDonationForm');
const modalTitle = document.getElementById('modalTitle');
const qrImage = document.getElementById('qrImage');
const donationTypeField = document.getElementById('donationType');
const timerElement = document.getElementById('timer');
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

// === Mobile Menu Toggle ===
if (hamburger) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
}

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (hamburger && !hamburger.contains(e.target) && navMenu && !navMenu.contains(e.target)) {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    }
});

// === Donation Configuration ===
const donationConfig = {
    'child': {
        title: 'Donate to Children',
        qrImage: 'qr-child.png',
        defaultAmount: 30,
        description: 'Provide nutritious meals to underprivileged children'
    },
    'dog': {
        title: 'Donate to Dogs',
        qrImage: 'qr-dog.png',
        defaultAmount: 20,
        description: 'Feed stray dogs and give them a better life'
    },
    'both': {
        title: 'Donate to Both',
        qrImage: 'qr-child.png',
        defaultAmount: 50,
        description: 'Support both children and dogs simultaneously'
    }
};

// === Timer Function ===
let timerInterval;
function startTimer(seconds) {
    let timeLeft = seconds;
    
    timerInterval = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        
        if (timerElement) {
            timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert('⏰ Payment time expired! Please restart donation.');
            closeModal();
        }
        
        timeLeft--;
    }, 1000);
}

// === Modal Functions ===
function openDonationForm(type) {
    const config = donationConfig[type];
    if (!config) return;
    
    if (modalTitle) modalTitle.textContent = config.title;
    if (qrImage) qrImage.src = config.qrImage;
    if (donationTypeField) donationTypeField.value = type;
    
    const amountInput = document.getElementById('amount');
    if (amountInput) amountInput.value = config.defaultAmount;
    
    // Start timer (5 minutes)
    startTimer(5 * 60);
    
    if (donationModal) {
        donationModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function openOwnerDonation() {
    if (ownerModal) {
        ownerModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal() {
    if (donationModal) {
        donationModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    clearInterval(timerInterval);
}

function closeOwnerModal() {
    if (ownerModal) {
        ownerModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// === Save Donation to Firebase ===
async function saveDonation(data) {
    try {
        // Show loading
        showLoading();
        
        // Add donation to Firestore
        const docRef = await addDoc(collection(db, "donations"), {
            name: data.name,
            email: data.email,
            phone: data.phone || "",
            amount: Number(data.amount),
            type: data.type,
            instagram: data.instagram || "",
            whatsapp: data.whatsapp || false,
            message: data.message || "",
            status: "pending",
            paymentVerified: false,
            receiptSent: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        console.log("Donation saved with ID: ", docRef.id);
        
        // Hide loading
        hideLoading();
        
        // Show success message
        showSuccessMessage("✅ Donation saved successfully!\n\nWe'll contact you within 24 hours on WhatsApp.");
        
        // Save to localStorage as backup
        saveToLocalStorage(data, docRef.id);
        
        // Redirect to thank you page after 2 seconds
        setTimeout(() => {
            window.location.href = `thankyou.html?name=${encodeURIComponent(data.name)}&amount=${data.amount}&type=${data.type}&id=${docRef.id}`;
        }, 2000);

        return { success: true, id: docRef.id };
        
    } catch (error) {
        console.error("Error saving donation: ", error);
        hideLoading();
        
        // Fallback to localStorage
        const localId = saveToLocalStorage(data);
        
        showWarningMessage("⚠️ Internet issue! Donation saved locally.\n\nPlease WhatsApp us: +91 7304937349\nWe'll manually verify your payment.");
        
        setTimeout(() => {
            window.location.href = `thankyou.html?name=${encodeURIComponent(data.name)}&amount=${data.amount}&type=${data.type}&id=local_${localId}`;
        }, 2000);
        
        return { success: true, id: localId };
    }
}

// === Local Storage Backup ===
function saveToLocalStorage(data, donationId = null) {
    try {
        const id = donationId || 'local_' + Date.now();
        const donation = {
            ...data,
            id: id,
            timestamp: new Date().toISOString(),
            status: 'pending_local',
            local: true
        };
        
        let donations = JSON.parse(localStorage.getItem('helperHandsDonations') || '[]');
        donations.push(donation);
        localStorage.setItem('helperHandsDonations', JSON.stringify(donations));
        
        return id;
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        return 'error_' + Date.now();
    }
}

// === UI Helper Functions ===
function showLoading() {
    const loader = document.createElement('div');
    loader.id = 'loader';
    loader.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                    background: rgba(0,0,0,0.7); display: flex; justify-content: center; 
                    align-items: center; z-index: 9999;">
            <div style="background: white; padding: 30px; border-radius: 10px; text-align: center;">
                <div class="spinner" style="width: 50px; height: 50px; border: 5px solid #f3f3f3;
                         border-top: 5px solid #3498db; border-radius: 50%; 
                         animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                <p style="font-size: 18px; color: #333;">Saving your donation...</p>
                <p style="font-size: 14px; color: #666;">Please don't close this window</p>
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

function hideLoading() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.remove();
    }
}

function showSuccessMessage(message) {
    const alertDiv = document.createElement('div');
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #27ae60;
        color: white;
        padding: 15px 25px;
        border-radius: 5px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 400px;
    `;
    alertDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

function showWarningMessage(message) {
    const alertDiv = document.createElement('div');
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f39c12;
        color: white;
        padding: 15px 25px;
        border-radius: 5px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 400px;
    `;
    alertDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 7000);
}

// === Event Listeners ===
if (donationForm) {
    donationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            instagram: document.getElementById('instagram').value.trim(),
            amount: document.getElementById('amount').value,
            type: document.getElementById('donationType').value,
            message: document.getElementById('message').value.trim(),
            whatsapp: document.getElementById('whatsapp')?.checked || false
        };
        
        // Basic validation
        if (!formData.name || !formData.email || !formData.amount) {
            alert('❌ Please fill all required fields (*)');
            return;
        }
        
        // Validate amount based on type
        const minAmount = donationConfig[formData.type]?.defaultAmount || 1;
        if (parseFloat(formData.amount) < minAmount) {
            alert(`Minimum donation for ${formData.type} is ₹${minAmount}`);
            return;
        }
        
        // Save donation
        await saveDonation(formData);
        
        // Reset form
        donationForm.reset();
        closeModal();
    });
}

if (ownerDonationForm) {
    ownerDonationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('ownerName').value.trim(),
            email: document.getElementById('ownerEmail').value.trim(),
            amount: document.getElementById('ownerAmount').value,
            type: 'owner',
            phone: '',
            whatsapp: false
        };
        
        if (!formData.name || !formData.email || !formData.amount) {
            alert('❌ Please fill all required fields');
            return;
        }
        
        await saveDonation(formData);
        
        alert('🙏 Thank you for supporting our operations!\n\nPlease send payment to UPI: 9797590308@fam\nThen WhatsApp us: +91 7304937349');
        
        ownerDonationForm.reset();
        closeOwnerModal();
    });
}

// === Smooth Scrolling ===
document.addEventListener('DOMContentLoaded', () => {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                if (hamburger) hamburger.classList.remove('active');
                if (navMenu) navMenu.classList.remove('active');
            }
        });
    });
    
    // Close modal when clicking outside
    window.onclick = function(event) {
        if (event.target === donationModal) {
            closeModal();
        }
        if (event.target === ownerModal) {
            closeOwnerModal();
        }
    }
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeModal();
            closeOwnerModal();
        }
    });
});

// === WhatsApp Function ===
function openWhatsApp() {
    const message = encodeURIComponent("Hello Helper Hands, I'd like to know more about your donation process.");
    window.open(`https://wa.me/917304937349?text=${message}`, '_blank');
}
