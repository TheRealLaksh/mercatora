import { db } from "../config/firebase";
import { 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    orderBy, 
    serverTimestamp 
} from "firebase/firestore";

const COLLECTION_NAME = "products";

export const ProductService = {
    // 1. ADD a new product
    async addProduct(productData) {
        try {
            if (!productData.shopId) {
                throw new Error("Product must be assigned to a shop!");
            }

            const payload = {
                ...productData,
                price: parseFloat(productData.price), // Ensure number
                stock: parseInt(productData.stock),   // Ensure integer
                createdAt: serverTimestamp()
            };

            const docRef = await addDoc(collection(db, COLLECTION_NAME), payload);
            return { id: docRef.id, ...payload };
        } catch (error) {
            console.error("Error adding product:", error);
            throw error;
        }
    },

    // 2. GET all products (Global Inventory)
    async getAllProducts() {
        try {
            const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error("Error fetching products:", error);
            throw error;
        }
    }
};