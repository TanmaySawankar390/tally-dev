# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Common Development Commands

### Testing and Development
```bash
# Run all tests (currently placeholder)
npm test

# Run linting with ESLint
npm run lint

# Run specific integration tests (requires TallyPrime)
npm run test:integration

# Run tests with coverage
npm run test:coverage

# Run examples to test functionality
npm run examples
node examples/basic-usage.js
node examples/ledger-management.js
node examples/voucher-operations.js
node examples/stock-management.js
```

### Package Management
```bash
# Install dependencies
npm install

# Build package (no build process required - ES modules)
npm run build

# Generate documentation
npm run docs

# Prepare for publishing
npm run prepublishOnly
```

## Architecture Overview

### Core Architecture Pattern
This SDK follows a **service-oriented architecture** with these key components:

- **TallyConnector**: Core HTTP/XML-RPC communication layer with TallyPrime
- **Service Classes**: Domain-specific operations (LedgerService, VoucherService, CompanyService, StockItemService)
- **XmlBuilder**: Utility for constructing TallyPrime-compatible XML requests
- **Main SDK Class**: Unified interface providing both convenience methods and direct service access

### XML Communication Pattern
The SDK communicates with TallyPrime using XML-RPC over HTTP:

1. **Export Requests**: Retrieve data from TallyPrime (GET-like operations)
2. **Import Requests**: Send data to TallyPrime (POST/PUT-like operations)  
3. **TDL Function Calls**: Execute custom Tally Definition Language functions

All XML follows TallyPrime's envelope structure:
```xml
<ENVELOPE>
    <HEADER><TALLYREQUEST>Import/Export Data</TALLYREQUEST></HEADER>
    <BODY><!-- Request-specific content --></BODY>
</ENVELOPE>
```

### Error Handling Strategy
- **Connection Errors**: ECONNREFUSED, ETIMEDOUT handled with descriptive messages
- **Tally Errors**: Parsed from XML response ERROR/LINEERROR elements
- **Validation Errors**: Client-side validation before sending requests
- **Business Logic Errors**: TallyPrime rejection handling with context

### Service Architecture
Each service follows this pattern:
- Constructor takes `TallyConnector` instance
- Methods return standardized response objects: `{ success, data, message? }`
- Async/await throughout with proper error propagation
- XML building delegated to `XmlBuilder` utility

## Development Setup Requirements

### TallyPrime Configuration
TallyPrime must be running with API access enabled:
1. Gateway of Tally → F11 (Features) → Advanced Features
2. Set "Allow XML/HTTP Remote API" to "Yes"
3. Configure Remote API Port (default: 9000)
4. Restart TallyPrime if prompted

### Environment Setup
- Node.js 14+ required (specified in package.json engines)
- ES Modules used throughout ("type": "module")
- Windows/Linux/macOS compatible via axios HTTP client

### Development Dependencies
- **ESLint**: Code quality with custom rules (4-space indent, single quotes, semicolons)
- **Jest/Mocha**: Testing frameworks
- **JSDoc**: Documentation generation
- **c8**: Coverage reporting

## Key Development Patterns

### Service Method Structure
```javascript
async methodName(requiredParam, options = {}) {
    // Validation
    if (!requiredParam) {
        throw new Error('Parameter required');
    }
    
    try {
        // Build XML request
        const xmlData = XmlBuilder.buildSpecificXml(data);
        
        // Send to TallyPrime
        const response = await this.connector.sendRequest(xmlData);
        
        // Return standardized response
        return {
            success: true,
            message: 'Operation completed',
            data: this._parseResponse(response.data)
        };
    } catch (error) {
        throw new Error(`Operation failed: ${error.message}`);
    }
}
```

### XML Building Pattern
The `XmlBuilder` class provides static methods for different XML structures:
- `buildEnvelope()`: Creates standard Tally envelope
- `buildExportRequest()`: For data retrieval
- `buildImportRequest()`: For data modification  
- `buildLedgerXml()`, `buildVoucherXml()`: Domain-specific builders

### Quick vs. Service Methods
The main SDK class provides both:
- **Quick methods**: `createLedger(name, parent, options)` - simplified interface
- **Service access**: `tally.ledger.createLedger(fullLedgerData)` - full control

### Testing Patterns
Examples serve as both documentation and integration tests. They follow this pattern:
```javascript
// Test connection first
const isConnected = await tally.testConnection();
if (!isConnected) {
    throw new Error('Cannot connect to TallyPrime');
}

// Demonstrate functionality with error handling
try {
    const result = await tally.someOperation();
    console.log('✅ Success:', result.message);
} catch (error) {
    console.log('⚠️ Warning:', error.message);
}
```

## Important Configuration

### Connection Configuration
Default configuration connects to localhost:9000 with 30-second timeout. Configuration can be updated at runtime:

```javascript
const tally = new TallyPrimeSDK({
    host: 'localhost',
    port: 9000,
    timeout: 30000
});

// Update later
tally.updateConfig({ timeout: 45000 });
```

### Package.json Key Points
- ES Module type with explicit `.js` extensions in imports
- No build step required - direct ES module execution
- Export paths defined for selective imports
- Engines specify Node.js 14+ requirement
- Integration tests separated from unit tests

### Development Workflow
1. Ensure TallyPrime is running with API enabled
2. Run examples to verify connectivity: `node examples/basic-usage.js`
3. Use service classes directly for complex operations
4. Follow ESLint rules: 4-space indentation, single quotes, semicolons
5. Add JSDoc comments for all public methods
6. Test with real TallyPrime instance for integration testing

### Debugging TallyPrime Issues
- Check TallyPrime logs for import/export errors
- Use `testConnection()` to verify connectivity
- Inspect raw XML responses via `executeRawRequest()`
- Monitor network traffic on port 9000
- Verify company is loaded in TallyPrime before operations