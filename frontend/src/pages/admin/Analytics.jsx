import { createElement, useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import * as XLSX from 'xlsx';
import { Activity, Calendar, ChartBar, CheckCircle, DollarCircle, Download, Pet, Print, Ticket, Users } from 'reicon-react';
import { adminAPI } from '../../services/api-client';
import { notify } from '../../utils/toast';

const numberFormat = new Intl.NumberFormat('en-PH');
const currencyFormat = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 });
const colors = ['#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444'];
const metricTones = { green: 'bg-green-100 text-green-700', blue: 'bg-blue-100 text-blue-700', purple: 'bg-purple-100 text-purple-700', amber: 'bg-amber-100 text-amber-700' };
const escapeHtml = value => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const longDate = value => {
    if (!value) return '';
    const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};
const exportTimestamp = () => new Date().toLocaleString('sv-SE').replace(' ', '_').replace(/:/g, '-');

const MetricCard = ({ icon, label, value, detail, tone = 'green' }) => (
    <article className="rounded-2xl border border-green-200 bg-white p-5 shadow-sm print:border-gray-300 print:shadow-none">
        <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl ${metricTones[tone]}`}>{createElement(icon, { className: 'h-6 w-6' })}</div>
        <p className="text-3xl font-black tabular-nums tracking-tight text-gray-950">{value}</p>
        <h2 className="mt-1 text-sm font-bold text-gray-800">{label}</h2>
        <p className="mt-2 text-xs leading-5 text-gray-500">{detail}</p>
    </article>
);

const Analytics = () => {
    const [timeRange, setTimeRange] = useState('week');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError('');
        adminAPI.getAnalytics(timeRange).then(response => {
            if (active) setData(response.data);
        }).catch(err => {
            if (active) setError(err.message || 'Analytics could not be loaded.');
        }).finally(() => {
            if (active) setLoading(false);
        });
        return () => { active = false; };
    }, [timeRange]);

    const summary = data?.summary || {};
    const daily = data?.dailyData || [];
    const statuses = data?.statusDistribution || [];
    const weekdays = data?.weekdayDemand || [];
    const mix = data?.admissionMix || [];
    const totalAdmissions = mix.reduce((sum, item) => sum + Number(item.count || 0), 0);
    const attendanceRate = summary.scheduledVisitors > 0 ? summary.checkedInVisitors / summary.scheduledVisitors * 100 : 0;
    const cancelled = statuses.find(item => item.status === 'cancelled')?.count || 0;
    const statusTotal = statuses.reduce((sum, item) => sum + item.count, 0);
    const cancellationRate = statusTotal > 0 ? cancelled / statusTotal * 100 : 0;
    const periodLabel = data?.meta ? `${longDate(data.meta.startDate)} to ${longDate(data.meta.endDate)}` : '';

    const baseChart = {
        chart: { toolbar: { show: false }, fontFamily: 'inherit', animations: { enabled: false } },
        dataLabels: { enabled: false },
        grid: { borderColor: '#e5e7eb', strokeDashArray: 4 },
        legend: { position: 'top', horizontalAlign: 'left' },
        tooltip: { theme: 'light' }
    };
    const chartDates = daily.map(item => new Date(`${item.date}T00:00:00`).getTime());
    const dateLabel = timestamp => new Date(timestamp).toLocaleDateString('en-US', timeRange === 'year' ? { month: 'short', year: 'numeric' } : { month: 'short', day: 'numeric' });
    const demandOptions = {
        ...baseChart,
        colors: [colors[0], colors[1]],
        stroke: { width: [0, 3], curve: 'straight' },
        xaxis: {
            type: 'datetime',
            categories: chartDates,
            tickAmount: timeRange === 'week' ? 6 : timeRange === 'month' ? 9 : 11,
            labels: { rotate: timeRange === 'year' ? 0 : -45, hideOverlappingLabels: true, formatter: value => dateLabel(Number(value)) },
            tooltip: { enabled: false }
        },
        tooltip: { shared: true, x: { formatter: timestamp => longDate(new Date(timestamp).toISOString().slice(0, 10)) } },
        yaxis: [{ title: { text: 'Visitors' }, min: 0, forceNiceScale: true }, { opposite: true, title: { text: 'Reservations' }, min: 0, forceNiceScale: true }]
    };
    const demandSeries = [{ name: 'Scheduled visitors', type: 'column', data: daily.map(item => item.visitors) }, { name: 'Reservations', type: 'line', data: daily.map(item => item.reservations) }];
    const weekdayOptions = { ...baseChart, colors: [colors[3]], plotOptions: { bar: { borderRadius: 6, horizontal: true } }, xaxis: { categories: weekdays.map(item => item.day) } };
    const mixOptions = { ...baseChart, labels: mix.map(item => item.type), colors, plotOptions: { pie: { donut: { size: '68%', labels: { show: true, total: { show: true, label: 'Admissions', formatter: () => numberFormat.format(totalAdmissions) } } } } } };

    const exportExcel = () => {
        if (!data) return;
        try {
            const workbook = XLSX.utils.book_new();
            const metadata = [
                ['Period', periodLabel], ['Date basis', data.meta.dateBasis],
                ['Included statuses', data.meta.includedStatuses.join(', ')],
                ['Fee assumptions', `Adult PHP ${data.meta.feeAssumptions.adult}; Child PHP ${data.meta.feeAssumptions.child}; Resident PHP ${data.meta.feeAssumptions.resident}`]
            ];
            const summaryRows = [
                ['Metric', 'Value'], ['Reservations', summary.reservations], ['Scheduled visitors', summary.scheduledVisitors],
                ['Checked-in visitors', summary.checkedInVisitors], ['Attendance rate', attendanceRate / 100],
                ['Estimated admission fees', summary.estimatedFees], ['Average party size', summary.averagePartySize],
                ['Pending verification', summary.pendingVerification], ['Cancellation rate', cancellationRate / 100],
                ['All-time users', summary.totalUsers], ['Animal inventory', summary.totalAnimals], ['Upcoming events', summary.upcomingEvents]
            ];
            const sheets = [
                ['Metadata', XLSX.utils.aoa_to_sheet(metadata)], ['Summary', XLSX.utils.aoa_to_sheet(summaryRows)],
                ['Daily Trend', XLSX.utils.json_to_sheet(daily.map(item => ({ ...item, date: longDate(item.date) })))], ['Status Breakdown', XLSX.utils.json_to_sheet(statuses)],
                ['Admission Mix', XLSX.utils.json_to_sheet(mix.map(item => ({ ...item, share: totalAdmissions ? item.count / totalAdmissions : 0 })))], ['Weekday Demand', XLSX.utils.json_to_sheet(weekdays)]
            ];
            sheets.forEach(([name, sheet]) => { sheet['!cols'] = Array.from({ length: 6 }, () => ({ wch: 22 })); XLSX.utils.book_append_sheet(workbook, sheet, name); });
            XLSX.writeFile(workbook, `Zoo_Analytics_${data.meta.startDate}_${data.meta.endDate}.xlsx`);
            notify.success('Analytics exported.');
        } catch (err) {
            notify.error(err.message || "Couldn't export analytics.");
        }
    };

    const printReport = () => {
        const metricRows = [
            ['Confirmed/completed reservations', numberFormat.format(summary.reservations || 0), 'Scheduled visitors', numberFormat.format(summary.scheduledVisitors || 0)],
            ['Estimated admission fees', currencyFormat.format(summary.estimatedFees || 0), 'Average party size', Number(summary.averagePartySize || 0).toFixed(1)],
            ['Pending verification', numberFormat.format(summary.pendingVerification || 0), 'Cancellation rate', `${cancellationRate.toFixed(1)}%`],
            ['Registered users', numberFormat.format(summary.totalUsers || 0), 'Animal inventory', numberFormat.format(summary.totalAnimals || 0)],
            ['Upcoming events', numberFormat.format(summary.upcomingEvents || 0), 'Reporting period', periodLabel]
        ].map(row => `<tr>${row.map((cell, index) => `<${index % 2 ? 'td' : 'th'}>${escapeHtml(cell)}</${index % 2 ? 'td' : 'th'}>`).join('')}</tr>`).join('');
        const statusRows = statuses.map(item => `<tr><td>${escapeHtml(item.status.replace('_', ' '))}</td><td>${numberFormat.format(item.count)}</td><td>${numberFormat.format(item.visitors)}</td></tr>`).join('');
        const mixRows = mix.filter(item => item.type !== 'Resident' || item.count > 0).map(item => `<tr><td>${escapeHtml(item.type)}</td><td>${numberFormat.format(item.count)}</td><td>${totalAdmissions ? (item.count / totalAdmissions * 100).toFixed(1) : '0.0'}%</td><td>${escapeHtml(currencyFormat.format(item.estimatedFees))}</td></tr>`).join('');
        const weekdayRows = weekdays.map(item => `<tr><td>${escapeHtml(item.day)}</td><td>${numberFormat.format(item.visitors)}</td></tr>`).join('');

        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;border:none;z-index:9999;visibility:hidden';
        document.body.appendChild(iframe);
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        doc.open();
        doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>BulusanZoo-Analytic-${exportTimestamp()}.pdf</title><style>
            @page { size: A4 portrait; margin: 0; }
            * { box-sizing: border-box; }
            html, body { width: 210mm; height: 297mm; margin: 0; overflow: hidden; }
            body { padding: 1in; font-family: Arial, sans-serif; color: #111; font-size: 11pt; line-height: 1.5; text-align: left; }
            .letterhead { text-align: center; border-bottom: 2px solid #222; padding-bottom: 5px; }
            .letterhead strong { display: block; font-size: 16pt; font-weight: 700; }
            .letterhead span { font-size: 11pt; }
            .subject { margin: 0 0 8pt; font-size: 16pt; font-weight: 700; text-align: center; }
            p { margin: 0 0 8pt; text-align: left; }
            h2 { margin: 0 0 8pt; font-size: 13pt; font-weight: 700; text-align: left; }
            .columns { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; align-items: start; }
            table { width: 100%; border-collapse: collapse; break-inside: avoid; }
            th, td { border: 1px solid #777; padding: 3pt 4pt; font-size: 11pt; line-height: 1.5; text-align: left; }
            th { background: #eee; font-weight: 700; }
            td { text-align: right; }
            .data td:first-child { text-align: left; text-transform: capitalize; }
            .note { margin-top: 8pt; font-size: 11pt; }
        </style></head><body>
            <header class="letterhead"><strong>Bulusan Zoo Calapan</strong><span>Administrative Analytics Memorandum</span></header>
            <div class="subject">Operational Analytics Summary</div>
            <p>To the concerned administrative officers:</p>
            <p>This memorandum presents the consolidated operational indicators for <strong>${escapeHtml(periodLabel)}</strong>. The information below summarizes reservation activity, visitor attendance, admission composition, and institutional activity for management review and planning.</p>
            <h2>Executive Summary</h2><table>${metricRows}</table>
            <div class="columns">
                <section><h2>Reservation Status</h2><table class="data"><thead><tr><th>Status</th><th>Records</th><th>Visitors</th></tr></thead><tbody>${statusRows}</tbody></table></section>
                <section><h2>Admission Classification</h2><table class="data"><thead><tr><th>Type</th><th>Count</th><th>Share</th><th>Est. Fees</th></tr></thead><tbody>${mixRows}</tbody></table></section>
            </div>
            <h2>Weekday Visitor Demand</h2><table class="data"><thead><tr><th>Day</th><th>Scheduled Visitors</th></tr></thead><tbody>${weekdayRows}</tbody></table>
            <p class="note"><strong>Methodological note:</strong> Admission fees are estimates based on PHP 40 per adult and PHP 20 per child; Bulusan residents are assigned no admission fee. Estimated fees are not recorded payment revenue.</p>
        </body></html>`);
        doc.close();
        iframe.style.visibility = 'visible';
        const printWhenReady = async () => {
            try {
                await iframe.contentDocument.fonts?.ready;
                await new Promise(resolve => setTimeout(resolve, 300));
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
            } catch (error) {
                console.error('Error preparing PDF export:', error);
                notify.error("Couldn't prepare the PDF export.");
            } finally {
                iframe.remove();
            }
        };
        iframe.addEventListener('afterprint', () => iframe.remove(), { once: true });
        setTimeout(() => iframe.remove(), 30000);
        if (doc.readyState === 'complete') printWhenReady();
        else iframe.addEventListener('load', printWhenReady, { once: true });
    };

    if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-green-400 border-t-transparent" /></div>;
    if (error) return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>;

    return (
        <section className="analytics-report space-y-6 pb-10">
            <header className="analytics-print-hidden rounded-3xl border border-green-400 bg-gradient-to-r from-green-300 via-green-400 to-green-500 p-6 text-gray-950 md:p-8">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div><p className="text-xs font-black uppercase tracking-[0.22em] text-green-950/70">Operational intelligence</p><h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">Zoo analytics</h1><p className="mt-2 text-sm text-green-950/75">Visit-date performance for confirmed and completed reservations · {periodLabel}</p></div>
                    <div className="analytics-controls flex flex-wrap gap-2">
                        <button onClick={exportExcel} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold shadow-sm"><Download className="h-4 w-4" />Export Excel</button>
                        <button onClick={printReport} className="inline-flex items-center gap-2 rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-bold text-white"><Print className="h-4 w-4" />Print / PDF</button>
                    </div>
                </div>
            </header>

            <div className="analytics-controls flex w-fit gap-1 rounded-xl border border-green-200 bg-white p-1">{['week', 'month', 'year'].map(range => <button key={range} onClick={() => setTimeRange(range)} className={`rounded-lg px-4 py-2 text-sm font-bold capitalize ${timeRange === range ? 'bg-green-400 text-gray-950' : 'text-gray-500 hover:bg-green-50'}`}>{range}</button>)}</div>

            <div className="analytics-primary-grid grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard icon={Users} label="Scheduled visitors" value={numberFormat.format(summary.scheduledVisitors || 0)} detail={`${numberFormat.format(summary.reservations || 0)} confirmed/completed reservations`} tone="green" />
                <MetricCard icon={CheckCircle} label="Checked-in visitors" value={numberFormat.format(summary.checkedInVisitors || 0)} detail={`${attendanceRate.toFixed(1)}% of scheduled visitors`} tone="blue" />
                <MetricCard icon={DollarCircle} label="Estimated admission fees" value={currencyFormat.format(summary.estimatedFees || 0)} detail="Tariff estimate, not recorded payment revenue" tone="purple" />
                <MetricCard icon={Ticket} label="Average party size" value={Number(summary.averagePartySize || 0).toFixed(1)} detail={`${summary.pendingVerification || 0} resident verifications pending`} tone="amber" />
            </div>

            <div className="analytics-secondary-grid grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[['Cancellation rate', `${cancellationRate.toFixed(1)}%`, Activity], ['All-time users', numberFormat.format(summary.totalUsers || 0), Users], ['Animal inventory', numberFormat.format(summary.totalAnimals || 0), Pet], ['Upcoming events', numberFormat.format(summary.upcomingEvents || 0), Calendar]].map(([label, value, icon]) => <div key={label} className="rounded-2xl border border-green-200 bg-white p-4">{createElement(icon, { className: 'mb-3 h-5 w-5 text-green-700' })}<p className="text-2xl font-black tabular-nums">{value}</p><p className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</p></div>)}
            </div>

            <div className="analytics-charts grid gap-6 xl:grid-cols-2">
                <article className="analytics-chart overflow-visible rounded-2xl border border-green-200 bg-white p-5"><h2 className="text-lg font-black">Daily visitor demand</h2><p className="text-sm text-gray-500">Chronological reservations and scheduled visitors. Hover any point for its complete date and values.</p><Chart options={demandOptions} series={demandSeries} type="line" height={360} /></article>
                <article className="analytics-chart rounded-2xl border border-green-200 bg-white p-5"><h2 className="text-lg font-black">Admission mix</h2><p className="text-sm text-gray-500">Adult, child, and Bulusan resident quantities</p><Chart options={mixOptions} series={mix.map(item => item.count)} type="donut" height={320} /></article>
                <article className="analytics-chart rounded-2xl border border-green-200 bg-white p-5"><h2 className="text-lg font-black">Weekday demand profile</h2><p className="text-sm text-gray-500">Aggregate scheduled visitors by day of week</p><Chart options={weekdayOptions} series={[{ name: 'Visitors', data: weekdays.map(item => item.visitors) }]} type="bar" height={320} /></article>
            </div>

            <div className="analytics-details grid gap-6 lg:grid-cols-2">
                <article className="rounded-2xl border border-green-200 bg-white p-5"><h2 className="mb-4 text-lg font-black">Reservation status</h2><div className="space-y-3">{statuses.map(item => <div key={item.status} className="flex items-center justify-between border-b border-green-100 pb-3"><span className="capitalize text-gray-700">{item.status.replace('_', ' ')}</span><span className="font-black tabular-nums">{numberFormat.format(item.count)} <small className="font-medium text-gray-400">· {numberFormat.format(item.visitors)} visitors</small></span></div>)}</div></article>
                <article className="rounded-2xl border border-green-200 bg-white p-5"><h2 className="mb-4 text-lg font-black">Admission breakdown</h2><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-xs uppercase tracking-wide text-gray-500"><th className="pb-3">Type</th><th className="pb-3 text-right">Admissions</th><th className="pb-3 text-right">Share</th><th className="pb-3 text-right">Estimated fees</th></tr></thead><tbody>{mix.map(item => <tr key={item.type} className="border-b border-green-100"><td className="py-3 font-bold">{item.type}</td><td className="py-3 text-right">{numberFormat.format(item.count)}</td><td className="py-3 text-right">{totalAdmissions ? (item.count / totalAdmissions * 100).toFixed(1) : '0.0'}%</td><td className="py-3 text-right font-bold">{currencyFormat.format(item.estimatedFees)}</td></tr>)}</tbody></table></div></article>
            </div>
            <footer className="flex items-start gap-3 rounded-xl bg-green-50 p-4 text-xs leading-5 text-green-950"><ChartBar className="mt-0.5 h-4 w-4 shrink-0" /><p>Estimated admission fees use configured report assumptions of PHP 40 per adult, PHP 20 per child, and no fee for Bulusan residents. They are not payment transactions.</p></footer>
        </section>
    );
};

export default Analytics;
