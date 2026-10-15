// Single source of truth for taxonomy. Keep in sync with firestore.rules (validShop).

export const CATEGORIES = [
  { id: 'Fashion', hue: 18 },
  { id: 'Beauty', hue: 340 },
  { id: 'Electronics', hue: 215 },
  { id: 'Dining', hue: 32 },
  { id: 'Home', hue: 150 },
  { id: 'Books and Gifts', hue: 280 },
  { id: 'Sports', hue: 95 },
  { id: 'Entertainment', hue: 255 },
  { id: 'Services', hue: 190 },
];

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id);

export const FLOORS = [
  { id: 'G', label: 'Ground', name: 'Ground Floor', blurb: 'Fashion, beauty and the grand entrance.' },
  { id: '1', label: 'Level 1', name: 'First Floor', blurb: 'Electronics, home and lifestyle.' },
  { id: '2', label: 'Level 2', name: 'Second Floor', blurb: 'Dining, books and gifts.' },
  { id: '3', label: 'Level 3', name: 'Third Floor', blurb: 'Cinema, play and services.' },
];

export const FLOOR_IDS = FLOORS.map((f) => f.id);

export const DAYS = [
  { key: 'mon', short: 'Mon', long: 'Monday' },
  { key: 'tue', short: 'Tue', long: 'Tuesday' },
  { key: 'wed', short: 'Wed', long: 'Wednesday' },
  { key: 'thu', short: 'Thu', long: 'Thursday' },
  { key: 'fri', short: 'Fri', long: 'Friday' },
  { key: 'sat', short: 'Sat', long: 'Saturday' },
  { key: 'sun', short: 'Sun', long: 'Sunday' },
];

export const SHOP_STATUS = {
  active: { label: 'Live', tone: 'ok' },
  pending: { label: 'Pending', tone: 'warn' },
  inactive: { label: 'Archived', tone: 'neutral' },
};

export const PRODUCT_STATUS = {
  active: { label: 'Live', tone: 'ok' },
  draft: { label: 'Draft', tone: 'warn' },
  archived: { label: 'Archived', tone: 'neutral' },
};

export const RESERVATION_STATUS = {
  requested: { label: 'Requested', tone: 'warn', hint: 'Waiting for the store to confirm.' },
  confirmed: { label: 'Confirmed', tone: 'info', hint: 'Items are set aside for you.' },
  ready: { label: 'Ready for pickup', tone: 'ok', hint: 'Show your code at the store counter.' },
  collected: { label: 'Collected', tone: 'neutral', hint: 'Picked up. Thank you.' },
  cancelled: { label: 'Cancelled', tone: 'danger', hint: 'This reservation was cancelled.' },
  expired: { label: 'Expired', tone: 'danger', hint: 'The hold expired and stock was released.' },
};

export const ACTIVE_RESERVATION = ['requested', 'confirmed', 'ready'];

export const PICKUP_WINDOWS = [
  { id: 'today-afternoon', label: 'Today, 12 PM to 4 PM' },
  { id: 'today-evening', label: 'Today, 4 PM to 9 PM' },
  { id: 'tomorrow-morning', label: 'Tomorrow, 11 AM to 1 PM' },
  { id: 'tomorrow-evening', label: 'Tomorrow, 4 PM to 9 PM' },
];

export const ROLES = {
  admin: { label: 'Administrator', tone: 'brass' },
  owner: { label: 'Store owner', tone: 'moss' },
  shopper: { label: 'Shopper', tone: 'neutral' },
};

export const LOW_STOCK = 5;
export const MAX_BAG_QTY = 10;

export const DEFAULT_SETTINGS = {
  name: 'Mercatora',
  tagline: 'Shop, dine and unwind under one roof.',
  address: 'Mercatora Mall, Linking Road, Bandra West, Mumbai 400050',
  city: 'Mumbai',
  phone: '+91 22 4000 1200',
  email: 'hello@mercatora.example',
  timezone: 'Asia/Kolkata',
  hours: {
    mon: { open: '10:00', close: '22:00', closed: false },
    tue: { open: '10:00', close: '22:00', closed: false },
    wed: { open: '10:00', close: '22:00', closed: false },
    thu: { open: '10:00', close: '22:00', closed: false },
    fri: { open: '10:00', close: '23:00', closed: false },
    sat: { open: '10:00', close: '23:00', closed: false },
    sun: { open: '11:00', close: '22:00', closed: false },
  },
  parking: {
    capacity: 1200,
    levels: 'Basement B1 to B3',
    rates: 'First 2 hours free with any purchase, then Rs 40 per hour.',
    evCharging: true,
    note: 'Valet is available at the Ground Floor main entrance from 11 AM.',
  },
  facilities: ['Free Wi-Fi', 'Baby care rooms', 'Wheelchair access', 'EV charging', 'Lost and found', 'Prayer room'],
  gettingHere: 'Ten minutes from Bandra station. Buses 211 and 231 stop at the Linking Road gate. Cab drop-off is at the Ground Floor main entrance.',
};
