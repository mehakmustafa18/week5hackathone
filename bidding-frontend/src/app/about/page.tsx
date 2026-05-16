import Link from 'next/link';
import styles from './About.module.css';
import Newsletter from '@/components/Newsletter';

export default function AboutPage() {
  return (
    <div className={styles.aboutContainer}>
      <section className={styles.heroSection}>
        <h1 className={styles.heroTitle}>About Car Deposit</h1>
        <p className={styles.heroSubtitle}>
          We are the world's leading online car auction platform, connecting passionate buyers with premium vehicles through a transparent and secure bidding process.
        </p>
      </section>

      <section className={styles.contentSection}>
        <div className={styles.grid2Col}>
          <div className={styles.imageWrapper}>
            <img 
              src="https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=800" 
              alt="Our Story" 
              className={styles.aboutImage} 
            />
          </div>
          <div>
            <span className={styles.sectionLabel}>Our Story</span>
            <h2 className={styles.sectionTitle}>Driving the Future of Car Auctions</h2>
            <p className={styles.sectionDesc}>
              Founded in 2020, Car Deposit started with a simple vision: to revolutionize the way people buy and sell cars. We realized that the traditional auction process was often opaque and exclusive.
            </p>
            <p className={styles.sectionDesc}>
              By leveraging cutting-edge technology and a commitment to transparency, we've built a platform where everyone—from individual enthusiasts to professional dealers—can participate in exciting auctions with confidence.
            </p>
          </div>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <h3>10K+</h3>
            <p>Vehicles Sold</p>
          </div>
          <div className={styles.statItem}>
            <h3>50K+</h3>
            <p>Active Users</p>
          </div>
          <div className={styles.statItem}>
            <h3>15+</h3>
            <p>Countries</p>
          </div>
          <div className={styles.statItem}>
            <h3>$500M+</h3>
            <p>Auction Volume</p>
          </div>
        </div>

        <div className={styles.grid2Col} style={{ marginTop: '80px' }}>
          <div>
            <span className={styles.sectionLabel}>Our Mission</span>
            <h2 className={styles.sectionTitle}>Trust, Transparency & Technology</h2>
            <p className={styles.sectionDesc}>
              Our mission is to create the most trusted marketplace for vehicles globally. We achieve this by providing detailed inspections, secure payment systems, and 24/7 customer support.
            </p>
            <p className={styles.sectionDesc}>
              Whether you're looking for a classic collector's item or a reliable daily driver, we ensure every listing is verified and every bid is real.
            </p>
          </div>
          <div className={styles.imageWrapper}>
            <img 
              src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&q=80&w=800" 
              alt="Our Mission" 
              className={styles.aboutImage} 
            />
          </div>
        </div>
      </section>

      <section className={styles.teamSection}>
        <h2 className={styles.teamTitle}>Meet Our Leadership</h2>
        <div className={styles.teamGrid}>
          {[
            { name: 'John Smith', role: 'Founder & CEO', img: 'https://i.pravatar.cc/300?u=john' },
            { name: 'Sarah Johnson', role: 'Chief Operations Officer', img: 'https://i.pravatar.cc/300?u=sarah' },
            { name: 'Michael Chen', role: 'Head of Technology', img: 'https://i.pravatar.cc/300?u=michael' },
            { name: 'Emma Davis', role: 'Director of Marketing', img: 'https://i.pravatar.cc/300?u=emma' },
          ].map((member, i) => (
            <div key={i} className={styles.teamMember}>
              <img src={member.img} alt={member.name} className={styles.memberImg} />
              <div className={styles.memberInfo}>
                <h3 className={styles.memberName}>{member.name}</h3>
                <p className={styles.memberRole}>{member.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <Newsletter />
    </div>
  );
}
