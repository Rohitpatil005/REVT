import React, { createContext, useContext, useEffect, useState } from 'react'
import supabase from '../../utils/supabase'

type AuthContextType = {
  user: any | null
  session: any | null
  loading: boolean
  signInWithPassword: (email: string, password: string) => Promise<any>
  signUpWithPassword: (email: string, password: string) => Promise<any>
  signInWithMagicLink: (email: string) => Promise<any>
  signOut: () => Promise<any>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const SupabaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null)
  const [session, setSession] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // initialize session/user
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!mounted) return
      setSession(currentSession)
      setUser(currentSession?.user ?? null)
      setLoading(false)
    }).catch((err) => {
      // Silently fail if Supabase is not available or network error
      console.warn('Failed to get session:', err?.message)
      if (mounted) {
        setSession(null)
        setUser(null)
        setLoading(false)
      }
    })

    // subscribe to changes
    try {
      const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
        setSession(newSession)
        setUser(newSession?.user ?? null)
      })

      return () => {
        mounted = false
        listener?.subscription?.unsubscribe()
      }
    } catch (err) {
      console.warn('Failed to subscribe to auth changes:', err)
      return () => {
        mounted = false
      }
    }
  }, [])

  const signInWithPassword = (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password })

  const signUpWithPassword = (email: string, password: string) =>
    supabase.auth.signUp({ email, password })

  const signInWithMagicLink = (email: string) =>
    supabase.auth.signInWithOtp({ email })

  const signOut = () => supabase.auth.signOut()

  return (
    <AuthContext.Provider value={{ user, session, loading, signInWithPassword, signUpWithPassword, signInWithMagicLink, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuthContext = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within SupabaseAuthProvider')
  return ctx
}

export default SupabaseAuthProvider
