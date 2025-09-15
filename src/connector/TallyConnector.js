import axios from 'axios';
import { parseString } from 'xml2js';

/**
 * TallyConnector - Main connector class for TallyPrime integration
 * Handles connection management and XML-RPC communication with TallyPrime
 * 
 * @class TallyConnector
 */
export class TallyConnector {
    /**
     * Create a TallyConnector instance
     * @param {Object} config - Connection configuration
     * @param {string} config.host - TallyPrime host (default: 'localhost')
     * @param {number} config.port - TallyPrime port (default: 9000)
     * @param {number} config.timeout - Request timeout in milliseconds (default: 30000)
     */
    constructor(config = {}) {
        this.host = config.host || 'localhost';
        this.port = config.port || 9000;
        this.timeout = config.timeout || 30000;
        this.baseUrl = `http://${this.host}:${this.port}`;
        
        // Configure axios instance
        this.client = axios.create({
            baseURL: this.baseUrl,
            timeout: this.timeout,
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': ''
            }
        });

        // Add response interceptor for error handling
        this.client.interceptors.response.use(
            response => response,
            error => this._handleError(error)
        );
    }

    /**
     * Test connection to TallyPrime
     * @returns {Promise<boolean>} Connection status
     */
    async testConnection() {
        try {
            const testXml = `
                <ENVELOPE>
                    <HEADER>
                        <TALLYREQUEST>Export Data</TALLYREQUEST>
                    </HEADER>
                    <BODY>
                        <EXPORTDATA>
                            <REQUESTDESC>
                                <REPORTNAME>List of Companies</REPORTNAME>
                            </REQUESTDESC>
                        </EXPORTDATA>
                    </BODY>
                </ENVELOPE>
            `;
            
            const response = await this.sendRequest(testXml);
            return response.success;
        } catch (error) {
            return false;
        }
    }

    /**
     * Send XML request to TallyPrime
     * @param {string} xmlData - XML request data
     * @param {Object} options - Additional request options
     * @returns {Promise<Object>} Parsed response data
     */
    async sendRequest(xmlData, options = {}) {
        try {
            const response = await this.client.post('', xmlData, {
                ...options,
                headers: {
                    ...this.client.defaults.headers,
                    ...options.headers
                }
            });

            return await this._parseResponse(response.data);
        } catch (error) {
            throw new Error(`TallyPrime request failed: ${error.message}`);
        }
    }

    /**
     * Send import request to TallyPrime
     * @param {string} xmlData - XML import data
     * @returns {Promise<Object>} Import response
     */
    async sendImportRequest(xmlData) {
        const importXml = `
            <ENVELOPE>
                <HEADER>
                    <TALLYREQUEST>Import Data</TALLYREQUEST>
                </HEADER>
                <BODY>
                    <IMPORTDATA>
                        ${xmlData}
                    </IMPORTDATA>
                </BODY>
            </ENVELOPE>
        `;

        return this.sendRequest(importXml);
    }

    /**
     * Send export request to TallyPrime
     * @param {string} reportName - Name of the report to export
     * @param {Object} filters - Export filters
     * @returns {Promise<Object>} Export response
     */
    async sendExportRequest(reportName, filters = {}) {
        let filterXml = '';
        if (Object.keys(filters).length > 0) {
            filterXml = Object.entries(filters)
                .map(([key, value]) => `<${key}>${value}</${key}>`)
                .join('\n                        ');
        }

        const exportXml = `
            <ENVELOPE>
                <HEADER>
                    <TALLYREQUEST>Export Data</TALLYREQUEST>
                </HEADER>
                <BODY>
                    <EXPORTDATA>
                        <REQUESTDESC>
                            <REPORTNAME>${reportName}</REPORTNAME>
                            ${filterXml}
                        </REQUESTDESC>
                    </EXPORTDATA>
                </BODY>
            </ENVELOPE>
        `;

        return this.sendRequest(exportXml);
    }

    /**
     * Execute TDL (Tally Definition Language) function
     * @param {string} functionName - TDL function name
     * @param {Object} parameters - Function parameters
     * @returns {Promise<Object>} Function execution result
     */
    async executeTDLFunction(functionName, parameters = {}) {
        let paramXml = '';
        if (Object.keys(parameters).length > 0) {
            paramXml = Object.entries(parameters)
                .map(([key, value]) => `<PARAMETER><NAME>${key}</NAME><VALUE>${value}</VALUE></PARAMETER>`)
                .join('\n                            ');
        }

        const functionXml = `
            <ENVELOPE>
                <HEADER>
                    <TALLYREQUEST>Execute Function</TALLYREQUEST>
                </HEADER>
                <BODY>
                    <FUNCTION>
                        <NAME>${functionName}</NAME>
                        <PARAMETERS>
                            ${paramXml}
                        </PARAMETERS>
                    </FUNCTION>
                </BODY>
            </ENVELOPE>
        `;

        return this.sendRequest(functionXml);
    }

    /**
     * Parse XML response from TallyPrime
     * @private
     * @param {string} xmlData - XML response data
     * @returns {Promise<Object>} Parsed response
     */
    async _parseResponse(xmlData) {
        return new Promise((resolve, reject) => {
            parseString(xmlData, {
                explicitArray: false,
                ignoreAttrs: false,
                mergeAttrs: true
            }, (error, result) => {
                if (error) {
                    reject(new Error(`XML parsing error: ${error.message}`));
                    return;
                }

                // Check for Tally errors in response
                const envelope = result.ENVELOPE || result;
                const body = envelope.BODY || envelope;

                if (body.ERROR || body.LINEERROR) {
                    const errorMsg = body.ERROR || body.LINEERROR;
                    reject(new Error(`Tally error: ${errorMsg}`));
                    return;
                }

                resolve({
                    success: true,
                    data: result,
                    rawXml: xmlData
                });
            });
        });
    }

    /**
     * Handle HTTP and connection errors
     * @private
     * @param {Error} error - Axios error
     * @returns {Promise<never>} Rejected promise with formatted error
     */
    async _handleError(error) {
        if (error.code === 'ECONNREFUSED') {
            throw new Error(`Cannot connect to TallyPrime at ${this.baseUrl}. Please ensure TallyPrime is running and the port is correct.`);
        }

        if (error.code === 'ETIMEDOUT') {
            throw new Error(`Request timed out after ${this.timeout}ms. TallyPrime may be busy or unresponsive.`);
        }

        if (error.response) {
            // Server responded with error status
            throw new Error(`TallyPrime server error: ${error.response.status} - ${error.response.statusText}`);
        }

        if (error.request) {
            // Request was made but no response received
            throw new Error(`No response received from TallyPrime. Please check if the service is running.`);
        }

        // Something else happened
        throw new Error(`Request failed: ${error.message}`);
    }

    /**
     * Get connection information
     * @returns {Object} Connection details
     */
    getConnectionInfo() {
        return {
            host: this.host,
            port: this.port,
            baseUrl: this.baseUrl,
            timeout: this.timeout
        };
    }

    /**
     * Update connection configuration
     * @param {Object} config - New configuration
     * @param {string} config.host - New host
     * @param {number} config.port - New port
     * @param {number} config.timeout - New timeout
     */
    updateConfig(config) {
        if (config.host) this.host = config.host;
        if (config.port) this.port = config.port;
        if (config.timeout) this.timeout = config.timeout;

        this.baseUrl = `http://${this.host}:${this.port}`;
        
        // Update axios instance
        this.client.defaults.baseURL = this.baseUrl;
        this.client.defaults.timeout = this.timeout;
    }
}

export default TallyConnector;