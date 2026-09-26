const test = require('node:test');
const assert = require('node:assert/strict');
const { sanitizePlainText } = require('../utils/helpers');

const reservationSteps = `To reserve an event at Bulusan Zoo, please follow these steps:

1.  **Log in** to your Bulusan Zoo account.
2.  **Open the Events page** on the website.
3.  **Select the desired event** from the list.
4.  **Review the event information** and check for available slots.
5.  **Complete the event reservation form.**
6.  **Submit the reservation.**
7.  If payment is required, **follow the payment instructions** shown by the application.
8.  You can then **check the Reservations or My Events section** to review your confirmed reservation.`;

test('removes markdown bold markers from numbered steps', () => {
    const cleaned = sanitizePlainText(reservationSteps);

    assert.ok(!cleaned.includes('*'), 'asterisks were left in the response');
    assert.match(cleaned, /1\.\s+Log in to your Bulusan Zoo account\./);
    assert.match(cleaned, /7\.\s+If payment is required, follow the payment instructions shown by the application\./);
    assert.ok(cleaned.includes('8.'), 'numbered steps must be preserved');
    assert.ok(cleaned.startsWith('To reserve an event at Bulusan Zoo, please follow these steps:'));
});

test('strips other markdown decoration while keeping the text readable', () => {
    const cleaned = sanitizePlainText('## Operating hours\n\n- **8:00 AM to 5:00 PM daily**\n- See the [Events page](/events) `now`\n- ~~Closed~~ Mondays open 🙂');

    assert.ok(!cleaned.includes('#'), 'heading markers were not removed');
    assert.ok(!cleaned.includes('[') && !cleaned.includes(']('), 'markdown links were not removed');
    assert.ok(!cleaned.includes('`'), 'inline code markers were not removed');
    assert.ok(!cleaned.includes('~'), 'strikethrough markers were not removed');
    assert.ok(!/\p{Extended_Pictographic}/u.test(cleaned), 'emoji were not removed');
    assert.match(cleaned, /^Operating hours$/m);
    assert.ok(cleaned.includes('- 8:00 AM to 5:00 PM daily'));
    assert.ok(cleaned.includes('See the Events page now'));
    assert.ok(cleaned.includes('- Closed Mondays open'));
});

test('keeps ordinary text, references, and punctuation intact', () => {
    const cleaned = sanitizePlainText('Your reference ZB_1234_ab costs P40 and expires at 5:00 PM. Contact info@bulusanwildlife.com or (043) 288-7291.');

    assert.equal(cleaned, 'Your reference ZB_1234_ab costs P40 and expires at 5:00 PM. Contact info@bulusanwildlife.com or (043) 288-7291.');
});

test('handles empty and non-string input', () => {
    assert.equal(sanitizePlainText(''), '');
    assert.equal(sanitizePlainText(null), '');
    assert.equal(sanitizePlainText(undefined), '');
});
