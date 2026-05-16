'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Star, CheckCircle, Truck, Package } from 'lucide-react';
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
  const [paymentDate] = useState(new Date());

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

  // Live delivery status updates via socket
  useEffect(() => {
    if (!socket) return;
    socket.emit('joinAuction', carId);
    const handleDelivery = (data: any) => {
      console.log('[PaymentPage] deliveryUpdate received:', data);
      setShippingStatus(data.status);
    };
    socket.on('deliveryUpdate', handleDelivery);
    return () => { socket.off('deliveryUpdate', handleDelivery); };
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

  if (loading) return <div style={{ padding: '80px', textAlign: 'center', color: '#3b4b89', fontSize: '18px' }}>Loading...</div>;
  if (!car) return <div style={{ padding: '80px', textAlign: 'center', color: '#ef4444' }}>Car not found</div>;

  const winner = bids.length > 0 ? bids[0] : null;
  const sellerId = car.sellerId?._id || car.sellerId?.id || car.sellerId?.toString() || '';
  const isSeller = currentUserId && sellerId && currentUserId === sellerId.toString();
  const winnerId = winner?.userId?._id || winner?.userId?.id || '';
  const isWinner = currentUserId && winnerId && currentUserId === winnerId;
  const winningAmount = winner?.amount || car.currentBid || 0;
  const lotNo = car._id?.toString().slice(-6).toUpperCase();

  // Track steps: sold = payment received, shipped = in transit, delivered
  const steps = [
    { key: 'sold', label: 'Ready For Shipping', sublabel: 'Payment Received' },
    { key: 'shipped', label: 'In Transit', sublabel: 'Vehicle In Transit' },
    { key: 'delivered', label: 'Delivered', sublabel: 'Vehicle Delivered' },
  ];

  const stepOrder = ['sold', 'shipped', 'delivered'];
  const currentStepIdx = stepOrder.indexOf(shippingStatus);

  // Estimated delivery = payment date + 7 days
  const estDelivery = new Date(paymentDate);
  estDelivery.setDate(estDelivery.getDate() + 7);

  const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageTitleContainer}>
          <h1 className={styles.pageTitle}>{car.make} {car.modelName}</h1>
          <div className={styles.titleUnderline}></div>
        </div>
        <p className={styles.pageSubtitle}>Track your winning auction and delivery progress below.</p>
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span className={styles.breadcrumbSpan}>{'>'}</span>
          <Link href={`/auctions/${carId}`}>Auction Detail</Link>
          <span className={styles.breadcrumbSpan}>{'>'}</span>
          <span>Payment & Tracking</span>
        </div>
      </div>

      {/* Car info section */}
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

        {/* Stats Strip */}
        <div className={styles.statsStrip}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{fmt(new Date(car.endTime))}</span>
            <span className={styles.statLabel}>Winning Date</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{new Date(car.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
            <span className={styles.statLabel}>End Time</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue} style={{ color: '#22c55e' }}>${winningAmount.toLocaleString()}</span>
            <span className={styles.statLabel}>Winning Bid</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{lotNo}</span>
            <span className={styles.statLabel}>Lot No.</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{bids.length}</span>
            <span className={styles.statLabel}>Total Bids</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{winner?.userId?.name || winner?.userId?.username || 'Winner'}</span>
            <span className={styles.statLabel}>Winner</span>
          </div>
        </div>
      </div>

      {/* ===== STEPS OF PAYMENT SECTION ===== */}
      <div className={styles.paymentSectionWrapper}>
        <h2 className={styles.paymentSectionTitle}>Steps of Payment</h2>

        <div className={styles.paymentLayout}>
          {/* LEFT: Order info cards — one per completed step */}
          <div className={styles.paymentLeft}>

            {/* Card 1: Winning info — always shown */}
            <div className={styles.paymentRowBox}>
              <div className={styles.paymentRowItem}>
                <div className={styles.dateText}>{fmt(new Date(car.endTime))}</div>
                <div className={styles.subLabel}>Winning Date</div>
              </div>
              <div className={styles.paymentRowItem}>
                <div className={styles.timeText}>{new Date(car.endTime).toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit'})}</div>
                <div className={styles.subLabel}>End Time</div>
              </div>
              <div className={styles.paymentRowItem}>
                <div className={styles.priceText}>${winningAmount.toLocaleString()}</div>
                <div className={styles.subLabel}>Winning Bid</div>
              </div>
              <div className={styles.paymentRowItem} style={{ textAlign: 'right' }}>
                <div className={styles.lotText}>{lotNo}</div>
                <div className={styles.subLabel}>Lot No.</div>
              </div>
            </div>

            {/* Card 2: Payment info — shown after payment (sold/shipped/delivered) */}
            {(['sold', 'shipped', 'delivered'] as string[]).includes(shippingStatus) && (
              <div className={styles.paymentRowBox}>
                <div className={styles.paymentRowItem}>
                  <div className={styles.dateText}>{fmt(paymentDate)}</div>
                  <div className={styles.subLabel}>Payment Date</div>
                </div>
                <div className={styles.paymentRowItem}>
                  <div className={styles.dateText}>{fmt(estDelivery)}</div>
                  <div className={styles.subLabel}>Expected Delivery Date</div>
                </div>
                <div className={styles.paymentRowItem}>
                  <div className={styles.priceText}>${winningAmount.toLocaleString()}</div>
                  <div className={styles.subLabel}>Amount Paid</div>
                </div>
                <div className={styles.paymentRowItem} style={{ textAlign: 'right' }}>
                  <div className={styles.lotText}>{lotNo}</div>
                  <div className={styles.subLabel}>Lot No.</div>
                </div>
              </div>
            )}

            {/* Card 3: Shipping/Delivered info */}
            {(['shipped', 'delivered'] as string[]).includes(shippingStatus) && (
              <div className={styles.paymentRowBox}>
                <div className={styles.paymentRowItem}>
                  <div className={styles.dateText}>{fmt(new Date())}</div>
                  <div className={styles.subLabel}>Shipped Date</div>
                </div>
                <div className={styles.paymentRowItem}>
                  <div className={styles.dateText}>{fmt(estDelivery)}</div>
                  <div className={styles.subLabel}>{shippingStatus === 'delivered' ? 'Vehicle Delivered' : 'Expected Delivery'}</div>
                </div>
                <div className={styles.paymentRowItem}>
                  <div className={styles.priceText}>${winningAmount.toLocaleString()}</div>
                  <div className={styles.subLabel}>Winning Price</div>
                </div>
                <div className={styles.paymentRowItem} style={{ textAlign: 'right' }}>
                  <div className={styles.lotText}>{lotNo}</div>
                  <div className={styles.subLabel}>Lot No.</div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Horizontal progress tracker */}
          <div className={styles.paymentRight}>

            {/* Horizontal tracker — like the image */}
            <div className={styles.trackerCard}>
              <div className={styles.trackerDates}>
                <div>
                  <div className={styles.trackerDateVal}>{fmt(paymentDate)}</div>
                  <div className={styles.trackerDateLabel}>Payment Date</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className={styles.trackerDateVal}>{fmt(estDelivery)}</div>
                  <div className={styles.trackerDateLabel}>
                    {shippingStatus === 'delivered' ? 'Vehicle Delivered' : 'Expected Delivery Date'}
                  </div>
                </div>
              </div>

              {/* Progress bar with dots */}
              <div className={styles.progressBar}>
                {steps.map((step, idx) => {
                  const done = currentStepIdx >= idx;
                  const isLast = idx === steps.length - 1;
                  return (
                    <div key={step.key} className={styles.progressStep} style={{ flex: isLast ? 0 : 1 }}>
                      <div className={styles.progressDotWrapper}>
                        <div className={`${styles.progressDot} ${done ? styles.progressDotDone : styles.progressDotPending}`}>
                          {done ? <CheckCircle size={14} color="white" strokeWidth={3} /> : null}
                        </div>
                        {!isLast && (
                          <div className={styles.progressLine}>
                            <div
                              className={styles.progressLineFill}
                              style={{ width: currentStepIdx > idx ? '100%' : '0%' }}
                            />
                          </div>
                        )}
                      </div>
                      <div className={`${styles.progressLabel} ${done ? styles.progressLabelDone : ''}`}>
                        {step.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* "Bidding has ended" text */}
            <div className={styles.biddingEndedText}>Bidding has ended</div>

            {/* Seller Shipping Controls */}
            {isSeller && (
              <div className={styles.sellerControls}>
                <h4 className={styles.sellerControlsTitle}>📦 Update Shipping Status</h4>
                <div className={styles.sellerBtnRow}>
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
                        className={`${styles.sellerBtn} ${isActive ? styles.sellerBtnActive : ''}`}
                      >
                        {statusUpdating ? 'Updating...' : btn.label}
                      </button>
                    );
                  })}
                </div>
                {error && <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '8px' }}>{error}</p>}
              </div>
            )}

            {/* Winner info panel */}
            {(isWinner || isSeller) && (
              <div className={styles.winnerPanel}>
                <div className={styles.winnerPanelHeader}>🏆 Winner Details</div>
                <div className={styles.winnerPanelBody}>
                  <div className={styles.winnerInfoRow}>
                    <span className={styles.winnerInfoLabel}>Name</span>
                    <span className={styles.winnerInfoValue}>{winner?.userId?.name || winner?.userId?.username || 'N/A'}</span>
                  </div>
                  <div className={styles.winnerInfoRow}>
                    <span className={styles.winnerInfoLabel}>Email</span>
                    <span className={styles.winnerInfoValue}>{winner?.userId?.email || 'N/A'}</span>
                  </div>
                  <div className={styles.winnerInfoRow}>
                    <span className={styles.winnerInfoLabel}>Phone</span>
                    <span className={styles.winnerInfoValue}>{winner?.userId?.phone || 'N/A'}</span>
                  </div>
                  <div className={styles.winnerInfoRow}>
                    <span className={styles.winnerInfoLabel}>Winning Bid</span>
                    <span className={styles.winnerInfoValue} style={{ color: '#22c55e', fontWeight: 700 }}>${winningAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
