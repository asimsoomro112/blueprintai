"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase/client";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: any;
  updatedAt: any;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isDemo: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserDisplayName: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setIsDemo(true);
      const cached = localStorage.getItem("blueprint_demo_user");
      if (cached) {
        try {
          setUser(JSON.parse(cached));
        } catch {
          setUser(null);
        }
      }
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);
        let profile: UserProfile;

        try {
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            profile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: data.displayName || firebaseUser.displayName,
              photoURL: data.photoURL || firebaseUser.photoURL,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
            };
          } else {
            const newProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
              photoURL: firebaseUser.photoURL,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };
            await setDoc(userRef, newProfile);
            profile = {
              ...newProfile,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
          }
          setUser(profile);
        } catch (err) {
          console.error("Error loading user profile doc:", err);
          // Fallback to local profile object if firestore read errors
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
            photoURL: firebaseUser.photoURL,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    if (isDemo) {
      const mockProfile: UserProfile = {
        uid: "demo-user-123",
        email: email,
        displayName: email.split("@")[0],
        photoURL: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      localStorage.setItem("blueprint_demo_user", JSON.stringify(mockProfile));
      setUser(mockProfile);
      return;
    }
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (email: string, password: string, name: string) => {
    if (isDemo) {
      const mockProfile: UserProfile = {
        uid: "demo-user-123",
        email: email,
        displayName: name,
        photoURL: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      localStorage.setItem("blueprint_demo_user", JSON.stringify(mockProfile));
      setUser(mockProfile);
      return;
    }
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    const userRef = doc(db, "users", cred.user.uid);
    await setDoc(userRef, {
      uid: cred.user.uid,
      email: cred.user.email,
      displayName: name,
      photoURL: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  const loginWithGoogle = async () => {
    if (isDemo) {
      const mockProfile: UserProfile = {
        uid: "demo-user-123",
        email: "demo.student@university.edu",
        displayName: "Demo Student",
        photoURL: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      localStorage.setItem("blueprint_demo_user", JSON.stringify(mockProfile));
      setUser(mockProfile);
      return;
    }
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    if (isDemo) {
      localStorage.removeItem("blueprint_demo_user");
      setUser(null);
      return;
    }
    await signOut(auth);
  };

  const updateUserDisplayName = async (name: string) => {
    if (!user) return;
    if (isDemo) {
      const updated = { ...user, displayName: name, updatedAt: new Date() };
      localStorage.setItem("blueprint_demo_user", JSON.stringify(updated));
      setUser(updated);
      return;
    }
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName: name });
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, { displayName: name, updatedAt: serverTimestamp() }, { merge: true });
      setUser(prev => prev ? { ...prev, displayName: name } : null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isDemo,
        login,
        signup,
        loginWithGoogle,
        logout,
        updateUserDisplayName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
