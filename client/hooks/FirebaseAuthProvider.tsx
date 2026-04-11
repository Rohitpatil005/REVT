import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from '../../utils/firebase'
import {
  cacheAuthUser,
  getCachedAuthUser,
  clearAuthCache
} from '@/lib/offlineStorage'

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
    let timeoutId: NodeJS.Timeout | null = null

    // Set a timeout to prevent infinite loading if Firebase is slow/unavailable
    timeoutId = setTimeout(() => {
      if (mounted) {
        console.warn('[FirebaseAuthProvider] Firebase initialization timeout (5s) - showing login screen')
        // Try to use cached user as fallback
        const cachedUser = getCachedAuthUser()
        if (cachedUser) {
          console.log('[FirebaseAuthProvider] Using cached user due to timeout')
          setUser(cachedUser)
          setSession({ user: cachedUser })
        }
        setLoading(false)
      }
    }, 5000)

    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!mounted) return
      if (timeoutId) clearTimeout(timeoutId)
      setUser(currentUser)
      setSession(currentUser ? { user: currentUser } : null)
      // Cache the authenticated user
      if (currentUser) {
        cacheAuthUser(currentUser)
      }
      setLoading(false)
    }, (error) => {
      console.warn('Auth state change error:', error?.message)
      if (timeoutId) clearTimeout(timeoutId)
      if (mounted) {
        // Try to use cached user as fallback
        const cachedUser = getCachedAuthUser()
        if (cachedUser) {
          console.log('[FirebaseAuthProvider] Using cached user due to auth error')
          setUser(cachedUser)
          setSession({ user: cachedUser })
        } else {
          setUser(null)
          setSession(null)
        }
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      if (timeoutId) clearTimeout(timeoutId)
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

  const signOut = async () => {
    clearAuthCache()
    return firebaseSignOut(auth)
  }

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
