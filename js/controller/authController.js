import { getCurrentUser, signIn, signOut, signUp } from '../model/auth.js';

export function initializeAuth(onSignOut = signOut) {
  document.querySelectorAll('[data-logout]').forEach((button) => {
    button.addEventListener('click', () => {
      try {
        onSignOut();
        window.location.assign('login.html');
      } catch (error) {
        window.alert(error.message);
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
  let mode = 'signin';

  if (getCurrentUser()) window.location.replace('index.html');

  const setMode = (nextMode) => {
    mode = nextMode;
    const isSignup = mode === 'signup';
    nameInput.hidden = !isSignup;
    nameLabel.hidden = !isSignup;
    nameInput.required = isSignup;
    passwordInput.autocomplete = isSignup ? 'new-password' : 'current-password';
    heading.textContent = isSignup ? 'Create your account' : 'Welcome back';
    subtitle.textContent = isSignup ? 'A fresh start, one session at a time.' : 'Sign in to pick up where you left off.';
    submit.innerHTML = isSignup ? 'Create account <span>→</span>' : 'Sign in <span>→</span>';
    message.textContent = '';
    message.classList.remove('error');
    document.querySelectorAll('[data-auth-mode]').forEach((tab) => {
      const active = tab.dataset.authMode === mode;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
    });
  };

  document.querySelectorAll('[data-auth-mode]').forEach((tab) => tab.addEventListener('click', () => setMode(tab.dataset.authMode)));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    message.textContent = '';
    message.classList.remove('error');
    const values = new FormData(form);
    try {
      if (mode === 'signup') signUp(String(values.get('name')), String(values.get('email')), String(values.get('password')));
      else signIn(String(values.get('email')), String(values.get('password')));
      window.location.assign('index.html');
    } catch (error) {
      message.textContent = error.message;
      message.classList.add('error');
    }
  });
}