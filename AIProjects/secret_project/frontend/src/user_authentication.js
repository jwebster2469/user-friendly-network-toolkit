// User Authentication Implementation

class UserAuthentication {
    constructor() {
        this.users = []; // In-memory user storage for demonstration
    }

    register(username, password) {
        const existingUser = this.users.find(user => user.username === username);
        if (existingUser) {
            console.log('User already exists.');
            return;
        }
        const hashedPassword = this.hashPassword(password);
        this.users.push({ username, password: hashedPassword });
        console.log('User registered successfully:', username);
    }

    login(username, password) {
        const user = this.users.find(user => user.username === username);
        if (!user || !this.verifyPassword(password, user.password)) {
            console.log('Invalid username or password.');
            return;
        }
        console.log('User logged in successfully:', username);
    }

    hashPassword(password) {
        // Simple hashing for demonstration (use a proper hashing library in production)
        return btoa(password);
    }

    verifyPassword(password, hashedPassword) {
        return this.hashPassword(password) === hashedPassword;
    }
}

// Usage
const auth = new UserAuthentication();
auth.register('testUser', 'password123');
auth.login('testUser', 'password123');
