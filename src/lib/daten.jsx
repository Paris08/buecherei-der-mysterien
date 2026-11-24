import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase'

const Ctx = createContext(null)

export function DatenProvider({ children }) {
  const [akten, setAkten] = useState([])
  const [ueberakten, setUeberakten] = useState([])
  const [laedt, setLaedt] = useState(true)
  const [fehler, setFehler] = useState(null)
  const [session, setSession] = useState(null)
  const [istAdmin, setIstAdmin] = useState(false)

  const neuLaden = useCallback(async () => {
    const [a, u] = await Promise.all([
      supabase.from('akten').select('*').order('nummer'),
      supabase.from('ueberakten').select('*').order('titel'),
    ])
    if (a.error || u.error) setFehler((a.error || u.error).message)
    else {
      setFehler(null)
      setAkten(a.data)
      setUeberakten(u.data)
    }
    setLaedt(false)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    let aktiv = true
    async function pruefen() {
      if (!session) { setIstAdmin(false); return }
      const { data } = await supabase.from('profiles').select('is_admin').eq('id', session.user.id).maybeSingle()
      if (aktiv) setIstAdmin(!!data?.is_admin)
    }
    pruefen()
    neuLaden()
    return () => { aktiv = false }
  }, [session, neuLaden])

  const wert = useMemo(() => {
    const ueberById = Object.fromEntries(ueberakten.map((u) => [u.id, u]))
    return {
      akten, ueberakten, ueberById, laedt, fehler, session, istAdmin, neuLaden,
      aktePerSlug: (slug) => akten.find((a) => a.slug === slug),
    }
  }, [akten, ueberakten, laedt, fehler, session, istAdmin, neuLaden])

  return <Ctx.Provider value={wert}>{children}</Ctx.Provider>
}

export const useDaten = () => useContext(Ctx)
