'use client';

import { useState } from 'react';
import Link from 'next/link';
import { EyeOff } from 'lucide-react';
import styles from '../Auth.module.css';
import api from '@/lib/api';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    
    if (!formData.email || !formData.password) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      const res = await api.post('/auth/login', {
        email: formData.email,
        password: formData.password,
      });
      console.log('Login successful', res.data);
      // Store token and user data
      if (res.data.access_token) {
        localStorage.setItem('token', res.data.access_token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setSuccess(true);
        // Redirect to profile or home
        setTimeout(() => {
          window.location.href = '/profile';
        }, 1500);
      }
    } catch (err: any) {
      console.error('Failed to log in', err);
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    }
  };

  return (
    <>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Login</h1>
        <p className={styles.pageSubtitle}>Lorem ipsum dolor sit amet consectetur. At in pretium semper vitae eu eu mus.</p>
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span className={styles.breadcrumbSpan}>{'>'}</span>
          <span>Login</span>
        </div>
      </div>

      <div className={styles.contentWrapper}>
        <div className={styles.toggleSwitch}>
          <Link href="/register" className={styles.toggleBtn}>Register</Link>
          <Link href="/login" className={`${styles.toggleBtn} ${styles.active}`}>Login</Link>
        </div>

        <div className={styles.authCard}>
          <h2 className={styles.cardTitle}>Log In</h2>
          <p className={styles.cardSubtitle}>
            New member? <Link href="/register">Register Here</Link>
          </p>

          <form onSubmit={handleSubmit}>
            {error && <div style={{ color: '#dc2626', backgroundColor: '#fef2f2', padding: '10px', borderRadius: '5px', marginBottom: '15px', fontSize: '14px' }}>{error}</div>}
            {success && <div style={{ color: '#16a34a', backgroundColor: '#f0fdf4', padding: '10px', borderRadius: '5px', marginBottom: '15px', fontSize: '14px' }}>Login successful! Redirecting...</div>}
            <div className={styles.formGroup}>
              <label>Enter Your Email<span>*</span></label>
              <input type="email" className={styles.inputControl} value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
            </div>

            <div className={styles.formGroup}>
              <label>Password<span>*</span></label>
              <div style={{position: 'relative'}}>
                <input type="password" className={styles.inputControl} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
                <EyeOff size={16} color="#9ca3af" style={{position: 'absolute', right: '14px', top: '12px', cursor: 'pointer'}} />
              </div>
            </div>

            <div className={styles.flexBetween}>
              <div className={styles.checkboxGroup} style={{marginBottom: 0}}>
                <input type="checkbox" id="remember" />
                <label htmlFor="remember">Remember me</label>
              </div>
              <a href="#" className={styles.forgotLink}>Forgot Password</a>
            </div>

            <button type="submit" className={styles.submitBtn}>Log in</button>

            <div className={styles.socialDivider}>Or Register With</div>
            <div className={styles.socialBtns}>
              <button type="button" className={styles.socialBtn}>
                 <img src="/assets/Group 34336.png" alt="Google" width="24"/>
              </button>
              <button type="button" className={styles.socialBtn}>
                 <img src="/assets/Group 34337.png" alt="Facebook" width="18"/>
              </button>
              <button type="button" className={styles.socialBtn}>
                 <img src="/assets/Group 34338.png" alt="Twitter" width="24"/>
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
