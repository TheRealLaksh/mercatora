import { db } from "../config/firebase";
import {
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    serverTimestamp,
    deleteDoc, 
    doc
} from "firebase/firestore";
import { LoggerService } from "./loggerService"; // <--- IMPORT THIS

const COLLECTION_NAME = "shops";

export const ShopService = {
    async addShop(shopData) {
        try {
            // 1. TRIM INPUTS
            const name = shopData.name?.trim();
            const category = shopData.category?.trim();
            const shopNumber = shopData.shopNumber?.trim();

            // 2. VALIDATION CHECKS
            if (!name) throw new Error("Shop Name is required.");
            if (!shopNumber) throw new Error("Shop Number is required.");
            if (!category) throw new Error("Category is required.");

            // Ensure floor is valid
            const validFloors = ["Ground", "1st", "2nd", "3rd"];
            if (!validFloors.includes(shopData.floor)) {
                throw new Error("Invalid Floor selected.");
            }

            const payload = {
                name,
                shopNumber,
                category,
                floor: shopData.floor,
                ownerName: shopData.ownerName?.trim() || "N/A",
                createdAt: serverTimestamp(),
                status: 'active'
            };

            const docRef = await addDoc(collection(db, "shops"), payload);

            await LoggerService.log("SHOP_CREATED", `Name: ${name}, ID: ${docRef.id}`);
            return { id: docRef.id, ...payload };

        } catch (error) {
            console.error("Validation/Network Error:", error);
            throw error; // Re-throw so the UI can catch it
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
    },
    async deleteShop(shopId) {
        try {
            const shopRef = doc(db, COLLECTION_NAME, shopId);
            await deleteDoc(shopRef);
            // Optional: You should ideally delete all products belonging to this shop here too
        } catch (error) {
            console.error("Error deleting shop:", error);
            throw error;
        }
    }

};