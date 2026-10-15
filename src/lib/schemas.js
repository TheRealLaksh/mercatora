import { CATEGORY_IDS, FLOOR_IDS } from './constants.js';
import { isEmail, isPhone, isUrl } from './validate.js';
import { validateHours } from './hours.js';

/** Each validator returns an object of { field: message }. Empty object means valid. */

export function validateShop(d, { ownerOnly = false } = {}) {
  const e = {};
  if (!ownerOnly) {
    if (!d.name?.trim()) e.name = 'Give the store a name.';
    else if (d.name.trim().length > 80) e.name = 'Keep the name under 80 characters.';
    if (!CATEGORY_IDS.includes(d.category)) e.category = 'Choose a category.';
    if (!FLOOR_IDS.includes(d.floor)) e.floor = 'Choose a floor.';
    if (!d.unitId) e.unitId = 'Pick a unit on the floor plan.';
    else if (!d.unitId.startsWith(`${d.floor}-`)) e.unitId = 'That unit is on a different floor.';
  }
  if ((d.tagline ?? '').length > 140) e.tagline = 'Keep the tagline under 140 characters.';
  if ((d.description ?? '').length > 2000) e.description = 'Keep the description under 2000 characters.';
  if (d.email && !isEmail(d.email)) e.email = 'Enter a valid email address.';
  if (d.phone && !isPhone(d.phone)) e.phone = 'Enter a valid phone number.';
  if (d.website && !isUrl(d.website)) e.website = 'Enter a valid web address.';
  if (d.hours) {
    const problems = validateHours(d.hours);
    if (problems.length) e.hours = problems[0];
  }
  return e;
}

export function validateProduct(d) {
  const e = {};
  if (!d.shopId) e.shopId = 'Choose which store this belongs to.';
  if (!d.name?.trim()) e.name = 'Give the product a name.';
  else if (d.name.trim().length > 120) e.name = 'Keep the name under 120 characters.';
  const price = Number(d.price);
  if (d.price === '' || d.price === undefined || !Number.isFinite(price) || price < 0) e.price = 'Enter a price of zero or more.';
  if (d.mrp !== '' && d.mrp !== undefined && d.mrp !== null) {
    const mrp = Number(d.mrp);
    if (!Number.isFinite(mrp) || mrp < 0) e.mrp = 'Enter a valid original price.';
    else if (Number.isFinite(price) && mrp < price) e.mrp = 'Original price cannot be lower than the selling price.';
  }
  const stock = Number(d.stock);
  if (d.stock === '' || d.stock === undefined || !Number.isInteger(stock) || stock < 0) e.stock = 'Stock must be a whole number, zero or more.';
  if ((d.description ?? '').length > 2000) e.description = 'Keep the description under 2000 characters.';
  return e;
}

export function validateOffer(d) {
  const e = {};
  if (!d.title?.trim()) e.title = 'Give it a title.';
  else if (d.title.trim().length > 120) e.title = 'Keep the title under 120 characters.';
  if (!['offer', 'event'].includes(d.kind)) e.kind = 'Choose offer or event.';
  const s = d.startsAt instanceof Date ? d.startsAt : new Date(d.startsAt);
  const en = d.endsAt instanceof Date ? d.endsAt : new Date(d.endsAt);
  if (!d.startsAt || Number.isNaN(s.getTime())) e.startsAt = 'Pick a start date.';
  if (!d.endsAt || Number.isNaN(en.getTime())) e.endsAt = 'Pick an end date.';
  if (!e.startsAt && !e.endsAt && en < s) e.endsAt = 'The end cannot be before the start.';
  if ((d.description ?? '').length > 1500) e.description = 'Keep the description under 1500 characters.';
  return e;
}

export function validateReview(d) {
  const e = {};
  if (!Number.isInteger(d.rating) || d.rating < 1 || d.rating > 5) e.rating = 'Choose a rating from 1 to 5.';
  if ((d.text ?? '').length > 1000) e.text = 'Keep your review under 1000 characters.';
  return e;
}

export function validateContact(d) {
  const e = {};
  if (!d.name?.trim()) e.name = 'Tell the store who is collecting.';
  if (!d.phone || !isPhone(d.phone)) e.phone = 'Enter a phone number the store can reach.';
  if ((d.note ?? '').length > 300) e.note = 'Keep the note under 300 characters.';
  return e;
}

export function validateSettings(d) {
  const e = {};
  if (!d.name?.trim()) e.name = 'The mall needs a name.';
  if (d.email && !isEmail(d.email)) e.email = 'Enter a valid email address.';
  if (d.phone && !isPhone(d.phone)) e.phone = 'Enter a valid phone number.';
  const problems = validateHours(d.hours);
  if (problems.length) e.hours = problems[0];
  return e;
}

export const hasErrors = (errors) => Object.keys(errors).length > 0;

/** Firestore rejects undefined. Strip it, keep null and empty strings. */
export function clean(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

export class ValidationError extends Error {
  constructor(errors) {
    super(Object.values(errors)[0] ?? 'Please check the form.');
    this.name = 'ValidationError';
    this.errors = errors;
  }
}
