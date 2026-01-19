'use client';

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth } from './firebase';
import { userService } from './firestore-service';

if (!auth) {
  throw new Error('Firebase Auth is not initialized. Please check your Firebase configuration.');
}

// Auth state management
export function getCurrentUser(): Promise<User | null> {
  return new Promise((resolve) => {
    if (!auth) {
      resolve(null);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

// Email/Password authentication
export async function signIn(email: string, password: string) {
  if (!auth) throw new Error('Auth not initialized');
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signUp(email: string, password: string, displayName: string) {
  if (!auth) throw new Error('Auth not initialized');
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  
  // Update display name
  if (userCredential.user) {
    await updateProfile(userCredential.user, { displayName });
    
    // Create user profile in Firestore
    try {
      await userService.createUser(userCredential.user.uid, {
        email,
        name: displayName,
        role: 'attendee',
        interests: [],
      });
    } catch (error) {
      console.error('Error creating user profile:', error);
      // Don't throw - auth succeeded even if profile creation failed
    }
  }
  
  return userCredential;
}

export async function logOut() {
  if (!auth) throw new Error('Auth not initialized');
  return signOut(auth);
}

// Google OAuth
export async function signInWithGoogle() {
  if (!auth) throw new Error('Auth not initialized');
  const provider = new GoogleAuthProvider();
  const userCredential = await signInWithPopup(auth, provider);
  
  // Create or update user profile in Firestore
  if (userCredential.user) {
    const user = userCredential.user;
    try {
      const existingUser = await userService.getUser(user.uid);
      if (!existingUser) {
        await userService.createUser(user.uid, {
          email: user.email || '',
          name: user.displayName || 'User',
          avatar: user.photoURL || undefined,
          role: 'attendee',
          interests: [],
        });
      } else if (user.photoURL && !existingUser.avatar) {
        // Update avatar if not set
        await userService.updateUser(user.uid, { avatar: user.photoURL });
      }
    } catch (error) {
      console.error('Error syncing user profile:', error);
    }
  }
  
  return userCredential;
}

// Password reset
export async function resetPassword(email: string) {
  if (!auth) throw new Error('Auth not initialized');
  return sendPasswordResetEmail(auth, email);
}

// Auth state observer hook helper
export function onAuthChange(callback: (user: User | null) => void) {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, callback);
}
