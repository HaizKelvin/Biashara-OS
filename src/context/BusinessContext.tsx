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
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [business, setBusiness] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [netBalance, setNetBalance] = useState(0);

  useEffect(() => {
    if (!user) {
      setBusiness(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    // 1. Get user profile to find businessId
    const userRef = doc(db, 'users', user.uid);
    const unsubscribeUser = onSnapshot(userRef, async (userDoc) => {
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.businessId) {
          const bizRef = doc(db, 'businesses', userData.businessId);
          const bizDoc = await getDoc(bizRef);
          if (bizDoc.exists()) {
            setBusiness(bizDoc.data());
          }
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

  // Real-time balance tracking
  useEffect(() => {
    if (!business?.id) {
      setNetBalance(0);
      return;
    }

    const salesRef = collection(db, `businesses/${business.id}/sales`);
    const expensesRef = collection(db, `businesses/${business.id}/expenses`);

    let currentSales = 0;
    let currentExpenses = 0;

    const unsubscribeSales = onSnapshot(salesRef, (snapshot) => {
      currentSales = snapshot.docs.reduce((acc, doc) => acc + (doc.data().amount || 0), 0);
      setNetBalance(currentSales - currentExpenses);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `businesses/${business.id}/sales`);
    });

    const unsubscribeExpenses = onSnapshot(expensesRef, (snapshot) => {
      currentExpenses = snapshot.docs.reduce((acc, doc) => acc + (doc.data().amount || 0), 0);
      setNetBalance(currentSales - currentExpenses);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `businesses/${business.id}/expenses`);
    });

    return () => {
      unsubscribeSales();
      unsubscribeExpenses();
    };
  }, [business?.id]);

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
    <BusinessContext.Provider value={{ business, loading, createBusiness, netBalance }}>
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
