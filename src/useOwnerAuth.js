import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';

/**
 * Gates the entire admin console. Being logged into Firebase Auth is NOT
 * enough on its own — we also check that the signed-in user's own doc at
 * users/{uid} has role === "owner". The Firestore rules re-check the exact
 * same thing server-side (see firestore-rules-addition.txt) — that check,
 * not this hook, is what actually protects the data. This hook only
 * decides what the UI shows.
 */
export function useOwnerAuth() {
  const [status, setStatus] = useState('checking'); // checking | signed-out | forbidden | owner
  const [user, setUser] = useState(null);

  useEffect(() => {
    let unsubDoc = null;

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (unsubDoc) {
        unsubDoc();
        unsubDoc = null;
      }

      if (!firebaseUser) {
        setUser(null);
        setStatus('signed-out');
        return;
      }

      setUser(firebaseUser);
      unsubDoc = onSnapshot(
        doc(db, 'users', firebaseUser.uid),
        (snap) => {
          const role = snap.exists() ? snap.data().role : null;
          setStatus(role === 'owner' ? 'owner' : 'forbidden');
        },
        () => setStatus('forbidden'),
      );
    });

    return () => {
      unsubAuth();
      if (unsubDoc) unsubDoc();
    };
  }, []);

  return { status, user };
}
