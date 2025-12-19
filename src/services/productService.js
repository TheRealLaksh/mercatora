import { db } from "../config/firebase";
import { 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    orderBy, 
    where, // <--- ADD THIS IMPORT
    serverTimestamp 
} from "firebase/firestore";

const COLLECTION_NAME = "products";

export const ProductService = {
    // ... [Keep addProduct as is] ...
    async addProduct(productData) {
        // (Keep existing code)
        try {
            if (!productData.shopId) throw new Error("Product must be assigned to a shop!");
            const payload = {
                ...productData,
                price: parseFloat(productData.price),
                stock: parseInt(productData.stock),
                createdAt: serverTimestamp()
            };
            const docRef = await addDoc(collection(db, COLLECTION_NAME), payload);
            return { id: docRef.id, ...payload };
        } catch (error) {
            console.error("Error adding product:", error);
            throw error;
        }
    },

    // ... [Keep getAllProducts as is] ...
    async getAllProducts() {
        // (Keep existing code)
        try {
            const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Error fetching products:", error);
            throw error;
        }
    },

    // 3. NEW: Get products for a specific shop
    async getProductsByShop(shopId) {
        try {
            // Create a query against the collection
            const q = query(
                collection(db, COLLECTION_NAME), 
                where("shopId", "==", shopId) // <--- The Filtering Magic
            );

            const querySnapshot = await getDocs(q);
            
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error("Error fetching shop products:", error);
            throw error;
        }
    }
};  