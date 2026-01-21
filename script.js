// DOM Elements
const donationModal = document.getElementById('donationModal');
const ownerModal = document.getElementById('ownerModal');
const donationForm = document.getElementById('donationForm');
const ownerDonationForm = document.getElementById('ownerDonationForm');
const modalTitle = document.getElementById('modalTitle');
const qrImage = document.getElementById('qrImage');
const donationTypeField = document.getElementById('donationType');
const timerElement = document.getElementById('timer');

// MongoDB Configuration
const MONGODB_URL = 'mongodb+srv://Donations:Radheyjii@outlook.in@cluster0.kbm4nfh.mongodb.net/?appName=Cluster0';
const API_ENDPOINT = 'https://your-backend-api.com'; // Replace with actual backend

// Donation Type Configuration
const donationConfig = {
    'child': {
        title: 'Donate to Children',
        qrImage: 'qr-child.png',
        defaultAmount: 30
    },
    'dog': {
        title: 'Donate to Dogs',
        qrImage: 'qr-dog.png',
        defaultAmount: 20
    },
    'both': {
        title: 'Donate to Both',
        qrImage: 'qr-child.png', // You can create a separate QR for both
        defaultAmount: 50
    }
};

// Mobile Menu Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    }
});

// Open Donation Modal
let timerInterval;
function openDonationForm(type) {
    const config = donationConfig[type];
    modalTitle.textContent = config.title;
    qrImage.src = config.qrImage;
    donationTypeField.value = type;
    document.getElementById('amount').value = config.defaultAmount;
    
    // Start timer
    startTimer(5 * 60); // 5 minutes
    
    donationModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Open Owner Donation Modal
function openOwnerDonation() {
    ownerModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Close Modals
function closeModal() {
    donationModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    clearInterval(timerInterval);
}

function closeOwnerModal() {
    ownerModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Timer Function
function startTimer(seconds) {
    let timeLeft = seconds;
    
    timerInterval = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert('Payment time expired. Please try again.');
            closeModal();
        }
        
        timeLeft--;
    }, 1000);
}

// Handle Donation Form Submission
donationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value || null,
        instagram: document.getElementById('instagram').value || null,
        amount: parseFloat(document.getElementById('amount').value),
        type: donationTypeField.value,
        message: document.getElementById('message').value || null,
        whatsapp: document.getElementById('whatsapp').checked,
        timestamp: new Date().toISOString()
    };
    
    // Validate amount
    const minAmount = donationConfig[formData.type].defaultAmount;
    if (formData.amount < minAmount) {
        alert(`Minimum donation amount for ${formData.type} is ₹${minAmount}`);
        return;
    }
    
    try {
        // Save to MongoDB (you'll need a backend API)
        const response = await saveDonation(formData);
        
        if (response.success) {
            // Redirect to thank you page
            window.location.href = `thankyou.html?name=${encodeURIComponent(formData.name)}&amount=${formData.amount}&type=${formData.type}`;
        }
    } catch (error) {
        console.error('Error saving donation:', error);
        alert('Error processing donation. Please try again or contact support.');
    }
});

// Handle Owner Donation Form Submission
ownerDonationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const ownerData = {
        name: document.getElementById('ownerName').value,
        email: document.getElementById('ownerEmail').value,
        amount: parseFloat(document.getElementById('ownerAmount').value),
        type: 'owner',
        upiId: '9797590308@fam',
        timestamp: new Date().toISOString()
    };
    
    try {
        const response = await saveDonation(ownerData);
        
        if (response.success) {
            alert('Thank you for supporting our operations! We appreciate your contribution.');
            closeOwnerModal();
            ownerDonationForm.reset();
        }
    } catch (error) {
        console.error('Error saving owner donation:', error);
        alert('Error processing donation. Please try again.');
    }
});

// Save donation to database
async function saveDonation(data) {
    // This is a mock function. In production, you'll need a backend API
    // that connects to MongoDB
    
    // For Netlify/GitHub Pages static hosting, you'll need to use:
    // 1. Netlify Functions for backend
    // 2. Or a separate backend service like Firebase, Supabase, or a Node.js server
    
    console.log('Saving donation:', data);
    
    // Example using fetch to your backend API
    /*
    const response = await fetch(`${API_ENDPOINT}/donations`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    });
    
    return await response.json();
    */
    
    // For now, return mock success
    return { success: true, id: 'mock_' + Date.now() };
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target === donationModal) {
        closeModal();
    }
    if (event.target === ownerModal) {
        closeOwnerModal();
    }
}

// WhatsApp Contact
function openWhatsApp() {
    const message = encodeURIComponent("Hello Helper Hands, I'd like to know more about your donation process.");
    window.open(`https://wa.me/917304937349?text=${message}`, '_blank');
}

// Initialize
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
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    });
    
    // Add current year to footer
    document.getElementById('currentYear').textContent = new Date().getFullYear();
});
