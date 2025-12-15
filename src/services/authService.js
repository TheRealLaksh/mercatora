import { 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "firebase/auth";
import { auth } from "../config/firebase";

export const AuthService = {
    // 1. Login Function
    async login(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return { user: userCredential.user, error: null };
        } catch (error) {
            return { user: null, error: error.message };
        }
    },

    // 2. Logout Function
    async logout() {
        try {
            await signOut(auth);
            return { success: true };
        } catch (error) {
            return { error: error.message };
        }
    },

    // 3. User Observer (Checks if user is logged in across pages)
    // We pass a callback function that runs whenever the login state changes
    observeAuth(callback) {
        onAuthStateChanged(auth, callback);
    }
};