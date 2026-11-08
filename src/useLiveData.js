// ---------------- // parkiti-admin/useLiveData.js

import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, limit, where } from 'firebase/firestore';
import { db } from './firebase';

function useCollection(path, ...queryArgs) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = queryArgs.length ? query(collection(db, path), ...queryArgs) : collection(db, path);
    const unsub = onSnapshot(
      q,
      (snap) => {
        setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error(`Live listener failed for ${path}:`, err);
        setLoading(false);
      },
    );
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  return { rows, loading };
}

// driverLocations/{driverId}: { lat, lng, heading, status: "navigating" | "reservation" | "idle",
// reservationId, lotId, lotName, driverName, updatedAt }
// Written directly by the driver mobile app the moment navigation starts —
// covers BOTH free navigation and reservation navigation, unlike
// `reservations`, which only exists once a spot is actually reserved.
export function useDriverLocations() {
  return useCollection('driverLocations');
}

// parkingLots/{lotId}: { name, zone, latitude, longitude, capacity,
// available, occupied, reserved, isOnline, openTime, closeTime,
// ownerId, ownerName, pricing: { dayPrice, pricePerHour }, lastUpdated,
// status? ("active" | "suspended" — added by the owner console itself) }
export function useLots() {
  return useCollection('parkingLots');
}

// users where role == "guard": { name, email, phone, lotId, avatar,
// avatarId, createdAt }. No online/offline flag on the guard doc itself —
// we treat a guard as "online" if their assigned lot's isOnline is true.
export function useGuards() {
  return useCollection('users', where('role', '==', 'guard'));
}

// users where role == "driver": { name, email, phone, walletBalance,
// driverId, notifEmail, notifPush }. No live status/position here — that
// comes from their most recent reservation instead (see useReservations).
export function useDrivers() {
  return useCollection('users', where('role', '==', 'driver'));
}

// reservations/{id}: { driverId, driverName, lotId, lotName, guardId,
// amount, paymentMethod, status, duration, time, expiresAt, createdAt,
// ticketCode, estimatedArrival, and — once the driver app is updated —
// lat, lng, heading, locationUpdatedAt while en route.
// Pulling a generous window (300 most recent) so both the live map and
// the 14-day revenue chart can be computed from one listener.
export function useReservations() {
  return useCollection('reservations', orderBy('createdAt', 'desc'), limit(300));
}

// guardPresence/{guardId}: { lastSeen, lotId } — heartbeat written every
// ~60s while the guard app is in the foreground (see GuardDashboardContent).
export function useGuardPresence() {
  return useCollection('guardPresence');
}
