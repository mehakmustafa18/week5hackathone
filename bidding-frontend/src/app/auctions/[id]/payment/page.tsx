'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Star, Package, Truck, CheckCircle } from 'lucide-react';
import styles from './Payment.module.css';
import api from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import CountdownTimer from '@/components/CountdownTimer';

export default function MakePaymentPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const carId = params.id;
  const { socket } = useSocket();
  const [car, setCar] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [shippingStatus, setShippingStatus] = useState<string>('sold');
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current logged-in user
  const currentUser = typeof window !== 'undefined' ? (() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  })() : null;
  const currentUserId = currentUser?._id || currentUser?.id || '';

  useEffect(() => {
    const fetchCar = async () => {
      try {
        const [carRes, bidsRes] = await Promise.all([
          api.get(`/cars/${carId}`),
          api.get(`/bids/car/${carId}`),
        ]);
        setCar(carRes.data);
        setBids(bidsRes.data);
        setShippingStatus(carRes.data.status || 'sold');
      } catch (error) {
        console.error('Error fetching car:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCar();
  }, [carId]);

  // Live delivery status updates
  useEffect(() => {
    if (!socket) return;
    socket.emit('joinAuction', carId);
    socket.on('deliveryUpdate', (data: any) => {
      setShippingStatus(data.status);
    });
    return () => { socket.off('deliveryUpdate'); };
  }, [socket, carId]);

  const handleUpdateStatus = async (status: string) => {
    setStatusUpdating(true);
    setError(null);
    try {
      await api.patch(`/payments/${carId}/status`, { status });
      setShippingStatus(status);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading) return <div style={{padding: '40px', textAlign: 'center', color:'white'}}>Loading...</div>;
  if (!car) return <div style={{padding: '40px', textAlign: 'center', color:'white'}}>Car not found</div>;

  const winner = bids.length > 0 ? bids[0] : null;
  const sellerId = car.sellerId?._id || car.sellerId?.id || car.sellerId?.toString() || '';
  const isSeller = currentUserId && sellerId && currentUserId === sellerId.toString();
  const winnerId = winner?.userId?._id || winner?.userId?.id || '';
  const isWinner = currentUserId && winnerId && currentUserId === winnerId;

  const shippingSteps = [
    { key: 'sold', label: 'Payment Received', date: car.updatedAt ? new Date(car.updatedAt).toLocaleDateString() : '--', icon: <Package size={20} /> },
    { key: 'shipped', label: 'In Transit', date: 'Pending', icon: <Truck size={20} /> },
    { key: 'delivered', label: 'Delivered', date: 'Pending', icon: <CheckCircle size={20} /> },
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
          <Link href={`/auctions/${params.id}`}>Auction Detail</Link>
          <span className={styles.breadcrumbSpan}>{'>'}</span>
          <span>Payment</span>
        </div>
      </div>

      <div className={styles.mainLayout}>
        <div className={styles.carHeaderBar}>
          <span className={styles.carHeaderTitle}>{car.make} {car.modelName}</span>
          <Star size={18} fill="currentColor" color="#f5c518" />
        </div>

        <div className={styles.galleryArea}>
          <div className={styles.mainImageWrapper}>
            <span className={styles.liveTag}>{car.status?.toUpperCase() || 'SOLD'}</span>
            <img src={car.images?.[0] || 'https://placehold.co/800x600/ffffff/555555?text=Car'} alt={car.modelName} className={styles.mainImage} />
          </div>
          <div className={styles.thumbnailsArea}>
            {car.images?.slice(0, 4).map((img: string, idx: number) => (
              <div key={idx} className={styles.thumbnailWrapper}>
                <img src={img} className={styles.thumbnailImage} alt={`Thumb ${idx}`} />
              </div>
            ))}
          </div>
        </div>

        <div className={styles.statsStrip}>
          <div className={styles.statItem}>
            <div className={styles.timerBoxes} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CountdownTimer endTime={car.endTime} />
            </div>
            <span className={styles.statLabel}>Auction Ended</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>${winner?.amount?.toLocaleString() || car.currentBid?.toLocaleString()}</span>
            <span className={styles.statLabel}>Winning Bid</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{new Date(car.endTime).toLocaleDateString()}</span>
            <span className={styles.statLabel}>End Time</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>$100</span>
            <span className={styles.statLabel}>Min. Increment</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{bids.length}</span>
            <span className={styles.statLabel}>Total Bids</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{car._id?.toString().slice(-6).toUpperCase()}</span>
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

            {/* Winner info - shown to all */}
            <div className={styles.boxHeader}>Winner</div>
            <div className={styles.boxContent}>
              <div className={styles.bidderProfile}>
                <img
                  src={winner?.userId?.profilePicture || `https://placehold.co/100x100/3b4b89/ffffff?text=${(winner?.userId?.name?.[0] || 'W')}`}
                  alt="Winner"
                  className={styles.bidderAvatar}
                />
                <div className={styles.bidderInfoGrid}>
                  <span className={styles.infoLabel}>Full Name</span>
                  <span className={styles.infoValue}>{winner?.userId?.name || winner?.userId?.username || 'Anonymous'}</span>
                  <span className={styles.infoLabel}>Email</span>
                  <span className={styles.infoValue}>{winner?.userId?.email || 'N/A'}</span>
                  <span className={styles.infoLabel}>Mobile Number</span>
                  <span className={styles.infoValue}>{winner?.userId?.phone || 'N/A'}</span>
                  <span className={styles.infoLabel}>Nationality</span>
                  <span className={styles.infoValue}>International</span>
                  <span className={styles.infoLabel}>ID Status</span>
                  <span className={styles.infoValue}>Verified</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.rightColumn}>
            <div className={styles.boxHeader}>Bidders List</div>
            <div className={`${styles.boxContent} ${styles.biddersList}`} style={{padding: 0}}>
              {bids.length === 0 ? (
                <div className={styles.bidderRow}><span className={styles.bidderRowLabel}>No bids.</span></div>
              ) : (
                bids.map((b, i) => (
                  <div key={b._id} className={styles.bidderRow}>
                    <span className={styles.bidderRowLabel}>{b.userId?.name || b.userId?.username || `Bidder ${i + 1}`}</span>
                    <span className={styles.bidderRowValue}>$ {b.amount?.toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== STEPS OF PAYMENT / SHIPPING TRACKER ===== */}
      <div className={styles.paymentSectionWrapper}>
        <h2 className={styles.paymentSectionTitle}>Steps of Payment</h2>

        <div className={styles.paymentLayout}>
          {/* Left: Status rows */}
          <div className={styles.paymentLeft}>
            <div className={styles.paymentRowBox}>
              <div>
                <div className={styles.dateText}>{new Date(car.endTime).toLocaleDateString()}</div>
                <div className={styles.subLabel}>Winning Time</div>
              </div>
              <div><div className={styles.phaseText}>Winning Bid</div></div>
              <div>
                <div className={styles.priceText}>${winner?.amount?.toLocaleString() || car.currentBid?.toLocaleString()}</div>
                <div className={styles.subLabel}>Winning Price</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div className={styles.lotText}>{car._id?.toString().slice(-6).toUpperCase()}</div>
                <div className={styles.subLabel}>Lot No.</div>
              </div>
            </div>

            {['sold', 'shipped', 'delivered'].includes(shippingStatus) && (
              <div className={styles.paymentRowBox}>
                <div>
                  <div className={styles.dateText}>{new Date().toLocaleDateString()}</div>
                  <div className={styles.subLabel}>Payment Date</div>
                </div>
                <div><div className={styles.phaseText}>Payment Complete</div></div>
                <div>
                  <div className={styles.priceText}>${winner?.amount?.toLocaleString() || car.currentBid?.toLocaleString()}</div>
                  <div className={styles.subLabel}>Winning Price</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div className={styles.lotText}>{car._id?.toString().slice(-6).toUpperCase()}</div>
                  <div className={styles.subLabel}>Lot No.</div>
                </div>
              </div>
            )}

            {['shipped', 'delivered'].includes(shippingStatus) && (
              <div className={styles.paymentRowBox}>
                <div>
                  <div className={styles.dateText}>{new Date().toLocaleDateString()}</div>
                  <div className={styles.subLabel}>Shipped Date</div>
                </div>
                <div><div className={styles.phaseText}>Ready for Ship</div></div>
                <div>
                  <div className={styles.priceText}>${winner?.amount?.toLocaleString() || car.currentBid?.toLocaleString()}</div>
                  <div className={styles.subLabel}>Winning Price</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div className={styles.lotText}>{car._id?.toString().slice(-6).toUpperCase()}</div>
                  <div className={styles.subLabel}>Lot No.</div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Timeline + Seller controls */}
          <div className={styles.paymentRight}>
            {shippingSteps.map((step, idx) => (
              <div key={step.key} className={styles.timelineItem}>
                <div className={styles.timelineDates}>
                  <span className={styles.tlDatePrimary}>{idx <= currentStepIdx ? new Date().toLocaleDateString() : '--'}</span>
                  <span className={styles.tlDateSecondary}>{step.date}</span>
                </div>
                <div className={styles.timelineBar}>
                  <div className={styles.timelineBarFill} style={{ width: idx <= currentStepIdx ? '100%' : '0%' }}></div>
                  <div className={styles.timelineDot} style={{ left: '0%' }}></div>
                  <div className={`${styles.timelineDot} ${idx <= currentStepIdx ? styles.timelineDotEnd : ''}`}></div>
                </div>
                <div className={styles.timelineLabels}>
                  <div style={{textAlign:'left'}}>
                    <div className={styles.tlLabelPrimary}>{step.label}</div>
                    <div className={styles.tlLabelSecondary}>
                      {idx <= currentStepIdx ? '✅ Done' : 'Pending'}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className={styles.biddingEndedText}>Bidding has ended</div>

            {/* Seller Shipping Controls */}
            {isSeller && (
              <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ color: 'white', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Update Shipping Status:</h4>
                {[
                  { status: 'sold', label: '✅ Ready for Shipping' },
                  { status: 'shipped', label: '🚚 In Transit' },
                  { status: 'delivered', label: '📬 Delivered' },
                ].map((btn) => {
                  const isActive = shippingStatus === btn.status;
                  return (
                    <button
                      key={btn.status}
                      onClick={() => handleUpdateStatus(btn.status)}
                      disabled={statusUpdating || isActive}
                      style={{
                        padding: '10px 20px', borderRadius: '6px',
                        border: isActive ? '2px solid #f5c518' : '2px solid #334155',
                        background: isActive ? '#f5c518' : '#1e293b',
                        color: isActive ? '#1a2e6e' : 'white',
                        fontWeight: 600, fontSize: '13px',
                        cursor: isActive || statusUpdating ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {statusUpdating ? 'Updating...' : btn.label}
                    </button>
                  );
                })}
                {error && <p style={{ color: '#ef4444', fontSize: '13px' }}>{error}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
