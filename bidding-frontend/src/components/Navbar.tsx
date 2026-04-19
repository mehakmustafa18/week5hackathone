'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Phone, Mail, Star, Bell, ChevronDown, Menu, X, Car, User, LogOut } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import styles from './Navbar.module.css';
import { useSocket } from '@/hooks/useSocket';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [carOpen, setCarOpen] = useState(false);
  
  const [user, setUser] = useState<any>(null);
  const { notifications, markAllSeen, clearAll } = useSocket();
  const pathname = usePathname();
  const router = useRouter();

  // Close other dropdowns when one opens
  const toggleBell = () => {
    setBellOpen(!bellOpen);
    setCarOpen(false);
    setProfileOpen(false);
  };

  const toggleCar = () => {
    setCarOpen(!carOpen);
    setBellOpen(false);
    setProfileOpen(false);
  };

  const toggleProfile = () => {
    setProfileOpen(!profileOpen);
    setBellOpen(false);
    setCarOpen(false);
  };

  useEffect(() => {
    // Check for user in localStorage on mount and when pathname changes (after login)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setProfileOpen(false);
    router.push('/login');
  };

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/auctions', label: 'Car Auction' },
    { href: '/sell', label: 'Sell Your Car' },
    { href: '/about', label: 'About us' },
    { href: '/contact', label: 'Contact' },
  ];

  const bellNotifs = notifications.filter(n => n.type !== 'NEW_CAR' && !n.seen);
  const carNotifs = notifications.filter(n => n.type === 'NEW_CAR' && !n.seen);
  
  const allBellNotifs = notifications.filter(n => n.type !== 'NEW_CAR');
  const allCarNotifs = notifications.filter(n => n.type === 'NEW_CAR');

  return (
    <header className={styles.header}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <div className={styles.topBarInner}>
          <div className={styles.contactInfo}>
            <Phone size={13} />
            <span>Call Us : 570-694-4002</span>
          </div>
          <div className={styles.emailInfo}>
            <Mail size={13} />
            <span>Email Id : info@cardeposit.com</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className={styles.mainNav}>
        <div className={styles.mainNavInner}>
          {/* Logo */}
          <Link href="/" className={styles.logoArea}>
            <img src="/assets/car logo.png" alt="Car Deposit Logo" style={{ height: '40px' }} />
          </Link>

          {/* Desktop Nav Links */}
          <ul className={styles.navLinks}>
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`${styles.navLink} ${pathname === link.href ? styles.activeLink : ''}`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Right Icons + Buttons */}
          <div className={styles.rightActions}>
            <div className={styles.iconGrp}>
              <Star size={18} className={styles.iconBtn} />
              
              {/* Bell — All Notifications (bids, auction win/lost/ended, payment, status) */}
              <div className={styles.notifContainer}>
                <div className={styles.iconWrapper} onClick={toggleBell}>
                  <Bell size={18} className={styles.iconBtn} />
                  {bellNotifs.length > 0 && <span className={styles.badge}>{bellNotifs.length}</span>}
                </div>
                {bellOpen && (
                  <div className={styles.notifDropdown}>
                    <div className={styles.dropdownHeader}>
                      <span>Notifications</span>
                      <button onClick={() => markAllSeen()} className={styles.clearBtn}>Mark Read</button>
                    </div>
                    <div className={styles.notifList}>
                      {allBellNotifs.length === 0 ? <p className={styles.emptyText}>No notifications</p> : 
                        allBellNotifs.map((n: any) => (
                          <div key={n.id} className={`${styles.notifItem} ${!n.seen ? styles.unseen : ''}`}>
                            <div className={styles.notifPoint} style={{
                              backgroundColor: n.type === 'AUCTION_WIN' ? '#16a34a' : 
                                n.type === 'AUCTION_LOST' ? '#dc2626' : 
                                n.type === 'AUCTION_ENDED' ? '#7c3aed' :
                                n.type === 'PAYMENT_COMPLETE' ? '#059669' :
                                n.type === 'PAYMENT_REQUIRED' ? '#d97706' :
                                n.type === 'BID_LOST' ? '#ef4444' :
                                n.type?.startsWith('STATUS_UPDATE_SHIPPED') ? '#2563eb' :
                                n.type?.startsWith('STATUS_UPDATE_DELIVERED') ? '#22c55e' :
                                n.type?.startsWith('STATUS_UPDATE_') ? '#0284c7' : '#3b4b89'
                            }}></div>
                            <p>{n.message}</p>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>

              {/* Car/Listings Notification Dropdown */}
              <div className={styles.notifContainer}>
                <div className={styles.iconWrapper} onClick={toggleCar}>
                  <div className={styles.iconBtn}>
                    <Car size={18} />
                    <ChevronDown size={14} />
                  </div>
                  {carNotifs.length > 0 && <span className={styles.badge} style={{backgroundColor: '#16a34a'}}>{carNotifs.length}</span>}
                </div>
                {carOpen && (
                  <div className={styles.notifDropdown}>
                    <div className={styles.dropdownHeader}>
                      <span>New Listings</span>
                      <button onClick={() => markAllSeen('NEW_CAR')} className={styles.clearBtn}>Mark Read</button>
                    </div>
                    <div className={styles.notifList}>
                      {allCarNotifs.length === 0 ? <p className={styles.emptyText}>No new listings</p> : 
                        allCarNotifs.map((n: any) => (
                          <div key={n.id} className={`${styles.notifItem} ${!n.seen ? styles.unseen : ''}`}>
                            <div className={styles.notifPoint} style={{backgroundColor: '#16a34a'}}></div>
                            <p>{n.message}</p>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>
            </div>

            {user ? (
              <div className={styles.profileContainer}>
                <button 
                  className={styles.profileBtn}
                  onClick={toggleProfile}
                >
                  <div className={styles.avatarCircle}>
                    <User size={20} />
                  </div>
                  <ChevronDown size={14} />
                </button>

                {profileOpen && (
                  <div className={styles.dropdownMenu}>
                    <div className={styles.userInfo}>
                      <p className={styles.userName}>{user.name || user.username}</p>
                      <p className={styles.userEmail}>{user.email}</p>
                    </div>
                    <hr className={styles.divider} />
                    <Link href="/profile" className={styles.dropdownItem} onClick={() => setProfileOpen(false)}>
                      <User size={16} />
                      <span>My Profile</span>
                    </Link>
                    <button className={styles.dropdownItem} onClick={handleLogout}>
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.authActions}>
                <Link href="/login" className={styles.signInBtn}>
                  Sign in
                </Link>
                <span style={{color: '#6b7280', fontSize: '13px'}}>or</span>
                <Link href="/register" className={styles.registerBtn}>
                  Register now
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className={styles.mobileToggle}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`${styles.mobileMenu} ${mobileOpen ? styles.open : ''}`}>
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={styles.navLink}
            onClick={() => setMobileOpen(false)}
          >
            {link.label}
          </Link>
        ))}
        {user ? (
          <>
            <div className={styles.mobileUserInfo}>
               <p>{user.name || user.username}</p>
               <p style={{fontSize: '12px', color: '#94a3b8'}}>{user.email}</p>
            </div>
            <button className={styles.registerBtn} onClick={handleLogout} style={{width: 'auto', alignSelf: 'center'}}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className={styles.signInBtn} style={{textAlign: 'center'}}>
              Sign In
            </Link>
            <Link href="/register" className={styles.registerBtn} style={{textAlign: 'center'}}>
              Register now
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
