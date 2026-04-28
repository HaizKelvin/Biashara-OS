import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  getDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

interface BusinessContextType {
  business: any | null;
  loading: boolean;
  createBusiness: (name: string) => Promise<void>;
  netBalance: number;
  sales: any[];
  expenses: any[];
  inventory: any[];
  debts: any[];
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [business, setBusiness] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [netBalance, setNetBalance] = useState(0);
  const [sales, setSales] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      setBusiness(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const userRef = doc(db, 'users', user.uid);
    const unsubscribeUser = onSnapshot(userRef, async (userDoc) => {
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.businessId) {
          const bizRef = doc(db, 'businesses', userData.businessId);
          onSnapshot(bizRef, (bizDoc) => {
            if (bizDoc.exists()) {
              setBusiness({ ...bizDoc.data(), id: bizDoc.id });
            }
          });
        }
      } else {
        setBusiness(null);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });

    return () => unsubscribeUser();
  }, [user]);

  // Real-time tracking of all business entities
  useEffect(() => {
    if (!business?.id) {
      setNetBalance(0);
      setSales([]);
      setExpenses([]);
      setInventory([]);
      setDebts([]);
      return;
    }

    const salesRef = collection(db, `businesses/${business.id}/sales`);
    const expensesRef = collection(db, `businesses/${business.id}/expenses`);
    const inventoryRef = collection(db, `businesses/${business.id}/inventory`);
    const debtsRef = collection(db, `businesses/${business.id}/debts`);

    const unsubscribeSales = onSnapshot(salesRef, (snapshot) => {
      const salesData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setSales(salesData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `businesses/${business.id}/sales`);
    });

    const unsubscribeExpenses = onSnapshot(expensesRef, (snapshot) => {
      const expensesData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setExpenses(expensesData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `businesses/${business.id}/expenses`);
    });

    const unsubscribeInventory = onSnapshot(inventoryRef, (snapshot) => {
      const inventoryData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setInventory(inventoryData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `businesses/${business.id}/inventory`);
    });

    const unsubscribeDebts = onSnapshot(debtsRef, (snapshot) => {
      const debtsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setDebts(debtsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `businesses/${business.id}/debts`);
    });

    return () => {
      unsubscribeSales();
      unsubscribeExpenses();
      unsubscribeInventory();
      unsubscribeDebts();
    };
  }, [business?.id]);

  // Calculate net balance reactively based on fetched sales and expenses
  useEffect(() => {
    const totalSales = sales.reduce((acc, sale) => acc + (sale.amount || 0), 0);
    const totalExpenses = expenses.reduce((acc, exp) => acc + (exp.amount || 0), 0);
    setNetBalance(totalSales - totalExpenses);
  }, [sales, expenses]);

  const createBusiness = async (name: string) => {
    if (!user) return;
    const businessId = `biz_${Date.now()}`;
    const bizData = {
      id: businessId,
      name,
      ownerId: user.uid,
      currency: 'KES',
      createdAt: serverTimestamp(),
    };
    
    // Create business
    await setDoc(doc(db, 'businesses', businessId), bizData);
    
    // Create root user mapping
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      businessId,
      role: 'owner',
      createdAt: serverTimestamp(),
    });

    // Create business employee entry
    await setDoc(doc(db, `businesses/${businessId}/users`, user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      businessId,
      role: 'owner',
      createdAt: serverTimestamp(),
    });
  };

  return (
    <BusinessContext.Provider value={{ 
      business, 
      loading, 
      createBusiness, 
      netBalance,
      sales,
      expenses,
      inventory,
      debts
    }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
}
