
import { useCallback, useEffect, useRef } from 'react'

export function useCommitOnExit<T>(
  savedValue: T,
  commit: (next: T) => boolean | void,
  resetKey?: unknown,
) {

  const state = useRef({ key: resetKey, saved: savedValue, draft: savedValue, commit })


  const track = useCallback((next: T) => {
    state.current.draft = next
  }, [])

  const flush = useCallback(() => {
    const s = state.current
    if (Object.is(s.draft, s.saved)) return
    // `false` means the commit was rejected (e.g. an emptied title) — leave the
    // draft pending so a later valid edit still gets written.
    if (s.commit(s.draft) === false) return
    s.saved = s.draft
  }, [])


  useEffect(() => {
    if (state.current.key === resetKey) {
      state.current.commit = commit
      return
    }
    flush()
    state.current = { key: resetKey, saved: savedValue, draft: savedValue, commit }
  })

  useEffect(() => {

    const onHide = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', flush)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', flush)
      flush() 
    }
  }, [flush])

  return { track, flush }
}
