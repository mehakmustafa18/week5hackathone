'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin, Send } from 'lucide-react';
import styles from './Contact.module.css';
import api from '@/lib/api';
import Newsletter from '@/components/Newsletter';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      // We will implement this endpoint in the backend
      await api.post('/contact', formData);
      setStatus({ type: 'success', msg: 'Thank you! Your message has been sent successfully. We will get back to you soon.' });
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error: any) {
      console.error('Error sending message:', error);
      setStatus({ type: 'error', msg: error.response?.data?.message || 'Something went wrong. Please try again later.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.contactContainer}>
      <section className={styles.heroSection}>
        <h1 className={styles.heroTitle}>Contact Us</h1>
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span>{'>'}</span>
          <span>Contact</span>
        </div>
      </section>

      <main className={styles.mainSection}>
        <div className={styles.grid2Col}>
          <div className={styles.infoCol}>
            <div>
              <h2 className={styles.infoTitle} style={{ fontSize: '32px', marginBottom: '20px' }}>Get In Touch</h2>
              <p className={styles.infoText}>Have questions or need assistance? Our team is here to help you. Reach out to us through any of the following channels.</p>
            </div>

            <div className={styles.infoItem}>
              <div className={styles.iconCircle}><Phone size={24} /></div>
              <div>
                <h3 className={styles.infoTitle}>Call Us</h3>
                <p className={styles.infoText}>+1 (570) 694-4002</p>
                <p className={styles.infoText}>Monday - Friday: 9am - 6pm</p>
              </div>
            </div>

            <div className={styles.infoItem}>
              <div className={styles.iconCircle}><Mail size={24} /></div>
              <div>
                <h3 className={styles.infoTitle}>Email Us</h3>
                <p className={styles.infoText}>info@cardeposit.com</p>
                <p className={styles.infoText}>support@cardeposit.com</p>
              </div>
            </div>

            <div className={styles.infoItem}>
              <div className={styles.iconCircle}><MapPin size={24} /></div>
              <div>
                <h3 className={styles.infoTitle}>Visit Us</h3>
                <p className={styles.infoText}>123 Auction Avenue, Auto City</p>
                <p className={styles.infoText}>New York, NY 10001, USA</p>
              </div>
            </div>
          </div>

          <div className={styles.formCard}>
            <h2 className={styles.formTitle}>Send Us a Message</h2>
            {status && (
              <div className={status.type === 'success' ? styles.successMsg : styles.errorMsg}>
                {status.msg}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Your Name</label>
                  <input 
                    type="text" 
                    placeholder="Enter your name" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required 
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    placeholder="Enter your email" 
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required 
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Subject</label>
                <input 
                  type="text" 
                  placeholder="How can we help?" 
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required 
                />
              </div>
              <div className={styles.formGroup}>
                <label>Message</label>
                <textarea 
                  rows={5} 
                  placeholder="Your message here..." 
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                ></textarea>
              </div>
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </main>
      <Newsletter />
    </div>
  );
}
