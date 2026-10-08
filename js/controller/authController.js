import { getCurrentUser, sendPasswordReset, signIn, signOut, signUp, updatePassword } from '../model/auth.js';

export function initializeAuth(onSignOut = signOut) {
  document.querySelectorAll('[data-logout]').forEach((button) => {
    button.addEventListener('click', async () => {
      button.disabled = true;
      try {
        await onSignOut();
        window.location.assign('login.html');
      } catch (error) {
        button.disabled = false;
        const message = document.createElement('p');
        message.className = 'app-error';
        message.setAttribute('role', 'alert');
        message.textContent = error.message;
        document.querySelector('.main-content')?.prepend(message);
      }
    });
  });
}

if (document.querySelector('[data-auth-form]')) {
  const form = document.querySelector('[data-auth-form]');
  const message = document.querySelector('[data-auth-message]');
  const nameInput = document.querySelector('#auth-name');
  const nameLabel = document.querySelector('[data-name-label]');
  const passwordInput = document.querySelector('#auth-password');
  const heading = document.querySelector('[data-auth-heading]');
  const subtitle = document.querySelector('[data-auth-subtitle]');
  const submit = document.querySelector('[data-auth-submit]');
  const forgotPassword = document.querySelector('[data-forgot-password]');
  const tabs = [...document.querySelectorAll('[data-auth-mode]')];
  const recoveryMode = new URLSearchParams(window.location.search).get('recovery') === '1';
  let mode = recoveryMode ? 'update' : 'signin';

  function setMode(nextMode) {
    mode = nextMode;
    const isSignup = mode === 'signup';
    const isReset = mode === 'recovery';
    const isUpdate = mode === 'update';
    nameInput.hidden = !isSignup;
    nameLabel.hidden = !isSignup;
    nameInput.required = isSignup;
    passwordInput.hidden = isReset;
    document.querySelector('[data-password-label]').hidden = isReset;
    passwordInput.required = !isReset;
    passwordInput.autocomplete = isSignup || isUpdate ? 'new-password' : 'current-password';
    passwordInput.placeholder = isUpdate ? 'Choose a new password' : 'At least 8 characters';
    heading.textContent = isSignup ? 'Create your account' : isReset ? 'Reset your password' : isUpdate ? 'Choose a new password' : 'Welcome back';
    subtitle.textContent = isSignup
      ? 'A fresh start, one session at a time.'
      : isReset
        ? 'We’ll email you a secure password reset link.'
        : isUpdate
          ? 'Choose a new password for your account.'
          : 'Sign in to pick up where you left off.';
    submit.innerHTML = isSignup ? 'Create account <span>→</span>' : isReset ? 'Send reset link <span>→</span>' : isUpdate ? 'Save new password <span>→</span>' : 'Sign in <span>→</span>';
    forgotPassword.hidden = mode !== 'signin';
    tabs.forEach((tab) => {
      const active = tab.dataset.authMode === mode;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.closest('[role="tablist"]').hidden = isReset || isUpdate;
    });
    message.textContent = '';
    message.classList.remove('error');
  }

  setMode(mode);
  Promise.resolve().then(async () => {
    if (!recoveryMode && await getCurrentUser()) window.location.replace('index.html');
  }).catch((error) => {
    message.textContent = error.message;
    message.classList.add('error');
  });

  tabs.forEach((tab) => tab.addEventListener('click', () => setMode(tab.dataset.authMode)));
  forgotPassword.addEventListener('click', () => setMode('recovery'));
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    message.textContent = '';
    message.classList.remove('error');
    const values = new FormData(form);
    submit.disabled = true;
    const originalLabel = submit.textContent;
    submit.textContent = 'Please wait…';
    try {
      if (mode === 'signup') {
        const result = await signUp(String(values.get('name')), String(values.get('email')), String(values.get('password')));
        if (result.needsEmailConfirmation) {
          message.textContent = 'Account created. Check your email to confirm your address, then sign in.';
          form.reset();
          setMode('signin');
          message.textContent = 'Account created. Check your email to confirm your address, then sign in.';
          return;
        }
        window.location.assign('index.html');
      } else if (mode === 'recovery') {
        await sendPasswordReset(String(values.get('email')));
        message.textContent = 'If an account exists for that address, a password reset link is on its way.';
      } else if (mode === 'update') {
        await updatePassword(String(values.get('password')));
        window.history.replaceState({}, '', 'login.html');
        setMode('signin');
        message.textContent = 'Password updated. You can now sign in with your new password.';
      } else {
        await signIn(String(values.get('email')), String(values.get('password')));
        window.location.assign('index.html');
      }
    } catch (error) {
      message.textContent = error.message;
      message.classList.add('error');
    } finally {
      submit.disabled = false;
      if (submit.textContent === 'Please wait…') submit.textContent = originalLabel;
    }
  });
}
