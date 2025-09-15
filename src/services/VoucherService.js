import { XmlBuilder } from '../utils/XmlBuilder.js';

/**
 * VoucherService - Service class for managing voucher operations in TallyPrime
 * Provides methods to create, fetch, update, and delete vouchers
 * 
 * @class VoucherService
 */
export class VoucherService {
    /**
     * Create a VoucherService instance
     * @param {TallyConnector} connector - TallyConnector instance
     */
    constructor(connector) {
        this.connector = connector;
    }

    /**
     * Create a new voucher in TallyPrime
     * @param {Object} voucherData - Voucher information
     * @param {string} voucherData.voucherType - Type of voucher (e.g., 'Sales', 'Purchase', 'Receipt', 'Payment')
     * @param {string} voucherData.date - Voucher date (DD-MMM-YYYY format)
     * @param {string} [voucherData.voucherNumber] - Voucher number
     * @param {string} [voucherData.narration] - Voucher narration/description
     * @param {Array} voucherData.ledgerEntries - Array of ledger entries
     * @param {string} voucherData.ledgerEntries[].ledgerName - Ledger name for entry
     * @param {number} voucherData.ledgerEntries[].amount - Entry amount (positive for debit, negative for credit)
     * @param {string} [voucherData.ledgerEntries[].billName] - Bill reference name
     * @param {string} [voucherData.ledgerEntries[].billType] - Bill type ('New Ref', 'Against Ref', 'Advance')
     * @returns {Promise<Object>} Created voucher response
     * 
     * @example
     * const voucher = await voucherService.createVoucher({
     *   voucherType: 'Sales',
     *   date: '15-Sep-2023',
     *   voucherNumber: 'S001',
     *   narration: 'Sale to ABC Corporation',
     *   ledgerEntries: [
     *     { ledgerName: 'ABC Corporation', amount: 11800, billName: 'INV001', billType: 'New Ref' },
     *     { ledgerName: 'Sales', amount: -10000 },
     *     { ledgerName: 'GST Output 18%', amount: -1800 }
     *   ]
     * });
     */
    async createVoucher(voucherData) {
        this._validateVoucherData(voucherData);

        try {
            const voucherXml = XmlBuilder.buildVoucherXml(voucherData);
            const importXml = XmlBuilder.buildImportRequest(voucherXml);
            
            const response = await this.connector.sendRequest(importXml);
            
            return {
                success: true,
                message: `Voucher created successfully`,
                data: response.data,
                voucherNumber: voucherData.voucherNumber,
                voucherType: voucherData.voucherType
            };
        } catch (error) {
            throw new Error(`Failed to create voucher: ${error.message}`);
        }
    }

    /**
     * Fetch voucher details by voucher number and type
     * @param {string} voucherNumber - Voucher number to fetch
     * @param {string} voucherType - Type of voucher
     * @param {Object} [options] - Additional fetch options
     * @param {string} [options.date] - Specific date to search (if multiple vouchers with same number)
     * @returns {Promise<Object>} Voucher details
     * 
     * @example
     * const voucher = await voucherService.fetchVoucher('S001', 'Sales', {
     *   date: '15-Sep-2023'
     * });
     */
    async fetchVoucher(voucherNumber, voucherType, options = {}) {
        if (!voucherNumber || !voucherType) {
            throw new Error('Voucher number and type are required');
        }

        try {
            const filters = {
                VOUCHERNUMBER: voucherNumber,
                VOUCHERTYPE: voucherType
            };

            if (options.date) filters.DATE = options.date;

            const exportXml = XmlBuilder.buildExportRequest('Voucher Details', filters);
            const response = await this.connector.sendRequest(exportXml);

            return {
                success: true,
                data: this._parseVoucherResponse(response.data),
                voucherNumber,
                voucherType
            };
        } catch (error) {
            throw new Error(`Failed to fetch voucher: ${error.message}`);
        }
    }

    /**
     * Get list of vouchers with optional filtering
     * @param {Object} [filters] - Filter criteria
     * @param {string} [filters.voucherType] - Filter by voucher type
     * @param {string} [filters.fromDate] - From date filter
     * @param {string} [filters.toDate] - To date filter
     * @param {string} [filters.ledgerName] - Filter vouchers containing specific ledger
     * @param {number} [filters.amountRange] - Filter by amount range
     * @param {number} [filters.limit] - Limit number of results
     * @returns {Promise<Array>} List of vouchers
     * 
     * @example
     * const vouchers = await voucherService.getVoucherList({
     *   voucherType: 'Sales',
     *   fromDate: '01-Sep-2023',
     *   toDate: '30-Sep-2023',
     *   ledgerName: 'ABC Corporation',
     *   limit: 50
     * });
     */
    async getVoucherList(filters = {}) {
        try {
            const requestFilters = {};
            
            if (filters.voucherType) requestFilters.VOUCHERTYPE = filters.voucherType;
            if (filters.fromDate) requestFilters.FROMDATE = filters.fromDate;
            if (filters.toDate) requestFilters.TODATE = filters.toDate;
            if (filters.ledgerName) requestFilters.LEDGERNAME = filters.ledgerName;

            const exportXml = XmlBuilder.buildCollectionRequest('Voucher', requestFilters);
            const response = await this.connector.sendRequest(exportXml);

            let vouchers = this._parseVoucherListResponse(response.data);

            // Apply client-side filters
            if (filters.amountRange) {
                vouchers = vouchers.filter(voucher => 
                    Math.abs(voucher.amount) >= filters.amountRange.min && 
                    Math.abs(voucher.amount) <= filters.amountRange.max
                );
            }

            if (filters.limit) {
                vouchers = vouchers.slice(0, filters.limit);
            }

            return {
                success: true,
                data: vouchers,
                count: vouchers.length
            };
        } catch (error) {
            throw new Error(`Failed to fetch voucher list: ${error.message}`);
        }
    }

    /**
     * Update an existing voucher
     * @param {string} voucherNumber - Voucher number to update
     * @param {string} voucherType - Type of voucher
     * @param {Object} updates - Updated voucher information
     * @param {string} [updates.narration] - New narration
     * @param {Array} [updates.ledgerEntries] - Updated ledger entries
     * @param {string} [updates.date] - New date
     * @returns {Promise<Object>} Update response
     * 
     * @example
     * const result = await voucherService.updateVoucher('S001', 'Sales', {
     *   narration: 'Updated sale description',
     *   ledgerEntries: [
     *     { ledgerName: 'ABC Corporation', amount: 12000 },
     *     { ledgerName: 'Sales', amount: -12000 }
     *   ]
     * });
     */
    async updateVoucher(voucherNumber, voucherType, updates) {
        if (!voucherNumber || !voucherType) {
            throw new Error('Voucher number and type are required');
        }

        try {
            // First, fetch current voucher details
            const currentVoucher = await this.fetchVoucher(voucherNumber, voucherType);
            
            // Merge current data with updates
            const updatedVoucherData = {
                voucherType: voucherType,
                voucherNumber: voucherNumber,
                date: updates.date || currentVoucher.data.date,
                narration: updates.narration || currentVoucher.data.narration,
                ledgerEntries: updates.ledgerEntries || currentVoucher.data.ledgerEntries
            };

            this._validateVoucherData(updatedVoucherData);

            // Build update XML (similar to create, but with ACTION="Alter")
            const voucherXml = XmlBuilder.buildVoucherXml(updatedVoucherData);
            const updateXml = voucherXml.replace('ACTION="Create"', 'ACTION="Alter"');
            const importXml = XmlBuilder.buildImportRequest(updateXml);
            
            const response = await this.connector.sendRequest(importXml);
            
            return {
                success: true,
                message: `Voucher '${voucherNumber}' updated successfully`,
                data: response.data,
                voucherNumber,
                voucherType
            };
        } catch (error) {
            throw new Error(`Failed to update voucher: ${error.message}`);
        }
    }

    /**
     * Delete a voucher
     * @param {string} voucherNumber - Voucher number to delete
     * @param {string} voucherType - Type of voucher
     * @param {Object} [options] - Deletion options
     * @param {string} [options.date] - Specific date if multiple vouchers with same number
     * @returns {Promise<Object>} Deletion response
     * 
     * @example
     * const result = await voucherService.deleteVoucher('S001', 'Sales', {
     *   date: '15-Sep-2023'
     * });
     */
    async deleteVoucher(voucherNumber, voucherType, options = {}) {
        if (!voucherNumber || !voucherType) {
            throw new Error('Voucher number and type are required');
        }

        try {
            // Build deletion XML
            const deleteXml = `<TALLYMESSAGE xmlns:UDF="TallyUDF">
                <VOUCHER VOUCHERNUMBER="${XmlBuilder.escapeXml(voucherNumber)}" VCHTYPE="${XmlBuilder.escapeXml(voucherType)}" ACTION="Delete">
                    ${options.date ? `<DATE>${options.date}</DATE>` : ''}
                </VOUCHER>
            </TALLYMESSAGE>`;
            
            const importXml = XmlBuilder.buildImportRequest(deleteXml);
            const response = await this.connector.sendRequest(importXml);
            
            return {
                success: true,
                message: `Voucher '${voucherNumber}' deleted successfully`,
                data: response.data,
                voucherNumber,
                voucherType
            };
        } catch (error) {
            throw new Error(`Failed to delete voucher: ${error.message}`);
        }
    }

    /**
     * Get voucher summary for a period
     * @param {Object} [options] - Summary options
     * @param {string} [options.fromDate] - Start date
     * @param {string} [options.toDate] - End date
     * @param {string} [options.voucherType] - Filter by voucher type
     * @param {boolean} [options.groupByType] - Group results by voucher type
     * @returns {Promise<Object>} Voucher summary
     * 
     * @example
     * const summary = await voucherService.getVoucherSummary({
     *   fromDate: '01-Sep-2023',
     *   toDate: '30-Sep-2023',
     *   groupByType: true
     * });
     */
    async getVoucherSummary(options = {}) {
        try {
            const filters = {
                FROMDATE: options.fromDate || '01-Apr-2023',
                TODATE: options.toDate || XmlBuilder.formatDate(new Date())
            };

            if (options.voucherType) {
                filters.VOUCHERTYPE = options.voucherType;
            }

            const exportXml = XmlBuilder.buildExportRequest('Voucher Summary', filters);
            const response = await this.connector.sendRequest(exportXml);

            return {
                success: true,
                data: this._parseVoucherSummaryResponse(response.data, options.groupByType),
                period: {
                    fromDate: filters.FROMDATE,
                    toDate: filters.TODATE
                }
            };
        } catch (error) {
            throw new Error(`Failed to get voucher summary: ${error.message}`);
        }
    }

    /**
     * Get vouchers by ledger name
     * @param {string} ledgerName - Ledger name to search for
     * @param {Object} [options] - Additional options
     * @param {string} [options.fromDate] - From date filter
     * @param {string} [options.toDate] - To date filter
     * @param {string} [options.voucherType] - Filter by voucher type
     * @returns {Promise<Array>} Vouchers containing the specified ledger
     * 
     * @example
     * const vouchers = await voucherService.getVouchersByLedger('ABC Corporation', {
     *   fromDate: '01-Sep-2023',
     *   toDate: '30-Sep-2023',
     *   voucherType: 'Sales'
     * });
     */
    async getVouchersByLedger(ledgerName, options = {}) {
        if (!ledgerName) {
            throw new Error('Ledger name is required');
        }

        try {
            const filters = {
                LEDGERNAME: ledgerName,
                FROMDATE: options.fromDate || '01-Apr-2023',
                TODATE: options.toDate || XmlBuilder.formatDate(new Date())
            };

            if (options.voucherType) filters.VOUCHERTYPE = options.voucherType;

            const exportXml = XmlBuilder.buildExportRequest('Ledger Vouchers', filters);
            const response = await this.connector.sendRequest(exportXml);

            return {
                success: true,
                data: this._parseVoucherListResponse(response.data),
                ledgerName,
                period: {
                    fromDate: filters.FROMDATE,
                    toDate: filters.TODATE
                }
            };
        } catch (error) {
            throw new Error(`Failed to fetch vouchers for ledger: ${error.message}`);
        }
    }

    /**
     * Validate voucher data before processing
     * @param {Object} voucherData - Voucher data to validate
     * @private
     */
    _validateVoucherData(voucherData) {
        if (!voucherData.voucherType) {
            throw new Error('Voucher type is required');
        }

        if (!voucherData.date) {
            throw new Error('Voucher date is required');
        }

        if (!voucherData.ledgerEntries || !Array.isArray(voucherData.ledgerEntries)) {
            throw new Error('Ledger entries are required and must be an array');
        }

        if (voucherData.ledgerEntries.length < 2) {
            throw new Error('At least two ledger entries are required for a voucher');
        }

        // Validate ledger entries
        for (const entry of voucherData.ledgerEntries) {
            if (!entry.ledgerName) {
                throw new Error('Each ledger entry must have a ledger name');
            }
            if (typeof entry.amount !== 'number' || entry.amount === 0) {
                throw new Error('Each ledger entry must have a non-zero amount');
            }
        }

        // Check if debits and credits balance
        const totalAmount = voucherData.ledgerEntries.reduce((sum, entry) => sum + entry.amount, 0);
        if (Math.abs(totalAmount) > 0.01) { // Allow for minor rounding differences
            throw new Error('Voucher debits and credits must balance');
        }
    }

    /**
     * Parse voucher response data
     * @param {Object} responseData - Raw response data from Tally
     * @returns {Object} Parsed voucher data
     * @private
     */
    _parseVoucherResponse(responseData) {
        const envelope = responseData.ENVELOPE || responseData;
        const body = envelope.BODY || envelope;
        
        if (body.EXPORTDATA && body.EXPORTDATA.REQUESTDATA) {
            const voucherData = body.EXPORTDATA.REQUESTDATA.TALLYMESSAGE || {};
            return {
                voucherNumber: voucherData.VOUCHERNUMBER || '',
                voucherType: voucherData.VOUCHERTYPENAME || '',
                date: voucherData.DATE || '',
                narration: voucherData.NARRATION || '',
                ledgerEntries: this._parseLedgerEntries(voucherData['LEDGERENTRIES.LIST'] || [])
            };
        }

        return {};
    }

    /**
     * Parse voucher list response data
     * @param {Object} responseData - Raw response data from Tally
     * @returns {Array} Parsed voucher list
     * @private
     */
    _parseVoucherListResponse(responseData) {
        const envelope = responseData.ENVELOPE || responseData;
        const body = envelope.BODY || envelope;
        
        if (body.EXPORTDATA && body.EXPORTDATA.REQUESTDATA) {
            const vouchers = body.EXPORTDATA.REQUESTDATA.TALLYMESSAGE || [];
            const voucherArray = Array.isArray(vouchers) ? vouchers : [vouchers];
            
            return voucherArray.map(voucher => ({
                voucherNumber: voucher.VOUCHERNUMBER || '',
                voucherType: voucher.VOUCHERTYPENAME || '',
                date: voucher.DATE || '',
                narration: voucher.NARRATION || '',
                amount: this._calculateVoucherAmount(voucher['LEDGERENTRIES.LIST'] || [])
            }));
        }

        return [];
    }

    /**
     * Parse voucher summary response data
     * @param {Object} responseData - Raw response data from Tally
     * @param {boolean} groupByType - Whether to group by voucher type
     * @returns {Object} Parsed summary data
     * @private
     */
    _parseVoucherSummaryResponse(responseData, groupByType = false) {
        const envelope = responseData.ENVELOPE || responseData;
        const body = envelope.BODY || envelope;
        
        if (body.EXPORTDATA && body.EXPORTDATA.REQUESTDATA) {
            const summaryData = body.EXPORTDATA.REQUESTDATA.TALLYMESSAGE || {};
            
            if (groupByType) {
                return {
                    byType: this._groupVouchersByType(summaryData),
                    total: {
                        count: summaryData.TOTALCOUNT || 0,
                        amount: summaryData.TOTALAMOUNT || 0
                    }
                };
            } else {
                return {
                    totalCount: summaryData.TOTALCOUNT || 0,
                    totalAmount: summaryData.TOTALAMOUNT || 0,
                    averageAmount: summaryData.AVERAGEAMOUNT || 0
                };
            }
        }

        return {};
    }

    /**
     * Parse ledger entries from voucher data
     * @param {Array} ledgerEntriesData - Raw ledger entries data
     * @returns {Array} Parsed ledger entries
     * @private
     */
    _parseLedgerEntries(ledgerEntriesData) {
        const entriesArray = Array.isArray(ledgerEntriesData) ? ledgerEntriesData : [ledgerEntriesData];
        
        return entriesArray.map(entry => ({
            ledgerName: entry.LEDGERNAME || '',
            amount: parseFloat(entry.AMOUNT) * (entry.ISDEEMEDPOSITIVE === 'No' ? -1 : 1) || 0,
            billName: entry['BILLALLOCATIONS.LIST'] ? entry['BILLALLOCATIONS.LIST'].NAME : '',
            billType: entry['BILLALLOCATIONS.LIST'] ? entry['BILLALLOCATIONS.LIST'].BILLTYPE : ''
        }));
    }

    /**
     * Calculate total voucher amount from ledger entries
     * @param {Array} ledgerEntries - Ledger entries data
     * @returns {number} Total amount
     * @private
     */
    _calculateVoucherAmount(ledgerEntries) {
        const entries = this._parseLedgerEntries(ledgerEntries);
        return entries.reduce((total, entry) => total + Math.abs(entry.amount), 0) / 2; // Divide by 2 as we count both debit and credit
    }

    /**
     * Group vouchers by type for summary
     * @param {Object} summaryData - Raw summary data
     * @returns {Object} Grouped data
     * @private
     */
    _groupVouchersByType(summaryData) {
        // This would need to be implemented based on actual Tally response format
        return {
            Sales: { count: 0, amount: 0 },
            Purchase: { count: 0, amount: 0 },
            Receipt: { count: 0, amount: 0 },
            Payment: { count: 0, amount: 0 },
            Journal: { count: 0, amount: 0 }
        };
    }
}

export default VoucherService;