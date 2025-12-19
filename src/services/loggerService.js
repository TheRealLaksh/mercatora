import { db, auth } from "../config/firebase";
import { 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    orderBy, 
    limit, 
    serverTimestamp 
} from "firebase/firestore";

const COLLECTION_NAME = "logs";

export const LoggerService = {
    // 1. Write a Log Entry
    async log(action, details) {
        try {
            const user = auth.currentUser;
            const email = user ? user.email : "System/Guest";

            await addDoc(collection(db, COLLECTION_NAME), {
                action: action,
                details: details,
                performedBy: email,
                timestamp: serverTimestamp()
            });
            console.log(`[LOG SAVED] ${action}: ${details}`);
        } catch (error) {
            console.error("Failed to save log:", error);
            // We do NOT throw error here. Logging failure should not crash the app.
        }
    },

    // 2. Fetch Logs for Admin Dashboard
    async getLogs() {
        try {
            // Get last 50 logs, newest first
            const q = query(
                collection(db, COLLECTION_NAME), 
                orderBy("timestamp", "desc"), 
                limit(50)
            );
            
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // Convert Firestore Timestamp to readable JS Date
                    timestamp: data.timestamp ? data.timestamp.toDate() : new Date()
                };
            });
        } catch (error) {
            console.error("Error fetching logs:", error);
            throw error;
        }
    }
};