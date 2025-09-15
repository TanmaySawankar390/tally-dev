import TallyPrimeSDK from '../src/index.js';

/**
 * Voucher Operations Example
 * 
 * This example demonstrates how to:
 * 1. Create various types of vouchers
 * 2. Fetch voucher details
 * 3. Update vouchers
 * 4. Get voucher lists and summaries
 * 5. Delete vouchers
 */

async function voucherOperationsExample() {
    console.log('🧾 Voucher Operations Examples');
    console.log('='.repeat(50));

    const tally = new TallyPrimeSDK();

    try {
        // Test connection first
        const isConnected = await tally.testConnection();
        if (!isConnected) {
            throw new Error('Cannot connect to TallyPrime. Please ensure it is running.');
        }

        console.log('✅ Connected to TallyPrime');

        // Example 1: Create a Sales voucher
        console.log('\\n1️⃣ Creating a Sales voucher...');
        
        const salesVoucher = await tally.createVoucher('Sales', '15-Sep-2023', [
            { 
                ledgerName: 'Customer ABC', 
                amount: 11800, 
                billName: 'INV-001', 
                billType: 'New Ref' 
            },
            { 
                ledgerName: 'Sales Account', 
                amount: -10000 
            },
            { 
                ledgerName: 'CGST Output 9%', 
                amount: -900 
            },
            { 
                ledgerName: 'SGST Output 9%', 
                amount: -900 
            }
        ], {
            voucherNumber: 'S-001',
            narration: 'Sale of goods to Customer ABC with GST'
        });

        console.log('✅ Sales voucher created:', salesVoucher.message);
        console.log('📝 Voucher number:', salesVoucher.voucherNumber);

        // Example 2: Create a Purchase voucher
        console.log('\\n2️⃣ Creating a Purchase voucher...');
        
        try {
            const purchaseVoucher = await tally.voucher.createVoucher({
                voucherType: 'Purchase',
                date: '16-Sep-2023',
                voucherNumber: 'P-001',
                narration: 'Purchase of raw materials from Supplier XYZ',
                ledgerEntries: [
                    { 
                        ledgerName: 'Raw Materials', 
                        amount: 5000 
                    },
                    { 
                        ledgerName: 'CGST Input 9%', 
                        amount: 450 
                    },
                    { 
                        ledgerName: 'SGST Input 9%', 
                        amount: 450 
                    },
                    { 
                        ledgerName: 'Supplier XYZ', 
                        amount: -5900, 
                        billName: 'BILL-101', 
                        billType: 'New Ref' 
                    }
                ]
            });

            console.log('✅ Purchase voucher created:', purchaseVoucher.message);
        } catch (error) {
            console.log(`⚠️  Could not create purchase voucher: ${error.message}`);
        }

        // Example 3: Create a Receipt voucher
        console.log('\\n3️⃣ Creating a Receipt voucher...');
        
        try {
            const receiptVoucher = await tally.voucher.createVoucher({
                voucherType: 'Receipt',
                date: '17-Sep-2023',
                voucherNumber: 'R-001',
                narration: 'Payment received from Customer ABC',
                ledgerEntries: [
                    { 
                        ledgerName: 'Bank Account', 
                        amount: 11800 
                    },
                    { 
                        ledgerName: 'Customer ABC', 
                        amount: -11800, 
                        billName: 'INV-001', 
                        billType: 'Against Ref' 
                    }
                ]
            });

            console.log('✅ Receipt voucher created:', receiptVoucher.message);
        } catch (error) {
            console.log(`⚠️  Could not create receipt voucher: ${error.message}`);
        }

        // Example 4: Create a Payment voucher
        console.log('\\n4️⃣ Creating a Payment voucher...');
        
        try {
            const paymentVoucher = await tally.voucher.createVoucher({
                voucherType: 'Payment',
                date: '18-Sep-2023',
                voucherNumber: 'PAY-001',
                narration: 'Office rent payment',
                ledgerEntries: [
                    { 
                        ledgerName: 'Office Rent', 
                        amount: 25000 
                    },
                    { 
                        ledgerName: 'Bank Account', 
                        amount: -25000 
                    }
                ]
            });

            console.log('✅ Payment voucher created:', paymentVoucher.message);
        } catch (error) {
            console.log(`⚠️  Could not create payment voucher: ${error.message}`);
        }

        // Example 5: Create a Journal voucher
        console.log('\\n5️⃣ Creating a Journal voucher...');
        
        try {
            const journalVoucher = await tally.voucher.createVoucher({
                voucherType: 'Journal',
                date: '19-Sep-2023',
                voucherNumber: 'J-001',
                narration: 'Adjustment entry for depreciation',
                ledgerEntries: [
                    { 
                        ledgerName: 'Depreciation', 
                        amount: 5000 
                    },
                    { 
                        ledgerName: 'Plant and Machinery', 
                        amount: -5000 
                    }
                ]
            });

            console.log('✅ Journal voucher created:', journalVoucher.message);
        } catch (error) {
            console.log(`⚠️  Could not create journal voucher: ${error.message}`);
        }

        // Example 6: Fetch voucher details
        console.log('\\n6️⃣ Fetching voucher details...');
        
        try {
            const voucherDetails = await tally.voucher.fetchVoucher('S-001', 'Sales', {
                date: '15-Sep-2023'
            });

            console.log('✅ Voucher details retrieved:');
            console.log('📝 Number:', voucherDetails.data.voucherNumber);
            console.log('📋 Type:', voucherDetails.data.voucherType);
            console.log('📅 Date:', voucherDetails.data.date);
            console.log('📄 Narration:', voucherDetails.data.narration);
            console.log('📊 Entries:', voucherDetails.data.ledgerEntries?.length || 0);
            
            if (voucherDetails.data.ledgerEntries) {
                console.log('💰 Ledger Entries:');
                voucherDetails.data.ledgerEntries.forEach((entry, index) => {
                    console.log(`   ${index + 1}. ${entry.ledgerName}: ${entry.amount}`);
                });
            }
        } catch (error) {
            console.log(`⚠️  Could not fetch voucher details: ${error.message}`);
        }

        // Example 7: Get voucher list
        console.log('\\n7️⃣ Getting voucher list...');
        
        try {
            const voucherList = await tally.voucher.getVoucherList({
                voucherType: 'Sales',
                fromDate: '01-Sep-2023',
                toDate: '30-Sep-2023',
                limit: 10
            });

            console.log(`✅ Found ${voucherList.count} Sales voucher(s):`);
            voucherList.data.forEach((voucher, index) => {
                console.log(`   ${index + 1}. ${voucher.voucherNumber} - ${voucher.date} - ₹${voucher.amount}`);
            });
        } catch (error) {
            console.log(`⚠️  Could not fetch voucher list: ${error.message}`);
        }

        // Example 8: Get voucher summary
        console.log('\\n8️⃣ Getting voucher summary...');
        
        try {
            const summary = await tally.voucher.getVoucherSummary({
                fromDate: '01-Sep-2023',
                toDate: '30-Sep-2023',
                groupByType: true
            });

            console.log('✅ Voucher summary retrieved:');
            console.log('📊 Summary by type:', summary.data.byType);
            console.log('📈 Total count:', summary.data.total?.count || 0);
            console.log('💰 Total amount:', summary.data.total?.amount || 0);
        } catch (error) {
            console.log(`⚠️  Could not get voucher summary: ${error.message}`);
        }

        // Example 9: Get vouchers by ledger
        console.log('\\n9️⃣ Getting vouchers by ledger...');
        
        try {
            const ledgerVouchers = await tally.voucher.getVouchersByLedger('Customer ABC', {
                fromDate: '01-Sep-2023',
                toDate: '30-Sep-2023',
                voucherType: 'Sales'
            });

            console.log(`✅ Found ${ledgerVouchers.data?.length || 0} voucher(s) for Customer ABC:`);
            if (ledgerVouchers.data) {
                ledgerVouchers.data.forEach((voucher, index) => {
                    console.log(`   ${index + 1}. ${voucher.voucherType} ${voucher.voucherNumber} - ${voucher.date}`);
                });
            }
        } catch (error) {
            console.log(`⚠️  Could not get vouchers by ledger: ${error.message}`);
        }

        // Example 10: Update a voucher
        console.log('\\n🔟 Updating a voucher...');
        
        try {
            const updateResult = await tally.voucher.updateVoucher('S-001', 'Sales', {
                narration: 'Updated: Sale of goods to Customer ABC with GST (Revised)',
                // Note: In real scenarios, you might also update ledger entries
            });

            console.log('✅ Voucher updated:', updateResult.message);
        } catch (error) {
            console.log(`⚠️  Could not update voucher: ${error.message}`);
        }

        // Example 11: Advanced voucher operations
        console.log('\\n1️⃣1️⃣ Advanced voucher operations...');
        
        try {
            // Create a compound voucher with multiple entries
            const compoundVoucher = await tally.voucher.createVoucher({
                voucherType: 'Journal',
                date: '20-Sep-2023',
                voucherNumber: 'J-002',
                narration: 'Multiple adjustments compound entry',
                ledgerEntries: [
                    { ledgerName: 'Office Expenses', amount: 3000 },
                    { ledgerName: 'Transport Expenses', amount: 2000 },
                    { ledgerName: 'Communication Expenses', amount: 1500 },
                    { ledgerName: 'Bank Account', amount: -6500 }
                ]
            });

            console.log('✅ Compound voucher created:', compoundVoucher.message);

            // Get all vouchers for a specific period
            const periodVouchers = await tally.voucher.getVoucherList({
                fromDate: '15-Sep-2023',
                toDate: '20-Sep-2023'
            });

            console.log(`📊 Total vouchers in period: ${periodVouchers.count}`);
            
            // Group vouchers by type
            const vouchersByType = periodVouchers.data.reduce((groups, voucher) => {
                const type = voucher.voucherType || 'Unknown';
                if (!groups[type]) groups[type] = [];
                groups[type].push(voucher);
                return groups;
            }, {});

            console.log('📈 Vouchers grouped by type:');
            Object.entries(vouchersByType).forEach(([type, vouchers]) => {
                console.log(`   📋 ${type}: ${vouchers.length} voucher(s)`);
            });

        } catch (error) {
            console.log(`⚠️  Advanced operations error: ${error.message}`);
        }

        console.log('\\n✅ Voucher operations examples completed!');

    } catch (error) {
        console.error('❌ Voucher operations example failed:', error.message);
        console.log('\\n🔧 Troubleshooting:');
        console.log('1. Ensure TallyPrime is running');
        console.log('2. Check if required ledgers exist');
        console.log('3. Verify voucher types are defined in TallyPrime');
        console.log('4. Ensure ledger entries balance (debits = credits)');
    }
}

// Cleanup example - delete test vouchers
async function cleanupTestVouchers() {
    console.log('\\n🧹 Cleanup: Removing test vouchers...');
    
    const tally = new TallyPrimeSDK();
    const testVouchers = [
        { number: 'S-001', type: 'Sales' },
        { number: 'P-001', type: 'Purchase' },
        { number: 'R-001', type: 'Receipt' },
        { number: 'PAY-001', type: 'Payment' },
        { number: 'J-001', type: 'Journal' },
        { number: 'J-002', type: 'Journal' }
    ];

    for (const voucher of testVouchers) {
        try {
            await tally.voucher.deleteVoucher(voucher.number, voucher.type);
            console.log(`🗑️  Deleted: ${voucher.type} ${voucher.number}`);
        } catch (error) {
            console.log(`⚠️  Could not delete ${voucher.type} ${voucher.number}: ${error.message}`);
        }
    }
}

// Run the examples
async function runVoucherExamples() {
    try {
        await voucherOperationsExample();
        
        // Uncomment the line below to cleanup test data
        // await cleanupTestVouchers();
        
    } catch (error) {
        console.error('❌ Error running voucher examples:', error);
    }
}

// Execute examples if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runVoucherExamples().catch(console.error);
}

export { voucherOperationsExample, cleanupTestVouchers };