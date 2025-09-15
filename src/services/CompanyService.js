import { XmlBuilder } from '../utils/XmlBuilder.js';

/**
 * CompanyService - Service class for managing company operations in TallyPrime
 * Provides methods to load, get info, list, and create companies
 * 
 * @class CompanyService
 */
export class CompanyService {
    /**
     * Create a CompanyService instance
     * @param {TallyConnector} connector - TallyConnector instance
     */
    constructor(connector) {
        this.connector = connector;
    }

    /**
     * Get list of all companies in TallyPrime
     * @param {Object} [options] - List options
     * @param {boolean} [options.activeOnly] - Return only active companies
     * @param {boolean} [options.includeDetails] - Include detailed company information
     * @returns {Promise<Array>} List of companies
     * 
     * @example
     * const companies = await companyService.getCompanyList({
     *   activeOnly: true,
     *   includeDetails: true
     * });
     */
    async getCompanyList(options = {}) {
        try {
            const filters = {};
            if (options.activeOnly) {
                filters.ACTIVEONLY = 'Yes';
            }

            const exportXml = XmlBuilder.buildCollectionRequest('Companies', filters);
            const response = await this.connector.sendRequest(exportXml);

            let companies = this._parseCompanyListResponse(response.data);

            // If detailed information is requested, fetch details for each company
            if (options.includeDetails) {
                companies = await Promise.all(
                    companies.map(async (company) => {
                        try {
                            const details = await this.getCompanyInfo(company.name);
                            return { ...company, ...details.data };
                        } catch (error) {
                            // If error getting details, return basic info
                            return company;
                        }
                    })
                );
            }

            return {
                success: true,
                data: companies,
                count: companies.length
            };
        } catch (error) {
            throw new Error(`Failed to get company list: ${error.message}`);
        }
    }

    /**
     * Get detailed information about a specific company
     * @param {string} companyName - Name of the company
     * @returns {Promise<Object>} Company information
     * 
     * @example
     * const companyInfo = await companyService.getCompanyInfo('My Company Ltd');
     */
    async getCompanyInfo(companyName) {
        if (!companyName) {
            throw new Error('Company name is required');
        }

        try {
            const filters = {
                COMPANYNAME: companyName
            };

            const exportXml = XmlBuilder.buildExportRequest('Company Details', filters);
            const response = await this.connector.sendRequest(exportXml);

            return {
                success: true,
                data: this._parseCompanyResponse(response.data),
                companyName
            };
        } catch (error) {
            throw new Error(`Failed to get company info: ${error.message}`);
        }
    }

    /**
     * Load (activate) a specific company
     * @param {string} companyName - Name of the company to load
     * @returns {Promise<Object>} Load response
     * 
     * @example
     * const result = await companyService.loadCompany('My Company Ltd');
     */
    async loadCompany(companyName) {
        if (!companyName) {
            throw new Error('Company name is required');
        }

        try {
            // Send company loading request
            const loadXml = `<ENVELOPE>
                <HEADER>
                    <TALLYREQUEST>Load Company</TALLYREQUEST>
                </HEADER>
                <BODY>
                    <LOADCOMPANY>
                        <COMPANYNAME>${XmlBuilder.escapeXml(companyName)}</COMPANYNAME>
                    </LOADCOMPANY>
                </BODY>
            </ENVELOPE>`;

            const response = await this.connector.sendRequest(loadXml);

            return {
                success: true,
                message: `Company '${companyName}' loaded successfully`,
                data: response.data,
                companyName
            };
        } catch (error) {
            throw new Error(`Failed to load company: ${error.message}`);
        }
    }

    /**
     * Create a new company
     * @param {Object} companyData - Company information
     * @param {string} companyData.name - Company name
     * @param {string} [companyData.mailingName] - Mailing name
     * @param {string} [companyData.address] - Company address
     * @param {string} [companyData.state] - State/Province
     * @param {string} [companyData.country] - Country
     * @param {string} [companyData.pincode] - Postal/ZIP code
     * @param {string} [companyData.financialYearFrom] - Financial year start date
     * @param {string} [companyData.booksBeginFrom] - Books begin from date
     * @param {string} [companyData.currencySymbol] - Currency symbol
     * @returns {Promise<Object>} Created company response
     * 
     * @example
     * const company = await companyService.createCompany({
     *   name: 'New Company Ltd',
     *   mailingName: 'New Company Limited',
     *   address: '123 Business Street, City',
     *   state: 'Maharashtra',
     *   country: 'India',
     *   pincode: '400001',
     *   financialYearFrom: '01-Apr-2023',
     *   currencySymbol: 'Rs.'
     * });
     */
    async createCompany(companyData) {
        if (!companyData.name) {
            throw new Error('Company name is required');
        }

        try {
            const companyXml = XmlBuilder.buildCompanyXml(companyData);
            const importXml = XmlBuilder.buildImportRequest(companyXml);
            
            const response = await this.connector.sendRequest(importXml);
            
            return {
                success: true,
                message: `Company '${companyData.name}' created successfully`,
                data: response.data,
                companyName: companyData.name
            };
        } catch (error) {
            throw new Error(`Failed to create company: ${error.message}`);
        }
    }

    /**
     * Get current active company information
     * @returns {Promise<Object>} Current company information
     * 
     * @example
     * const currentCompany = await companyService.getCurrentCompany();
     */
    async getCurrentCompany() {
        try {
            const exportXml = XmlBuilder.buildExportRequest('Current Company Info', {});
            const response = await this.connector.sendRequest(exportXml);

            return {
                success: true,
                data: this._parseCompanyResponse(response.data)
            };
        } catch (error) {
            throw new Error(`Failed to get current company info: ${error.message}`);
        }
    }

    /**
     * Get company's financial year information
     * @param {string} [companyName] - Company name (if not provided, uses current company)
     * @returns {Promise<Object>} Financial year information
     * 
     * @example
     * const financialYear = await companyService.getFinancialYear('My Company Ltd');
     */
    async getFinancialYear(companyName) {
        try {
            const filters = {};
            if (companyName) {
                filters.COMPANYNAME = companyName;
            }

            const exportXml = XmlBuilder.buildExportRequest('Financial Year Info', filters);
            const response = await this.connector.sendRequest(exportXml);

            return {
                success: true,
                data: this._parseFinancialYearResponse(response.data),
                companyName
            };
        } catch (error) {
            throw new Error(`Failed to get financial year info: ${error.message}`);
        }
    }

    /**
     * Get company statistics
     * @param {string} [companyName] - Company name (if not provided, uses current company)
     * @param {Object} [options] - Statistics options
     * @param {boolean} [options.includeLedgerCount] - Include ledger count
     * @param {boolean} [options.includeVoucherCount] - Include voucher count
     * @param {boolean} [options.includeStockCount] - Include stock item count
     * @returns {Promise<Object>} Company statistics
     * 
     * @example
     * const stats = await companyService.getCompanyStatistics('My Company Ltd', {
     *   includeLedgerCount: true,
     *   includeVoucherCount: true,
     *   includeStockCount: true
     * });
     */
    async getCompanyStatistics(companyName, options = {}) {
        try {
            const filters = {};
            if (companyName) {
                filters.COMPANYNAME = companyName;
            }

            const exportXml = XmlBuilder.buildExportRequest('Company Statistics', filters);
            const response = await this.connector.sendRequest(exportXml);

            let statistics = this._parseCompanyStatisticsResponse(response.data);

            // Fetch additional counts if requested
            if (options.includeLedgerCount || options.includeVoucherCount || options.includeStockCount) {
                const additionalStats = await this._getAdditionalStatistics(companyName, options);
                statistics = { ...statistics, ...additionalStats };
            }

            return {
                success: true,
                data: statistics,
                companyName
            };
        } catch (error) {
            throw new Error(`Failed to get company statistics: ${error.message}`);
        }
    }

    /**
     * Backup company data
     * @param {string} companyName - Company name to backup
     * @param {Object} [options] - Backup options
     * @param {string} [options.backupPath] - Path for backup file
     * @param {boolean} [options.includeImages] - Include images in backup
     * @returns {Promise<Object>} Backup response
     * 
     * @example
     * const backup = await companyService.backupCompany('My Company Ltd', {
     *   backupPath: 'C:\\Backups\\',
     *   includeImages: true
     * });
     */
    async backupCompany(companyName, options = {}) {
        if (!companyName) {
            throw new Error('Company name is required');
        }

        try {
            const backupXml = `<ENVELOPE>
                <HEADER>
                    <TALLYREQUEST>Backup Company</TALLYREQUEST>
                </HEADER>
                <BODY>
                    <BACKUPCOMPANY>
                        <COMPANYNAME>${XmlBuilder.escapeXml(companyName)}</COMPANYNAME>
                        ${options.backupPath ? `<BACKUPPATH>${XmlBuilder.escapeXml(options.backupPath)}</BACKUPPATH>` : ''}
                        <INCLUDEIMAGES>${options.includeImages ? 'Yes' : 'No'}</INCLUDEIMAGES>
                    </BACKUPCOMPANY>
                </BODY>
            </ENVELOPE>`;

            const response = await this.connector.sendRequest(backupXml);

            return {
                success: true,
                message: `Company '${companyName}' backup initiated`,
                data: response.data,
                companyName
            };
        } catch (error) {
            throw new Error(`Failed to backup company: ${error.message}`);
        }
    }

    /**
     * Get additional statistics for company
     * @param {string} companyName - Company name
     * @param {Object} options - Statistics options
     * @returns {Promise<Object>} Additional statistics
     * @private
     */
    async _getAdditionalStatistics(companyName, options) {
        const stats = {};

        try {
            if (options.includeLedgerCount) {
                const ledgerFilters = companyName ? { COMPANYNAME: companyName } : {};
                const ledgerXml = XmlBuilder.buildCollectionRequest('Ledger', ledgerFilters);
                const ledgerResponse = await this.connector.sendRequest(ledgerXml);
                const ledgers = this._parseLedgerListResponse(ledgerResponse.data);
                stats.ledgerCount = ledgers.length;
            }

            if (options.includeVoucherCount) {
                const voucherFilters = companyName ? { COMPANYNAME: companyName } : {};
                const voucherXml = XmlBuilder.buildCollectionRequest('Voucher', voucherFilters);
                const voucherResponse = await this.connector.sendRequest(voucherXml);
                const vouchers = this._parseVoucherListResponse(voucherResponse.data);
                stats.voucherCount = vouchers.length;
            }

            if (options.includeStockCount) {
                const stockFilters = companyName ? { COMPANYNAME: companyName } : {};
                const stockXml = XmlBuilder.buildCollectionRequest('Stock Item', stockFilters);
                const stockResponse = await this.connector.sendRequest(stockXml);
                const stockItems = this._parseStockListResponse(stockResponse.data);
                stats.stockItemCount = stockItems.length;
            }
        } catch (error) {
            // If any additional stat fails, continue with what we have
            console.warn(`Warning: Could not fetch some statistics: ${error.message}`);
        }

        return stats;
    }

    /**
     * Parse company response data
     * @param {Object} responseData - Raw response data from Tally
     * @returns {Object} Parsed company data
     * @private
     */
    _parseCompanyResponse(responseData) {
        const envelope = responseData.ENVELOPE || responseData;
        const body = envelope.BODY || envelope;
        
        if (body.EXPORTDATA && body.EXPORTDATA.REQUESTDATA) {
            const companyData = body.EXPORTDATA.REQUESTDATA.TALLYMESSAGE || {};
            return {
                name: companyData.NAME || '',
                mailingName: companyData.MAILINGNAME || '',
                address: companyData.ADDRESS || '',
                state: companyData.STATE || '',
                country: companyData.COUNTRY || '',
                pincode: companyData.PINCODE || '',
                currencySymbol: companyData.CURRENCYSYMBOL || '',
                financialYearFrom: companyData.BOOKSBEGINFROM || '',
                isActive: companyData.ISACTIVE !== 'No'
            };
        }

        return {};
    }

    /**
     * Parse company list response data
     * @param {Object} responseData - Raw response data from Tally
     * @returns {Array} Parsed company list
     * @private
     */
    _parseCompanyListResponse(responseData) {
        const envelope = responseData.ENVELOPE || responseData;
        const body = envelope.BODY || envelope;
        
        if (body.EXPORTDATA && body.EXPORTDATA.REQUESTDATA) {
            const companies = body.EXPORTDATA.REQUESTDATA.TALLYMESSAGE || [];
            const companyArray = Array.isArray(companies) ? companies : [companies];
            
            return companyArray.map(company => ({
                name: company.NAME || '',
                mailingName: company.MAILINGNAME || '',
                isActive: company.ISACTIVE !== 'No',
                lastModified: company.LASTMODIFIED || ''
            }));
        }

        return [];
    }

    /**
     * Parse financial year response data
     * @param {Object} responseData - Raw response data from Tally
     * @returns {Object} Parsed financial year data
     * @private
     */
    _parseFinancialYearResponse(responseData) {
        const envelope = responseData.ENVELOPE || responseData;
        const body = envelope.BODY || envelope;
        
        if (body.EXPORTDATA && body.EXPORTDATA.REQUESTDATA) {
            const fyData = body.EXPORTDATA.REQUESTDATA.TALLYMESSAGE || {};
            return {
                startDate: fyData.STARTDATE || '',
                endDate: fyData.ENDDATE || '',
                booksBeginFrom: fyData.BOOKSBEGINFROM || '',
                accountingBasis: fyData.ACCOUNTINGBASIS || '',
                isLocked: fyData.ISLOCKED === 'Yes'
            };
        }

        return {};
    }

    /**
     * Parse company statistics response data
     * @param {Object} responseData - Raw response data from Tally
     * @returns {Object} Parsed statistics data
     * @private
     */
    _parseCompanyStatisticsResponse(responseData) {
        const envelope = responseData.ENVELOPE || responseData;
        const body = envelope.BODY || envelope;
        
        if (body.EXPORTDATA && body.EXPORTDATA.REQUESTDATA) {
            const statsData = body.EXPORTDATA.REQUESTDATA.TALLYMESSAGE || {};
            return {
                lastBackupDate: statsData.LASTBACKUPDATE || '',
                databaseSize: statsData.DATABASESIZE || 0,
                createdDate: statsData.CREATEDDATE || '',
                totalTransactions: parseInt(statsData.TOTALTRANSACTIONS) || 0
            };
        }

        return {};
    }

    /**
     * Parse ledger list response data (helper method)
     * @param {Object} responseData - Raw response data from Tally
     * @returns {Array} Parsed ledger list
     * @private
     */
    _parseLedgerListResponse(responseData) {
        const envelope = responseData.ENVELOPE || responseData;
        const body = envelope.BODY || envelope;
        
        if (body.EXPORTDATA && body.EXPORTDATA.REQUESTDATA) {
            const ledgers = body.EXPORTDATA.REQUESTDATA.TALLYMESSAGE || [];
            return Array.isArray(ledgers) ? ledgers : [ledgers];
        }
        return [];
    }

    /**
     * Parse voucher list response data (helper method)
     * @param {Object} responseData - Raw response data from Tally
     * @returns {Array} Parsed voucher list
     * @private
     */
    _parseVoucherListResponse(responseData) {
        const envelope = responseData.ENVELOPE || responseData;
        const body = envelope.BODY || envelope;
        
        if (body.EXPORTDATA && body.EXPORTDATA.REQUESTDATA) {
            const vouchers = body.EXPORTDATA.REQUESTDATA.TALLYMESSAGE || [];
            return Array.isArray(vouchers) ? vouchers : [vouchers];
        }
        return [];
    }

    /**
     * Parse stock list response data (helper method)
     * @param {Object} responseData - Raw response data from Tally
     * @returns {Array} Parsed stock list
     * @private
     */
    _parseStockListResponse(responseData) {
        const envelope = responseData.ENVELOPE || responseData;
        const body = envelope.BODY || envelope;
        
        if (body.EXPORTDATA && body.EXPORTDATA.REQUESTDATA) {
            const stockItems = body.EXPORTDATA.REQUESTDATA.TALLYMESSAGE || [];
            return Array.isArray(stockItems) ? stockItems : [stockItems];
        }
        return [];
    }
}

export default CompanyService;