import { auth } from '../config/firebase';

/**
 * Script to reset password for a Firebase Authentication user
 */

async function resetPassword() {
    const email = 'ajith@gmail.com';
    const newPassword = 'Admin@123'; // Change this to your desired password

    try {
        console.log(`Resetting password for ${email}...`);

        // Update the user's password
        const user = await auth.getUserByEmail(email);

        await auth.updateUser(user.uid, {
            password: newPassword,
        });

        console.log('✅ Password reset successfully!');
        console.log(`\nYou can now login with:`);
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${newPassword}`);
        console.log('\n⚠️  IMPORTANT: Change this password after first login!');

        process.exit(0);
    } catch (error: any) {
        console.error('❌ Error resetting password:', error.message);
        process.exit(1);
    }
}

// Run the script
resetPassword();
