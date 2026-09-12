const categories = [
    { code: 'adult', label: 'Adult', unitPriceCents: 4000, discountCents: 0 },
    { code: 'child', label: 'Child', unitPriceCents: 2000, discountCents: 0 },
    { code: 'senior', label: 'Senior Citizen', unitPriceCents: 4000, discountCents: 800, requiresProof: true },
    { code: 'pwd', label: 'PWD', unitPriceCents: 4000, discountCents: 800, requiresProof: true },
    { code: 'resident', label: 'Bulusan Resident', unitPriceCents: 0, discountCents: 0, requiresProof: true }
];

module.exports = Object.freeze({
    currency: 'PHP',
    categories,
    paymentMethods: [
        { code: 'cash', label: 'Cash' },
        { code: 'gcash', label: 'GCash', requiresReference: true }
    ],
    dailyCapacity: 100,
    maxVisitorsPerSale: 50,
    receipt: {
        organizationName: 'Bulusan Wildlife and Nature Park',
        address: process.env.PARK_ADDRESS || 'Bulusan, Calapan City, Oriental Mindoro',
        contact: process.env.PARK_CONTACT || 'Contact the park office for assistance',
        policyNote: 'Keep this receipt. Tickets are valid only for the visit date shown.',
        defaultPaperWidth: '58mm'
    }
});
