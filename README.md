# Donation site by x87r

# Helper Hands Donation Website

A professional donation website for Helper Hands NGO to collect donations for children and dogs meals.

## Features

1. **Modern, Responsive Design**
   - Mobile-friendly interface
   - Blue, white, and black color scheme
   - Professional animations and transitions

2. **Multiple Donation Options**
   - Child meals: ₹30 per meal
   - Dog meals: ₹20 per meal
   - Both: ₹50
   - Owner support: Any amount

3. **Complete Donor Management**
   - Donor information collection (name, email, phone, Instagram)
   - Automatic email confirmation
   - WhatsApp verification
   - Data storage in MongoDB

4. **Admin Panel**
   - Secure login (email: radheyjii@outlook.in, password: Sunradhey#123)
   - View all donations with filters
   - Export data to CSV
   - Contact donors directly

5. **Payment Integration**
   - QR code scanning for child/dog meals
   - UPI ID for owner donations
   - 5-minute payment timer
   - Manual payment verification

## Setup Instructions

### 1. Hosting on Netlify

1. Create a GitHub repository and push all files
2. Go to [Netlify.com](https://netlify.com)
3. Click "New site from Git"
4. Connect your GitHub repository
5. Deploy the site

### 2. Backend Setup (Required for Database)

For MongoDB connectivity, you need a backend API. You can use:

**Option A: Netlify Functions**
- Create a `netlify/functions` folder
- Add serverless functions for database operations

**Option B: Firebase/Supabase**
- Use Firebase Firestore or Supabase as backend
- Update API endpoints in `script.js`

**Option C: Custom Node.js Server**
- Deploy a separate backend on Render/Railway
- Connect to MongoDB using the provided URL

### 3. Configuration

1. **QR Codes**: Replace `qr-child.png` and `qr-dog.png` with your actual QR images
2. **Logo**: Create a logo with blue, white, and black colors
3. **API Endpoint**: Update `API_ENDPOINT` in `script.js` with your backend URL
4. **MongoDB**: Use the provided connection string for your database

### 4. Important Notes

- Manual payment verification is required
- WhatsApp confirmation for each donation
- Pictures sent within 6-7 days
- 24/7 support available

## File Structure
