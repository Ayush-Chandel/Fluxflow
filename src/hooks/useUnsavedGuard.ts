
import { useCallback, useEffect, useRef } from 'react'
import { useBlocker, type BlockerFunction } from 'react-router'

export function useUnsavedGuard(isDirty: boolean) {

  const dirtyRef = useRef(isDirty)
  useEffect(() => {
    dirtyRef.current = isDirty
  }, [isDirty])

  const shouldBlock = useCallback<BlockerFunction>(
    ({ currentLocation, nextLocation }) =>
      dirtyRef.current && currentLocation.pathname !== nextLocation.pathname,
    [],
  )

  const blocker = useBlocker(shouldBlock)

  return {
    open: blocker.state === 'blocked',
    confirm: () => blocker.proceed?.(),
    cancel: () => blocker.reset?.(),
    release: () => {
      dirtyRef.current = false
    },
  }
}
