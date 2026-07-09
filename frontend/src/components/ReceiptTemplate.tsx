import React from 'react';
import './ReceiptTemplate.css';
import signatureImg from '../assets/signature.jpg';

export interface ReceiptTemplateProps {
  receiptNumber?: string;
  date?: string;
  memberName?: string;
  amount?: number | string;
  amountInWords?: string;
  membershipType?: string;
  journalYear?: string;
  paymentMethod?: string;
  transactionId?: string;
  status?: 'PAID' | string;
}

export const ReceiptTemplate: React.FC<ReceiptTemplateProps> = ({
  receiptNumber,
  date,
  memberName,
  amount,
  amountInWords,
  membershipType,
  journalYear,
  paymentMethod,
  transactionId,
  status,
}) => {
  // Helper to format currency
  const formatAmount = (amt?: number | string) => {
    if (amt === undefined || amt === null || amt === '') return '';
    const numeric = typeof amt === 'string' ? parseFloat(amt.replace(/[^\d.]/g, '')) : amt;
    if (isNaN(numeric)) return amt.toString();
    return `${numeric.toLocaleString('en-IN')}/-`;
  };

  // Helper to check if a field is populated
  const isPopulated = (val?: string | number) => {
    return val !== undefined && val !== null && val !== '';
  };

  return (
    <div className="receipt-container-wrapper">
      <div className="receipt-card">

        {/* Central Seal Watermark - Positioned like the physical stamp */}
        <div className="receipt-center-seal">
          <img src="/seal.png" alt="Official Seal" className="receipt-seal-image" />
        </div>

        {/* Header Block */}
        <div className="receipt-header">
          <div className="receipt-logo-container">
            <img src="/logo.png" alt="KMA Logo" className="receipt-header-logo" />
          </div>
          <div className="receipt-header-titles">
            <h1 className="receipt-main-title">BULLETIN OF KERALA MATHEMATICS ASSOCIATION</h1>
            <h2 className="receipt-subtitle">Official Journal of the Kerala Mathematical Association</h2>
            <p className="receipt-reg-issn">Register No. KERENG/2004/17381, ISSN 0973-2721</p>
          </div>
        </div>

        {/* Horizontal Divider Line */}
        <hr className="receipt-header-line" />

        {/* Meta Row: Receipt Number, Receipt Label, Date */}
        <div className="receipt-meta-row">
          <div className="receipt-meta-no">
            <span className="receipt-meta-label">No.</span>
            <span className="receipt-meta-val-no">
              {isPopulated(receiptNumber) ? receiptNumber : <span className="empty-dots empty-dots-short"></span>}
            </span>
          </div>
          <div className="receipt-label-pill">
            <span>RECEIPT</span>
          </div>
          <div className="receipt-meta-date">
            <span className="receipt-meta-label">Date :</span>
            <span className="receipt-meta-val-date">
              {isPopulated(date) ? date : <span className="empty-dots empty-dots-medium"></span>}
            </span>
          </div>
        </div>

        {/* Receipt Lines Grid */}
        <div className="receipt-body">
          {/* Line 1: Received with thanks from */}
          <div className="receipt-body-multiline-row">
            <span className="receipt-body-label-inline">Received with thanks from</span>
            <span className="receipt-body-value-inline">{memberName || ''}</span>
            <div className="receipt-print-line receipt-print-line-1"></div>
            <div className="receipt-print-line receipt-print-line-2"></div>
          </div>

          {/* Line 2: The sum of Rupees */}
          <div className="receipt-body-multiline-row">
            <span className="receipt-body-label-inline">the sum of Rupees (UPI / Card / Net Banking / Wallet)</span>
            <span className="receipt-body-value-inline">{amountInWords || ''}</span>
            <div className="receipt-print-line receipt-print-line-1"></div>
            <div className="receipt-print-line receipt-print-line-2"></div>
          </div>

          {/* Line 3: Subscription to the journal */}
          <div className="receipt-body-multiline-row">
            <span className="receipt-body-label-inline">being the subscription to the journal for the year</span>
            <span className="receipt-body-value-inline">
              {isPopulated(membershipType) && isPopulated(journalYear)
                ? `${membershipType} - ${journalYear}`
                : isPopulated(membershipType)
                  ? membershipType
                  : isPopulated(journalYear)
                    ? journalYear
                    : ''}
            </span>
            <div className="receipt-print-line receipt-print-line-1"></div>
            <div className="receipt-print-line receipt-print-line-2"></div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="receipt-footer">
          {/* Footer Left: Amount, Payment Method, Txn ID, realize footnote */}
          <div className="receipt-footer-left">
            {/* Rs. Amount block */}
            <div className="receipt-rs-row">
              <span className="receipt-rs-label">Rs.</span>
              <div className="receipt-rs-field-wrapper">
                <span className="receipt-rs-value">{isPopulated(amount) ? formatAmount(amount) : ''}</span>
                <div className="receipt-rs-solid-line"></div>
              </div>
            </div>

            {/* Payment Method & Transaction ID lines */}
            <div className="receipt-meta-field">
              <span className="receipt-meta-field-label">Payment Method:</span>
              <div className="receipt-meta-field-wrapper">
                <span className="receipt-meta-field-value">{paymentMethod || ''}</span>
              </div>
            </div>

            <div className="receipt-meta-field">
              <span className="receipt-meta-field-label">Transaction ID:</span>
              <div className="receipt-meta-field-wrapper">
                <span className="receipt-meta-field-value">{transactionId || ''}</span>
              </div>
            </div>

            {/* Cheque realization notice */}
            {paymentMethod?.toLowerCase().includes('cheque') && (
              <p className="receipt-cheque-notice">* Cheques are subject to realisation</p>
            )}
          </div>

          {/* Footer Right: Executive Editor signature area */}
          <div className="receipt-footer-right">
            {/* Signature Area */}
            <div className="receipt-signature-area">
              <div className="receipt-signature-space">
                {status?.toUpperCase() === 'PAID' && (
                  <img src={signatureImg} alt="Digital Signature" className="receipt-signature-img" />
                )}
              </div>
              <p className="receipt-signee-label">Executive Editor</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
