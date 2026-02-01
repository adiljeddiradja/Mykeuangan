
import * as SQLite from 'expo-sqlite';
import { auth, db as firestoreDB } from '../config/firebase';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc, orderBy, getDoc } from 'firebase/firestore';

let db; // Local SQLite DB

// --- HELPER: Check if Online/Logged In ---
const isCloudMode = () => {
    return auth?.currentUser !== null;
};

const getUserId = () => {
    return auth?.currentUser?.uid;
};

// --- SQLITE INIT (Local) ---
export const initDB = async () => {
    try {
        db = await SQLite.openDatabaseAsync('finance_db_v2.db');
        await db.execAsync('PRAGMA journal_mode = WAL;');
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS accounts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT,
                icon TEXT DEFAULT 'wallet',
                balance REAL DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                icon TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                amount REAL NOT NULL,
                type TEXT NOT NULL,
                category_id INTEGER,
                category_name TEXT,
                category_icon TEXT,
                account_id INTEGER,
                note TEXT,
                date TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(account_id) REFERENCES accounts(id)
            );
        `);

        // Seed only if empty and LOCAL
        const accountCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM accounts');
        if (accountCount.count === 0) {
            await db.execAsync(`
                INSERT INTO accounts (name, type, icon, balance) VALUES ('Dompet Tunai', 'CASH', 'wallet', 0), ('Bank BCA', 'BANK', 'card', 0), ('Gopay', 'EWALLET', 'phone-portrait', 0);
                INSERT INTO categories (name, type, icon) VALUES ('Gaji', 'INCOME', 'cash'), ('Bonus', 'INCOME', 'gift'), ('Investasi', 'INCOME', 'stats-chart'), ('Makanan', 'EXPENSE', 'fast-food'), ('Transport', 'EXPENSE', 'car'), ('Belanja', 'EXPENSE', 'cart'), ('Tagihan', 'EXPENSE', 'receipt'), ('Hiburan', 'EXPENSE', 'game-controller'), ('Kesehatan', 'EXPENSE', 'medkit');
            `);
        }
        console.log('Database initialized');
    } catch (error) {
        console.error('Error init DB:', error);
    }
};

// --- ACCOUNTS ---
export const getAccounts = async () => {
    if (isCloudMode()) {
        try {
            const userId = getUserId();
            const q = query(collection(firestoreDB, "users", userId, "accounts"));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (e) { console.error("Cloud Get Accounts Error", e); return []; }
    } else {
        if (!db) await initDB();
        return await db.getAllAsync('SELECT * FROM accounts');
    }
};

export const addAccount = async ({ name, type, icon, initialBalance }) => {
    if (isCloudMode()) {
        try {
            const userId = getUserId();
            await addDoc(collection(firestoreDB, "users", userId, "accounts"), {
                name, type, icon, balance: initialBalance
            });
        } catch (e) { console.error("Cloud Add Account Error", e); throw e; }
    } else {
        if (!db) await initDB();
        await db.runAsync(
            'INSERT INTO accounts (name, type, icon, balance) VALUES (?, ?, ?, ?)',
            name, type, icon, initialBalance
        );
    }
};

export const deleteAccount = async (id) => {
    if (isCloudMode()) {
        try {
            const userId = getUserId();
            await deleteDoc(doc(firestoreDB, "users", userId, "accounts", id));
        } catch (e) { console.error("Cloud Delete Account Error", e); }
    } else {
        if (!db) await initDB();
        await db.runAsync('DELETE FROM accounts WHERE id = ?', id);
    }
};

// --- CATEGORIES ---
export const getCategories = async (type) => {
    if (isCloudMode()) {
        const userId = getUserId();
        const q = query(collection(firestoreDB, "users", userId, "categories"), where("type", "==", type));
        const snapshot = await getDocs(q);
        const cloudCats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (cloudCats.length > 0) return cloudCats;

        return type === 'INCOME' ?
            [{ id: 'c1', name: 'Gaji', icon: 'cash' }, { id: 'c2', name: 'Bonus', icon: 'gift' }, { id: 'c3', name: 'Investasi', icon: 'stats-chart' }] :
            [{ id: 'c4', name: 'Makanan', icon: 'fast-food' }, { id: 'c5', name: 'Transport', icon: 'car' }, { id: 'c6', name: 'Belanja', icon: 'cart' }, { id: 'c7', name: 'Tagihan', icon: 'receipt' }];
    } else {
        if (!db) await initDB();
        return await db.getAllAsync('SELECT * FROM categories WHERE type = ?', type);
    }
};

// --- TRANSACTIONS ---
export const addTransaction = async ({ amount, type, categoryId, categoryName, categoryIcon, accountId, note, date }) => {
    if (isCloudMode()) {
        const userId = getUserId();
        // 1. Add Transaction
        await addDoc(collection(firestoreDB, "users", userId, "transactions"), {
            amount, type, categoryId, categoryName, categoryIcon, accountId, note, date, created_at: new Date().toISOString()
        });

        // 2. Update Account Balance
        try {
            const accountRef = doc(firestoreDB, "users", userId, "accounts", accountId);
            const accSnap = await getDoc(accountRef);

            if (accSnap.exists()) {
                const currentBalance = accSnap.data().balance || 0;
                const newBalance = type === 'INCOME' ? (currentBalance + amount) : (currentBalance - amount);
                await updateDoc(accountRef, { balance: newBalance });
            }
        } catch (e) {
            console.error('Cloud Balance Update Error:', e);
        }

    } else {
        if (!db) await initDB();
        await db.runAsync(
            'INSERT INTO transactions (amount, type, category_id, category_name, category_icon, account_id, note, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            amount, type, categoryId, categoryName, categoryIcon || 'help-circle', accountId, note, date
        );
        const balanceChange = type === 'INCOME' ? amount : -amount;
        await db.runAsync('UPDATE accounts SET balance = balance + ? WHERE id = ?', balanceChange, accountId);
    }
};

export const getTransactions = async () => {
    if (isCloudMode()) {
        const userId = getUserId();
        const q = query(collection(firestoreDB, "users", userId, "transactions"), orderBy("date", "desc"));
        const snapshot = await getDocs(q);

        // Fetch accounts for name mapping
        const accounts = await getAccounts();
        const accMap = {};
        accounts.forEach(a => accMap[a.id] = a.name);

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                account_name: accMap[data.account_id] || accMap[data.accountId] || 'Umum'
            };
        });
    } else {
        if (!db) await initDB();
        return await db.getAllAsync(`
            SELECT t.*, a.name as account_name 
            FROM transactions t 
            LEFT JOIN accounts a ON t.account_id = a.id 
            ORDER BY t.date DESC, t.id DESC
        `);
    }
};

export const getSummary = async () => {
    if (isCloudMode()) {
        const txs = await getTransactions();
        let income = 0;
        let expense = 0;
        txs.forEach(t => {
            if (t.type === 'INCOME') income += t.amount;
            else expense += t.amount;
        });

        const accounts = await getAccounts();
        let totalBalance = 0;
        accounts.forEach(a => totalBalance += (a.balance || 0));

        return { income, expense, totalBalance };
    } else {
        if (!db) await initDB();
        const incomeResult = await db.getFirstAsync("SELECT SUM(amount) as total FROM transactions WHERE type = 'INCOME'");
        const expenseResult = await db.getFirstAsync("SELECT SUM(amount) as total FROM transactions WHERE type = 'EXPENSE'");
        const totalBalance = await db.getFirstAsync("SELECT SUM(balance) as total FROM accounts");
        return {
            income: incomeResult?.total || 0,
            expense: expenseResult?.total || 0,
            totalBalance: totalBalance?.total || 0
        };
    }
};

export const getMonthlySummary = async () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const txs = await getTransactions();
    let monthlyIncome = 0;
    let monthlyExpense = 0;
    txs.forEach(t => {
        const tDate = new Date(t.date);
        if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
            if (t.type === 'INCOME') monthlyIncome += t.amount;
            else monthlyExpense += t.amount;
        }
    });
    return { income: monthlyIncome, expense: monthlyExpense, surplus: monthlyIncome - monthlyExpense };
};

export const deleteTransaction = async (id) => {
    if (isCloudMode()) {
        const userId = getUserId();
        // Need to fetch tx first to reverse balance
        const txRef = doc(firestoreDB, "users", userId, "transactions", id);
        const txSnap = await getDoc(txRef);

        if (txSnap.exists()) {
            const txData = txSnap.data();
            const accountId = txData.account_id || txData.accountId;

            // Reverse Balance
            try {
                const accountRef = doc(firestoreDB, "users", userId, "accounts", accountId);
                const accSnap = await getDoc(accountRef);
                if (accSnap.exists()) {
                    const currentBalance = accSnap.data().balance || 0;
                    const reverseAmount = txData.type === 'INCOME' ? -txData.amount : txData.amount;
                    const newBalance = currentBalance + reverseAmount;
                    await updateDoc(accountRef, { balance: newBalance });
                }
            } catch (e) { console.error('Cloud Reverse Balance Error:', e); }

            await deleteDoc(txRef);
        }
    } else {
        if (!db) await initDB();
        const tx = await db.getFirstAsync('SELECT * FROM transactions WHERE id = ?', id);
        if (tx) {
            const limitReverse = tx.type === 'INCOME' ? -tx.amount : tx.amount;
            await db.runAsync('UPDATE accounts SET balance = balance + ? WHERE id = ?', limitReverse, tx.account_id);
            await db.runAsync('DELETE FROM transactions WHERE id = ?', id);
        }
    }
};
