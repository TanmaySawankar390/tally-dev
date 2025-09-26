import { XmlBuilder } from '../utils/XmlBuilder.js';

/**
 * LedgerService - Service class for managing ledger operations in TallyPrime
 * Provides methods to create, fetch, update, and delete ledgers
 * 
 * @class LedgerService
 */
export class LedgerService {
    /**
     * Create a LedgerService instance
     * @param {TallyConnector} connector - TallyConnector instance
     */
    constructor(connector) {
        this.connector = connector;
    }

    /**
     * Create a new ledger in TallyPrime
     * @param {Object} ledgerData - Ledger information
     * @param {string} ledgerData.name - Ledger name
     * @param {string} ledgerData.parent - Parent group (e.g., 'Sundry Debtors', 'Cash')
     * @param {string} [ledgerData.alias] - Ledger alias
     * @param {Object} [ledgerData.openingBalance] - Opening balance details
     * @param {number} [ledgerData.openingBalance.amount] - Opening balance amount
     * @param {boolean} [ledgerData.openingBalance.isBillWise] - Enable bill-wise details
     * @param {boolean} [ledgerData.openingBalance.isCostCentre] - Enable cost centre
     * @returns {Promise<Object>} Created ledger response
     * 
     * @example
     * const ledger = await ledgerService.createLedger({
     *   name: 'ABC Corporation',
     *   parent: 'Sundry Debtors',
     *   alias: 'ABC Corp',
     *   openingBalance: {
     *     amount: 10000,
     *     isBillWise: true,
     *     isCostCentre: false
     *   }
     * });
     */
    async createLedger(ledgerData) {
        if (!ledgerData.name) {
            throw new Error('Ledger name is required');
        }
        
        if (!ledgerData.parent) {
            throw new Error('Parent group is required');
        }

        try {
            const ledgerXml = XmlBuilder.buildLedgerXml(ledgerData);
            const importXml = XmlBuilder.buildImportRequest(ledgerXml, { reportName: 'All Masters', companyName: process.env.TALLY_COMPANY });
            
            const response = await this.connector.sendRequest(importXml);
            
            return {
                success: true,
                message: `Ledger '${ledgerData.name}' created successfully`,
                data: response.data,
                ledgerName: ledgerData.name
            };
        } catch (error) {
            throw new Error(`Failed to create ledger: ${error.message}`);
        }
    }

    /**
     * Fetch ledger details by name
     * @param {string} ledgerName - Name of the ledger to fetch
     * @param {Object} [options] - Additional fetch options
     * @param {boolean} [options.includeBalance] - Include current balance
     * @param {string} [options.fromDate] - From date for balance calculation
     * @param {string} [options.toDate] - To date for balance calculation
     * @returns {Promise<Object>} Ledger details
     * 
     * @example
     * const ledger = await ledgerService.fetchLedger('ABC Corporation', {
     *   includeBalance: true,
     *   fromDate: '01-Apr-2023',
     *   toDate: '31-Mar-2024'
     * });
     */
    async fetchLedger(ledgerName, options = {}) {
        if (!ledgerName) {
            throw new Error('Ledger name is required');
        }

        try {
            const filters = {
                LEDGERNAME: ledgerName
            };

            if (options.fromDate) filters.FROMDATE = options.fromDate;
            if (options.toDate) filters.TODATE = options.toDate;

            const exportXml = XmlBuilder.buildExportRequest('Ledger Details', filters);
            const response = await this.connector.sendRequest(exportXml);

            return {
                success: true,
                data: this._parseLedgerResponse(response.data),
                ledgerName
            };
        } catch (error) {
            throw new Error(`Failed to fetch ledger: ${error.message}`);
        }
    }

    /**
     * Get list of all ledgers with optional filtering
     * @param {Object} [filters] - Filter criteria
     * @param {string} [filters.group] - Filter by parent group
     * @param {boolean} [filters.activeOnly] - Return only active ledgers
     * @param {string} [filters.nameContains] - Filter ledgers containing text
     * @returns {Promise<Array>} List of ledgers
     * 
     * @example
     * const ledgers = await ledgerService.getLedgerList({
     *   group: 'Sundry Debtors',
     *   activeOnly: true,
     *   nameContains: 'Corp'
     * });
     */
    async getLedgerList(filters = {}) {
        try {
            const requestFilters = {};
            
            if (filters.group) {
                requestFilters.GROUP = filters.group;
            }

            // Prefer robust TDL collection request
            const exportXml = XmlBuilder.buildTDLCollectionRequest('Ledger List', 'Ledger', ['NAME','PARENT']);
            const response = await this.connector.sendRequest(exportXml);

            let ledgers = this._parseLedgerListResponse(response.data);

            // Apply client-side filters
            if (filters.activeOnly) {
                ledgers = ledgers.filter(ledger => ledger.isActive !== false);
            }

            if (filters.nameContains) {
                const searchTerm = filters.nameContains.toLowerCase();
                ledgers = ledgers.filter(ledger => 
                    ledger.name.toLowerCase().includes(searchTerm)
                );
            }

            return {
                success: true,
                data: ledgers,
                count: ledgers.length
            };
        } catch (error) {
            throw new Error(`Failed to fetch ledger list: ${error.message}`);
        }
    }

    /**
     * Update an existing ledger
     * @param {string} ledgerName - Name of the ledger to update
     * @param {Object} updates - Updated ledger information
     * @param {string} [updates.alias] - New alias
     * @param {string} [updates.parent] - New parent group
     * @param {Object} [updates.openingBalance] - Updated opening balance
     * @returns {Promise<Object>} Update response
     * 
     * @example
     * const result = await ledgerService.updateLedger('ABC Corporation', {
     *   alias: 'ABC Corp Ltd',
     *   openingBalance: {
     *     amount: 15000,
     *     isBillWise: true
     *   }
     * });
     */
    async updateLedger(ledgerName, updates) {
        if (!ledgerName) {
            throw new Error('Ledger name is required');
        }

        try {
            // First, fetch current ledger details
            const currentLedger = await this.fetchLedger(ledgerName);
            
            // Merge current data with updates
            const updatedLedgerData = {
                name: ledgerName,
                parent: updates.parent || currentLedger.data.parent,
                alias: updates.alias || currentLedger.data.alias,
                openingBalance: updates.openingBalance || currentLedger.data.openingBalance
            };

            // Build update XML (similar to create, but with ACTION="Alter")
            const ledgerXml = XmlBuilder.buildLedgerXml(updatedLedgerData);
            const updateXml = ledgerXml.replace('ACTION="Create"', 'ACTION="Alter"');
            const importXml = XmlBuilder.buildImportRequest(updateXml, { reportName: 'All Masters', companyName: process.env.TALLY_COMPANY });
            
            const response = await this.connector.sendRequest(importXml);
            
            return {
                success: true,
                message: `Ledger '${ledgerName}' updated successfully`,
                data: response.data,
                ledgerName
            };
        } catch (error) {
            throw new Error(`Failed to update ledger: ${error.message}`);
        }
    }

    /**
     * Delete a ledger (mark as inactive)
     * @param {string} ledgerName - Name of the ledger to delete
     * @param {Object} [options] - Deletion options
     * @param {boolean} [options.force] - Force deletion even if ledger has transactions
     * @returns {Promise<Object>} Deletion response
     * 
     * @example
     * const result = await ledgerService.deleteLedger('ABC Corporation', {
     *   force: false
     * });
     */
    async deleteLedger(ledgerName, options = {}) {
        if (!ledgerName) {
            throw new Error('Ledger name is required');
        }

        try {
            // Check if ledger has transactions (unless force is true)
            if (!options.force) {
                const hasTransactions = await this.checkLedgerTransactions(ledgerName);
                if (hasTransactions) {
                    throw new Error('Cannot delete ledger with existing transactions. Use force option to override.');
                }
            }

            // Build deletion XML
            const deleteXml = `<TALLYMESSAGE xmlns:UDF="TallyUDF">
                <LEDGER NAME="${XmlBuilder.escapeXml(ledgerName)}" ACTION="Delete">
                </LEDGER>
            </TALLYMESSAGE>`;
            
            const importXml = XmlBuilder.buildImportRequest(deleteXml, { reportName: 'All Masters', companyName: process.env.TALLY_COMPANY });
            const response = await this.connector.sendRequest(importXml);
            
            return {
                success: true,
                message: `Ledger '${ledgerName}' deleted successfully`,
                data: response.data,
                ledgerName
            };
        } catch (error) {
            throw new Error(`Failed to delete ledger: ${error.message}`);
        }
    }

    /**
     * Get ledger balance for a specific period
     * @param {string} ledgerName - Name of the ledger
     * @param {Object} [options] - Balance calculation options
     * @param {string} [options.fromDate] - Start date (default: financial year start)
     * @param {string} [options.toDate] - End date (default: current date)
     * @param {boolean} [options.includePending] - Include pending transactions
     * @returns {Promise<Object>} Ledger balance information
     * 
     * @example
     * const balance = await ledgerService.getLedgerBalance('ABC Corporation', {
     *   fromDate: '01-Apr-2023',
     *   toDate: '31-Dec-2023',
     *   includePending: true
     * });
     */
    async getLedgerBalance(ledgerName, options = {}) {
        if (!ledgerName) {
            throw new Error('Ledger name is required');
        }

        try {
            const filters = {
                LEDGERNAME: ledgerName,
                FROMDATE: options.fromDate || '01-Apr-2023',
                TODATE: options.toDate || XmlBuilder.formatDate(new Date())
            };

            const exportXml = XmlBuilder.buildExportRequest('Ledger Balance', filters);
            const response = await this.connector.sendRequest(exportXml);

            return {
                success: true,
                data: this._parseLedgerBalanceResponse(response.data),
                ledgerName,
                period: {
                    fromDate: filters.FROMDATE,
                    toDate: filters.TODATE
                }
            };
        } catch (error) {
            throw new Error(`Failed to get ledger balance: ${error.message}`);
        }
    }

    /**
     * Check if a ledger has transactions
     * @param {string} ledgerName - Name of the ledger to check
     * @returns {Promise<boolean>} True if ledger has transactions
     * @private
     */
    async checkLedgerTransactions(ledgerName) {
        try {
            const filters = {
                LEDGERNAME: ledgerName,
                FROMDATE: '01-Apr-1990', // Very old date to check all transactions
                TODATE: XmlBuilder.formatDate(new Date())
            };

            const exportXml = XmlBuilder.buildExportRequest('Ledger Transactions', filters);
            const response = await this.connector.sendRequest(exportXml);
            
            // Parse response to check if there are any transactions
            const transactions = this._parseLedgerTransactionsResponse(response.data);
            return transactions && transactions.length > 0;
        } catch (error) {
            // If error occurs, assume there are transactions to be safe
            return true;
        }
    }

    /**
     * Parse ledger response data
     * @param {Object} responseData - Raw response data from Tally
     * @returns {Object} Parsed ledger data
     * @private
     */
    _parseLedgerResponse(responseData) {
        // Extract ledger information from Tally XML response
        // This would need to be customized based on actual Tally response format
        const envelope = responseData.ENVELOPE || responseData;
        const body = envelope.BODY || envelope;
        
        if (body.EXPORTDATA && body.EXPORTDATA.REQUESTDATA) {
            const ledgerData = body.EXPORTDATA.REQUESTDATA.TALLYMESSAGE || {};
            return {
                name: ledgerData.NAME || '',
                parent: ledgerData.PARENT || '',
                alias: ledgerData.ALIAS || '',
                openingBalance: {
                    amount: ledgerData.OPENINGBALANCE || 0,
                    isBillWise: ledgerData.ISBILLWISEON === 'Yes',
                    isCostCentre: ledgerData.ISCOSTCENTRESON === 'Yes'
                }
            };
        }

        return {};
    }

    /**
     * Parse ledger list response data
     * @param {Object} responseData - Raw response data from Tally
     * @returns {Array} Parsed ledger list
     * @private
     */
    _parseLedgerListResponse(responseData) {
        const envelope = responseData.ENVELOPE || responseData;
        const body = envelope.BODY || envelope;
        
        // Handle TDL Collection response: top-level is RESPONSE/ or COLLECTION dump
        const tdlNodes = body?.DESC || body?.COLLECTION || body?.TALLYMESSAGE;
        const exportData = body.EXPORTDATA && body.EXPORTDATA.REQUESTDATA && body.EXPORTDATA.REQUESTDATA.TALLYMESSAGE;
        const nodes = exportData || tdlNodes || [];
        const arr = Array.isArray(nodes) ? nodes : [nodes];

        return arr
            .map(n => n || {})
            .map(node => ({
                name: node.NAME || node.LedgerName || node.$NAME || '',
                parent: node.PARENT || node.Parent || '',
                alias: node.ALIAS || node.Alias || '',
                isActive: node.ISACTIVE ? node.ISACTIVE !== 'No' : true
            }))
            .filter(x => x.name);
        

        return [];
    }

    /**
     * Parse ledger balance response data
     * @param {Object} responseData - Raw response data from Tally
     * @returns {Object} Parsed balance data
     * @private
     */
    _parseLedgerBalanceResponse(responseData) {
        const envelope = responseData.ENVELOPE || responseData;
        const body = envelope.BODY || envelope;
        
        if (body.EXPORTDATA && body.EXPORTDATA.REQUESTDATA) {
            const balanceData = body.EXPORTDATA.REQUESTDATA.TALLYMESSAGE || {};
            return {
                openingBalance: parseFloat(balanceData.OPENINGBALANCE) || 0,
                closingBalance: parseFloat(balanceData.CLOSINGBALANCE) || 0,
                debitTotal: parseFloat(balanceData.DEBITTOTAL) || 0,
                creditTotal: parseFloat(balanceData.CREDITTOTAL) || 0
            };
        }

        return {
            openingBalance: 0,
            closingBalance: 0,
            debitTotal: 0,
            creditTotal: 0
        };
    }

    /**
     * Parse ledger transactions response data
     * @param {Object} responseData - Raw response data from Tally
     * @returns {Array} Parsed transactions
     * @private
     */
    _parseLedgerTransactionsResponse(responseData) {
        const envelope = responseData.ENVELOPE || responseData;
        const body = envelope.BODY || envelope;
        
        if (body.EXPORTDATA && body.EXPORTDATA.REQUESTDATA) {
            const transactions = body.EXPORTDATA.REQUESTDATA.TALLYMESSAGE || [];
            return Array.isArray(transactions) ? transactions : [transactions];
        }

        return [];
    }
}

export default LedgerService;