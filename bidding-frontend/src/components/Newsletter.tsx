'use client';

import { useState } from 'react';
import styles from './Newsletter.module.css';
import { Send } from 'lucide-react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      try {
        const res = await fetch('http://localhost:3000/contact/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        if (res.ok) {
          setSubscribed(true);
          setEmail('');
        }
      } catch (err) {
        console.error('Subscription error:', err);
      }
    }
  };

  return (
    <section className={styles.newsletterSection}>
      <div className={styles.container}>
        <div className={styles.content}>
          <h2 className={styles.title}>Subscribe to our Newsletter</h2>
          <p className={styles.subtitle}>Get the latest updates on new car auctions and exclusive deals delivered straight to your inbox.</p>
        </div>
        
        {subscribed ? (
          <div className={styles.successMsg}>
            🎉 Thank you for subscribing! Check your email for a welcome message.
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubscribe}>
            <input 
              type="email" 
              className={styles.input} 
              placeholder="Enter your email address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
            <button type="submit" className={styles.subscribeBtn}>
              Subscribe <Send size={18} />
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
