'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ChevronDown, Star } from 'lucide-react';
import styles from './Home.module.css';
import api from '@/lib/api';

import { useSocket } from '@/hooks/useSocket';
import { useWishlist } from '@/hooks/useWishlist';
import CountdownTimer from '@/components/CountdownTimer';

export default function HomePage() {
  const { notifications } = useSocket();
  const { wishlist, toggleWishlist } = useWishlist();
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [price, setPrice] = useState('');
  const [cars, setCars] = useState<any[]>([]);
  const [metadata, setMetadata] = useState<any>({ makes: [], models: [], years: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [carsRes, metadataRes] = await Promise.all([
          api.get('/cars'),
          api.get('/cars/metadata')
        ]);
        setCars(carsRes.data);
        const carsData = carsRes.data;
        const uniqueMakes = Array.from(new Set(carsData.map((c: any) => c.make))).filter(Boolean);
        const uniqueYears = Array.from(new Set(carsData.map((c: any) => c.year))).sort().reverse();
        
        setMetadata({
          makes: uniqueMakes.length > 0 ? uniqueMakes : ['Audi', 'BMW', 'Toyota', 'Honda'],
          years: uniqueYears.length > 0 ? uniqueYears : ['2024', '2023', '2022', '2021'],
          categories: metadataRes.data.categories || [],
          bodyTypes: metadataRes.data.bodyTypes || []
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    if (notifications.length > 0) {
      const lastNotif = notifications[0];
      if (lastNotif.type === 'NEW_BID') {
        setCars((prevCars) => 
          prevCars.map((car) => 
            car._id === lastNotif.carId ? { ...car, currentBid: lastNotif.amount } : car
          )
        );
      } else if (lastNotif.type === 'NEW_CAR') {
        fetchData();
      }
    }
  }, [notifications]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (make) params.make = make;
      if (year) params.year = year;
      const res = await api.get('/cars', { params });
      setCars(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <div className={styles.welcomeBadge}>Welcome to Auction</div>
          <h1 className={styles.heroTitle}>Find Your<br />Dream Car</h1>
          <p className={styles.heroDesc}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Tellus elementum cursus tincidunt sagittis elementum suspendisse velit arcu.
          </p>

          <div className={styles.searchBar}>
            {[
              { label: 'Make', value: make, setter: setMake, options: metadata.makes },
              { label: 'Year', value: year, setter: setYear, options: metadata.years },
              { label: 'Status', value: '', setter: () => {}, options: ['Active', 'Ending Soon'] },
              { label: 'Price Range', value: price, setter: setPrice, options: ['$0-$10k', '$10k-$30k', '$30k-$60k', '$60k+'] },
            ].map(({ label, value, setter, options }) => (
              <div key={label} className={styles.searchGroup}>
                <label className={styles.searchLabel}>{label}</label>
                <select
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  className={styles.searchInput}
                >
                  <option value="">{label}</option>
                  {options.map((o: any) => <option key={o} value={o}>{o}</option>)}
                </select>
                <div className={styles.searchIconWrapper}>
                  <ChevronDown size={14} />
                </div>
              </div>
            ))}
            <button className={styles.searchBtn} onClick={handleSearch}>
              <Search size={16} /> Search
            </button>
          </div>
        </div>
      </section>

      <section className={styles.auctionSection}>
        <div className={styles.auctionContainer}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Live Auction</h2>
            <div className={styles.sectionDivider}>
              <div className={styles.dividerLine}></div>
              <div className={styles.dividerDiamond}></div>
              <div className={styles.dividerLine}></div>
            </div>
          </div>

          <div className={styles.tabsArea}>
            <div className={styles.activeTab}>Live Auction</div>
          </div>

          <div className={styles.cardsGrid}>
            {loading ? (
              <p>Loading live auctions...</p>
            ) : cars.length > 0 ? (
              cars.map((car: any, index: number) => {
                const fallbackImages = ['/assets/Group 19022.png', '/assets/Group 19023.png', '/assets/Group 19024.png', '/assets/Group 19025.png'];
                const displayImage = car.images?.[0] || car.image || fallbackImages[index % 4];
                
                // Hide expired auctions from Home Page
                if (new Date(car.endTime) <= new Date()) return null;

                return (
                <div key={car._id || car.id} className={styles.carCard}>
                  <div className={styles.cardHeader}>
                    <span className={styles.trendingTag}>Trending <img src="/assets/Vector.png" alt="" style={{width:8, marginLeft:4}} /></span>
                    <Star 
                      size={16} 
                      className={styles.starIcon} 
                      fill={wishlist.includes(car._id || car.id || '') ? "#f5c518" : "none"}
                      color={wishlist.includes(car._id || car.id || '') ? "#f5c518" : "currentColor"}
                      onClick={() => toggleWishlist(car._id || car.id || '')}
                      style={{ cursor: 'pointer' }}
                    />
                  </div>
                  
                  <h3 className={styles.carTitle}>{car.make} {car.modelName}</h3>

                  <Link href="/auctions" className={styles.imageArea}>
                    <img src={displayImage} alt={car.modelName} className={styles.carImage} />
                  </Link>
  
                  <div className={styles.cardDetails}>
                    <div className={styles.detailCol}>
                      <span className={styles.detailValue}>${(car.currentBid || car.basePrice)?.toLocaleString()}</span>
                      <span className={styles.detailLabel}>Current Bid</span>
                    </div>
                    <div className={styles.detailCol}>
                      <span className={styles.detailValue}>
                        <CountdownTimer endTime={car.endTime} />
                      </span>
                      <span className={styles.detailLabel}>Waiting for Bid</span>
                    </div>
                  </div>
  
                  <Link href={`/auctions/${car._id || car.id}`} className={styles.submitBtn}>
                    Submit A Bid
                  </Link>
                </div>
              )})
            ) : (
              <p className={styles.noCarsMsg} style={{color: 'white', gridColumn: 'span 4', textAlign: 'center'}}>No live auctions found.</p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
