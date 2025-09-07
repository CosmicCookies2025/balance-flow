import { loadStripe } from '@stripe/stripe-js';

// Make Stripe loading more defensive to prevent white screen
export const stripePromise = (() => {
  try {
    const publicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
    if (!publicKey) {
      console.warn('Missing VITE_STRIPE_PUBLIC_KEY - Stripe features will be disabled');
      return null;
    }
    return loadStripe(publicKey);
  } catch (error) {
    console.error('Failed to load Stripe:', error);
    return null;
  }
})();
