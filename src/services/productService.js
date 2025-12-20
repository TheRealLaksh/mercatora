import { db } from "../config/firebase";
import {
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    where,
    serverTimestamp,
    deleteDoc,
    doc
} from "firebase/firestore";

const COLLECTION_NAME = "products";

export const ProductService = {
    // In src/services/productService.js

    async addProduct(productData) {
        try {
            if (!productData.shopId) throw new Error("Product must be assigned to a shop.");
            if (!productData.name) throw new Error("Product Name is required.");

            const price = parseFloat(productData.price);
            const stock = parseInt(productData.stock);

            // NUMERIC CHECKS
            if (isNaN(price) || price < 0) throw new Error("Price must be a positive number.");
            if (isNaN(stock) || stock < 0) throw new Error("Stock cannot be negative.");

            const payload = {
                ...productData,
                price,
                stock,
                createdAt: serverTimestamp()
            };

            const docRef = await addDoc(collection(db, "products"), payload);
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
    },
    async deleteProduct(productId) {
        try {
            const productRef = doc(db, COLLECTION_NAME, productId);
            await deleteDoc(productRef);
        } catch (error) {
            console.error("Error deleting product:", error);
            throw error;
        }
    }
};  