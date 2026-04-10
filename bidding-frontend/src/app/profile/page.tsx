'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Edit, Star } from 'lucide-react';
import styles from './Profile.module.css';
import api from '@/lib/api';
import { useWishlist } from '@/hooks/useWishlist';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('My Bids');
  const [user, setUser] = useState<any>(null);
  const [myCars, setMyCars] = useState<any[]>([]);
  const [myBids, setMyBids] = useState<any[]>([]);
  const [fullWishlist, setFullWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { wishlist, toggleWishlist } = useWishlist();

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      try {
        const [meRes, carsRes, bidsRes, wishRes] = await Promise.all([
          api.get('/profile/me'),
          api.get('/profile/cars'),
          api.get('/profile/bids'),
          api.get('/profile/wishlist')
        ]);
        setUser(meRes.data);
        setMyCars(carsRes.data);
        setMyBids(bidsRes.data);
        setFullWishlist(wishRes.data);
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, []);

  const handleToggleWishlist = async (carId: string) => {
    await toggleWishlist(carId);
    // Refresh detailed wishlist view
    const res = await api.get('/profile/wishlist');
    setFullWishlist(res.data);
  };

  return (
    <>
      <div className={styles.pageHeader}>
        <div className={styles.pageTitleContainer}>
          <h1 className={styles.pageTitle}>My Profile</h1>
          <div className={styles.titleUnderline}></div>
        </div>
        <p className={styles.pageSubtitle}>Lorem ipsum dolor sit amet consectetur. At in pretium semper vitae eu eu mus.</p>
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span className={styles.breadcrumbSpan}>{'>'}</span>
          <span>My Profile</span>
        </div>
      </div>

      <div className={styles.mainLayout}>
        <div className={styles.sidebar}>
          <div className={styles.sidebarMenu}>
            <button className={`${styles.menuItem} ${activeTab === 'Personal Information' ? styles.active : ''}`} onClick={() => setActiveTab('Personal Information')}>
              Personal Information
            </button>
            <button className={`${styles.menuItem} ${activeTab === 'My Cars' ? styles.active : ''}`} onClick={() => setActiveTab('My Cars')}>
              My Cars
            </button>
            <button className={`${styles.menuItem} ${activeTab === 'My Bids' ? styles.active : ''}`} onClick={() => setActiveTab('My Bids')}>
              My Bids
            </button>
            <button className={`${styles.menuItem} ${activeTab === 'Wishlist' ? styles.active : ''}`} onClick={() => setActiveTab('Wishlist')}>
              Wishlist
            </button>
          </div>
        </div>

        <div className={styles.contentArea}>
          {activeTab === 'Personal Information' && (
            <div>
              {/* ... (Personal Info implementation kept simple to not exceed file size max easily, but I will put it all) */}
              <div className={styles.infoBlock}>
                <div className={styles.blockHeader}><span>Personal Information</span><Edit size={16} className={styles.editIcon} /></div>
                <div className={styles.blockContent}>
                  <div className={styles.personalInfoGrid}>
                      <img src={user?.profilePicture || "https://placehold.co/150x150/ffffff/555555?text=Avatar"} alt="User" className={styles.avatar} />
                      <div className={styles.detailsGrid}>
                        <div className={styles.detailItem}><span className={styles.detailLabel}>Full Name</span><span className={styles.detailValue}>{user?.name}</span></div>
                        <div className={styles.detailItem}><span className={styles.detailLabel}>Email</span><span className={styles.detailValue}>{user?.email}</span></div>
                        <div className={styles.detailItem}><span className={styles.detailLabel}>Mobile Number</span><span className={styles.detailValue}>{user?.phone || 'N/A'}</span></div>
                        <div className={styles.detailItem}><span className={styles.detailLabel}>Nationality</span><span className={styles.detailValue}>Not Specified</span></div>
                        <div className={styles.detailItem}><span className={styles.detailLabel}>ID Type</span><span className={styles.detailValue}>Not Specified</span></div>
                        <div className={styles.detailItem}><span className={styles.detailLabel}>ID Number</span><span className={styles.detailValue}>Not Specified</span></div>
                      </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'My Cars' && (
            <div>
              <div className={styles.tabTitleArea}><div className={styles.tabTitle}>My Cars</div></div>
              <div className={styles.grid3Col}>
                 {myCars.length === 0 ? <p>No cars added yet.</p> : myCars.map(car => (
                   <div key={car._id} className={styles.carCard}>
                     <div className={styles.carCardHeader}>
                       <span className={styles.trendingTag}>{car.category}</span>
                       <h3 className={styles.carCardTitle}>{car.make} {car.modelName}</h3>
                       <div className={styles.starIconBtn} onClick={() => handleToggleWishlist(car._id)} style={{cursor:'pointer'}}>
                         <Star size={14} fill={wishlist.includes(car._id) ? "#f5c518" : "none"} color={wishlist.includes(car._id) ? "#f5c518" : "#9ca3af"}/>
                       </div>
                     </div>
                     <img src={car.images?.[0] || car.image || "https://placehold.co/300x150/ffffff/555555?text=Car"} alt={car.modelName} className={styles.carCardImage} />
                     <div className={styles.carCardStatsArea}>
                       <div className={styles.carCardStats}>
                         <div className={styles.cardStat}>
                           <span className={styles.cardStatValue}>${car.currentBid?.toLocaleString()}</span>
                           <span className={styles.cardStatLabel}>Current Bid</span>
                         </div>
                       </div>
                     </div>
                     <Link href={`/auctions/${car._id}`} className={`${styles.carCardBtn} ${styles.btnDark}`}>View Auction</Link>
                   </div>
                 ))}
              </div>
            </div>
          )}
          
          {activeTab === 'My Bids' && (
            <div>
              <div className={styles.tabTitleArea}>
                <div className={styles.tabTitle}>My Bids</div>
              </div>
              <div className={styles.grid3Col}>
                {myBids.length === 0 ? <p>No bids placed yet.</p> : myBids.map(({ car, myMaxBid }) => {
                  const isWinning = car.currentBid === myMaxBid;
                  return (
                    <div key={car._id} className={styles.carCard}>
                      <div className={styles.carCardHeader}>
                        <span className={styles.trendingTag}>{car.category}</span>
                        <h3 className={styles.carCardTitle}>{car.make} {car.modelName}</h3>
                        <div className={styles.starIconBtn} onClick={() => handleToggleWishlist(car._id)} style={{cursor:'pointer'}}>
                          <Star size={14} fill={wishlist.includes(car._id) ? "#f5c518" : "none"} color={wishlist.includes(car._id) ? "#f5c518" : "#9ca3af"}/>
                        </div>
                      </div>
                      <img src={car.images?.[0] || car.image || "https://placehold.co/300x150/ffffff/555555?text=Car"} alt={car.modelName} className={styles.carCardImage} />
                      
                      <div className={styles.carCardStatsArea}>
                        <div className={styles.bidBoxBlock}>
                          <div className={`${styles.bidBox} ${styles.bidBoxGrey}`}>
                            <span className={styles.bidBoxValue} style={{color:'#1a2e6e'}}>${car.currentBid?.toLocaleString()}</span>
                            <span className={styles.bidBoxLabel}>{isWinning ? 'Winning Bid' : 'Highest Bid'}</span>
                          </div>
                          <div className={`${styles.bidBox} ${isWinning ? styles.bidBoxGreen : styles.bidBoxRed}`}>
                            <span className={styles.bidBoxValue} style={{color: isWinning ? '#22c55e' : '#ef4444'}}>${myMaxBid?.toLocaleString()}</span>
                            <span className={styles.bidBoxLabel} style={{color: isWinning ? '#22c55e' : '#ef4444'}}>Your Best Bid</span>
                          </div>
                        </div>
                      </div>
                      <Link href={`/auctions/${car._id}`} className={`${styles.carCardBtn} ${styles.btnDark}`}>Update Bid</Link>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'Wishlist' && (
            <div>
              <div className={styles.tabTitleArea}>
                <div className={styles.tabTitle}>Wishlist ({fullWishlist.length})</div>
              </div>
              
              <div className={styles.grid3Col}>
                {fullWishlist.length === 0 ? <p>Your wishlist is empty.</p> : fullWishlist.map((car, idx) => (
                  <div key={car._id} className={styles.carCard}>
                    <div className={styles.carCardHeader}>
                      <span className={styles.trendingTag}>{car.category}</span>
                      <h3 className={styles.carCardTitle}>{car.make} {car.modelName}</h3>
                      <div className={styles.starIconBtn} onClick={() => handleToggleWishlist(car._id)} style={{cursor:'pointer'}}>
                        <Star size={14} fill="#f5c518" color="#f5c518"/>
                      </div>
                    </div>
                    <img src={car.images?.[0] || car.image || "https://placehold.co/300x150/ffffff/555555?text=Car"} alt={car.modelName} className={styles.carCardImage} />
                    
                    <p className={styles.wishlistDesc}>
                      {car.description?.substring(0, 100)}... <Link href={`/auctions/${car._id}`} className={styles.viewDetails}>View Details</Link>
                    </p>
                    
                    <div className={styles.carCardStats} style={{marginBottom: '10px'}}>
                      <div className={styles.cardStat}>
                        <span className={styles.cardStatValue}>${car.currentBid?.toLocaleString()}</span>
                        <span className={styles.cardStatLabel}>Current Bid</span>
                      </div>
                      <div className={styles.cardStat} style={{textAlign: 'right'}}>
                        <span className={styles.cardStatValue}>$ {car.basePrice?.toLocaleString()}</span>
                        <span className={styles.cardStatLabel}>Base Price</span>
                      </div>
                    </div>
                    
                    <Link href={`/auctions/${car._id}`} className={`${styles.carCardBtn} ${styles.btnOutline}`}>Bid Now</Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
