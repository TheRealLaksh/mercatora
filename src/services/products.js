import { collection, doc, query, serverTimestamp, where, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase.js';
import { ValidationError, clean, hasErrors, validateProduct } from '../lib/schemas.js';
import { stageAudit } from './audit.js';

/** Public catalog for one shop. Only live products. */
export const shopProductsQuery = (shopId) =>
  query(collection(db, 'products'), where('shopId', '==', shopId), where('status', '==', 'active'));

/** Staff view of one shop, including drafts and archived. */
export const staffProductsQuery = (shopId) => query(collection(db, 'products'), where('shopId', '==', shopId));

/** Latest live products across the mall (home page). */
export const liveProductsQuery = () => query(collection(db, 'products'), where('status', '==', 'active'));

export const allProductsQuery = () => collection(db, 'products');

function shape(d) {
  const mrp = d.mrp === '' || d.mrp === undefined || d.mrp === null ? null : Number(d.mrp);
  return clean({
    shopId: d.shopId,
    name: d.name.trim(),
    description: d.description?.trim() ?? '',
    category: d.category?.trim() ?? '',
    price: Number(d.price),
    mrp,
    stock: Number(d.stock),
    imageUrl: d.imageUrl ?? '',
    status: d.status ?? 'active',
  });
}

export async function saveProduct(data, id = null) {
  const errors = validateProduct(data);
  if (hasErrors(errors)) throw new ValidationError(errors);
  const payload = shape(data);
  const batch = writeBatch(db);
  const ref = id ? doc(db, 'products', id) : doc(collection(db, 'products'));
  if (id) {
    const { shopId: _ignored, ...rest } = payload;
    batch.update(ref, { ...rest, updatedAt: serverTimestamp() });
    stageAudit(batch, 'PRODUCT_UPDATED', `${payload.name}, stock ${payload.stock}, price ${payload.price}`, 'product', id);
  } else {
    batch.set(ref, { ...payload, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    stageAudit(batch, 'PRODUCT_CREATED', `${payload.name} added`, 'product', ref.id);
  }
  await batch.commit();
  return ref.id;
}

export async function setStock(product, stock) {
  if (!Number.isInteger(stock) || stock < 0) throw new Error('Stock must be a whole number, zero or more.');
  const batch = writeBatch(db);
  batch.update(doc(db, 'products', product.id), { stock, updatedAt: serverTimestamp() });
  stageAudit(batch, 'STOCK_ADJUSTED', `${product.name}: ${product.stock} to ${stock}`, 'product', product.id);
  await batch.commit();
}

export async function setProductStatus(product, status) {
  const batch = writeBatch(db);
  batch.update(doc(db, 'products', product.id), { status, updatedAt: serverTimestamp() });
  stageAudit(batch, 'PRODUCT_STATUS', `${product.name} set to ${status}`, 'product', product.id);
  await batch.commit();
}

export async function deleteProduct(product) {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'products', product.id));
  stageAudit(batch, 'PRODUCT_DELETED', product.name, 'product', product.id);
  await batch.commit();
}

