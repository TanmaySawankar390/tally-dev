import TallyPrimeSDK from '../src/index.js';

/**
 * Stock Management Example
 * 
 * This example demonstrates how to:
 * 1. Create stock items
 * 2. Fetch stock item details
 * 3. Update stock items
 * 4. Get stock item lists
 * 5. Check stock balances and movements
 * 6. Generate stock summaries
 */

async function stockManagementExample() {
    console.log('📦 Stock Management Examples');
    console.log('='.repeat(50));

    const tally = new TallyPrimeSDK();

    try {
        // Test connection first
        const isConnected = await tally.testConnection();
        if (!isConnected) {
            throw new Error('Cannot connect to TallyPrime. Please ensure it is running.');
        }

        console.log('✅ Connected to TallyPrime');

        // Example 1: Create stock items using the quick method
        console.log('\\n1️⃣ Creating stock items...');
        
        const stockItemA = await tally.createStockItem('Widget A', 'Raw Materials', 'Nos', {
            alias: 'WGT-A',
            openingBalance: {
                quantity: 100,
                rate: 50.00,
                value: 5000.00
            }
        });

        console.log('✅ Stock item created:', stockItemA.message);
        console.log('📝 Stock item name:', stockItemA.stockItemName);

        // Example 2: Create multiple stock items using the service directly
        console.log('\\n2️⃣ Creating multiple stock items...');
        
        const stockItemsToCreate = [
            {
                name: 'Widget B',
                parent: 'Raw Materials',
                baseUnits: 'Kg',
                alias: 'WGT-B',
                openingBalance: {
                    quantity: 50,
                    rate: 75.00,
                    value: 3750.00
                }
            },
            {
                name: 'Finished Product X',
                parent: 'Finished Goods',
                baseUnits: 'Nos',
                alias: 'FP-X',
                openingBalance: {
                    quantity: 25,
                    rate: 200.00,
                    value: 5000.00
                }
            },
            {
                name: 'Packaging Material',
                parent: 'Raw Materials',
                baseUnits: 'Mtr',
                alias: 'PKG-MAT'
            },
            {
                name: 'Semi Finished Y',
                parent: 'Work in Progress',
                baseUnits: 'Nos',
                alias: 'SF-Y',
                openingBalance: {
                    quantity: 15,
                    rate: 120.00,
                    value: 1800.00
                }
            }
        ];

        for (const stockData of stockItemsToCreate) {
            try {
                const result = await tally.stock.createStockItem(stockData);
                console.log(`✅ Created: ${result.stockItemName}`);
            } catch (error) {
                console.log(`⚠️  Could not create ${stockData.name}: ${error.message}`);
            }
        }

        // Example 3: Fetch stock item details
        console.log('\\n3️⃣ Fetching stock item details...');
        
        try {
            const stockDetails = await tally.stock.fetchStockItem('Widget A', {
                includeBalance: true,
                asOn: '31-Dec-2023'
            });

            console.log('✅ Stock item details retrieved:');
            console.log('📝 Name:', stockDetails.data.name);
            console.log('🏢 Parent:', stockDetails.data.parent);
            console.log('🔖 Alias:', stockDetails.data.alias);
            console.log('📏 Base Units:', stockDetails.data.baseUnits);
            console.log('💰 Opening Balance:');
            console.log('   📊 Quantity:', stockDetails.data.openingBalance?.quantity || 0);
            console.log('   💵 Rate:', stockDetails.data.openingBalance?.rate || 0);
            console.log('   💰 Value:', stockDetails.data.openingBalance?.value || 0);
        } catch (error) {
            console.log(`⚠️  Could not fetch stock details: ${error.message}`);
        }

        // Example 4: Get stock item list with filters
        console.log('\\n4️⃣ Getting stock item list...');
        
        try {
            const stockList = await tally.stock.getStockItemList({
                group: 'Raw Materials',
                activeOnly: true,
                nameContains: 'Widget'
            });

            console.log(`✅ Found ${stockList.count} stock item(s) matching criteria:`);
            stockList.data.forEach((item, index) => {
                console.log(`   ${index + 1}. ${item.name} (${item.parent}) - ${item.baseUnits}`);
                if (item.closingBalance) {
                    console.log(`      📊 Closing: ${item.closingBalance.quantity} units, ₹${item.closingBalance.value}`);
                }
            });
        } catch (error) {
            console.log(`⚠️  Could not fetch stock list: ${error.message}`);
        }

        // Example 5: Get all stock items grouped by category
        console.log('\\n5️⃣ Getting all stock items...');
        
        try {
            const allStock = await tally.stock.getStockItemList({
                activeOnly: true,
                withBalance: false // Include all items, not just those with balance
            });

            console.log(`✅ Total active stock items: ${allStock.count}`);
            
            // Group by parent for better display
            const groupedStock = allStock.data.reduce((groups, item) => {
                const parent = item.parent || 'No Parent';
                if (!groups[parent]) groups[parent] = [];
                groups[parent].push(item.name);
                return groups;
            }, {});

            console.log('📊 Stock items grouped by category:');
            Object.entries(groupedStock).forEach(([parent, items]) => {
                console.log(`   📁 ${parent}: ${items.length} item(s)`);
            });

        } catch (error) {
            console.log(`⚠️  Could not fetch all stock items: ${error.message}`);
        }

        // Example 6: Update a stock item
        console.log('\\n6️⃣ Updating stock item...');
        
        try {
            const updateResult = await tally.stock.updateStockItem('Widget A', {
                alias: 'Widget-A-Premium',
                // Note: Updating base units should be done carefully as it affects calculations
            });

            console.log('✅ Stock item updated:', updateResult.message);
        } catch (error) {
            console.log(`⚠️  Could not update stock item: ${error.message}`);
        }

        // Example 7: Get stock balance for specific item
        console.log('\\n7️⃣ Getting stock balance...');
        
        try {
            const balance = await tally.stock.getStockBalance('Widget A', {
                asOn: '31-Dec-2023'
                // godown: 'Main Warehouse' // Specify godown if needed
            });

            console.log('✅ Stock balance retrieved:');
            console.log('📊 Opening Balance:');
            console.log('   📦 Quantity:', balance.data.openingBalance?.quantity || 0);
            console.log('   💵 Rate:', balance.data.openingBalance?.rate || 0);
            console.log('   💰 Value:', balance.data.openingBalance?.value || 0);
            console.log('📈 Inward Quantity:', balance.data.inwardQuantity || 0);
            console.log('📉 Outward Quantity:', balance.data.outwardQuantity || 0);
            console.log('📊 Closing Balance:');
            console.log('   📦 Quantity:', balance.data.closingBalance?.quantity || 0);
            console.log('   💵 Rate:', balance.data.closingBalance?.rate || 0);
            console.log('   💰 Value:', balance.data.closingBalance?.value || 0);
            console.log('📅 As on:', balance.asOn);

        } catch (error) {
            console.log(`⚠️  Could not get stock balance: ${error.message}`);
        }

        // Example 8: Get stock summary report
        console.log('\\n8️⃣ Getting stock summary...');
        
        try {
            const summary = await tally.stock.getStockSummary({
                group: 'Raw Materials',
                asOn: '31-Dec-2023',
                includeZeroBalance: false
            });

            console.log('✅ Stock summary retrieved:');
            console.log('📊 Total items in summary:', summary.data.totalItems);
            console.log('💰 Total value:', summary.data.totalValue);
            console.log('📈 Stock Analysis:');
            console.log('   ✅ Positive stock items:', summary.data.summary.positiveStock);
            console.log('   ❌ Negative stock items:', summary.data.summary.negativeStock);
            console.log('   ⚪ Zero stock items:', summary.data.summary.zeroStock);

            if (summary.data.items && summary.data.items.length > 0) {
                console.log('🔝 Top stock items by value:');
                const sortedItems = summary.data.items
                    .sort((a, b) => b.closingValue - a.closingValue)
                    .slice(0, 5);
                
                sortedItems.forEach((item, index) => {
                    console.log(`   ${index + 1}. ${item.name}: ${item.closingQuantity} ${item.baseUnits} = ₹${item.closingValue}`);
                });
            }

        } catch (error) {
            console.log(`⚠️  Could not get stock summary: ${error.message}`);
        }

        // Example 9: Get stock movements
        console.log('\\n9️⃣ Getting stock movements...');
        
        try {
            const movements = await tally.stock.getStockMovements('Widget A', {
                fromDate: '01-Dec-2023',
                toDate: '31-Dec-2023'
                // voucherType: 'Sales', // Filter by specific voucher type
                // godown: 'Main Warehouse' // Filter by specific godown
            });

            console.log(`✅ Found ${movements.data?.length || 0} stock movement(s) for Widget A:`);
            if (movements.data && movements.data.length > 0) {
                console.log('📋 Movement Details:');
                movements.data.forEach((movement, index) => {
                    console.log(`   ${index + 1}. ${movement.date} - ${movement.voucherType} ${movement.voucherNumber}`);
                    console.log(`      📥 Inward: ${movement.inwardQuantity}, 📤 Outward: ${movement.outwardQuantity}`);
                    console.log(`      💵 Rate: ₹${movement.rate}, 💰 Amount: ₹${movement.amount}`);
                    if (movement.godown) console.log(`      🏪 Godown: ${movement.godown}`);
                });
            } else {
                console.log('   ℹ️  No movements found in the specified period');
            }

        } catch (error) {
            console.log(`⚠️  Could not get stock movements: ${error.message}`);
        }

        // Example 10: Advanced stock operations
        console.log('\\n🔟 Advanced stock operations...');
        
        try {
            // Get stock items with positive balance only
            const stockWithBalance = await tally.stock.getStockItemList({
                withBalance: true,
                activeOnly: true
            });

            console.log(`📊 Stock items with positive balance: ${stockWithBalance.count}`);

            // Create a high-value stock item
            const premiumStock = await tally.stock.createStockItem({
                name: 'Premium Component Z',
                parent: 'Raw Materials',
                baseUnits: 'Nos',
                alias: 'PREM-Z',
                openingBalance: {
                    quantity: 10,
                    rate: 1500.00,
                    value: 15000.00
                }
            });

            console.log('✅ Premium stock item created:', premiumStock.stockItemName);

            // Get comprehensive summary for all categories
            const comprehensiveSummary = await tally.stock.getStockSummary({
                includeZeroBalance: true,
                asOn: '31-Dec-2023'
            });

            console.log('📈 Comprehensive Stock Analysis:');
            console.log('   📦 Total items:', comprehensiveSummary.data.totalItems);
            console.log('   💰 Total inventory value: ₹', comprehensiveSummary.data.totalValue);

            // Group items by value ranges
            if (comprehensiveSummary.data.items) {
                const valueRanges = {
                    high: 0,    // > ₹10,000
                    medium: 0,  // ₹1,000 - ₹10,000
                    low: 0      // < ₹1,000
                };

                comprehensiveSummary.data.items.forEach(item => {
                    if (item.closingValue > 10000) valueRanges.high++;
                    else if (item.closingValue > 1000) valueRanges.medium++;
                    else valueRanges.low++;
                });

                console.log('💰 Items by value range:');
                console.log(`   🔴 High value (>₹10K): ${valueRanges.high} items`);
                console.log(`   🟡 Medium value (₹1K-₹10K): ${valueRanges.medium} items`);
                console.log(`   🟢 Low value (<₹1K): ${valueRanges.low} items`);
            }

        } catch (error) {
            console.log(`⚠️  Advanced operations error: ${error.message}`);
        }

        console.log('\\n✅ Stock management examples completed!');

    } catch (error) {
        console.error('❌ Stock management example failed:', error.message);
        console.log('\\n🔧 Troubleshooting:');
        console.log('1. Ensure TallyPrime is running');
        console.log('2. Check if required stock groups exist (Raw Materials, Finished Goods, etc.)');
        console.log('3. Verify API access is enabled in TallyPrime');
        console.log('4. Ensure stock item units are properly configured');
    }
}

// Cleanup example - delete test stock items
async function cleanupTestStockItems() {
    console.log('\\n🧹 Cleanup: Removing test stock items...');
    
    const tally = new TallyPrimeSDK();
    const testStockItems = [
        'Widget A',
        'Widget B',
        'Finished Product X',
        'Packaging Material',
        'Semi Finished Y',
        'Premium Component Z'
    ];

    for (const stockItemName of testStockItems) {
        try {
            await tally.stock.deleteStockItem(stockItemName, { force: true });
            console.log(`🗑️  Deleted: ${stockItemName}`);
        } catch (error) {
            console.log(`⚠️  Could not delete ${stockItemName}: ${error.message}`);
        }
    }
}

// Run the examples
async function runStockExamples() {
    try {
        await stockManagementExample();
        
        // Uncomment the line below to cleanup test data
        // await cleanupTestStockItems();
        
    } catch (error) {
        console.error('❌ Error running stock examples:', error);
    }
}

// Execute examples if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runStockExamples().catch(console.error);
}

export { stockManagementExample, cleanupTestStockItems };