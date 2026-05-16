'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './Auctions.module.css';
import api from '@/lib/api';
import { useWishlist } from '@/hooks/useWishlist';
import CountdownTimer from '@/components/CountdownTimer';

export default function AuctionsPage() {
  const { wishlist, toggleWishlist } = useWishlist();
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [metadata, setMetadata] = useState<any>({ makes: [], bodyTypes: [] });
  
  // Filter States
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedEngineSize, setSelectedEngineSize] = useState('');
  const [selectedPaint, setSelectedPaint] = useState('');
  const [selectedGccSpecs, setSelectedGccSpecs] = useState('');
  const [selectedAccidentHistory, setSelectedAccidentHistory] = useState('');
  const [selectedServiceHistory, setSelectedServiceHistory] = useState('');
  const [selectedBodyType, setSelectedBodyType] = useState('');
  const [priceRange, setPriceRange] = useState(100000000); // 100M default

  const fetchCars = async (filters: any = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.make) params.append('make', filters.make);
      if (filters.model) params.append('model', filters.model);
      if (filters.year) params.append('year', filters.year);
      if (filters.engineSize) params.append('engineSize', filters.engineSize);
      if (filters.paint) params.append('paint', filters.paint);
      if (filters.gccSpecs) params.append('gccSpecs', filters.gccSpecs);
      if (filters.accidentHistory) params.append('accidentHistory', filters.accidentHistory);
      if (filters.serviceHistory) params.append('serviceHistory', filters.serviceHistory);
      if (filters.bodyType) params.append('bodyType', filters.bodyType);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);

      const [carsRes, metadataRes] = await Promise.all([
        api.get(`/cars?${params.toString()}`),
        api.get('/cars/metadata')
      ]);
      setCars(carsRes.data);
      setMetadata({
        makes: Array.from(new Set(carsRes.data.map((c: any) => c.make))).filter(Boolean),
        bodyTypes: metadataRes.data.bodyTypes || []
      });
    } catch (error) {
      console.error('Error fetching auctions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCars();
  }, []);

  const handleFilterClick = () => {
    fetchCars({
      make: selectedMake,
      model: selectedModel,
      year: selectedYear,
      engineSize: selectedEngineSize,
      paint: selectedPaint,
      gccSpecs: selectedGccSpecs,
      accidentHistory: selectedAccidentHistory,
      serviceHistory: selectedServiceHistory,
      bodyType: selectedBodyType,
      maxPrice: priceRange
    });
  };

  const handleClearFilters = () => {
    setSelectedMake('');
    setSelectedModel('');
    setSelectedYear('');
    setSelectedEngineSize('');
    setSelectedPaint('');
    setSelectedGccSpecs('');
    setSelectedAccidentHistory('');
    setSelectedServiceHistory('');
    setSelectedBodyType('');
    setPriceRange(100000000);
    fetchCars({}); // Fetch all cars
  };

  return (
    <>
      <div className={styles.pageHeader}>
        <div className={styles.pageTitleContainer}>
          <h1 className={styles.pageTitle}>Auction</h1>
          <div className={styles.titleUnderline}></div>
        </div>
        <p className={styles.pageSubtitle}>Lorem ipsum dolor sit amet consectetur. At in pretium semper vitae eu eu mus.</p>
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span className={styles.breadcrumbSpan}>{'>'}</span>
          <span>Auction</span>
        </div>
      </div>

      <div className={styles.mainLayout}>
        <div className={styles.contentArea}>
          <div className={styles.topBar}>
            <span className={styles.resultsText}>Showing {cars.length} Results</span>
            <select className={styles.sortSelect}>
              <option>Sort By: Newest</option>
              <option>Sort By: Price Low-High</option>
            </select>
          </div>

          <div className={styles.auctionGrid}>
            {loading ? (
              <p>Loading auctions...</p>
            ) : cars.length === 0 ? (
              <p>No cars available matching these filters.</p>
            ) : (
            cars.map(car => (
              <div key={car._id || car.id} className={styles.carItem}>
                <Link href={`/auctions/${car._id || car.id}`} className={styles.carItemImageWrapper}>
                  {car.status === 'sold' && <span className={styles.itemBadge}>Sold</span>}
                  <img src={car.images?.[0] || '/assets/Group 19025.png'} alt={car.modelName} className={styles.carItemImage} />
                </Link>

                <div className={styles.carItemDetails}>
                  <div className={styles.carItemHeader}>
                    <div>
                      <Link href={`/auctions/${car._id || car.id}`} className={styles.carItemTitle}>
                        {car.make} {car.modelName}
                      </Link>
                      <div className={styles.stars}>
                        <Star 
                          size={14} 
                          fill={wishlist.includes(car._id || car.id || '') ? "#f5c518" : "none"} 
                          color={wishlist.includes(car._id || car.id || '') ? "#f5c518" : "#f5c518"} 
                          onClick={() => toggleWishlist(car._id || car.id || '')}
                          style={{ cursor: 'pointer' }}
                        />
                         {/* Keeping other stars as dummy for rating look */}
                        <Star size={14} fill="currentColor" color="#f5c518" />
                        <Star size={14} fill="currentColor" color="#f5c518" />
                        <Star size={14} fill="currentColor" color="#f5c518" />
                        <Star size={14} fill="currentColor" color="#f5c518" />
                      </div>
                    </div>
                  </div>

                  <p className={styles.carItemDesc}>
                    {car.description?.substring(0, 100)}... <Link href={`/auctions/${car._id}`} className={styles.viewDetailsLink}>View Details</Link>
                  </p>

                  <div className={styles.carItemStats}>
                    <div className={styles.statBlock}>
                      <span className={styles.statValue}>${car.currentBid?.toLocaleString() || car.basePrice?.toLocaleString()}</span>
                      <span className={styles.statLabel}>Current Bid</span>
                    </div>
                    <div className={styles.statBlock} style={{flex: 1}}>
                      <div style={{display: 'flex', gap: '30px', justifyContent: 'flex-end'}}>
                         <div>
                            <span className={styles.statValue}>{car.bodyType || 'Sedan'}</span>
                            <span className={styles.statLabel} style={{display: 'block'}}>Body Type</span>
                         </div>
                         <div>
                            <span className={styles.statValue}>
                              <CountdownTimer endTime={car.endTime} />
                            </span>
                            <span className={styles.statLabel} style={{display: 'block'}}>End Time</span>
                         </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.itemSubmitBtns}>
                    <Link href={`/auctions/${car._id || car.id}`} className={styles.submitBidBtnLine}>
                      Submit A Bid
                    </Link>
                  </div>
                </div>
              </div>
            ))
            )}
          </div>

          <div className={styles.pagination}>
            <button className={styles.pageBtn}><ChevronLeft size={16} /></button>
            <button className={`${styles.pageBtn} ${styles.activePage}`}>1</button>
            <button className={styles.pageBtn}><ChevronRight size={16} /></button>
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.filterBox}>
            <div className={styles.filterHeader}>
              Filter By
            </div>
            <div className={styles.filterContent}>
              <select 
                className={styles.filterInput}
                value={selectedMake}
                onChange={(e) => setSelectedMake(e.target.value)}
              >
                <option value="">Any Make</option>
                {['Audi', 'BMW', 'Honda', 'Toyota'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>

              <select 
                className={styles.filterInput}
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                <option value="">Any Model</option>
                {['Model S', 'M4', 'Civic', 'Corolla'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>

              <select 
                className={styles.filterInput}
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <option value="">Any Year</option>
                {['2024', '2023', '2022', '2021', '2020'].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>

              <select 
                className={styles.filterInput}
                value={selectedEngineSize}
                onChange={(e) => setSelectedEngineSize(e.target.value)}
              >
                <option value="">Any Engine Size</option>
                {['4 Cylinder', '6 Cylinder', '8 Cylinder', '10 Cylinder', '12 Cylinder'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <select 
                className={styles.filterInput}
                value={selectedPaint}
                onChange={(e) => setSelectedPaint(e.target.value)}
              >
                <option value="">Any Paint Condition</option>
                {['Original paint', 'Partially Repainted', 'Totally Repainted'].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>

              <select 
                className={styles.filterInput}
                value={selectedGccSpecs}
                onChange={(e) => setSelectedGccSpecs(e.target.value)}
              >
                <option value="">GCC Specs?</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>

              <select 
                className={styles.filterInput}
                value={selectedAccidentHistory}
                onChange={(e) => setSelectedAccidentHistory(e.target.value)}
              >
                <option value="">Accident History?</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>

              <select 
                className={styles.filterInput}
                value={selectedServiceHistory}
                onChange={(e) => setSelectedServiceHistory(e.target.value)}
              >
                <option value="">Full Service History?</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>

              <select 
                className={styles.filterInput}
                value={selectedBodyType}
                onChange={(e) => setSelectedBodyType(e.target.value)}
              >
                <option value="">Any Body Type</option>
                {metadata.bodyTypes.map((b: any) => <option key={b} value={b}>{b}</option>)}
              </select>
              
              <div className={styles.labelSmall}>Max Price: ${priceRange.toLocaleString()}</div>
              <div className={styles.sliderContainer}>
                <input 
                  type="range" 
                  min="0" 
                  max="100000000" 
                  step="100000"
                  value={priceRange} 
                  onChange={(e) => setPriceRange(Number(e.target.value))}
                  style={{width: '100%'}}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button className={styles.filterBtn} onClick={handleFilterClick} style={{ flex: 1 }}>Filter</button>
                <button 
                  className={styles.filterBtn} 
                  onClick={handleClearFilters} 
                  style={{ flex: 1, backgroundColor: '#f3f4f6', color: '#1a2e6e', border: '1px solid #d1d5db' }}
                >
                  Clear All
                </button>
              </div>
              <div className={styles.priceRangeText}>Range: $0 - ${priceRange.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
