import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from '../../utils/firebase'

type AuthContextType = {
  user: User | null
  session: { user: User } | null
  loading: boolean
  signInWithPassword: (email: string, password: string) => Promise<any>
  signUpWithPassword: (email: string, password: string) => Promise<any>
  signInWithMagicLink: (email: string) => Promise<any>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const FirebaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<{ user: User } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!mounted) return
      setUser(currentUser)
      setSession(currentUser ? { user: currentUser } : null)
      setLoading(false)
    }, (error) => {
      console.warn('Auth state change error:', error?.message)
      if (mounted) {
        setUser(null)
        setSession(null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  const signInWithPassword = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      return { data: { user: result.user }, error: null }
    } catch (error: any) {
      return { data: null, error }
    }
  }

  const signUpWithPassword = async (email: string, password: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      return { data: { user: result.user }, error: null }
    } catch (error: any) {
      return { data: null, error }
    }
  }

  const signInWithMagicLink = async (email: string) => {
    // Firebase doesn't have built-in OTP/magic link for web
    // For now, return an error message suggesting password sign-in
    return {
      data: null,
      error: new Error('Magic link not available. Please use email/password authentication.'),
    }
  }

  const signOut = () => firebaseSignOut(auth)

  return (
    <AuthContext.Provider value={{ user, session, loading, signInWithPassword, signUpWithPassword, signInWithMagicLink, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuthContext = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within FirebaseAuthProvider')
  return ctx
}

export default FirebaseAuthProvider
