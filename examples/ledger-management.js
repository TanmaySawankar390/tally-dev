import TallyPrimeSDK from '../src/index.js';

/**
 * Ledger Management Example
 * 
 * This example demonstrates how to:
 * 1. Create ledgers
 * 2. Fetch ledger details
 * 3. Update ledgers
 * 4. Get ledger lists
 * 5. Check ledger balances
 * 6. Delete ledgers
 */

async function ledgerManagementExample() {
    console.log('📊 Ledger Management Examples');
    console.log('='.repeat(50));

    const tally = new TallyPrimeSDK();

    try {
        // Test connection first
        const isConnected = await tally.testConnection();
        if (!isConnected) {
            throw new Error('Cannot connect to TallyPrime. Please ensure it is running.');
        }

        console.log('✅ Connected to TallyPrime');

        // Example 1: Create a new ledger
        console.log('\\n1️⃣ Creating a new ledger...');
        
        const newLedger = await tally.createLedger('ABC Corporation', 'Sundry Debtors', {
            alias: 'ABC Corp',
            openingBalance: {
                amount: 15000,
                isBillWise: true,
                isCostCentre: false
            }
        });

        console.log('✅ Ledger created:', newLedger.message);
        console.log('📝 Ledger name:', newLedger.ledgerName);

        // Example 2: Create multiple ledgers using the service directly
        console.log('\\n2️⃣ Creating multiple ledgers...');
        
        const ledgersToCreate = [
            {
                name: 'XYZ Industries',
                parent: 'Sundry Debtors',
                alias: 'XYZ Ind',
                openingBalance: { amount: 25000 }
            },
            {
                name: 'Office Rent',
                parent: 'Indirect Expenses',
                alias: 'Rent'
            },
            {
                name: 'Petty Cash',
                parent: 'Cash',
                openingBalance: { amount: 5000 }
            }
        ];

        for (const ledgerData of ledgersToCreate) {
            try {
                const result = await tally.ledger.createLedger(ledgerData);
                console.log(`✅ Created: ${result.ledgerName}`);
            } catch (error) {
                console.log(`⚠️  Could not create ${ledgerData.name}: ${error.message}`);
            }
        }

        // Example 3: Fetch ledger details
        console.log('\\n3️⃣ Fetching ledger details...');
        
        try {
            const ledgerDetails = await tally.ledger.fetchLedger('ABC Corporation', {
                includeBalance: true,
                fromDate: '01-Apr-2023',
                toDate: '31-Mar-2024'
            });

            console.log('✅ Ledger details retrieved:');
            console.log('📝 Name:', ledgerDetails.data.name);
            console.log('🏢 Parent:', ledgerDetails.data.parent);
            console.log('🔖 Alias:', ledgerDetails.data.alias);
            console.log('💰 Opening Balance:', ledgerDetails.data.openingBalance?.amount || 0);
        } catch (error) {
            console.log(`⚠️  Could not fetch ledger details: ${error.message}`);
        }

        // Example 4: Get list of ledgers
        console.log('\\n4️⃣ Getting ledger list...');
        
        try {
            const ledgerList = await tally.ledger.getLedgerList({
                group: 'Sundry Debtors',
                activeOnly: true,
                nameContains: 'Corp'
            });

            console.log(`✅ Found ${ledgerList.count} ledger(s) matching criteria:`);
            ledgerList.data.forEach((ledger, index) => {
                console.log(`   ${index + 1}. ${ledger.name} (${ledger.parent})`);
            });
        } catch (error) {
            console.log(`⚠️  Could not fetch ledger list: ${error.message}`);
        }

        // Example 5: Get all ledgers
        console.log('\\n5️⃣ Getting all active ledgers...');
        
        try {
            const allLedgers = await tally.ledger.getLedgerList({
                activeOnly: true
            });

            console.log(`✅ Total active ledgers: ${allLedgers.count}`);
            
            // Group by parent for better display
            const groupedLedgers = allLedgers.data.reduce((groups, ledger) => {
                const parent = ledger.parent || 'No Parent';
                if (!groups[parent]) groups[parent] = [];
                groups[parent].push(ledger.name);
                return groups;
            }, {});

            console.log('📊 Ledgers grouped by parent:');
            Object.entries(groupedLedgers).forEach(([parent, ledgers]) => {
                console.log(`   📁 ${parent}: ${ledgers.length} ledger(s)`);
            });

        } catch (error) {
            console.log(`⚠️  Could not fetch all ledgers: ${error.message}`);
        }

        // Example 6: Update a ledger
        console.log('\\n6️⃣ Updating ledger...');
        
        try {
            const updateResult = await tally.ledger.updateLedger('ABC Corporation', {
                alias: 'ABC Corporation Ltd',
                openingBalance: {
                    amount: 18000,
                    isBillWise: true
                }
            });

            console.log('✅ Ledger updated:', updateResult.message);
        } catch (error) {
            console.log(`⚠️  Could not update ledger: ${error.message}`);
        }

        // Example 7: Get ledger balance
        console.log('\\n7️⃣ Getting ledger balance...');
        
        try {
            const balance = await tally.ledger.getLedgerBalance('ABC Corporation', {
                fromDate: '01-Apr-2023',
                toDate: '31-Dec-2023',
                includePending: true
            });

            console.log('✅ Ledger balance retrieved:');
            console.log('💰 Opening Balance:', balance.data.openingBalance);
            console.log('💰 Closing Balance:', balance.data.closingBalance);
            console.log('📈 Debit Total:', balance.data.debitTotal);
            console.log('📉 Credit Total:', balance.data.creditTotal);
            console.log('📅 Period:', `${balance.period.fromDate} to ${balance.period.toDate}`);

        } catch (error) {
            console.log(`⚠️  Could not get ledger balance: ${error.message}`);
        }

        // Example 8: Advanced ledger operations
        console.log('\\n8️⃣ Advanced ledger operations...');
        
        try {
            // Create a ledger with detailed configuration
            const advancedLedger = await tally.ledger.createLedger({
                name: 'Premium Customer Ltd',
                parent: 'Sundry Debtors',
                alias: 'Premium Cust',
                openingBalance: {
                    amount: 50000,
                    isBillWise: true,
                    isCostCentre: false
                }
            });

            console.log('✅ Advanced ledger created:', advancedLedger.ledgerName);

            // Search for specific ledgers
            const searchResults = await tally.ledger.getLedgerList({
                nameContains: 'Premium',
                activeOnly: true
            });

            console.log(`🔍 Found ${searchResults.count} ledger(s) with 'Premium' in name`);

        } catch (error) {
            console.log(`⚠️  Advanced operations error: ${error.message}`);
        }

        console.log('\\n✅ Ledger management examples completed!');

    } catch (error) {
        console.error('❌ Ledger management example failed:', error.message);
        console.log('\\n🔧 Troubleshooting:');
        console.log('1. Ensure TallyPrime is running');
        console.log('2. Check if required parent groups exist (Sundry Debtors, etc.)');
        console.log('3. Verify API access is enabled in TallyPrime');
    }
}

// Cleanup example - delete test ledgers
async function cleanupTestLedgers() {
    console.log('\\n🧹 Cleanup: Removing test ledgers...');
    
    const tally = new TallyPrimeSDK();
    const testLedgers = [
        'ABC Corporation',
        'XYZ Industries', 
        'Premium Customer Ltd'
    ];

    for (const ledgerName of testLedgers) {
        try {
            await tally.ledger.deleteLedger(ledgerName, { force: true });
            console.log(`🗑️  Deleted: ${ledgerName}`);
        } catch (error) {
            console.log(`⚠️  Could not delete ${ledgerName}: ${error.message}`);
        }
    }
}

// Run the examples
async function runLedgerExamples() {
    try {
        await ledgerManagementExample();
        
        // Uncomment the line below to cleanup test data
        // await cleanupTestLedgers();
        
    } catch (error) {
        console.error('❌ Error running ledger examples:', error);
    }
}

// Execute examples if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runLedgerExamples().catch(console.error);
}

export { ledgerManagementExample, cleanupTestLedgers };