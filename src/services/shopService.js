import { db } from "../config/firebase";
import { 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    orderBy, 
    serverTimestamp 
} from "firebase/firestore";
import { LoggerService } from "./loggerService"; // <--- IMPORT THIS

const COLLECTION_NAME = "shops";

export const ShopService = {
    async addShop(shopData) {
        try {
            if (!shopData.name || !shopData.shopNumber) {
                throw new Error("Shop Name and Number are required!");
            }

            const payload = {
                ...shopData,
                createdAt: serverTimestamp(),
                status: 'active'
            };

            const docRef = await addDoc(collection(db, COLLECTION_NAME), payload);
            
            // <--- ADD LOGGING HERE
            await LoggerService.log(
                "SHOP_CREATED", 
                `Name: ${shopData.name}, Floor: ${shopData.floor}`
            );

            return { id: docRef.id, ...payload };
        } catch (error) {
            console.error("Error adding shop:", error);
            throw error;
        }
    },

    async getAllShops() {
        try {
            const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error("Error fetching shops:", error);
            throw error;
        }
    }
};