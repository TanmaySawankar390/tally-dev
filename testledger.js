import TallyPrimeSDK from 'tallyprime-js-sdk';

// Initialize the SDK
const tally = new TallyPrimeSDK({
    host: 'localhost', // TallyPrime host (default: localhost)
    port: 9000, // TallyPrime port (default: 9000)
    timeout: 30000 // Request timeout (default: 30000ms)
});

// Test connection
const isConnected = await tally.testConnection();
if (isConnected) {
    console.log('✅ Connected to TallyPrime successfully!');

    // Create a ledger
    const ledger = await tally.createLedger(
        'Customer Name Tanmay Sawankar',
        'Sundry Debtors',
        {
            alias: 'Cust Name',
            openingBalance: {
                amount: 18000,
                isBillWise: true,
                isCostCentre: false
            }
        }
    );

    console.log('Ledger created:', ledger.message);
} else {
    console.log('❌ Failed to connect to TallyPrime');
}
