import { XmlBuilder } from '../utils/XmlBuilder.js';

/**
 * StockItemService - Service class for managing stock items and inventory in TallyPrime
 * Provides methods to create, fetch, update, and delete stock items
 * 
 * @class StockItemService
 */
export class StockItemService {
    /**
     * Create a StockItemService instance
     * @param {TallyConnector} connector - TallyConnector instance
     */
    constructor(connector) {
        this.connector = connector;
    }

    /**
     * Create a new stock item in TallyPrime
     * @param {Object} stockData - Stock item information
     * @param {string} stockData.name - Stock item name
     * @param {string} stockData.parent - Parent group (e.g., 'Raw Materials', 'Finished Goods')
     * @param {string} stockData.baseUnits - Base units of measurement (e.g., 'Nos', 'Kg', 'Mtr')
     * @param {string} [stockData.alias] - Stock item alias
     * @param {Object} [stockData.openingBalance] - Opening balance details
     * @param {number} [stockData.openingBalance.quantity] - Opening quantity
     * @param {number} [stockData.openingBalance.rate] - Opening rate per unit
     * @param {number} [stockData.openingBalance.value] - Opening value
     * @returns {Promise<Object>} Created stock item response
     * 
     * @example
     * const stockItem = await stockItemService.createStockItem({
     *   name: 'Widget A',
     *   parent: 'Raw Materials',
     *   baseUnits: 'Nos',
     *   alias: 'WGT-A',
     *   openingBalance: {
     *     quantity: 100,
     *     rate: 50.00,
     *     value: 5000.00
     *   }
     * });
     */
    async createStockItem(stockData) {
        if (!stockData.name) {
            throw new Error('Stock item name is required');
        }
        
        if (!stockData.parent) {
            throw new Error('Parent group is required');
        }

        if (!stockData.baseUnits) {
            throw new Error('Base units are required');
        }

        try {
            const stockXml = XmlBuilder.buildStockItemXml(stockData);
            const importXml = XmlBuilder.buildImportRequest(stockXml);
            
            const response = await this.connector.sendRequest(importXml);
            
            return {
                success: true,
                message: `Stock item '${stockData.name}' created successfully`,
                data: response.data,
                stockItemName: stockData.name
            };
        } catch (error) {
            throw new Error(`Failed to create stock item: ${error.message}`);
        }
    }

    /**
     * Fetch stock item details by name
     * @param {string} stockItemName - Name of the stock item to fetch
     * @param {Object} [options] - Additional fetch options
     * @param {boolean} [options.includeBalance] - Include current stock balance
     * @param {string} [options.asOn] - Date for balance calculation
     * @returns {Promise<Object>} Stock item details
     * 
     * @example
     * const stockItem = await stockItemService.fetchStockItem('Widget A', {
     *   includeBalance: true,
     *   asOn: '31-Dec-2023'
     * });
     */
    async fetchStockItem(stockItemName, options = {}) {
        if (!stockItemName) {
            throw new Error('Stock item name is required');
        }

        try {
            const filters = {
                STOCKITEMNAME: stockItemName
            };

            if (options.asOn) filters.ASON = options.asOn;

            const exportXml = XmlBuilder.buildExportRequest('Stock Item Details', filters);
            const response = await this.connector.sendRequest(exportXml);

            return {
                success: true,
                data: this._parseStockItemResponse(response.data),
                stockItemName
            };
        } catch (error) {
            throw new Error(`Failed to fetch stock item: ${error.message}`);
        }
    }

    /**
     * Get list of all stock items with optional filtering
     * @param {Object} [filters] - Filter criteria
     * @param {string} [filters.group] - Filter by parent group
     * @param {boolean} [filters.activeOnly] - Return only active stock items
     * @param {string} [filters.nameContains] - Filter stock items containing text
     * @param {boolean} [filters.withBalance] - Only items with non-zero balance
     * @returns {Promise<Array>} List of stock items
     * 
     * @example
     * const stockItems = await stockItemService.getStockItemList({
     *   group: 'Raw Materials',
     *   activeOnly: true,
     *   nameContains: 'Widget',
     *   withBalance: true
     * });
     */
    async getStockItemList(filters = {}) {
        try {
            const requestFilters = {};
            
            if (filters.group) {
                requestFilters.GROUP = filters.group;
            }

            const exportXml = XmlBuilder.buildTDLCollectionRequest('Stock Item List', 'Stock Item', ['NAME','PARENT']);
            const response = await this.connector.sendRequest(exportXml);

            let stockItems = this._parseStockItemListResponse(response.data);

            // Apply client-side filters
            if (filters.activeOnly) {
                stockItems = stockItems.filter(item => item.isActive !== false);
            }

            if (filters.nameContains) {
                const searchTerm = filters.nameContains.toLowerCase();
                stockItems = stockItems.filter(item => 
                    item.name.toLowerCase().includes(searchTerm)
                );
            }

            if (filters.withBalance) {
                stockItems = stockItems.filter(item => 
                    item.closingBalance && item.closingBalance.quantity > 0
                );
            }

            return {
                success: true,
                data: stockItems,
                count: stockItems.length
            };
        } catch (error) {
            throw new Error(`Failed to fetch stock item list: ${error.message}`);
        }
    }

    /**
     * Update an existing stock item
     * @param {string} stockItemName - Name of the stock item to update
     * @param {Object} updates - Updated stock item information
     * @param {string} [updates.alias] - New alias
     * @param {string} [updates.parent] - New parent group
     * @param {string} [updates.baseUnits] - New base units
     * @returns {Promise<Object>} Update response
     * 
     * @example
     * const result = await stockItemService.updateStockItem('Widget A', {
     *   alias: 'Widget-A-v2',
     *   baseUnits: 'Kg'
     * });
     */
    async updateStockItem(stockItemName, updates) {
        if (!stockItemName) {
            throw new Error('Stock item name is required');
        }

        try {
            // First, fetch current stock item details
            const currentItem = await this.fetchStockItem(stockItemName);
            
            // Merge current data with updates
            const updatedStockData = {
                name: stockItemName,
                parent: updates.parent || currentItem.data.parent,
                baseUnits: updates.baseUnits || currentItem.data.baseUnits,
                alias: updates.alias || currentItem.data.alias,
                openingBalance: updates.openingBalance || currentItem.data.openingBalance
            };

            // Build update XML (similar to create, but with ACTION="Alter")
            const stockXml = XmlBuilder.buildStockItemXml(updatedStockData);
            const updateXml = stockXml.replace('ACTION="Create"', 'ACTION="Alter"');
            const importXml = XmlBuilder.buildImportRequest(updateXml);
            
            const response = await this.connector.sendRequest(importXml);
            
            return {
                success: true,
                message: `Stock item '${stockItemName}' updated successfully`,
                data: response.data,
                stockItemName
            };
        } catch (error) {
            throw new Error(`Failed to update stock item: ${error.message}`);
        }
    }

    /**
     * Delete a stock item
     * @param {string} stockItemName - Name of the stock item to delete
     * @param {Object} [options] - Deletion options
     * @param {boolean} [options.force] - Force deletion even if item has transactions
     * @returns {Promise<Object>} Deletion response
     * 
     * @example
     * const result = await stockItemService.deleteStockItem('Widget A', {
     *   force: false
     * });
     */
    async deleteStockItem(stockItemName, options = {}) {
        if (!stockItemName) {
            throw new Error('Stock item name is required');
        }

        try {
            // Check if stock item has transactions (unless force is true)
            if (!options.force) {
                const hasTransactions = await this.checkStockTransactions(stockItemName);
                if (hasTransactions) {
                    throw new Error('Cannot delete stock item with existing transactions. Use force option to override.');
                }
            }

            // Build deletion XML
            const deleteXml = `<TALLYMESSAGE xmlns:UDF="TallyUDF">
                <STOCKITEM NAME="${XmlBuilder.escapeXml(stockItemName)}" ACTION="Delete">
                </STOCKITEM>
            </TALLYMESSAGE>`;
            
            const importXml = XmlBuilder.buildImportRequest(deleteXml);
            const response = await this.connector.sendRequest(importXml);
            
            return {
                success: true,
                message: `Stock item '${stockItemName}' deleted successfully`,
                data: response.data,
                stockItemName
            };
        } catch (error) {
            throw new Error(`Failed to delete stock item: ${error.message}`);
        }
    }

    /**
     * Get stock balance for a specific item
     * @param {string} stockItemName - Name of the stock item
     * @param {Object} [options] - Balance calculation options
     * @param {string} [options.asOn] - Date for balance calculation (default: current date)
     * @param {string} [options.godown] - Specific godown/location
     * @returns {Promise<Object>} Stock balance information
     * 
     * @example
     * const balance = await stockItemService.getStockBalance('Widget A', {
     *   asOn: '31-Dec-2023',
     *   godown: 'Main Warehouse'
     * });
     */
    async getStockBalance(stockItemName, options = {}) {
        if (!stockItemName) {
            throw new Error('Stock item name is required');
        }

        try {
            const filters = {
                STOCKITEMNAME: stockItemName,
                ASON: options.asOn || XmlBuilder.formatDate(new Date())
            };

            if (options.godown) filters.GODOWN = options.godown;

            const exportXml = XmlBuilder.buildExportRequest('Stock Balance', filters);
            const response = await this.connector.sendRequest(exportXml);

            return {
                success: true,
                data: this._parseStockBalanceResponse(response.data),
                stockItemName,
                asOn: filters.ASON
            };
        } catch (error) {
            throw new Error(`Failed to get stock balance: ${error.message}`);
        }
    }

    /**
     * Get stock summary report
     * @param {Object} [options] - Summary options
     * @param {string} [options.group] - Filter by stock group
     * @param {string} [options.asOn] - Date for summary (default: current date)
     * @param {boolean} [options.includeZeroBalance] - Include items with zero balance
     * @param {string} [options.godown] - Specific godown/location
     * @returns {Promise<Object>} Stock summary report
     * 
     * @example
     * const summary = await stockItemService.getStockSummary({
     *   group: 'Raw Materials',
     *   asOn: '31-Dec-2023',
     *   includeZeroBalance: false,
     *   godown: 'Main Warehouse'
     * });
     */
    async getStockSummary(options = {}) {
        try {
            const filters = {
                ASON: options.asOn || XmlBuilder.formatDate(new Date())
            };

            if (options.group) filters.STOCKGROUP = options.group;
            if (options.godown) filters.GODOWN = options.godown;
            if (options.includeZeroBalance !== undefined) {
                filters.INCLUDEZEROBALANCE = options.includeZeroBalance ? 'Yes' : 'No';
            }

            const exportXml = XmlBuilder.buildExportRequest('Stock Summary', filters);
            const response = await this.connector.sendRequest(exportXml);

            return {
                success: true,
                data: this._parseStockSummaryResponse(response.data),
                asOn: filters.ASON
            };
        } catch (error) {
            throw new Error(`Failed to get stock summary: ${error.message}`);
        }
    }

    /**
     * Get stock movements for a specific item
     * @param {string} stockItemName - Name of the stock item
     * @param {Object} [options] - Movement options
     * @param {string} [options.fromDate] - Start date for movements
     * @param {string} [options.toDate] - End date for movements
     * @param {string} [options.voucherType] - Filter by voucher type
     * @param {string} [options.godown] - Specific godown/location
     * @returns {Promise<Array>} Stock movements
     * 
     * @example
     * const movements = await stockItemService.getStockMovements('Widget A', {
     *   fromDate: '01-Dec-2023',
     *   toDate: '31-Dec-2023',
     *   voucherType: 'Purchase',
     *   godown: 'Main Warehouse'
     * });
     */
    async getStockMovements(stockItemName, options = {}) {
        if (!stockItemName) {
            throw new Error('Stock item name is required');
        }

        try {
            const filters = {
                STOCKITEMNAME: stockItemName,
                FROMDATE: options.fromDate || '01-Apr-2023',
                TODATE: options.toDate || XmlBuilder.formatDate(new Date())
            };

            if (options.voucherType) filters.VOUCHERTYPE = options.voucherType;
            if (options.godown) filters.GODOWN = options.godown;

            const exportXml = XmlBuilder.buildExportRequest('Stock Movements', filters);
            const response = await this.connector.sendRequest(exportXml);

            return {
                success: true,
                data: this._parseStockMovementsResponse(response.data),
                stockItemName,
                period: {
                    fromDate: filters.FROMDATE,
                    toDate: filters.TODATE
                }
            };
        } catch (error) {
            throw new Error(`Failed to get stock movements: ${error.message}`);
        }
    }

    /**
     * Check if a stock item has transactions
     * @param {string} stockItemName - Name of the stock item to check
     * @returns {Promise<boolean>} True if stock item has transactions
     * @private
     */
    async checkStockTransactions(stockItemName) {
        try {
            const filters = {
                STOCKITEMNAME: stockItemName,
                FROMDATE: '01-Apr-1990', // Very old date to check all transactions
                TODATE: XmlBuilder.formatDate(new Date())
            };

            const exportXml = XmlBuilder.buildExportRequest('Stock Transactions', filters);
            const response = await this.connector.sendRequest(exportXml);
            
            // Parse response to check if there are any transactions
            const transactions = this._parseStockMovementsResponse(response.data);
            return transactions && transactions.length > 0;
        } catch (error) {
            // If error occurs, assume there are transactions to be safe
            return true;
        }
    }

    /**
     * Parse stock item response data
     * @param {Object} responseData - Raw response data from Tally
     * @returns {Object} Parsed stock item data
     * @private
     */
    _parseStockItemResponse(responseData) {
        const envelope = responseData.ENVELOPE || responseData;
        const body = envelope.BODY || envelope;
        
        if (body.EXPORTDATA && body.EXPORTDATA.REQUESTDATA) {
            const stockData = body.EXPORTDATA.REQUESTDATA.TALLYMESSAGE || {};
            return {
                name: stockData.NAME || '',
                parent: stockData.PARENT || '',
                alias: stockData.ALIAS || '',
                baseUnits: stockData.BASEUNITS || '',
                openingBalance: {
                    quantity: parseFloat(stockData.OPENINGBALANCE) || 0,
                    rate: parseFloat(stockData.OPENINGRATE) || 0,
                    value: parseFloat(stockData.OPENINGVALUE) || 0
                },
                closingBalance: {
                    quantity: parseFloat(stockData.CLOSINGBALANCE) || 0,
                    rate: parseFloat(stockData.CLOSINGRATE) || 0,
                    value: parseFloat(stockData.CLOSINGVALUE) || 0
                }
            };
        }

        return {};
    }

    /**
     * Parse stock item list response data
     * @param {Object} responseData - Raw response data from Tally
     * @returns {Array} Parsed stock item list
     * @private
     */
    _parseStockItemListResponse(responseData) {
        const envelope = responseData.ENVELOPE || responseData;
        const body = envelope.BODY || envelope;
        
        if (body.EXPORTDATA && body.EXPORTDATA.REQUESTDATA) {
            const stockItems = body.EXPORTDATA.REQUESTDATA.TALLYMESSAGE || [];
            const stockArray = Array.isArray(stockItems) ? stockItems : [stockItems];
            
            return stockArray.map(stock => ({
                name: stock.NAME || '',
                parent: stock.PARENT || '',
                alias: stock.ALIAS || '',
                baseUnits: stock.BASEUNITS || '',
                isActive: stock.ISACTIVE !== 'No',
                closingBalance: {
                    quantity: parseFloat(stock.CLOSINGBALANCE) || 0,
                    value: parseFloat(stock.CLOSINGVALUE) || 0
                }
            }));
        }

        return [];
    }

    /**
     * Parse stock balance response data
     * @param {Object} responseData - Raw response data from Tally
     * @returns {Object} Parsed balance data
     * @private
     */
    _parseStockBalanceResponse(responseData) {
        const envelope = responseData.ENVELOPE || responseData;
        const body = envelope.BODY || envelope;
        
        if (body.EXPORTDATA && body.EXPORTDATA.REQUESTDATA) {
            const balanceData = body.EXPORTDATA.REQUESTDATA.TALLYMESSAGE || {};
            return {
                openingBalance: {
                    quantity: parseFloat(balanceData.OPENINGBALANCE) || 0,
                    rate: parseFloat(balanceData.OPENINGRATE) || 0,
                    value: parseFloat(balanceData.OPENINGVALUE) || 0
                },
                inwardQuantity: parseFloat(balanceData.INWARDQUANTITY) || 0,
                outwardQuantity: parseFloat(balanceData.OUTWARDQUANTITY) || 0,
                closingBalance: {
                    quantity: parseFloat(balanceData.CLOSINGBALANCE) || 0,
                    rate: parseFloat(balanceData.CLOSINGRATE) || 0,
                    value: parseFloat(balanceData.CLOSINGVALUE) || 0
                }
            };
        }

        return {
            openingBalance: { quantity: 0, rate: 0, value: 0 },
            inwardQuantity: 0,
            outwardQuantity: 0,
            closingBalance: { quantity: 0, rate: 0, value: 0 }
        };
    }

    /**
     * Parse stock summary response data
     * @param {Object} responseData - Raw response data from Tally
     * @returns {Object} Parsed summary data
     * @private
     */
    _parseStockSummaryResponse(responseData) {
        const envelope = responseData.ENVELOPE || responseData;
        const body = envelope.BODY || envelope;
        
        if (body.EXPORTDATA && body.EXPORTDATA.REQUESTDATA) {
            const summaryData = body.EXPORTDATA.REQUESTDATA.TALLYMESSAGE || {};
            
            // Parse individual stock items from summary
            const stockItems = summaryData.STOCKITEMS || summaryData.TALLYMESSAGE || [];
            const itemArray = Array.isArray(stockItems) ? stockItems : [stockItems];
            
            const items = itemArray.map(item => ({
                name: item.NAME || '',
                group: item.PARENT || '',
                closingQuantity: parseFloat(item.CLOSINGBALANCE) || 0,
                closingValue: parseFloat(item.CLOSINGVALUE) || 0,
                rate: parseFloat(item.RATE) || 0,
                baseUnits: item.BASEUNITS || ''
            }));
            
            const totalValue = items.reduce((sum, item) => sum + item.closingValue, 0);
            
            return {
                items,
                totalItems: items.length,
                totalValue,
                summary: {
                    positiveStock: items.filter(item => item.closingQuantity > 0).length,
                    negativeStock: items.filter(item => item.closingQuantity < 0).length,
                    zeroStock: items.filter(item => item.closingQuantity === 0).length
                }
            };
        }

        return {
            items: [],
            totalItems: 0,
            totalValue: 0,
            summary: { positiveStock: 0, negativeStock: 0, zeroStock: 0 }
        };
    }

    /**
     * Parse stock movements response data
     * @param {Object} responseData - Raw response data from Tally
     * @returns {Array} Parsed movements data
     * @private
     */
    _parseStockMovementsResponse(responseData) {
        const envelope = responseData.ENVELOPE || responseData;
        const body = envelope.BODY || envelope;
        
        if (body.EXPORTDATA && body.EXPORTDATA.REQUESTDATA) {
            const movements = body.EXPORTDATA.REQUESTDATA.TALLYMESSAGE || [];
            const movementArray = Array.isArray(movements) ? movements : [movements];
            
            return movementArray.map(movement => ({
                date: movement.DATE || '',
                voucherType: movement.VOUCHERTYPENAME || '',
                voucherNumber: movement.VOUCHERNUMBER || '',
                inwardQuantity: parseFloat(movement.INWARDQUANTITY) || 0,
                outwardQuantity: parseFloat(movement.OUTWARDQUANTITY) || 0,
                rate: parseFloat(movement.RATE) || 0,
                amount: parseFloat(movement.AMOUNT) || 0,
                godown: movement.GODOWNNAME || ''
            }));
        }

        return [];
    }
}

export default StockItemService;