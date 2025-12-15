import { db } from "../config/firebase";
import { 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    orderBy, 
    serverTimestamp 
} from "firebase/firestore";

const COLLECTION_NAME = "shops";

export const ShopService = {
    // 1. ADD a new shop
    async addShop(shopData) {
        try {
            // Validate data before sending (Basic check)
            if (!shopData.name || !shopData.shopNumber) {
                throw new Error("Shop Name and Number are required!");
            }

            // Add timestamp
            const payload = {
                ...shopData,
                createdAt: serverTimestamp(),
                status: 'active' // Default status
            };

            const docRef = await addDoc(collection(db, COLLECTION_NAME), payload);
            return { id: docRef.id, ...payload };
        } catch (error) {
            console.error("Error adding shop:", error);
            throw error;
        }
    },

    // 2. GET all shops (Ordered by newest first)
    async getAllShops() {
        try {
            const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            
            // Convert Firebase "Snapshot" into a normal Array
            const shops = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            return shops;
        } catch (error) {
            console.error("Error fetching shops:", error);
            throw error;
        }
    }
};