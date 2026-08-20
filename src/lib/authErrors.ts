
import { FirebaseError } from 'firebase/app'

export class WorkspaceClaimError extends Error {
  constructor() {
    super('Failed to set workspace claims')
    this.name = 'WorkspaceClaimError'
  }
}

const MESSAGES: Record<string, string> = {
  'auth/email-already-in-use': 'That email already has an account — log in instead.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/user-not-found': 'No account found for that email.',
  'auth/invalid-email': 'That email address isn\'t valid.',
  'auth/weak-password': 'Password is too weak — use at least 6 characters.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/too-many-requests': 'Too many attempts. Wait a moment and try again.',
  'auth/network-request-failed': 'Network error — check your connection and try again.',
  'auth/operation-not-allowed': 'Email sign-in is turned off for this project.',
}

export function authErrorMessage(error: unknown): string {
  if (error instanceof WorkspaceClaimError) {
    return 'Account created, but setup didn\'t finish. Log in to complete it.'
  }
  if (error instanceof FirebaseError && MESSAGES[error.code]) {
    return MESSAGES[error.code]
  }
  // Unmapped: keep the real error reachable, prod has no other trace of it.
  console.error('[auth]', error)
  return 'Something went wrong. Please try again.'
}
