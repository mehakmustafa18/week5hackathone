'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Star, Minus, Plus, Truck, Package, CheckCircle } from 'lucide-react';
import styles from './AuctionDetail.module.css';
import api from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import CountdownTimer from '@/components/CountdownTimer';

export default function AuctionDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { socket, notifications } = useSocket();
  const [car, setCar] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [auctionEnded, setAuctionEnded] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [shippingStatus, setShippingStatus] = useState<string>('');
  // Track if the auctionEnded event was already emitted (survives page refresh)
  const auctionEndedKey = `auctionEnded_${id}`;

  // Get current logged-in user
  const currentUser = typeof window !== 'undefined' ? (() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  })() : null;
  const currentUserId = currentUser?._id || currentUser?.id || '';

  useEffect(() => {
    const fetchData = async () => {
      console.log('Fetching details for car ID:', id);
      try {
        const [carRes, bidsRes] = await Promise.all([
          api.get(`/cars/${id}`),
          api.get(`/bids/car/${id}`)
        ]);
        const carData = carRes.data;
        setCar(carData);
        setBids(bidsRes.data);
        setShippingStatus(carData.status || 'active');
        setBidAmount((carData.currentBid || carData.basePrice) + 100);
        if (carData.images?.length > 0) {
          setSelectedImage(carData.images[0]);
        }
        // Check if auction already ended
        if (new Date(carData.endTime) <= new Date()) {
          setAuctionEnded(true);
        }
      } catch (error: any) {
        console.error('Error fetching auction details:', error);
        if (error.response?.status === 404 || !car) {
          const dummyCar = {
            _id: id || 'dummy_id',
            make: 'Audi',
            modelName: 'Q3',
            year: 2023,
            basePrice: 20000,
            currentBid: 30000,
            endTime: new Date(Date.now() + 86400000).toISOString(),
            images: [
              'https://images.unsplash.com/photo-1542362567-b051c63b9a56?auto=format&fit=crop&q=80&w=800',
              'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=400',
            ],
            category: 'Sports',
            bodyType: 'SUV',
            description: 'Lorem ipsum dolor sit amet consectetur.',
            sellerId: { name: 'Dealer', email: 'dealer@example.com', username: 'dealer' },
            status: 'active'
          };
          setCar(dummyCar);
          setSelectedImage(dummyCar.images[0]);
          setBids([]);
          setBidAmount(30100);
        }
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  // Listen for real-time bid updates and delivery updates
  useEffect(() => {
    if (notifications.length > 0) {
      const lastNotif = notifications[0];
      if (lastNotif.type === 'NEW_BID' && lastNotif.carId === id) {
        setCar((prev: any) => ({ ...prev, currentBid: lastNotif.amount }));
        api.get(`/bids/car/${id}`).then(res => setBids(res.data)).catch(() => {});
      }
    }
  }, [notifications, id]);

  // Listen for delivery status and bid updates via socket
  useEffect(() => {
    if (!socket) return;
    socket.emit('joinAuction', id);
    
    const handleDelivery = (data: any) => {
      setShippingStatus(data.status);
      setCar((prev: any) => prev ? { ...prev, status: data.status } : prev);
    };

    const handleBidUpdate = (bid: any) => {
      setCar((prev: any) => ({ ...prev, currentBid: bid.amount }));
      // Fetch latest bids completely so avatars and data populated correctly
      api.get(`/bids/car/${id}`).then(res => {
        setBids(res.data);
        if (res.data.length > 0) {
          setBidAmount(res.data[0].amount + 100);
        }
      }).catch(() => {});
    };

    socket.on('deliveryUpdate', handleDelivery);
    socket.on('bidUpdate', handleBidUpdate);

    return () => { 
      socket.off('deliveryUpdate', handleDelivery); 
      socket.off('bidUpdate', handleBidUpdate);
    };
  }, [socket, id]);

  // Called when CountdownTimer reaches zero
  const handleAuctionEnd = () => {
    setAuctionEnded(true);

    // Prevent re-emitting if already done (checked via localStorage, survives refresh)
    const alreadyEmitted = localStorage.getItem(auctionEndedKey);
    if (alreadyEmitted) return;
    localStorage.setItem(auctionEndedKey, 'true');

    if (!socket || !car) return;

    const winner = bids.length > 0 ? bids[0] : null;
    const winnerId = winner?.userId?._id || winner?.userId?.id || '';
    const winnerName = winner?.userId?.name || winner?.userId?.username || 'Unknown';
    const sellerId = car.sellerId?._id || car.sellerId?.id || car.sellerId || '';
    const loserIds = Array.from(new Set(
      bids.slice(1)
        .map((b: any) => b.userId?._id?.toString() || b.userId?.id?.toString() || b.userId?.toString() || '')
        .filter(lid => lid && lid !== winnerId.toString())
    ));

    socket.emit('auctionEnded', {
      carId: id,
      carName: `${car.make} ${car.modelName}`,
      winnerId: winnerId.toString(),
      winnerName,
      sellerId: sellerId.toString(),
      winningAmount: winner?.amount || car.currentBid,
      loserIds: loserIds.map((lid: any) => lid.toString()),
    });
  };

  const handlePlaceBid = async () => {
    if (!currentUser) { router.push('/login'); return; }
    const sellerId = car.sellerId?._id || car.sellerId;
    if (currentUserId === sellerId?.toString()) {
      setError('You cannot bid on your own car');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/bids', { carId: id, userId: currentUserId, amount: bidAmount });
      const resBids = await api.get(`/bids/car/${id}`);
      setBids(resBids.data);
      setCar((prev: any) => ({ ...prev, currentBid: bidAmount }));
      setBidAmount(bidAmount + 100);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to place bid');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMakePayment = async () => {
    setPaymentLoading(true);
    try {
      await api.post(`/payments/${id}/pay`);
      router.push(`/auctions/${id}/payment`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Payment failed');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    setStatusUpdating(true);
    try {
      await api.patch(`/payments/${id}/status`, { status });
      setShippingStatus(status);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading) return <div className={styles.mainLayout} style={{padding: '100px', textAlign: 'center'}}>Loading auction details...</div>;
  if (!car) return <div className={styles.mainLayout} style={{padding: '100px', textAlign: 'center'}}>Car not found.</div>;

  const mainImage = selectedImage || car.images?.[0] || 'https://placehold.co/800x600/ffffff/555555?text=No+Image';
  const increment = 100;
  const topBidder = bids.length > 0 ? bids[0] : null;

  // Determine current user's role in this auction
  const sellerId = car.sellerId?._id || car.sellerId?.id || car.sellerId?.toString() || '';
  const isSeller = currentUserId && sellerId && currentUserId === sellerId.toString();
  const winnerId = topBidder?.userId?._id || topBidder?.userId?.id || '';
  const isWinner = auctionEnded && currentUserId && winnerId && currentUserId === winnerId;
  const alreadyPaid = ['sold', 'shipped', 'delivered', 'completed'].includes(shippingStatus);

  const shippingSteps = [
    { key: 'sold', label: 'Payment Received', icon: <Package size={18} /> },
    { key: 'shipped', label: 'In Transit', icon: <Truck size={18} /> },
    { key: 'delivered', label: 'Delivered', icon: <CheckCircle size={18} /> },
  ];
  const currentStepIdx = shippingSteps.findIndex(s => s.key === shippingStatus);

  return (
    <>
      <div className={styles.pageHeader}>
        <div className={styles.pageTitleContainer}>
          <h1 className={styles.pageTitle}>{car.make} {car.modelName}</h1>
          <div className={styles.titleUnderline}></div>
        </div>
        <p className={styles.pageSubtitle}>Lorem ipsum dolor sit amet consectetur. At in pretium semper vitae eu eu mus.</p>
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span className={styles.breadcrumbSpan}>{'>'}</span>
          <span>Auction Detail</span>
        </div>
      </div>

      <div className={styles.mainLayout}>
        <div className={styles.carHeaderBar}>
          <span className={styles.carHeaderTitle}>{car.make} {car.modelName}</span>
          <Star size={18} fill="currentColor" color="#f5c518" style={{cursor: 'pointer'}} />
        </div>

        <div className={styles.galleryArea}>
          <div className={styles.mainImageWrapper}>
            <span className={styles.liveTag}>{car.status?.toUpperCase() || 'LIVE'}</span>
            <img src={mainImage} alt={car.modelName} className={styles.mainImage} />
          </div>
          <div className={styles.thumbnailsArea}>
            {car.images?.slice(0, 4).map((img: string, idx: number) => (
              <div
                key={idx}
                className={`${styles.thumbnailWrapper} ${selectedImage === img ? styles.activeThumbnail : ''}`}
                onClick={() => setSelectedImage(img)}
              >
                <img src={img} className={styles.thumbnailImage} alt={`Thumb ${idx}`} />
              </div>
            ))}
          </div>
        </div>

        <div className={styles.statsStrip}>
          <div className={styles.statItem}>
            <div className={styles.timerBoxes} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CountdownTimer endTime={car.endTime} onEnd={handleAuctionEnd} />
            </div>
            <span className={styles.statLabel}>Time Left</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>${car.currentBid?.toLocaleString()}</span>
            <span className={styles.statLabel}>Current Bid</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>
              <CountdownTimer endTime={car.endTime} />
            </span>
            <span className={styles.statLabel}>End Time</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>${increment}</span>
            <span className={styles.statLabel}>Min. Increment</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{bids.length}</span>
            <span className={styles.statLabel}>Total Bids</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{car._id?.toString().slice(-6).toUpperCase() || 'ABC123'}</span>
            <span className={styles.statLabel}>Lot No.</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>10,876 K.M</span>
            <span className={styles.statLabel}>Kilometer</span>
          </div>
        </div>

        <div className={styles.detailsLayout}>
          <div className={styles.leftColumn}>
            <h3 className={styles.sectionTitle}>Description</h3>
            <p className={styles.descriptionText}>{car.description}</p>

            <div className={styles.boxHeader}>Seller Information</div>
            <div className={styles.boxContent}>
              <div className={styles.bidderProfile}>
                <img src={car.sellerId?.profilePicture || "https://placehold.co/100x100/ffffff/555555?text=User"} alt="Seller" className={styles.bidderAvatar} />
                <div className={styles.bidderInfoGrid}>
                  <span className={styles.infoLabel}>Seller Name</span>
                  <span className={styles.infoValue}>{car.sellerId?.username || car.sellerId?.name || 'Authorized Dealer'}</span>
                  <span className={styles.infoLabel}>Seller Email</span>
                  <span className={styles.infoValue}>{car.sellerId?.email || 'seller@example.com'}</span>
                  <span className={styles.infoLabel}>Category</span>
                  <span className={styles.infoValue}>{car.category}</span>
                  <span className={styles.infoLabel}>Location</span>
                  <span className={styles.infoValue}>Dubai, UAE</span>
                </div>
              </div>
            </div>

            {topBidder && (
              <div className={styles.topBidderSection}>
                <div className={styles.boxHeader}>Top Bidder</div>
                <div className={`${styles.boxContent} ${styles.topBidderBox}`}>
                  <div className={styles.bidderProfile}>
                    <img
                      src={topBidder.userId?.profilePicture || "https://placehold.co/100x100/3b4b89/ffffff?text=" + (topBidder.userId?.name?.[0] || 'B')}
                      alt="Top Bidder"
                      className={styles.bidderAvatar}
                    />
                    <div className={styles.bidderInfoGrid}>
                      <span className={styles.infoLabel}>Full Name</span>
                      <span className={styles.infoValue}>{topBidder.userId?.name || topBidder.userId?.username || 'Anonymous Bidder'}</span>
                      <span className={styles.infoLabel}>Email</span>
                      <span className={styles.infoValue}>{topBidder.userId?.email || 'N/A'}</span>
                      <span className={styles.infoLabel}>Mobile Number</span>
                      <span className={styles.infoValue}>{topBidder.userId?.phone || 'N/A'}</span>
                      <span className={styles.infoLabel}>Nationality</span>
                      <span className={styles.infoValue}>International</span>
                      <span className={styles.infoLabel}>ID Status</span>
                      <span className={styles.infoValue}>Verified</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={styles.rightColumn}>
            <div className={styles.bidWidget}>
              <div className={styles.bidHeader}>
                <div>
                  <span className={styles.bidLabel}>Base Price</span>
                  <div className={styles.bidVal}>${car.basePrice?.toLocaleString()}</div>
                </div>
                <div style={{textAlign: 'right'}}>
                  <span className={styles.bidLabel}>Current Bid</span>
                  <div className={styles.bidVal}>${car.currentBid?.toLocaleString()}</div>
                </div>
              </div>

              <div className={styles.bidWidgetSlider}>
                <div
                  className={styles.bidWidgetSliderFill}
                  style={{ width: `${Math.min(100, ((car.currentBid - car.basePrice) / (car.basePrice * 0.2 + 1)) * 100)}%` }}
                ></div>
                <div
                  className={styles.bidWidgetSliderThumb}
                  style={{ left: `${Math.min(100, ((car.currentBid - car.basePrice) / (car.basePrice * 0.2 + 1)) * 100)}%` }}
                ></div>
              </div>

              <div className={styles.bidInputGroup}>
                <div className={styles.bidInputLabel}>
                  {bids.length}<br/>
                  <span style={{fontSize:'10px', color:'#94a3b8', fontWeight:'normal'}}>Bids Placed</span>
                </div>
                <div className={styles.bidInputControl}>
                  <button className={styles.bidInputBtn} onClick={() => setBidAmount(prev => Math.max(car.currentBid + increment, prev - increment))}><Minus size={16}/></button>
                  <input type="text" value={`$${bidAmount.toLocaleString()}`} readOnly className={styles.bidInputField} />
                  <button className={styles.bidInputBtn} onClick={() => setBidAmount(prev => prev + increment)}><Plus size={16}/></button>
                </div>
              </div>

              {error && (
                <div style={{ color: '#dc2626', backgroundColor: '#fef2f2', padding: '10px', borderRadius: '6px', fontSize: '12px', marginBottom: '15px' }}>
                  {error}
                </div>
              )}

              <button
                className={styles.bidSubmitBtn}
                onClick={handlePlaceBid}
                disabled={submitting || bidAmount <= car.currentBid || auctionEnded}
              >
                {auctionEnded ? 'Auction Ended' : (submitting ? 'Placing Bid...' : 'Submit A Bid')}
              </button>
            </div>

            <div>
              <div className={styles.biddersListHeader}>Bidders List</div>
              <div className={styles.biddersList}>
                {bids.length === 0 ? (
                  <div className={styles.bidderRow} style={{borderBottom: 'none'}}>
                    <span className={styles.bidderRowLabel}>No bids yet.</span>
                  </div>
                ) : (
                  bids.map((b, i) => (
                    <div key={b._id} className={styles.bidderRow}>
                      <span className={styles.bidderRowLabel}>{b.userId?.name || b.userId?.username || 'Bidder ' + (i+1)}</span>
                      <span className={styles.bidderRowValue}>$ {b.amount.toLocaleString()}</span>
                    </div>
                  ))
                )}
                <div className={styles.bidderRow} style={{borderBottom: 'none', justifyContent: 'center'}}>
                  <span className={styles.bidderRowLabel}>...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== WINNER PAYMENT SECTION ===== */}
      {isWinner && !alreadyPaid && (
        <div style={{
          background: 'linear-gradient(135deg, #1a2e6e 0%, #2d4a9e 100%)',
          padding: '48px 32px',
          margin: '40px 0 0 0',
          textAlign: 'center',
          borderTop: '4px solid #f5c518',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</div>
          <h2 style={{ color: '#f5c518', fontSize: '28px', fontWeight: 700, marginBottom: '12px' }}>
            Congratulations! You Won the Bid!
          </h2>
          <p style={{ color: '#cbd5e1', fontSize: '16px', marginBottom: '8px' }}>
            You won <strong style={{color:'white'}}>{car.make} {car.modelName}</strong> with a bid of{' '}
            <strong style={{color:'#f5c518'}}>${topBidder?.amount?.toLocaleString()}</strong>
          </p>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '32px' }}>
            Please complete your payment to proceed with the car delivery.
          </p>
          <button
            onClick={handleMakePayment}
            disabled={paymentLoading}
            style={{
              background: '#f5c518',
              color: '#1a2e6e',
              border: 'none',
              padding: '16px 48px',
              borderRadius: '8px',
              fontSize: '18px',
              fontWeight: 700,
              cursor: paymentLoading ? 'not-allowed' : 'pointer',
              opacity: paymentLoading ? 0.7 : 1,
              transition: 'all 0.2s',
            }}
          >
            {paymentLoading ? 'Processing...' : '💳 Make Payment'}
          </button>
        </div>
      )}

      {/* ===== SELLER SHIPPING CONTROL SECTION ===== */}
      {isSeller && auctionEnded && bids.length > 0 && (
        <div style={{
          background: '#0f172a',
          padding: '40px 32px',
          margin: '40px 0 0 0',
          borderTop: '4px solid #1a2e6e',
        }}>
          <h2 style={{ color: 'white', fontSize: '22px', fontWeight: 700, marginBottom: '8px', textAlign: 'center' }}>
            📦 Manage Shipping Status
          </h2>
          <p style={{ color: '#94a3b8', textAlign: 'center', marginBottom: '32px' }}>
            Won by: <strong style={{color:'#f5c518'}}>{topBidder?.userId?.name || topBidder?.userId?.username}</strong> — ${topBidder?.amount?.toLocaleString()}
          </p>

          {/* Progress bar */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0', marginBottom: '32px' }}>
            {shippingSteps.map((step, idx) => (
              <div key={step.key} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%',
                    background: idx <= currentStepIdx ? '#f5c518' : '#1e293b',
                    border: `2px solid ${idx <= currentStepIdx ? '#f5c518' : '#334155'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: idx <= currentStepIdx ? '#1a2e6e' : '#64748b',
                    fontWeight: 700,
                    transition: 'all 0.3s',
                  }}>
                    {step.icon}
                  </div>
                  <span style={{ color: idx <= currentStepIdx ? '#f5c518' : '#64748b', fontSize: '12px', fontWeight: 600, textAlign: 'center' }}>
                    {step.label}
                  </span>
                </div>
                {idx < shippingSteps.length - 1 && (
                  <div style={{
                    width: '80px', height: '2px',
                    background: idx < currentStepIdx ? '#f5c518' : '#1e293b',
                    margin: '0 8px',
                    marginBottom: '28px',
                    transition: 'background 0.3s',
                  }} />
                )}
              </div>
            ))}
          </div>

          {/* Control Buttons */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { status: 'sold', label: '✅ Ready for Shipping', enabledWhen: ['active', 'sold'] },
              { status: 'shipped', label: '🚚 Mark as In Transit', enabledWhen: ['sold'] },
              { status: 'delivered', label: '📬 Mark as Delivered', enabledWhen: ['shipped'] },
            ].map((btn) => {
              const isEnabled = btn.enabledWhen.includes(shippingStatus) || (btn.status === 'sold' && !alreadyPaid);
              const isActive = shippingStatus === btn.status;
              return (
                <button
                  key={btn.status}
                  onClick={() => handleUpdateStatus(btn.status)}
                  disabled={statusUpdating || !isEnabled || isActive}
                  style={{
                    padding: '12px 28px',
                    borderRadius: '8px',
                    border: isActive ? '2px solid #f5c518' : '2px solid #334155',
                    background: isActive ? '#f5c518' : isEnabled ? '#1e293b' : '#0f172a',
                    color: isActive ? '#1a2e6e' : isEnabled ? 'white' : '#475569',
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: (!isEnabled || isActive || statusUpdating) ? 'not-allowed' : 'pointer',
                    opacity: (!isEnabled || statusUpdating) ? 0.6 : 1,
                    transition: 'all 0.2s',
                  }}
                >
                  {statusUpdating ? 'Updating...' : btn.label}
                </button>
              );
            })}
          </div>

          {error && (
            <p style={{ color: '#ef4444', textAlign: 'center', marginTop: '16px', fontSize: '14px' }}>{error}</p>
          )}
        </div>
      )}
    </>
  );
}
