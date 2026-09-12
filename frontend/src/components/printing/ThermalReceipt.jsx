import { QRCodeSVG } from 'qrcode.react';
import './thermal-receipt.css';

const money = (cents, currency = 'PHP') => `${currency} ${(Number(cents || 0) / 100).toFixed(2)}`;

const ThermalReceipt = ({ receipt, paperWidth = '58mm', isReprint = false, className = '' }) => {
    if (!receipt) return null;
    const createdAt = new Date(receipt.createdAt);
    return (
        <article className={`thermal-receipt paper-${paperWidth.replace('mm', '')} ${className}`} aria-label="Thermal receipt">
            {isReprint && <div className="receipt-reprint">REPRINT</div>}
            <header className="receipt-center receipt-section">
                <h2>{receipt.organizationName}</h2>
                <p>{receipt.address}</p>
                <p>{receipt.contact}</p>
            </header>
            <section className="receipt-section receipt-meta">
                <p><span>Receipt</span><strong>{receipt.receiptNumber}</strong></p>
                <p><span>Date</span><strong>{Number.isNaN(createdAt.getTime()) ? receipt.createdAt : createdAt.toLocaleString()}</strong></p>
                <p><span>Visit</span><strong>{receipt.visitDate}</strong></p>
                <p><span>Staff</span><strong>{receipt.staffName}</strong></p>
                {receipt.visitorName && <p><span>Visitor</span><strong>{receipt.visitorName}</strong></p>}
            </section>
            <section className="receipt-section receipt-items">
                {receipt.items?.map(item => (
                    <div className="receipt-item" key={item.categoryCode}>
                        <div><strong>{item.quantity} x {item.categoryLabel}</strong><span>{money(item.unitPriceCents, receipt.currency)}</span></div>
                        {Number(item.discountCents) > 0 && <small>Discount: -{money(item.discountCents, receipt.currency)}</small>}
                        <b>{money(item.lineTotalCents, receipt.currency)}</b>
                    </div>
                ))}
            </section>
            <section className="receipt-section receipt-totals">
                <p><span>Subtotal</span><strong>{money(receipt.subtotalCents, receipt.currency)}</strong></p>
                {Number(receipt.discountCents) > 0 && <p><span>Discount</span><strong>-{money(receipt.discountCents, receipt.currency)}</strong></p>}
                <p className="receipt-grand-total"><span>Total</span><strong>{money(receipt.totalCents, receipt.currency)}</strong></p>
                <p><span>Received</span><strong>{money(receipt.payment?.amountReceivedCents, receipt.currency)}</strong></p>
                <p><span>Change</span><strong>{money(receipt.payment?.changeCents, receipt.currency)}</strong></p>
                <p><span>Payment</span><strong>{receipt.payment?.methodLabel || receipt.payment?.method} / {receipt.payment?.status}</strong></p>
            </section>
            {receipt.qrData && <div className="receipt-qr"><QRCodeSVG value={receipt.qrData} size={112} bgColor="#ffffff" fgColor="#000000" level="M" /><p>{receipt.receiptNumber}</p></div>}
            <footer className="receipt-center receipt-footer">{receipt.policyNote}</footer>
        </article>
    );
};

export default ThermalReceipt;
