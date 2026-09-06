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
    const periodLabel = data?.meta ? `${data.meta.startDate} to ${data.meta.endDate}` : '';

    const baseChart = {
        chart: { toolbar: { show: false }, fontFamily: 'inherit', animations: { enabled: false } },
        dataLabels: { enabled: false },
        grid: { borderColor: '#e5e7eb', strokeDashArray: 4 },
        legend: { position: 'top', horizontalAlign: 'left' },
        tooltip: { theme: 'light' }
    };
    const demandOptions = { ...baseChart, colors: [colors[0], colors[1]], stroke: { width: [0, 3], curve: 'straight' }, xaxis: { categories: daily.map(item => item.date), labels: { rotate: -45 } }, yaxis: [{ title: { text: 'Visitors' } }, { opposite: true, title: { text: 'Reservations' } }] };
    const demandSeries = [{ name: 'Scheduled visitors', type: 'column', data: daily.map(item => item.visitors) }, { name: 'Reservations', type: 'line', data: daily.map(item => item.reservations) }];
    const attendanceOptions = { ...baseChart, colors: [colors[0], colors[2]], stroke: { width: 3, curve: 'straight' }, xaxis: { categories: daily.map(item => item.date), labels: { rotate: -45 } } };
    const attendanceSeries = [{ name: 'Scheduled', data: daily.map(item => item.visitors) }, { name: 'Checked in', data: daily.map(item => item.checkedIn) }];
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
                ['Daily Trend', XLSX.utils.json_to_sheet(daily)], ['Status Breakdown', XLSX.utils.json_to_sheet(statuses)],
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
        const report = document.querySelector('.analytics-report');
        const printWindow = window.open('', '_blank', 'width=1400,height=900');
        if (!report || !printWindow) {
            notify.error(printWindow ? "Couldn't prepare the report." : 'Please allow pop-ups to print the report.');
            return;
        }

        const styles = [...document.head.querySelectorAll('link[rel="stylesheet"], style')].map(node => node.outerHTML).join('');
        printWindow.document.open();
        printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title></title>${styles}<style>
            @page { size: A4 portrait; margin: 0; }
            * { box-sizing: border-box; print-color-adjust: exact !important; -webkit-print-color-adjust: exact !important; }
            html, body { width: 100%; height: auto !important; overflow: visible !important; background: #fff !important; }
            body { margin: 0; padding: 10mm; font-family: Arial, sans-serif; color: #111827; }
            .analytics-report { width: 100% !important; max-width: none !important; padding: 0 !important; }
            .analytics-controls, .analytics-print-hidden { display: none !important; }
            .analytics-primary-grid, .analytics-secondary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
            .analytics-charts, .analytics-details { display: block !important; }
            .analytics-charts > *, .analytics-details > * { margin-bottom: 6mm !important; }
            article, .analytics-chart, .analytics-details > *, footer, table, tr { break-inside: avoid !important; page-break-inside: avoid !important; }
            .analytics-chart { min-width: 0 !important; overflow: visible !important; }
            .apexcharts-canvas, .apexcharts-svg { max-width: 100% !important; overflow: visible !important; }
            .apexcharts-toolbar { display: none !important; }
            table { width: 100% !important; }
            thead { display: table-header-group; }
            svg { animation: none !important; transition: none !important; }
        </style></head><body>${report.outerHTML}</body></html>`);
        printWindow.document.close();
        printWindow.addEventListener('load', () => setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }, 500), { once: true });
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
                <article className="analytics-chart rounded-2xl border border-green-200 bg-white p-5"><h2 className="text-lg font-black">Daily visitor demand</h2><p className="text-sm text-gray-500">Chronological reservations and scheduled visitors</p><Chart options={demandOptions} series={demandSeries} type="line" height={320} /></article>
                <article className="analytics-chart rounded-2xl border border-green-200 bg-white p-5"><h2 className="text-lg font-black">Attendance progression</h2><p className="text-sm text-gray-500">Scheduled visitors compared with recorded check-ins</p><Chart options={attendanceOptions} series={attendanceSeries} type="line" height={320} /></article>
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
