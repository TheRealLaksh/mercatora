# Mercatora | Mall Management System

Mercatora is a modern, web-based **Mall Management System** designed to bridge the gap between mall administrators and shoppers. It features a dual-interface architecture: a secure dashboard for admins to manage inventory and shops, and a public-facing directory for users to explore the mall.

---

## 🚀 Features

### 🏢 Public Mall Directory (User Facing)
- **Shop Discovery:** Browse all active shops by category and floor  
- **Product Catalog:** View products listed by each shop  
- **Smart Filtering:** Search by shop name/category or filter by floors  
- **Responsive Design:** Optimized for mobile and desktop  

### 🛡️ Admin Dashboard (Secure Access)
- **Shop Management:** Onboard shops with owner details and location mapping  
- **Inventory Control:** Add and update products for shops  
- **Audit Logging:** Immutable tracking of critical actions (e.g. SHOP_CREATED)  
- **Security:** Role-based access using Firebase Authentication  

---

## 🛠️ Tech Stack
- **Frontend:** Vanilla JavaScript (ES Modules), Vite  
- **Backend:** Firebase (Authentication, Firestore, Hosting)  
- **Styling:** CSS3 with CSS Variables  

---

## 📦 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/mercatora.git
cd mercatora
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the project root:

```env
VITE_API_KEY=your_api_key
VITE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_PROJECT_ID=your_project_id
VITE_STORAGE_BUCKET=your_project.appspot.com
VITE_MESSAGING_SENDER_ID=your_sender_id
VITE_APP_ID=your_app_id
```

### 4. Run Development Server
```bash
npm run dev
```

---

## 🚢 Deployment (Firebase Hosting)

### Build Production Bundle
```bash
npm run build
```

### Deploy to Firebase
```bash
firebase deploy
```

---

## 📐 Low-Level Design (LLD)

A Low-Level Design (LLD) document explains how the internal structure of the application is organized.

Create a file named **`DESIGN.md`** (or `LLD.md`) in the root directory.

```markdown
# Low-Level Design (LLD) – Mercatora

## 1. Architecture Overview
Mercatora follows a **Service-Oriented Architecture (SOA)** on the frontend.  
Application logic is strictly separated from UI logic.

- **UI Layer (`/src/ui`)**  
  Handles DOM manipulation and user interactions.

- **Service Layer (`/src/services`)**  
  Contains business logic and Firebase API calls.

- **Config Layer (`/src/config`)**  
  Centralized Firebase configuration and initialization.

## 2. Data Model (Firestore)

### Collection: `shops`
| Field | Type | Description |
|------|------|-------------|
| `id` | string | Auto-generated document ID |
| `name` | string | Shop name |
| `category` | string | Fashion, Electronics, etc. |
| `floor` | string | Ground, 1st, 2nd |
| `status` | string | active / inactive |

### Collection: `products`
| Field | Type | Description |
|------|------|-------------|
| `name` | string | Product name |
| `price` | number | Price in INR |
| `stock` | number | Available quantity |
| `shopId` | string | Parent shop reference |

### Collection: `logs`
| Field | Type | Description |
|------|------|-------------|
| `action` | string | Event type (e.g. SHOP_CREATED) |
| `performedBy` | string | Admin email |
| `timestamp` | timestamp | Server timestamp |

## 3. Key Modules

### Authentication Service (`authService.js`)
- Wraps Firebase Authentication APIs
- Uses `onAuthStateChanged` for session persistence
- Acts as route gatekeeper in `main.js`

### Logger Service (`loggerService.js`)
- Decoupled logging mechanism
- Writes asynchronously to Firestore `logs`
- Failure-safe: logging errors never crash the application
```

---

## 🧹 Final Code Cleanup Checklist
- Remove debug `console.log` statements  
- Keep `console.error` for error handling  
- Ensure `.env` is listed in `.gitignore`  
- Format files using Prettier or similar  

---

## 📄 License
MIT
