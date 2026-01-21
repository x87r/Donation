// donations.js - Complete backend for donations
const { MongoClient } = require('mongodb');

// MongoDB Connection - APNA CONNECTION STRING YAHAN DAALEIN
const MONGODB_URI = 'mongodb+srv://radheyjii:Sunradhey%40123@helperhandscluster.mongodb.net/?retryWrites=true&w=majority';
const DB_NAME = 'helper_hands';
let cachedDb = null;

async function connectToDatabase() {
    if (cachedDb) {
        return cachedDb;
    }
    
    const client = new MongoClient(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    
    await client.connect();
    cachedDb = client.db(DB_NAME);
    return cachedDb;
}

exports.handler = async (event, context) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Content-Type': 'application/json',
    };

    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: '',
        };
    }

    try {
        const db = await connectToDatabase();
        const donationsCollection = db.collection('donations');

        // GET: Retrieve all donations (for admin)
        if (event.httpMethod === 'GET') {
            const { admin_email, admin_password } = event.queryStringParameters || {};
            
            // Verify admin credentials
            if (!admin_email || !admin_password) {
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({ 
                        success: false, 
                        message: 'Admin credentials required' 
                    }),
                };
            }
            
            if (admin_email !== 'radheyjii@outlook.in' || admin_password !== 'Sunradhey#123') {
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({ 
                        success: false, 
                        message: 'Invalid admin credentials' 
                    }),
                };
            }
            
            const donations = await donationsCollection
                .find({})
                .sort({ createdAt: -1 })
                .toArray();
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    success: true, 
                    data: donations 
                }),
            };
        }

        // POST: Save new donation
        if (event.httpMethod === 'POST') {
            const donationData = JSON.parse(event.body);
            
            // Validate required fields
            if (!donationData.name || !donationData.email || !donationData.amount || !donationData.type) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ 
                        success: false, 
                        message: 'Missing required fields' 
                    }),
                };
            }
            
            // Add metadata
            const donation = {
                ...donationData,
                status: 'pending',
                paymentVerified: false,
                receiptSent: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            
            const result = await donationsCollection.insertOne(donation);
            
            // Send confirmation email (basic simulation)
            // In production, you'd use SendGrid, Mailgun, etc.
            console.log('Donation saved:', {
                id: result.insertedId,
                email: donation.email,
                amount: donation.amount,
                type: donation.type
            });
            
            return {
                statusCode: 201,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Donation saved successfully',
                    donationId: result.insertedId,
                    data: donation
                }),
            };
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ 
                success: false, 
                message: 'Method not allowed' 
            }),
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                message: 'Internal server error',
                error: error.message 
            }),
        };
    }
};
