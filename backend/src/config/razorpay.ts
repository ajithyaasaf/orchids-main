import Razorpay from 'razorpay';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Razorpay instance
let razorpayInstance: any = null;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    try {
        razorpayInstance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
        console.log('✅ Razorpay configured successfully');
    } catch (error) {
        console.error('⚠️ Razorpay initialization failed:', error);
    }
} else {
    console.warn('⚠️ Razorpay keys missing. Payment features will not work.');
}

export default razorpayInstance;
