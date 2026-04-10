import Link from 'next/link';
import { Car, Phone, Mail, MapPin } from 'lucide-react';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        {/* Column 1: Logo + Description */}
        <div>
          <Link href="/" className={styles.logoArea}>
            <img src="/assets/car logo.png" alt="Car Deposit Logo" style={{ height: '40px' }} />
          </Link>
          <p className={styles.description}>
            Lorem ipsum dolor sit amet consectetur. Mauris eu convallis proin turpis pretium donec orci semper.
            Sit suscipit lctus cras commodo in lectus sed egestas. Mattis egestas sit viverra pretium tincidunt libero.
            Suspendisse aliquam donec leo nisl purus et quam pulvinar. Odio egestas egestas tristique et lectus viverra in sed mauris.
          </p>
          <div>
            <h4 className={styles.socialTitle}>Follow Us</h4>
            <div className={styles.socialIcons}>
              <a href="#" className={styles.socialIcon}><img src="/assets/facebook.svg" alt="Facebook" style={{ width: '20px', objectFit: 'contain' }} /></a>
              <a href="#" className={styles.socialIcon}><img src="/assets/Group 1.png" alt="Instagram" style={{ width: '20px', objectFit: 'contain' }} /></a>
              <a href="#" className={styles.socialIcon}><img src="/assets/linkedin.svg" alt="LinkedIn" style={{ width: '20px', objectFit: 'contain' }} /></a>
              <a href="#" className={styles.socialIcon}><img src="/assets/twitter.svg" alt="Twitter" style={{ width: '20px', objectFit: 'contain' }} /></a>
            </div>
          </div>
        </div>

        {/* Column 2: Home Links */}
        <div>
          <h4 className={styles.columnTitle}>Home</h4>
          <ul className={styles.linkList}>
            <li><Link href="/" className={styles.linkListItem}>Help Center</Link></li>
            <li><Link href="/faq" className={styles.linkListItem}>FAQ</Link></li>
            <li><Link href="/profile" className={styles.linkListItem}>My Account</Link></li>
            <li><Link href="/profile" className={styles.linkListItem}>My Account</Link></li>
          </ul>
        </div>

        {/* Column 3: Car Auction Links */}
        <div>
          <h4 className={styles.columnTitle}>Car Aucation</h4>
          <ul className={styles.linkList}>
            <li><Link href="/help" className={styles.linkListItem}>Help Center</Link></li>
            <li><Link href="/faq" className={styles.linkListItem}>FAQ</Link></li>
            <li><Link href="/profile" className={styles.linkListItem}>My Account</Link></li>
            <li><Link href="/profile" className={styles.linkListItem}>My Account</Link></li>
          </ul>
        </div>

        {/* Column 4: About Us / Contact */}
        <div>
          <h4 className={styles.columnTitle}>About us</h4>
          <ul className={styles.contactList}>
            <li className={styles.contactItem}>
              <Phone size={16} className={styles.contactIcon} />
              <div>
                <p className={styles.contactLabel}>Hot Line Number</p>
                <p className={styles.contactText}>+654 211 4444</p>
              </div>
            </li>
            <li className={styles.contactItem}>
              <Mail size={16} className={styles.contactIcon} />
              <div>
                <p className={styles.contactLabel}>Email Id :</p>
                <p className={styles.contactText}>info@cardeposit.com</p>
              </div>
            </li>
            <li className={styles.contactItem}>
              <MapPin size={16} className={styles.contactIcon} />
              <div>
                <p className={styles.contactText} style={{ marginTop: '-2px' }}>Office No 6, SKB Plaza next to Barclay Showroom, Umm Al Sheif Street, Sheikh Zayed Road, Dubai, UAE</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className={styles.bottomBar}>
        <Link href="#">Copyright 2022</Link> All Rights Reserved
      </div>
    </footer>
  );
}
