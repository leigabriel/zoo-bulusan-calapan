const config = require('../config/walk-in-config');
const walkInService = require('../services/walk-in-service');

const requestContext = req => ({
    staff: req.user,
    ipAddress: req.ip || null,
    userAgent: req.get('user-agent') || null
});

exports.getConfig = async (req, res, next) => {
    try {
        const today = walkInService.parkDateKey();
        const date = typeof req.query.date === 'string' ? req.query.date : today;
        const availability = await walkInService.getAvailability(date);
        res.json({ success: true, config: { ...config, availability } });
    } catch (error) {
        next(error);
    }
};

exports.create = async (req, res, next) => {
    try {
        const idempotencyKey = req.get('Idempotency-Key');
        if (!idempotencyKey || !/^[A-Za-z0-9_-]{16,100}$/.test(idempotencyKey)) {
            return res.status(400).json({ success: false, message: 'A valid Idempotency-Key header is required.' });
        }
        const payload = walkInService.validateAndCalculate(req.body);
        const result = await walkInService.createSale({ ...requestContext(req), idempotencyKey, payload });
        res.status(result.replayed ? 200 : 201).json({ success: true, replayed: result.replayed, sale: result.sale, receipt: result.sale.receipt });
    } catch (error) {
        next(error);
    }
};

exports.getOne = async (req, res, next) => {
    try {
        const sale = await walkInService.getSale(req.params.saleNumber);
        if (!sale) return res.status(404).json({ success: false, message: 'Walk-in sale not found.' });
        res.json({ success: true, sale });
    } catch (error) {
        next(error);
    }
};

exports.list = async (req, res, next) => {
    try {
        const result = await walkInService.listSales(req.query);
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

exports.getReceipt = async (req, res, next) => {
    try {
        const sale = await walkInService.getSale(req.params.saleNumber);
        if (!sale) return res.status(404).json({ success: false, message: 'Walk-in sale not found.' });
        res.json({ success: true, status: sale.status, receipt: sale.receipt });
    } catch (error) {
        next(error);
    }
};

exports.void = async (req, res, next) => {
    try {
        const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : '';
        if (reason.length < 3 || reason.length > 500) return res.status(400).json({ success: false, message: 'A void reason between 3 and 500 characters is required.' });
        const sale = await walkInService.voidSale({ ...requestContext(req), saleNumber: req.params.saleNumber, reason });
        res.json({ success: true, sale });
    } catch (error) {
        next(error);
    }
};

exports.receiptEvent = async (req, res, next) => {
    try {
        await walkInService.logReceiptEvent({ ...requestContext(req), saleNumber: req.params.saleNumber, eventType: req.body.eventType });
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};
