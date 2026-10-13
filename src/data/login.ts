/**
 * Dataset for the Login screen — the way into the product.
 *
 * The view in `src/screens/Login.tsx` is a pure projection of this file: every
 * word on screen is read from here.
 *
 * ⚠ There is NO authentication behind this. The frontend has no backend and no
 *   auth layer, so the form checks nothing: Sign in goes through whatever the
 *   fields hold, empty included. Nothing is sent anywhere and no account is
 *   looked up. A real sign-in — and the validation and error copy that come
 *   with it — replaces `onSignIn` in the view.
 */

export interface LoginField {
  label: string
}

export interface LoginScreen {
  /** The product's name, shown beside the mark. */
  brand: string
  title: string
  subtitle: string
  fields: { email: LoginField; password: LoginField }
  showPassword: string
  submit: string
  /** The line under the form: a question, then the action that answers it. */
  signUp: { prompt: string; action: string }
  /** What the 3D model beside the form is, for anyone who cannot see it. */
  artLabel: string
}

export const login: LoginScreen = {
  brand: 'EMR Dental',
  title: 'Welcome back',
  subtitle: 'Your patients, charts and schedule, kept in one place.',
  fields: {
    email: { label: 'Email address' },
    password: { label: 'Password' },
  },
  showPassword: 'Show password',
  submit: 'Sign in',
  signUp: { prompt: 'Don’t have an account?', action: 'Sign up' },
  artLabel: '3D model of a full set of healthy teeth',
}
