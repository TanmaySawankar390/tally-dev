import { TallyConnector } from './connector/TallyConnector.js'
import {
  LedgerService,
  VoucherService,
  CompanyService,
  StockItemService,
} from './services/index.js'
import { XmlBuilder } from './utils/index.js'

/**
 * TallyPrimeSDK - Main SDK class providing unified access to TallyPrime functionality
 *
 * @class TallyPrimeSDK
 */
export class TallyPrimeSDK {
  /**
   * Create a TallyPrimeSDK instance
   * @param {Object} [config] - SDK configuration
   * @param {string} [config.host='localhost'] - TallyPrime host
   * @param {number} [config.port=9000] - TallyPrime port
   * @param {number} [config.timeout=30000] - Request timeout in milliseconds
   *
   * @example
   * // Create SDK instance with default settings (localhost:9000)
   * const tally = new TallyPrimeSDK();
   *
   * @example
   * // Create SDK instance with custom settings
   * const tally = new TallyPrimeSDK({
   *   host: 'remote-server',
   *   port: 9001,
   *   timeout: 60000
   * });
   */
  constructor(config = {}) {
    // Initialize the connector
    this.connector = new TallyConnector(config)

    // Initialize all services
    this.ledger = new LedgerService(this.connector)
    this.voucher = new VoucherService(this.connector)
    this.company = new CompanyService(this.connector)
    this.stock = new StockItemService(this.connector)

    // Expose utilities
    this.utils = {
      XmlBuilder,
    }
  }

  /**
   * Test connection to TallyPrime
   * @returns {Promise<boolean>} Connection status
   *
   * @example
   * const isConnected = await tally.testConnection();
   * if (isConnected) {
   *   console.log('Connected to TallyPrime successfully!');
   * }
   */
  async testConnection() {
    return this.connector.testConnection()
  }

  /**
   * Get connection information
   * @returns {Object} Connection details
   *
   * @example
   * const connectionInfo = tally.getConnectionInfo();
   * console.log(`Connected to ${connectionInfo.host}:${connectionInfo.port}`);
   */
  getConnectionInfo() {
    return this.connector.getConnectionInfo()
  }

  /**
   * Update connection configuration
   * @param {Object} config - New configuration
   * @param {string} [config.host] - New host
   * @param {number} [config.port] - New port
   * @param {number} [config.timeout] - New timeout
   *
   * @example
   * tally.updateConfig({
   *   host: 'new-server',
   *   port: 9001,
   *   timeout: 45000
   * });
   */
  updateConfig(config) {
    this.connector.updateConfig(config)
  }

  /**
   * Execute raw XML request (for advanced users)
   * @param {string} xmlData - Raw XML request data
   * @param {Object} [options] - Request options
   * @returns {Promise<Object>} Response data
   *
   * @example
   * const customXml = '<ENVELOPE>...</ENVELOPE>';
   * const response = await tally.executeRawRequest(customXml);
   */
  async executeRawRequest(xmlData, options = {}) {
    return this.connector.sendRequest(xmlData, options)
  }

  /**
   * Execute TDL (Tally Definition Language) function
   * @param {string} functionName - TDL function name
   * @param {Object} [parameters] - Function parameters
   * @returns {Promise<Object>} Function execution result
   *
   * @example
   * const result = await tally.executeTDLFunction('MyCustomFunction', {
   *   param1: 'value1',
   *   param2: 'value2'
   * });
   */
  async executeTDLFunction(functionName, parameters = {}) {
    return this.connector.executeTDLFunction(functionName, parameters)
  }

  /**
   * Quick methods for common operations
   */

  /**
   * Quick method to create a ledger
   * @param {string} name - Ledger name
   * @param {string} parent - Parent group
   * @param {Object} [options] - Additional options
   * @returns {Promise<Object>} Created ledger response
   *
   * @example
   * const ledger = await tally.createLedger('ABC Corporation', 'Sundry Debtors', {
   *   alias: 'ABC Corp',
   *   openingBalance: { amount: 10000 }
   * });
   */
  async createLedger(name, parent, options = {}) {
    const ledgerData = {
      name,
      parent,
      ...options,
    }
    return this.ledger.createLedger(ledgerData)
  }

  /**
   * Quick method to create a voucher
   * @param {string} voucherType - Type of voucher
   * @param {string} date - Voucher date
   * @param {Array} entries - Ledger entries
   * @param {Object} [options] - Additional options
   * @returns {Promise<Object>} Created voucher response
   *
   * @example
   * const voucher = await tally.createVoucher('Sales', '15-Sep-2023', [
   *   { ledgerName: 'Customer A', amount: 11800 },
   *   { ledgerName: 'Sales', amount: -10000 },
   *   { ledgerName: 'GST Output 18%', amount: -1800 }
   * ], {
   *   voucherNumber: 'S001',
   *   narration: 'Sale to Customer A'
   * });
   */
  async createVoucher(voucherType, date, entries, options = {}) {
    const voucherData = {
      voucherType,
      date,
      ledgerEntries: entries,
      ...options,
    }
    return this.voucher.createVoucher(voucherData)
  }

  /**
   * Quick method to create a stock item
   * @param {string} name - Stock item name
   * @param {string} parent - Parent group
   * @param {string} baseUnits - Base units
   * @param {Object} [options] - Additional options
   * @returns {Promise<Object>} Created stock item response
   *
   * @example
   * const stockItem = await tally.createStockItem('Widget A', 'Raw Materials', 'Nos', {
   *   alias: 'WGT-A',
   *   openingBalance: { quantity: 100, rate: 50, value: 5000 }
   * });
   */
  async createStockItem(name, parent, baseUnits, options = {}) {
    const stockData = {
      name,
      parent,
      baseUnits,
      ...options,
    }
    return this.stock.createStockItem(stockData)
  }

  /**
   * Get SDK version and information
   * @returns {Object} SDK information
   *
   * @example
   * const info = tally.getSDKInfo();
   * console.log(`TallyPrime JS SDK v${info.version}`);
   */
    getSDKInfo() {
        return {
            name: 'TallyPrime JavaScript SDK',
            version: '1.0.0',
            description: 'A comprehensive JavaScript SDK for TallyPrime integration',
            services: {
                ledger: 'Ledger management operations',
                voucher: 'Voucher/transaction management',
                company: 'Company management and information',
                stock: 'Stock item and inventory management',
            },
            utilities: {
                XmlBuilder: 'XML request builder utility',
            },
        }
    }
}
// Export individual components for advanced usage
export { TallyConnector } from './connector/TallyConnector.js'
export {
  LedgerService,
  VoucherService,
  CompanyService,
  StockItemService,
} from './services/index.js'
export { XmlBuilder } from './utils/index.js'

// Default export
export default TallyPrimeSDK
