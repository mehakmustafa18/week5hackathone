'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp } from 'lucide-react';
import styles from './Sell.module.css';

import api from '@/lib/api';

// Reusable Custom Select Component matching the screenshot perfectly
const CustomSelect = ({ options, value, onChange, placeholder }: any) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={styles.customSelectWrapper} ref={ref}>
      <div 
        className={styles.customSelectBtn} 
        style={{ borderBottomLeftRadius: open ? 0 : 4, borderBottomRightRadius: open ? 0 : 4 }}
        onClick={() => setOpen(!open)}
      >
        <span>{value || placeholder || 'Select'}</span>
        {open ? <ChevronUp size={16} color="#1a2e6e" /> : <ChevronDown size={16} color="#1a2e6e" />}
      </div>
      {open && (
        <div className={styles.customSelectDropdown}>
          {options.map((opt: string) => (
            <div 
              key={opt} 
              className={`${styles.customSelectOption} ${value === opt ? styles.selected : ''}`}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function SellPage() {
  const router = useRouter();
  const [sellerType, setSellerType] = useState('Dealer');
  const [modifiedType, setModifiedType] = useState('Completely stock');
  
  // Custom Select States
  const [year, setYear] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [engineSize, setEngineSize] = useState('');
  const [paint, setPaint] = useState('');
  const [gccSpecs, setGccSpecs] = useState('');
  const [accidentHistory, setAccidentHistory] = useState('');
  const [serviceHistory, setServiceHistory] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [auctionEndDate, setAuctionEndDate] = useState('');
  const [auctionEndTime, setAuctionEndTime] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const handleSubmit = async () => {
    setError(null);
    setSuccess(false);

    // Double-check authentication before submitting
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    if (!make || !model || !year || !basePrice || !auctionEndDate || !auctionEndTime || files.length === 0) {
      setError('Please fill in Year, Make, Model, Base Price, Auction End Date/Time, and upload at least one photo.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('make', make);
      formData.append('modelName', model);
      formData.append('year', year.toString());
      formData.append('basePrice', basePrice.toString());
      formData.append('bodyType', 'sedan'); // default or dynamic
      formData.append('category', 'car'); // default or dynamic
      formData.append('description', description || `${sellerType} | ${engineSize} | ${paint} | GCC: ${gccSpecs} | Accident: ${accidentHistory} | Modified: ${modifiedType}`);
      
      // New specific fields for filtering
      formData.append('engineSize', engineSize);
      formData.append('paint', paint);
      formData.append('gccSpecs', gccSpecs);
      formData.append('accidentHistory', accidentHistory);
      formData.append('serviceHistory', serviceHistory);
      formData.append('modifiedType', modifiedType);
      formData.append('sellerType', sellerType);

      const combinedEndTime = new Date(`${auctionEndDate}T${auctionEndTime}`);
      formData.append('endTime', combinedEndTime.toISOString());

      files.forEach(file => {
        formData.append('images', file);
      });

      await api.post('/cars', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccess(true);
      
      // Reset form fields
      setYear('');
      setMake('');
      setModel('');
      setEngineSize('');
      setPaint('');
      setGccSpecs('');
      setAccidentHistory('');
      setServiceHistory('');
      setDescription('');
      setBasePrice('');
      setAuctionEndDate('');
      setAuctionEndTime('');
      setFiles([]);
      
      setTimeout(() => {
        setSuccess(false);
        router.push('/sell'); 
      }, 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to submit car details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Sell Your Car</h1>
        <p className={styles.pageSubtitle}>Lorem ipsum dolor sit amet consectetur. At in pretium semper vitae eu eu mus.</p>
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span className={styles.breadcrumbSpan}>{'>'}</span>
          <span>Sell Your Car</span>
        </div>
      </div>

      <div className={styles.contentWrapper}>
        <h2 className={styles.mainTitle}>Tell us about your car</h2>
        <p className={styles.introText}>
          Please give us some basics about yourself and car you'll like to sell. We'll also need
          details about the car's title status as well as 50 photos that highlight the car's exterior and
          interior condition.
          <br/><br/>
          We'll respond to your application within a business day, and we work with you to build a
          custom and professional listing and get the auction live.
        </p>

        {/* Your Info */}
        <div className={styles.formBox}>
          <div className={styles.sectionTitle}>Your Info</div>
          
          <div className={styles.formGroup} style={{marginBottom: '20px'}}>
            <label className={styles.label}>Dealer or Private party?</label>
            <div className={styles.radioGroup}>
              <button 
                type="button"
                className={`${styles.radioBtn} ${sellerType === 'Dealer' ? styles.active : ''}`}
                onClick={() => setSellerType('Dealer')}
              >
                Dealer
              </button>
              <button 
                type="button"
                className={`${styles.radioBtn} ${sellerType === 'Private party' ? styles.active : ''}`}
                onClick={() => setSellerType('Private party')}
              >
                Private party
              </button>
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>First name<span>*</span></label>
              <input type="text" className={styles.inputControl} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Last name<span>*</span></label>
              <input type="text" className={styles.inputControl} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Email<span>*</span></label>
              <input type="email" className={styles.inputControl} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>phone number<span>*</span></label>
              <div className={styles.phoneInputGroup}>
                <select className={styles.countryCode}>
                  <option>PK (92)</option>
                  <option>US (1)</option>
                </select>
                <input type="tel" className={styles.phoneInput} />
              </div>
            </div>
          </div>
        </div>

        {/* Car Details */}
        <div className={styles.formBox}>
          <div className={styles.sectionTitle}>Car Details</div>
          
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>VIN<span>*</span></label>
              <input type="text" className={styles.inputControl} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Year<span>*</span></label>
              <CustomSelect 
                options={['2024', '2023', '2022', '2021', '2020']} 
                value={year} 
                onChange={setYear} 
                placeholder="Select Year" 
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Make<span>*</span></label>
              <CustomSelect 
                options={['Audi', 'BMW', 'Honda', 'Toyota']} 
                value={make} 
                onChange={setMake} 
                placeholder="Select Make" 
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Model<span>*</span></label>
              <CustomSelect 
                options={['Model S', 'M4', 'Civic', 'Corolla']} 
                value={model} 
                onChange={setModel} 
                placeholder="All Models" 
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Mileage (in miles)</label>
              <input type="number" className={styles.inputControl} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Engine size</label>
              <CustomSelect 
                options={['4 Cylinder', '6 Cylinder', '8 Cylinder', '10 Cylinder', '12 Cylinder']} 
                value={engineSize} 
                onChange={setEngineSize} 
                placeholder="Select" 
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Paint<span>*</span></label>
              <CustomSelect 
                options={['Original paint', 'Partially Repainted', 'Totally Repainted']} 
                value={paint} 
                onChange={setPaint} 
                placeholder="Select" 
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Has GCC Specs</label>
              <CustomSelect 
                options={['Yes', 'No']} 
                value={gccSpecs} 
                onChange={setGccSpecs} 
                placeholder="Select" 
              />
            </div>
          </div>

          <div className={styles.formGroup} style={{marginBottom: '20px'}}>
            <label className={styles.label}>Noteworthy options/features</label>
            <textarea className={styles.textareaControl} value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Accident History</label>
              <CustomSelect 
                options={['Yes', 'No']} 
                value={accidentHistory} 
                onChange={setAccidentHistory} 
                placeholder="Select" 
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Full Service History</label>
              <CustomSelect 
                options={['Yes', 'No']} 
                value={serviceHistory} 
                onChange={setServiceHistory} 
                placeholder="Select" 
              />
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Has the car been modified?</label>
              <div className={styles.radioGroup}>
                <button 
                  type="button"
                  className={`${styles.radioBtn} ${modifiedType === 'Completely stock' ? styles.active : ''}`}
                  onClick={() => setModifiedType('Completely stock')}
                >
                  Completely stock
                </button>
                <button 
                  type="button"
                  className={`${styles.radioBtn} ${modifiedType === 'Modified' ? styles.active : ''}`}
                  onClick={() => setModifiedType('Modified')}
                >
                  Modified
                </button>
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Starting Bid / Base Price<span>*</span></label>
              <input type="number" placeholder="$" className={styles.inputControl} value={basePrice} onChange={(e) => setBasePrice(e.target.value)} />
            </div>
          </div>

          <div className={styles.formGrid} style={{marginTop: '20px'}}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Auction End Date<span>*</span></label>
              <input type="date" className={styles.inputControl} value={auctionEndDate} onChange={(e) => setAuctionEndDate(e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Auction End Time<span>*</span></label>
              <input type="time" className={styles.inputControl} value={auctionEndTime} onChange={(e) => setAuctionEndTime(e.target.value)} />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Upload Photos</label>
            <div>
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                ref={fileInputRef} 
                onChange={(e) => {
                  if (e.target.files) {
                    setFiles(Array.from(e.target.files));
                  }
                }}
                style={{ display: 'none' }} 
              />
              <button type="button" className={styles.addPhotosBtn} onClick={() => fileInputRef.current?.click()}>
                Add Photos ({files.length} selected)
              </button>
            </div>
            {files.length > 0 && <div style={{marginTop: '10px', fontSize: '14px', color: '#6b7280'}}>{files.map(f => f.name).join(', ')}</div>}
          </div>
          
          {error && <div style={{ color: '#dc2626', backgroundColor: '#fef2f2', padding: '10px', borderRadius: '5px', marginBottom: '15px', fontSize: '14px' }}>{error}</div>}
          {success && <div style={{ color: '#16a34a', backgroundColor: '#f0fdf4', padding: '10px', borderRadius: '5px', marginBottom: '15px', fontSize: '14px' }}>Car submitted successfully! Redirecting...</div>}

          <button type="button" className={styles.submitBtn} onClick={handleSubmit} disabled={loading}>
            {loading ? 'Uploading Images...' : 'Submit'}
          </button>
        </div>
      </div>
    </>
  );
}
