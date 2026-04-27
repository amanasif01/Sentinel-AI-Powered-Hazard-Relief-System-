const bcrypt = require('bcryptjs');

class User {
    constructor(data) {
        this.email = data.email;
        this.username = data.username;
        this.password = data.password;
        this.emergencyContacts = data.emergencyContacts || [];
        this.profile = data.profile || {};
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
    }

    // Hash password before saving
    async hashPassword() {
        if (this.password) {
            const saltRounds = 12;
            this.password = await bcrypt.hash(this.password, saltRounds);
        }
    }

    // Verify password
    async verifyPassword(plainPassword) {
        return await bcrypt.compare(plainPassword, this.password);
    }

    // Add emergency contact
    addEmergencyContact(email, name = '') {
        // Check if email already exists in emergency contacts
        const existingContact = this.emergencyContacts.find(contact => 
            contact.email.toLowerCase() === email.toLowerCase()
        );
        
        if (existingContact) {
            throw new Error('Emergency contact email already exists');
        }

        this.emergencyContacts.push({
            email: email.toLowerCase(),
            name: name.trim(),
            addedAt: new Date()
        });
        
        this.updatedAt = new Date();
    }

    // Remove emergency contact
    removeEmergencyContact(email) {
        this.emergencyContacts = this.emergencyContacts.filter(contact => 
            contact.email.toLowerCase() !== email.toLowerCase()
        );
        this.updatedAt = new Date();
    }

    // Get user data without password
    toJSON() {
        return {
            email: this.email,
            username: this.username,
            emergencyContacts: this.emergencyContacts,
            profile: this.profile,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    // Validate email format
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Validate password strength
    static validatePassword(password) {
        if (!password || password.length < 8) {
            return { valid: false, message: 'Password must be at least 8 characters long' };
        }
        
        if (!/(?=.*[a-z])/.test(password)) {
            return { valid: false, message: 'Password must contain at least one lowercase letter' };
        }
        
        if (!/(?=.*[A-Z])/.test(password)) {
            return { valid: false, message: 'Password must contain at least one uppercase letter' };
        }
        
        if (!/(?=.*\d)/.test(password)) {
            return { valid: false, message: 'Password must contain at least one number' };
        }
        
        return { valid: true };
    }
}

module.exports = User;
