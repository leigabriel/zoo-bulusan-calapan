const crypto = require('crypto');
const db = require('../config/database');
const config = require('../config/walk-in-config');

class WalkInError extends Error {
    constructor(message, status = 400) {
        super(message);
        this.status = status;
    }
}

const parseDate = value => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
};

const validateAndCalculate = body => {
    const visitDateObject = parseDate(body?.visitDate);
    if (!visitDateObject) throw new WalkInError('A valid visit date is required.');

    const localToday = parseDate(parkDateKey());
    const latestDate = new Date(localToday);
    latestDate.setUTCFullYear(latestDate.getUTCFullYear() + 1);
    if (visitDateObject < localToday || visitDateObject > latestDate) {
        throw new WalkInError('Visit date must be between today and one year from today.');
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
        throw new WalkInError('Select at least one admission category.');
    }

    const catalog = new Map(config.categories.map(category => [category.code, category]));
    const usedCodes = new Set();
    const items = body.items.map(item => {
        const category = catalog.get(item?.categoryCode);
        if (!category || usedCodes.has(item.categoryCode)) throw new WalkInError('An admission category is invalid or duplicated.');
        if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0) throw new WalkInError('Ticket quantities must be positive whole numbers.');
        usedCodes.add(item.categoryCode);
        const subtotalCents = category.unitPriceCents * item.quantity;
        const discountCents = category.discountCents * item.quantity;
        return {
            categoryCode: category.code,
            categoryLabel: category.label,
            quantity: item.quantity,
            unitPriceCents: category.unitPriceCents,
            discountCents,
            lineTotalCents: subtotalCents - discountCents
        };
    });

    const totalVisitors = items.reduce((sum, item) => sum + item.quantity, 0);
    if (totalVisitors > config.maxVisitorsPerSale) throw new WalkInError(`A sale is limited to ${config.maxVisitorsPerSale} visitors.`);

    const visitorName = typeof body.visitorName === 'string' ? body.visitorName.trim() : '';
    const visitorPhone = typeof body.visitorPhone === 'string' ? body.visitorPhone.trim() : '';
    if (visitorName.length > 100) throw new WalkInError('Visitor name must be 100 characters or fewer.');
    if (visitorPhone && (!/^[0-9+()\-\s]{7,20}$/.test(visitorPhone))) throw new WalkInError('Enter a valid contact number.');

    const methodConfig = config.paymentMethods.find(method => method.code === body.payment?.method);
    if (!methodConfig) throw new WalkInError('Select a valid payment method.');
    const providerReference = typeof body.payment?.providerReference === 'string' ? body.payment.providerReference.trim() : '';
    if (methodConfig.requiresReference && (!providerReference || providerReference.length > 100)) {
        throw new WalkInError('A valid payment reference is required.');
    }

    const subtotalCents = items.reduce((sum, item) => sum + (item.unitPriceCents * item.quantity), 0);
    const discountCents = items.reduce((sum, item) => sum + item.discountCents, 0);
    const totalCents = subtotalCents - discountCents;
    let amountReceivedCents = totalCents;
    if (methodConfig.code === 'cash') {
        amountReceivedCents = body.payment?.amountReceivedCents;
        if (!Number.isSafeInteger(amountReceivedCents) || amountReceivedCents < totalCents) {
            throw new WalkInError('Cash received must cover the total amount.');
        }
    }

    return {
        visitDate: body.visitDate,
        visitorName: visitorName || null,
        visitorPhone: visitorPhone || null,
        items,
        totalVisitors,
        subtotalCents,
        discountCents,
        totalCents,
        payment: {
            method: methodConfig.code,
            methodLabel: methodConfig.label,
            amountReceivedCents,
            changeCents: amountReceivedCents - totalCents,
            providerReference: providerReference || null
        }
    };
};

const hashRequest = payload => crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
const parkDateKey = (value = new Date()) => {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(value);
    const get = type => parts.find(part => part.type === type)?.value;
    return `${get('year')}-${get('month')}-${get('day')}`;
};
const makeNumber = prefix => `${prefix}-${parkDateKey().replaceAll('-', '')}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
const parseSnapshot = value => typeof value === 'string' ? JSON.parse(value) : value;
const formatDate = value => {
    if (typeof value === 'string') return value.slice(0, 10);
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
};

const fetchSale = async (connection, saleNumber) => {
    const [rows] = await connection.query(
        `SELECT s.*, DATE_FORMAT(s.visit_date, '%Y-%m-%d') AS visit_date_key,
                CONCAT(staff.first_name, ' ', staff.last_name) AS staff_name,
                CONCAT(voider.first_name, ' ', voider.last_name) AS voided_by_name,
                p.method AS payment_method, p.status AS payment_status,
                p.amount_received_cents, p.change_cents, p.provider_reference
         FROM walk_in_sales s
         JOIN users staff ON staff.id = s.staff_id
         LEFT JOIN users voider ON voider.id = s.voided_by
         JOIN walk_in_payments p ON p.sale_id = s.id
         WHERE s.sale_number = ? OR s.receipt_number = ? LIMIT 1`,
        [saleNumber, saleNumber]
    );
    if (!rows[0]) return null;
    const sale = rows[0];
    const [items] = await connection.query(
        `SELECT category_code AS categoryCode, category_label AS categoryLabel, quantity,
                unit_price_cents AS unitPriceCents, discount_cents AS discountCents,
                line_total_cents AS lineTotalCents
         FROM walk_in_sale_items WHERE sale_id = ? ORDER BY id`,
        [sale.id]
    );
    return {
        saleNumber: sale.sale_number,
        receiptNumber: sale.receipt_number,
        source: sale.source,
        status: sale.status,
        visitorName: sale.visitor_name,
        visitorPhone: sale.visitor_phone,
        visitDate: sale.visit_date_key || formatDate(sale.visit_date),
        staffName: sale.staff_name,
        currency: sale.currency,
        subtotalCents: Number(sale.subtotal_cents),
        discountCents: Number(sale.discount_cents),
        totalCents: Number(sale.total_cents),
        items,
        payment: {
            method: sale.payment_method,
            status: sale.payment_status,
            amountReceivedCents: sale.amount_received_cents === null ? null : Number(sale.amount_received_cents),
            changeCents: Number(sale.change_cents),
            providerReference: sale.provider_reference
        },
        voidReason: sale.void_reason,
        voidedByName: sale.voided_by_name,
        voidedAt: sale.voided_at,
        checkedInAt: sale.checked_in_at,
        createdAt: sale.created_at,
        receipt: parseSnapshot(sale.receipt_snapshot)
    };
};

const createSale = async ({ staff, idempotencyKey, payload, ipAddress, userAgent }) => {
    const requestHash = hashRequest(payload);
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [existing] = await connection.query(
            'SELECT sale_number, request_hash FROM walk_in_sales WHERE staff_id = ? AND idempotency_key = ? FOR UPDATE',
            [staff.id, idempotencyKey]
        );
        if (existing[0]) {
            if (existing[0].request_hash !== requestHash) throw new WalkInError('This idempotency key was already used for a different sale.', 409);
            const sale = await fetchSale(connection, existing[0].sale_number);
            await connection.commit();
            return { sale, replayed: true };
        }

        await connection.query('INSERT IGNORE INTO walk_in_capacity_dates (visit_date) VALUES (?)', [payload.visitDate]);
        await connection.query('SELECT visit_date FROM walk_in_capacity_dates WHERE visit_date = ? FOR UPDATE', [payload.visitDate]);
        const [reservationCapacity] = await connection.query(
            `SELECT COALESCE(SUM(total_visitors), 0) AS used
             FROM ticket_reservations
             WHERE reservation_date = ? AND status IN ('pending', 'confirmed', 'completed')
               AND (is_deleted IS NULL OR is_deleted = FALSE) FOR UPDATE`,
            [payload.visitDate]
        );
        const [walkInCapacity] = await connection.query(
            `SELECT COALESCE(SUM(item_totals.visitors), 0) AS used
             FROM walk_in_sales sales
             JOIN (SELECT sale_id, SUM(quantity) AS visitors FROM walk_in_sale_items GROUP BY sale_id) item_totals ON item_totals.sale_id = sales.id
             WHERE sales.visit_date = ? AND sales.status = 'completed' FOR UPDATE`,
            [payload.visitDate]
        );
        const usedCapacity = Number(reservationCapacity[0].used) + Number(walkInCapacity[0].used);
        if (usedCapacity + payload.totalVisitors > config.dailyCapacity) {
            throw new WalkInError(`Only ${Math.max(config.dailyCapacity - usedCapacity, 0)} admission slots remain for this date.`, 409);
        }

        const saleNumber = makeNumber('WIN');
        const receiptNumber = makeNumber('OR');
        const createdAt = new Date().toISOString();
        const staffName = `${staff.first_name || ''} ${staff.last_name || ''}`.trim() || staff.username || 'Staff';
        const receipt = {
            version: 1,
            ...config.receipt,
            saleNumber,
            receiptNumber,
            createdAt,
            visitDate: payload.visitDate,
            staffName,
            visitorName: payload.visitorName,
            currency: config.currency,
            items: payload.items,
            subtotalCents: payload.subtotalCents,
            discountCents: payload.discountCents,
            totalCents: payload.totalCents,
            payment: { ...payload.payment, status: 'paid' },
            qrData: receiptNumber
        };
        const [saleResult] = await connection.query(
            `INSERT INTO walk_in_sales
             (sale_number, receipt_number, staff_id, idempotency_key, request_hash, visitor_name, visitor_phone,
              visit_date, currency, subtotal_cents, discount_cents, total_cents, receipt_snapshot)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [saleNumber, receiptNumber, staff.id, idempotencyKey, requestHash, payload.visitorName, payload.visitorPhone,
                payload.visitDate, config.currency, payload.subtotalCents, payload.discountCents, payload.totalCents, JSON.stringify(receipt)]
        );
        for (const item of payload.items) {
            await connection.query(
                `INSERT INTO walk_in_sale_items
                 (sale_id, category_code, category_label, quantity, unit_price_cents, discount_cents, line_total_cents)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [saleResult.insertId, item.categoryCode, item.categoryLabel, item.quantity, item.unitPriceCents, item.discountCents, item.lineTotalCents]
            );
        }
        await connection.query(
            `INSERT INTO walk_in_payments
             (sale_id, method, status, amount_due_cents, amount_received_cents, change_cents, provider_reference, paid_at)
             VALUES (?, ?, 'paid', ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [saleResult.insertId, payload.payment.method, payload.totalCents, payload.payment.amountReceivedCents,
                payload.payment.changeCents, payload.payment.providerReference]
        );
        await connection.query(
            `INSERT INTO staff_activity_logs
             (staff_id, action_type, action_description, entity_type, entity_id, ip_address, user_agent)
             VALUES (?, 'walk_in_sale', ?, 'walk_in_sale', ?, ?, ?)`,
            [staff.id, `Completed walk-in sale ${saleNumber}`, saleResult.insertId, ipAddress, userAgent]
        );
        await connection.commit();
        return { sale: await fetchSale(db, saleNumber), replayed: false };
    } catch (error) {
        await connection.rollback();
        if (error.code === 'ER_DUP_ENTRY' && /uk_walk_in_idempotency/i.test(error.message || '')) {
            const [existing] = await db.query(
                'SELECT sale_number, request_hash FROM walk_in_sales WHERE staff_id = ? AND idempotency_key = ? LIMIT 1',
                [staff.id, idempotencyKey]
            );
            if (existing[0]?.request_hash === requestHash) {
                return { sale: await fetchSale(db, existing[0].sale_number), replayed: true };
            }
            throw new WalkInError('This idempotency key was already used for a different sale.', 409);
        }
        throw error;
    } finally {
        connection.release();
    }
};

const getSale = saleNumber => fetchSale(db, saleNumber);

const listSales = async ({ page = 1, limit = 20, search = '', status = '', visitDate = '' } = {}) => {
    const safePage = Math.max(Number.parseInt(page, 10) || 1, 1);
    const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 20, 1), 100);
    const conditions = [];
    const parameters = [];
    if (['completed', 'voided'].includes(status)) {
        conditions.push('s.status = ?');
        parameters.push(status);
    }
    if (visitDate) {
        if (!parseDate(visitDate)) throw new WalkInError('A valid visit date is required.');
        conditions.push('s.visit_date = ?');
        parameters.push(visitDate);
    }
    const safeSearch = typeof search === 'string' ? search.trim().slice(0, 100) : '';
    if (safeSearch) {
        conditions.push('(s.sale_number LIKE ? OR s.receipt_number LIKE ? OR s.visitor_name LIKE ? OR s.visitor_phone LIKE ?)');
        const term = `%${safeSearch.replace(/[\\%_]/g, '\\$&')}%`;
        parameters.push(term, term, term, term);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const [countRows] = await db.query(`SELECT COUNT(*) AS total FROM walk_in_sales s ${where}`, parameters);
    const [rows] = await db.query(
        `SELECT s.sale_number, s.receipt_number, s.visitor_name, s.visitor_phone,
                DATE_FORMAT(s.visit_date, '%Y-%m-%d') AS visit_date_key,
                s.total_cents, s.currency, s.status, s.checked_in_at, s.created_at,
                CONCAT(u.first_name, ' ', u.last_name) AS staff_name,
                p.method AS payment_method, p.status AS payment_status,
                COALESCE(items.total_visitors, 0) AS total_visitors
         FROM walk_in_sales s
         JOIN users u ON u.id = s.staff_id
         JOIN walk_in_payments p ON p.sale_id = s.id
         LEFT JOIN (SELECT sale_id, SUM(quantity) AS total_visitors FROM walk_in_sale_items GROUP BY sale_id) items ON items.sale_id = s.id
         ${where}
         ORDER BY s.created_at DESC
         LIMIT ? OFFSET ?`,
        [...parameters, safeLimit, (safePage - 1) * safeLimit]
    );
    return {
        records: rows.map(row => ({
            saleNumber: row.sale_number,
            receiptNumber: row.receipt_number,
            visitorName: row.visitor_name,
            visitorPhone: row.visitor_phone,
            visitDate: row.visit_date_key,
            totalCents: Number(row.total_cents),
            currency: row.currency,
            status: row.status,
            checkedInAt: row.checked_in_at,
            createdAt: row.created_at,
            staffName: row.staff_name,
            paymentMethod: row.payment_method,
            paymentStatus: row.payment_status,
            totalVisitors: Number(row.total_visitors)
        })),
        pagination: {
            page: safePage,
            limit: safeLimit,
            total: Number(countRows[0].total),
            pages: Math.max(Math.ceil(Number(countRows[0].total) / safeLimit), 1)
        }
    };
};

const getAvailability = async visitDate => {
    if (!parseDate(visitDate)) throw new WalkInError('A valid visit date is required.');
    const [reservationCapacity] = await db.query(
        `SELECT COALESCE(SUM(total_visitors), 0) AS used FROM ticket_reservations
         WHERE reservation_date = ? AND status IN ('pending', 'confirmed', 'completed')
           AND (is_deleted IS NULL OR is_deleted = FALSE)`,
        [visitDate]
    );
    const [walkInCapacity] = await db.query(
        `SELECT COALESCE(SUM(item_totals.visitors), 0) AS used
         FROM walk_in_sales sales
         JOIN (SELECT sale_id, SUM(quantity) AS visitors FROM walk_in_sale_items GROUP BY sale_id) item_totals ON item_totals.sale_id = sales.id
         WHERE sales.visit_date = ? AND sales.status = 'completed'`,
        [visitDate]
    );
    const used = Number(reservationCapacity[0].used) + Number(walkInCapacity[0].used);
    return { date: visitDate, capacity: config.dailyCapacity, used, remaining: Math.max(config.dailyCapacity - used, 0) };
};

const voidSale = async ({ saleNumber, staff, reason, ipAddress, userAgent }) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [rows] = await connection.query('SELECT id, status FROM walk_in_sales WHERE sale_number = ? OR receipt_number = ? FOR UPDATE', [saleNumber, saleNumber]);
        if (!rows[0]) throw new WalkInError('Walk-in sale not found.', 404);
        if (rows[0].status === 'voided') throw new WalkInError('This sale has already been voided.', 409);
        await connection.query(
            `UPDATE walk_in_sales SET status = 'voided', void_reason = ?, voided_by = ?, voided_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [reason, staff.id, rows[0].id]
        );
        await connection.query("UPDATE walk_in_payments SET status = 'voided' WHERE sale_id = ?", [rows[0].id]);
        await connection.query(
            `INSERT INTO staff_activity_logs
             (staff_id, action_type, action_description, entity_type, entity_id, ip_address, user_agent)
             VALUES (?, 'walk_in_void', ?, 'walk_in_sale', ?, ?, ?)`,
            [staff.id, `Voided walk-in sale ${saleNumber}: ${reason}`, rows[0].id, ipAddress, userAgent]
        );
        await connection.commit();
        return fetchSale(db, saleNumber);
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const markUsed = async ({ saleNumber, staff, ipAddress, userAgent }) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [rows] = await connection.query(
            'SELECT id, sale_number, status, checked_in_at FROM walk_in_sales WHERE sale_number = ? OR receipt_number = ? FOR UPDATE',
            [saleNumber, saleNumber]
        );
        if (!rows[0]) throw new WalkInError('Walk-in sale not found.', 404);
        if (rows[0].status === 'voided') throw new WalkInError('A voided walk-in receipt cannot be checked in.', 409);
        if (!rows[0].checked_in_at) {
            await connection.query('UPDATE walk_in_sales SET checked_in_by = ?, checked_in_at = CURRENT_TIMESTAMP WHERE id = ?', [staff.id, rows[0].id]);
            await connection.query(
                `INSERT INTO staff_activity_logs
                 (staff_id, action_type, action_description, entity_type, entity_id, ip_address, user_agent)
                 VALUES (?, 'walk_in_check_in', ?, 'walk_in_sale', ?, ?, ?)`,
                [staff.id, `Checked in walk-in sale ${rows[0].sale_number}`, rows[0].id, ipAddress, userAgent]
            );
        }
        await connection.commit();
        return fetchSale(db, rows[0].sale_number);
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const logReceiptEvent = async ({ saleNumber, staff, eventType, ipAddress, userAgent }) => {
    const sale = await fetchSale(db, saleNumber);
    if (!sale) throw new WalkInError('Walk-in sale not found.', 404);
    const allowed = ['print_requested', 'reprint_requested', 'print_failed'];
    if (!allowed.includes(eventType)) throw new WalkInError('Invalid receipt event.');
    await db.query(
        `INSERT INTO staff_activity_logs (staff_id, action_type, action_description, entity_type, ip_address, user_agent)
         VALUES (?, ?, ?, 'walk_in_sale', ?, ?)`,
        [staff.id, eventType, `${eventType.replaceAll('_', ' ')} for ${sale.saleNumber}`, ipAddress, userAgent]
    );
};

module.exports = { WalkInError, parkDateKey, validateAndCalculate, createSale, getSale, listSales, getAvailability, voidSale, markUsed, logReceiptEvent };
