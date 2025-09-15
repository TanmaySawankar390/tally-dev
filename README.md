# TallyPrime JavaScript SDK

A comprehensive JavaScript SDK for TallyPrime integration with XML-RPC and ODBC API support. This SDK provides an easy-to-use interface for developers to interact with TallyPrime programmatically.

[![npm version](https://badge.fury.io/js/tallyprime-js-sdk.svg)](https://badge.fury.io/js/tallyprime-js-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/Node.js-14%2B-green.svg)](https://nodejs.org/)

## 🌟 Features

- **Modern ES6+ JavaScript** with classes, async/await, and Promises
- **Complete CRUD Operations** for ledgers, vouchers, stock items, and companies
- **XML Request Builder** utilities for TallyPrime's XML format
- **Comprehensive Error Handling** with detailed error messages
- **Extensible Architecture** for adding new TallyPrime features
- **TypeScript-Ready** with detailed JSDoc comments
- **Example-Rich Documentation** with real-world use cases

## 📦 Installation

```bash
npm install tallyprime-js-sdk
```

## 🚀 Quick Start

```javascript
import TallyPrimeSDK from 'tallyprime-js-sdk';

// Initialize the SDK
const tally = new TallyPrimeSDK({
    host: 'localhost',  // TallyPrime host (default: localhost)
    port: 9000,         // TallyPrime port (default: 9000)
    timeout: 30000      // Request timeout (default: 30000ms)
});

// Test connection
const isConnected = await tally.testConnection();
if (isConnected) {
    console.log('✅ Connected to TallyPrime successfully!');
    
    // Create a ledger
    const ledger = await tally.createLedger('ABC Corporation', 'Sundry Debtors', {
        alias: 'ABC Corp',
        openingBalance: { amount: 10000 }
    });
    
    console.log('Ledger created:', ledger.message);
} else {
    console.log('❌ Failed to connect to TallyPrime');
}
```

## 📋 Prerequisites

1. **TallyPrime** installed and running
2. **API Access Enabled** in TallyPrime:
   - Go to Gateway of Tally → F11 (Features) → Advanced Features
   - Enable "Allow XML/HTTP Remote API"
   - Set port (default: 9000)
3. **Node.js 14+** installed

## 🏗️ Architecture

The SDK is organized into service classes for different TallyPrime modules:

```
TallyPrimeSDK
├── TallyConnector     # Core connection management
├── LedgerService      # Ledger operations
├── VoucherService     # Voucher/transaction operations
├── CompanyService     # Company management
├── StockItemService   # Stock item and inventory
└── XmlBuilder         # XML request utilities
```

## 📚 API Reference

### Core SDK

#### TallyPrimeSDK Class

```javascript
import TallyPrimeSDK from 'tallyprime-js-sdk';

const tally = new TallyPrimeSDK({
    host: 'localhost',    // Optional
    port: 9000,          // Optional
    timeout: 30000       // Optional
});
```

#### Connection Methods

```javascript
// Test connection to TallyPrime
const isConnected = await tally.testConnection();

// Get connection information
const info = tally.getConnectionInfo();

// Update configuration
tally.updateConfig({ port: 9001, timeout: 45000 });
```

### Ledger Operations

#### Create Ledger

```javascript
// Quick method
const ledger = await tally.createLedger('Customer Name', 'Sundry Debtors', {
    alias: 'Cust Name',
    openingBalance: {
        amount: 15000,
        isBillWise: true,
        isCostCentre: false
    }
});

// Using service directly
const ledger = await tally.ledger.createLedger({
    name: 'Supplier XYZ',
    parent: 'Sundry Creditors',
    alias: 'Supplier XYZ Ltd',
    openingBalance: {
        amount: -25000,
        isBillWise: true
    }
});
```

#### Fetch Ledger

```javascript
const ledgerDetails = await tally.ledger.fetchLedger('Customer Name', {
    includeBalance: true,
    fromDate: '01-Apr-2023',
    toDate: '31-Mar-2024'
});
```

#### Update Ledger

```javascript
const result = await tally.ledger.updateLedger('Customer Name', {
    alias: 'Customer Name Ltd',
    openingBalance: { amount: 18000 }
});
```

#### Get Ledger List

```javascript
const ledgers = await tally.ledger.getLedgerList({
    group: 'Sundry Debtors',
    activeOnly: true,
    nameContains: 'Corp'
});
```

#### Get Ledger Balance

```javascript
const balance = await tally.ledger.getLedgerBalance('Customer Name', {
    fromDate: '01-Apr-2023',
    toDate: '31-Dec-2023'
});
```

#### Delete Ledger

```javascript
const result = await tally.ledger.deleteLedger('Customer Name', {
    force: false  // Set to true to force delete even with transactions
});
```

### Voucher Operations

#### Create Voucher

```javascript
// Sales voucher
const salesVoucher = await tally.createVoucher('Sales', '15-Sep-2023', [
    { ledgerName: 'Customer ABC', amount: 11800, billName: 'INV-001', billType: 'New Ref' },
    { ledgerName: 'Sales Account', amount: -10000 },
    { ledgerName: 'CGST Output 9%', amount: -900 },
    { ledgerName: 'SGST Output 9%', amount: -900 }
], {
    voucherNumber: 'S-001',
    narration: 'Sale of goods with GST'
});

// Purchase voucher using service
const purchaseVoucher = await tally.voucher.createVoucher({
    voucherType: 'Purchase',
    date: '16-Sep-2023',
    voucherNumber: 'P-001',
    narration: 'Purchase of raw materials',
    ledgerEntries: [
        { ledgerName: 'Raw Materials', amount: 5000 },
        { ledgerName: 'CGST Input 9%', amount: 450 },
        { ledgerName: 'SGST Input 9%', amount: 450 },
        { ledgerName: 'Supplier XYZ', amount: -5900, billName: 'BILL-101', billType: 'New Ref' }
    ]
});
```

#### Fetch Voucher

```javascript
const voucher = await tally.voucher.fetchVoucher('S-001', 'Sales', {
    date: '15-Sep-2023'
});
```

#### Update Voucher

```javascript
const result = await tally.voucher.updateVoucher('S-001', 'Sales', {
    narration: 'Updated narration',
    ledgerEntries: [/* updated entries */]
});
```

#### Get Voucher List

```javascript
const vouchers = await tally.voucher.getVoucherList({
    voucherType: 'Sales',
    fromDate: '01-Sep-2023',
    toDate: '30-Sep-2023',
    limit: 50
});
```

#### Get Voucher Summary

```javascript
const summary = await tally.voucher.getVoucherSummary({
    fromDate: '01-Sep-2023',
    toDate: '30-Sep-2023',
    groupByType: true
});
```

### Stock Item Operations

#### Create Stock Item

```javascript
// Quick method
const stockItem = await tally.createStockItem('Widget A', 'Raw Materials', 'Nos', {
    alias: 'WGT-A',
    openingBalance: {
        quantity: 100,
        rate: 50.00,
        value: 5000.00
    }
});

// Using service directly
const stockItem = await tally.stock.createStockItem({
    name: 'Finished Product X',
    parent: 'Finished Goods',
    baseUnits: 'Nos',
    alias: 'FP-X',
    openingBalance: {
        quantity: 25,
        rate: 200.00,
        value: 5000.00
    }
});
```

#### Fetch Stock Item

```javascript
const stockDetails = await tally.stock.fetchStockItem('Widget A', {
    includeBalance: true,
    asOn: '31-Dec-2023'
});
```

#### Get Stock Balance

```javascript
const balance = await tally.stock.getStockBalance('Widget A', {
    asOn: '31-Dec-2023',
    godown: 'Main Warehouse'
});
```

#### Get Stock Summary

```javascript
const summary = await tally.stock.getStockSummary({
    group: 'Raw Materials',
    asOn: '31-Dec-2023',
    includeZeroBalance: false
});
```

#### Get Stock Movements

```javascript
const movements = await tally.stock.getStockMovements('Widget A', {
    fromDate: '01-Dec-2023',
    toDate: '31-Dec-2023',
    voucherType: 'Sales'
});
```

### Company Operations

#### Get Company List

```javascript
const companies = await tally.company.getCompanyList({
    activeOnly: true,
    includeDetails: true
});
```

#### Get Company Info

```javascript
const companyInfo = await tally.company.getCompanyInfo('My Company Ltd');
```

#### Load Company

```javascript
const result = await tally.company.loadCompany('My Company Ltd');
```

#### Create Company

```javascript
const company = await tally.company.createCompany({
    name: 'New Company Ltd',
    mailingName: 'New Company Limited',
    address: '123 Business Street, City',
    state: 'Maharashtra',
    country: 'India',
    pincode: '400001'
});
```

#### Get Company Statistics

```javascript
const stats = await tally.company.getCompanyStatistics('My Company Ltd', {
    includeLedgerCount: true,
    includeVoucherCount: true,
    includeStockCount: true
});
```

### Advanced Usage

#### Raw XML Requests

```javascript
const customXml = `
<ENVELOPE>
    <HEADER>
        <TALLYREQUEST>Export Data</TALLYREQUEST>
    </HEADER>
    <BODY>
        <EXPORTDATA>
            <REQUESTDESC>
                <REPORTNAME>Custom Report</REPORTNAME>
            </REQUESTDESC>
        </EXPORTDATA>
    </BODY>
</ENVELOPE>
`;

const response = await tally.executeRawRequest(customXml);
```

#### Using Individual Services

```javascript
import { TallyConnector, LedgerService, VoucherService } from 'tallyprime-js-sdk';

const connector = new TallyConnector({ host: 'localhost', port: 9000 });
const ledgerService = new LedgerService(connector);
const voucherService = new VoucherService(connector);

// Use services independently
const ledgers = await ledgerService.getLedgerList({ activeOnly: true });
const vouchers = await voucherService.getVoucherList({ voucherType: 'Sales' });
```

#### XML Builder Utilities

```javascript
import { XmlBuilder } from 'tallyprime-js-sdk';

// Build custom ledger XML
const ledgerXml = XmlBuilder.buildLedgerXml({
    name: 'Test Ledger',
    parent: 'Sundry Debtors',
    alias: 'Test'
});

// Build custom export request
const exportXml = XmlBuilder.buildExportRequest('Ledger Details', {
    LEDGERNAME: 'Test Ledger'
});
```

## 🔧 Configuration

### TallyPrime Setup

1. Open TallyPrime
2. Go to **Gateway of Tally** → **F11 (Features)** → **Advanced Features**
3. Set **Allow XML/HTTP Remote API** to **Yes**
4. Set **Remote API Port** (default: 9000)
5. Restart TallyPrime if prompted

### SDK Configuration Options

```javascript
const tally = new TallyPrimeSDK({
    host: 'localhost',        // TallyPrime host
    port: 9000,              // TallyPrime port
    timeout: 30000,          // Request timeout (ms)
});

// Update configuration later
tally.updateConfig({
    host: 'remote-server',
    port: 9001,
    timeout: 60000
});
```

## 📖 Examples

### Complete Examples

The `examples/` directory contains comprehensive examples:

- **[basic-usage.js](examples/basic-usage.js)** - SDK initialization and connection testing
- **[ledger-management.js](examples/ledger-management.js)** - Complete ledger CRUD operations
- **[voucher-operations.js](examples/voucher-operations.js)** - Voucher creation and management
- **[stock-management.js](examples/stock-management.js)** - Stock item and inventory operations

### Running Examples

```bash
# Run basic usage example
node examples/basic-usage.js

# Run ledger management example
node examples/ledger-management.js

# Run voucher operations example
node examples/voucher-operations.js

# Run stock management example
node examples/stock-management.js
```

### Real-World Scenarios

#### 1. Complete Sales Transaction Flow

```javascript
async function processSalesTransaction() {
    const tally = new TallyPrimeSDK();
    
    // 1. Ensure customer ledger exists
    try {
        await tally.ledger.createLedger({
            name: 'Customer ABC',
            parent: 'Sundry Debtors',
            alias: 'ABC Corp'
        });
    } catch (error) {
        console.log('Customer ledger may already exist');
    }
    
    // 2. Create sales voucher
    const salesVoucher = await tally.createVoucher('Sales', '15-Sep-2023', [
        { ledgerName: 'Customer ABC', amount: 11800, billName: 'INV-001', billType: 'New Ref' },
        { ledgerName: 'Sales Account', amount: -10000 },
        { ledgerName: 'CGST Output 9%', amount: -900 },
        { ledgerName: 'SGST Output 9%', amount: -900 }
    ], {
        voucherNumber: 'S-001',
        narration: 'Sale of goods with GST'
    });
    
    // 3. Update stock (if inventory voucher)
    await tally.stock.getStockMovements('Product A', {
        fromDate: '15-Sep-2023',
        toDate: '15-Sep-2023'
    });
    
    console.log('Sales transaction processed successfully');
}
```

#### 2. Inventory Management Dashboard

```javascript
async function getInventoryDashboard() {
    const tally = new TallyPrimeSDK();
    
    // Get stock summary
    const summary = await tally.stock.getStockSummary({
        asOn: new Date().toISOString().split('T')[0],
        includeZeroBalance: false
    });
    
    // Get low stock items
    const lowStockItems = summary.data.items.filter(item => 
        item.closingQuantity < 10 && item.closingQuantity > 0
    );
    
    // Get high value items
    const highValueItems = summary.data.items
        .filter(item => item.closingValue > 50000)
        .sort((a, b) => b.closingValue - a.closingValue);
    
    return {
        totalItems: summary.data.totalItems,
        totalValue: summary.data.totalValue,
        lowStockAlert: lowStockItems.length,
        highValueItems: highValueItems.slice(0, 10),
        stockAnalysis: summary.data.summary
    };
}
```

#### 3. Financial Report Generation

```javascript
async function generateFinancialReport(fromDate, toDate) {
    const tally = new TallyPrimeSDK();
    
    // Get all ledgers with balances
    const ledgers = await tally.ledger.getLedgerList({ activeOnly: true });
    const balances = await Promise.all(
        ledgers.data.map(async (ledger) => {
            try {
                const balance = await tally.ledger.getLedgerBalance(ledger.name, {
                    fromDate, toDate
                });
                return { ...ledger, balance: balance.data };
            } catch (error) {
                return { ...ledger, balance: null };
            }
        })
    );
    
    // Get voucher summary
    const voucherSummary = await tally.voucher.getVoucherSummary({
        fromDate, toDate, groupByType: true
    });
    
    return {
        period: { fromDate, toDate },
        ledgerBalances: balances,
        voucherSummary: voucherSummary.data,
        generatedAt: new Date()
    };
}
```

## ❌ Error Handling

The SDK provides comprehensive error handling:

```javascript
try {
    const ledger = await tally.createLedger('Test Ledger', 'Sundry Debtors');
} catch (error) {
    if (error.message.includes('Cannot connect')) {
        console.log('TallyPrime is not running or API is disabled');
    } else if (error.message.includes('Ledger name is required')) {
        console.log('Invalid input parameters');
    } else if (error.message.includes('Parent group')) {
        console.log('Parent group does not exist');
    } else {
        console.log('Unexpected error:', error.message);
    }
}
```

Common error scenarios:
- **Connection errors**: TallyPrime not running, wrong port, network issues
- **Authentication errors**: API access disabled, security restrictions
- **Validation errors**: Missing required fields, invalid data formats
- **Business logic errors**: Duplicate names, missing dependencies
- **Timeout errors**: Large data requests, slow network

## 🔧 Troubleshooting

### Connection Issues

**Problem**: Cannot connect to TallyPrime
```javascript
const isConnected = await tally.testConnection();
// Returns false
```

**Solutions**:
1. Ensure TallyPrime is running
2. Enable XML/HTTP Remote API in TallyPrime (F11 → Advanced Features)
3. Check port configuration (default: 9000)
4. Verify firewall settings
5. Test with telnet: `telnet localhost 9000`

### API Access Issues

**Problem**: API requests are rejected
```javascript
// Error: "Request failed with status 403"
```

**Solutions**:
1. Enable "Allow XML/HTTP Remote API" in TallyPrime
2. Check if remote access is allowed
3. Verify TallyPrime version supports API
4. Restart TallyPrime after configuration changes

### Data Issues

**Problem**: Ledgers/vouchers not created despite success response
```javascript
// Success response but data not visible in TallyPrime
```

**Solutions**:
1. Ensure correct company is loaded in TallyPrime
2. Check if parent groups exist
3. Verify data formats (dates, amounts)
4. Refresh TallyPrime display (F5)
5. Check TallyPrime logs for import errors

### Performance Issues

**Problem**: Slow API responses
```javascript
// Requests taking too long
```

**Solutions**:
1. Increase timeout in SDK configuration
2. Optimize filters to reduce data volume
3. Use pagination for large datasets
4. Process requests in batches
5. Monitor TallyPrime performance

## 🧪 Testing

### Unit Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- --grep "LedgerService"

# Run with coverage
npm run test:coverage
```

### Integration Tests

```bash
# Requires running TallyPrime instance
npm run test:integration
```

### Manual Testing

Use the provided examples for manual testing:

```bash
# Test basic connectivity
node examples/basic-usage.js

# Test full functionality
node examples/ledger-management.js
node examples/voucher-operations.js
node examples/stock-management.js
```

## 🚀 Deployment

### NPM Package

```bash
# Build the package
npm run build

# Publish to NPM
npm publish
```

### Docker Deployment

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
CMD ["node", "src/index.js"]
```

### Environment Variables

```bash
# .env file
TALLY_HOST=localhost
TALLY_PORT=9000
TALLY_TIMEOUT=30000
TALLY_COMPANY_NAME="My Company"
```

```javascript
// Use in application
const tally = new TallyPrimeSDK({
    host: process.env.TALLY_HOST || 'localhost',
    port: parseInt(process.env.TALLY_PORT) || 9000,
    timeout: parseInt(process.env.TALLY_TIMEOUT) || 30000
});
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/your-username/tallyprime-js-sdk.git
cd tallyprime-js-sdk

# Install dependencies
npm install

# Run tests
npm test

# Run examples
npm run examples
```

### Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Update documentation
7. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [GitHub Wiki](https://github.com/your-username/tallyprime-js-sdk/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-username/tallyprime-js-sdk/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/tallyprime-js-sdk/discussions)
- **Email**: support@tallyprime-js-sdk.com

## 🔮 Roadmap

### Version 1.1 (Upcoming)
- [ ] TypeScript definitions
- [ ] WebSocket support for real-time updates
- [ ] Batch operations
- [ ] Advanced filtering and querying
- [ ] Report generation utilities

### Version 1.2 (Future)
- [ ] TallyPrime Server Edition support
- [ ] Multi-company operations
- [ ] Advanced authentication
- [ ] Performance optimization
- [ ] GraphQL API layer

### Version 2.0 (Long-term)
- [ ] Complete rewrite in TypeScript
- [ ] Plugin architecture
- [ ] Advanced caching
- [ ] Offline support
- [ ] Mobile SDK variants

## 🙏 Acknowledgments

- TallyPrime development team for API documentation
- Contributors and beta testers
- Open source community for tools and libraries

## 📊 Project Stats

![GitHub stars](https://img.shields.io/github/stars/your-username/tallyprime-js-sdk?style=social)
![GitHub forks](https://img.shields.io/github/forks/your-username/tallyprime-js-sdk?style=social)
![GitHub issues](https://img.shields.io/github/issues/your-username/tallyprime-js-sdk)
![GitHub pull requests](https://img.shields.io/github/issues-pr/your-username/tallyprime-js-sdk)

---

Made with ❤️ for the TallyPrime developer community