const bcrypt = require('bcrypt');

const hash = '$2b$12$6ZBsrLKlwilGOGpd7a9EOecpPAuhxk7Mn.9o4sjbpc.UtBRrRAFaq';

const candidates = [
    'AdminPassword2026!',
    'Password123!',
    'password123',
    'password',
    'maintenance',
    'maintenance123',
    'MaintenancePassword2026!',
    'ContractorPassword2026!',
    'contractor',
    'contractor123',
    'MannyPassword2026!',
    'manny',
    'manny123',
    'domiknow',
    'domiknow2026',
    'domiknow2026!',
    'DomiKnow2026!',
    'domiknow_maintenance',
    'domiknow_contractor',
    'Password2026!',
    'Maintenance2026!',
    'Contractor2026!',
    'Manny2026!',
    'lspu2026!',
    'Lspu2026!',
    'admin123',
    'admin',
    '12345678',
    '123456',
    'qwerty'
];

console.log('Testing candidates...');
for (const cand of candidates) {
    if (bcrypt.compareSync(cand, hash)) {
        console.log(`🎉 SUCCESS! Password found: ${cand}`);
        process.exit(0);
    }
}
console.log('❌ None of the common candidates matched.');
process.exit(1);
