import { QRCodeSVG } from 'qrcode.react';
import './thermal-receipt.css';

const ThermalReceipt = ({ receipt, paperWidth = '58mm', isReprint = false, className = '' }) => {
    if (!receipt) return null;
    const createdAt = new Date(receipt.createdAt);
    const validDate = !Number.isNaN(createdAt.getTime());
    const date = validDate ? createdAt.toLocaleDateString('en-PH', { timeZone: 'Asia/Manila', year: 'numeric', month: 'short', day: '2-digit' }) : receipt.createdAt;
    const time = validDate ? createdAt.toLocaleTimeString('en-PH', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit' }) : '-';
    return (
        <article className={`thermal-receipt paper-${paperWidth.replace('mm', '')} ${className}`} aria-label="Admission receipt">
            {isReprint && <div className="receipt-reprint">REPRINT</div>}
            <header className="receipt-center">
                <h1 className="receipt-title">Bulusan Zoo</h1>
            </header>
            <section className="receipt-details">
                <p><span>Ref.</span><strong>{receipt.receiptNumber}</strong></p>
                <p><span>Date</span><strong>{date}, {time}</strong></p>
                {(receipt.items || []).map(item => <p key={item.categoryCode}><span>Ticket</span><strong>{item.quantity} x {item.categoryLabel}</strong></p>)}
            </section>
            {receipt.qrData && <div className="receipt-qr"><QRCodeSVG value={receipt.qrData} size={150} bgColor="#ffffff" fgColor="#000000" level="M" /></div>}
        </article>
    );
};

export default ThermalReceipt;
