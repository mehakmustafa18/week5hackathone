'use client';

import { useState } from 'react';
import Link from 'next/link';
import { EyeOff } from 'lucide-react';
import styles from '../Auth.module.css';
import api from '@/lib/api';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    try {
      // Wiring to Nest.js Backend '/auth/register' endpoint
      const res = await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        username: formData.username,
        password: formData.password,
      });
      console.log('Registration successful', res.data);
      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } catch (err: any) {
      console.error('Failed to register', err);
      setError(err.response?.data?.message || 'Registration failed. Please check your data.');
    }
  };

  return (
    <>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Register</h1>
        <p className={styles.pageSubtitle}>Lorem ipsum dolor sit amet consectetur. At in pretium semper vitae eu eu mus.</p>
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span className={styles.breadcrumbSpan}>{'>'}</span>
          <span>Register</span>
        </div>
      </div>

      <div className={styles.contentWrapper}>
        <div className={styles.toggleSwitch}>
          <Link href="/register" className={`${styles.toggleBtn} ${styles.active}`}>Register</Link>
          <Link href="/login" className={styles.toggleBtn}>Login</Link>
        </div>

        <div className={styles.authCard}>
          <h2 className={styles.cardTitle}>Register</h2>
          <p className={styles.cardSubtitle}>
            Do you already have an account? <Link href="/login">Login Here</Link>
          </p>

          <form onSubmit={handleSubmit}>
            {error && <div style={{ color: '#dc2626', backgroundColor: '#fef2f2', padding: '10px', borderRadius: '5px', marginBottom: '15px', fontSize: '14px' }}>{error}</div>}
            {success && <div style={{ color: '#16a34a', backgroundColor: '#f0fdf4', padding: '10px', borderRadius: '5px', marginBottom: '15px', fontSize: '14px' }}>Registration successful! Redirecting to login...</div>}
            <div className={styles.sectionTitle}>Personal Information</div>
            <div className={styles.formGroup}>
              <label>Enter Your Full Name<span>*</span></label>
              <input type="text" className={styles.inputControl} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formGroup} style={{marginBottom: 0}}>
                <label>Enter Your Email<span>*</span></label>
                <input type="email" className={styles.inputControl} value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
              </div>
              <div className={styles.formGroup} style={{marginBottom: 0}}>
                <label>Enter Mobile Number<span>*</span></label>
                <div className={styles.phoneInputGroup}>
                  <select className={styles.countryCode}>
                    <option>India (+91)</option>
                    <option>US (+1)</option>
                  </select>
                  <input type="tel" className={styles.phoneInput} value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>
            </div>

            <div className={styles.sectionTitle} style={{marginTop: '10px'}}>Account Information</div>
            <div className={styles.formGroup}>
              <label>Username<span>*</span></label>
              <input type="text" className={styles.inputControl} value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} />
              <div style={{textAlign: 'right', marginTop: '4px'}}>
                <a href="#" style={{fontSize: '10px', color: '#3b4b89', textDecoration: 'underline'}}>Check Availability</a>
              </div>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formGroup} style={{marginBottom: 0}}>
                <label>Password<span>*</span></label>
                <input type="password" className={styles.inputControl} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
              </div>
              <div className={styles.formGroup} style={{marginBottom: 0}}>
                <label>Confirm Password<span>*</span></label>
                <input type="password" className={styles.inputControl} value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} required />
              </div>
            </div>

            <div className={styles.sectionTitle} style={{marginTop: '20px'}}>Prove You Are Human</div>
            <div className={styles.captchaBox}>
              <input type="checkbox" style={{width: '24px', height: '24px'}} />
              <span style={{fontSize: '14px', color: '#4b5563'}}>I'm not a robot</span>
            </div>

            <div className={styles.checkboxGroup}>
              <input type="checkbox" id="terms" />
              <label htmlFor="terms">I agree to the Terms & Conditions.</label>
            </div>

            <button type="submit" className={styles.submitBtn}>Create Account</button>

            <div className={styles.socialDivider}>Or Login With</div>
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
