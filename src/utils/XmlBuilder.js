/**
 * XmlBuilder - Utility class for building TallyPrime XML requests
 * Provides methods to construct properly formatted XML for various Tally operations
 * 
 * @class XmlBuilder
 */
export class XmlBuilder {
    /**
     * Build a standard Tally envelope structure
     * @param {string} requestType - Type of request (Import Data, Export Data)
     * @param {string} bodyContent - XML content for the body
     * @returns {string} Complete XML envelope
     */
    static buildEnvelope(requestType, bodyContent) {
        return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
    <HEADER>
        <TALLYREQUEST>${requestType}</TALLYREQUEST>
    </HEADER>
    <BODY>
        ${bodyContent}
    </BODY>
</ENVELOPE>`;
    }

    /**
     * Build export request XML
     * @param {string} reportName - Name of the report to export
     * @param {Object} filters - Export filters and parameters
     * @returns {string} Export request XML
     */
    static buildExportRequest(reportName, filters = {}) {
        let filterXml = '';
        if (Object.keys(filters).length > 0) {
            filterXml = Object.entries(filters)
                .map(([key, value]) => `                <${key}>${this.escapeXml(value)}</${key}>`)
                .join('\\n');
        }

        const bodyContent = `<EXPORTDATA>
            <REQUESTDESC>
                <REPORTNAME>${reportName}</REPORTNAME>
${filterXml}
            </REQUESTDESC>
        </EXPORTDATA>`;

        return this.buildEnvelope('Export Data', bodyContent);
    }

    /**
     * Build import request XML
     * @param {string} dataXml - Data to import
     * @returns {string} Import request XML
     */
    static buildImportRequest(dataXml, options = {}) {
        const reportName = options.reportName || 'All Masters';
        const companyName = options.companyName || process.env.TALLY_COMPANY || '';

        const staticVars = companyName
            ? `
                <STATICVARIABLES>
                    <SVCURRENTCOMPANY>${this.escapeXml(companyName)}</SVCURRENTCOMPANY>
                </STATICVARIABLES>`
            : '';

        const bodyContent = `<IMPORTDATA>
            <REQUESTDESC>
                <REPORTNAME>${reportName}</REPORTNAME>${staticVars}
            </REQUESTDESC>
            <REQUESTDATA>
                ${dataXml}
            </REQUESTDATA>
        </IMPORTDATA>`;

        return this.buildEnvelope('Import Data', bodyContent);
    }

    /**
     * Build ledger XML structure
     * @param {Object} ledgerData - Ledger information
     * @param {string} ledgerData.name - Ledger name
     * @param {string} ledgerData.parent - Parent group
     * @param {string} ledgerData.alias - Ledger alias
     * @param {Object} ledgerData.openingBalance - Opening balance details
     * @returns {string} Ledger XML
     */
    static buildLedgerXml(ledgerData) {
        const { name, parent, alias, openingBalance } = ledgerData;
        
        let openingBalanceXml = '';
        if (openingBalance) {
            openingBalanceXml = `
                <OPENINGBALANCE>${openingBalance.amount || 0}</OPENINGBALANCE>
                <ISBILLWISEON>${openingBalance.isBillWise ? 'Yes' : 'No'}</ISBILLWISEON>
                <ISCOSTCENTRESON>${openingBalance.isCostCentre ? 'Yes' : 'No'}</ISCOSTCENTRESON>`;
        }

        return `<TALLYMESSAGE xmlns:UDF="TallyUDF">
            <LEDGER NAME="${this.escapeXml(name)}" ACTION="Create" RESERVEDNAME="">
                <NAME>${this.escapeXml(name)}</NAME>
                <PARENT>${this.escapeXml(parent)}</PARENT>
                <ALIAS>${this.escapeXml(alias || '')}</ALIAS>
                <ISBILLWISEON>${openingBalance && openingBalance.isBillWise ? 'Yes' : 'No'}</ISBILLWISEON>
                <AFFECTSSTOCK>No</AFFECTSSTOCK>
                <USEFORVAT>No</USEFORVAT>
                ${openingBalanceXml}
            </LEDGER>
        </TALLYMESSAGE>`;
    }

    /**
     * Build voucher XML structure
     * @param {Object} voucherData - Voucher information
     * @param {string} voucherData.voucherType - Type of voucher
     * @param {string} voucherData.date - Voucher date
     * @param {Array} voucherData.ledgerEntries - Ledger entries
     * @returns {string} Voucher XML
     */
    static buildVoucherXml(voucherData) {
        const { voucherType, date, ledgerEntries, narration, voucherNumber } = voucherData;

        const ledgerEntriesXml = ledgerEntries.map(entry => `
            <LEDGERENTRIES.LIST>
                <OLDAUDITENTRYIDS.LIST TYPE="Number">
                    <OLDAUDITENTRYIDS>-1</OLDAUDITENTRYIDS>
                </OLDAUDITENTRYIDS.LIST>
                <LEDGERNAME>${this.escapeXml(entry.ledgerName)}</LEDGERNAME>
                <ISDEEMEDPOSITIVE>${entry.amount > 0 ? 'Yes' : 'No'}</ISDEEMEDPOSITIVE>
                <AMOUNT>${Math.abs(entry.amount)}</AMOUNT>
                <BILLALLOCATIONS.LIST>
                    <NAME>${this.escapeXml(entry.billName || '')}</NAME>
                    <BILLTYPE>${entry.billType || 'New Ref'}</BILLTYPE>
                    <AMOUNT>${Math.abs(entry.amount)}</AMOUNT>
                </BILLALLOCATIONS.LIST>
            </LEDGERENTRIES.LIST>
        `).join('');

        return `<TALLYMESSAGE xmlns:UDF="TallyUDF">
            <VOUCHER REMOTEID="" VCHKEY="" VCHTYPE="${this.escapeXml(voucherType)}" ACTION="Create" OBJVIEW="Accounting Voucher View">
                <OLDAUDITENTRYIDS.LIST TYPE="Number">
                    <OLDAUDITENTRYIDS>-1</OLDAUDITENTRYIDS>
                </OLDAUDITENTRYIDS.LIST>
                <DATE>${this.formatDate(date)}</DATE>
                <VOUCHERTYPENAME>${this.escapeXml(voucherType)}</VOUCHERTYPENAME>
                <VOUCHERNUMBER>${this.escapeXml(voucherNumber || '')}</VOUCHERNUMBER>
                <NARRATION>${this.escapeXml(narration || '')}</NARRATION>
                <PARTYLEDGERNAME></PARTYLEDGERNAME>
                <VOUCHERTYPENAME>${this.escapeXml(voucherType)}</VOUCHERTYPENAME>
                <REFERENCE></REFERENCE>
                <PERSISTEDVIEW>Accounting Voucher View</PERSISTEDVIEW>
                <VCHGSTCLASS/>
                <ENTEREDBY>SDK</ENTEREDBY>
                <DIFFACTUALQTY>No</DIFFACTUALQTY>
                <ISMSTFROMSYNC>No</ISMSTFROMSYNC>
                <ASORIGINAL>No</ASORIGINAL>
                <AUDITED>No</AUDITED>
                <FORJOBCOSTING>No</FORJOBCOSTING>
                <ISOPTIONAL>No</ISOPTIONAL>
                <EFFECTIVEDATE>${this.formatDate(date)}</EFFECTIVEDATE>
                <USEFOREXCISE>No</USEFOREXCISE>
                <ISFORJOBWORKIN>No</ISFORJOBWORKIN>
                <ALLOWCONSUMPTION>No</ALLOWCONSUMPTION>
                <USEFORINTEREST>No</USEFORINTEREST>
                <USEFORGAINLOSS>No</USEFORGAINLOSS>
                <USEFORGODOWNTRANSFER>No</USEFORGODOWNTRANSFER>
                <USEFORCOMPOUND>No</USEFORCOMPOUND>
                <USEFORSERVICETAX>No</USEFORSERVICETAX>
                <ISEXCISEVOUCHER>No</ISEXCISEVOUCHER>
                <EXCISETAXOVERRIDE>No</EXCISETAXOVERRIDE>
                <USEFORTAXUNITTRANSFER>No</USEFORTAXUNITTRANSFER>
                <IGNOREPOSVALIDATION>No</IGNOREPOSVALIDATION>
                <EXCISEOPENING>No</EXCISEOPENING>
                <USEFORFINALPRODUCTION>No</USEFORFINALPRODUCTION>
                <ISTDSOVERRIDDEN>No</ISTDSOVERRIDDEN>
                <ISTCSOVERRIDDEN>No</ISTCSOVERRIDDEN>
                <ISTDSTCSCASHVCH>No</ISTDSTCSCASHVCH>
                <INCLUDEADVPYMTVCH>No</INCLUDEADVPYMTVCH>
                <ISSUBWORKSCONTRACT>No</ISSUBWORKSCONTRACT>
                <ISVATOVERRIDDEN>No</ISVATOVERRIDDEN>
                <IGNOREORIGVCHDATE>No</IGNOREORIGVCHDATE>
                <ISVATPAIDATCUSTOMS>No</ISVATPAIDATCUSTOMS>
                <ISDECLAREDTOCUSTOMS>No</ISDECLAREDTOCUSTOMS>
                <ISSERVICETAXOVERRIDDEN>No</ISSERVICETAXOVERRIDDEN>
                <ISISDVOUCHER>No</ISISDVOUCHER>
                <ISEXCISEOVERRIDDEN>No</ISEXCISEOVERRIDDEN>
                <ISEXCISESUPPLYVCH>No</ISEXCISESUPPLYVCH>
                <ISGSTOVERRIDDEN>No</ISGSTOVERRIDDEN>
                <GSTNOTEXPORTED>No</GSTNOTEXPORTED>
                <IGNOREGSTINVALIDATION>No</IGNOREGSTINVALIDATION>
                <ISVATPRINCIPALACCOUNT>No</ISVATPRINCIPALACCOUNT>
                <VCHSTATUSISVCHNUMUSED>No</VCHSTATUSISVCHNUMUSED>
                <VCHGSTCLASS/>
                <VCHENTRYMODE>Item Invoice</VCHENTRYMODE>
                <DIFFACTUALQTY>No</DIFFACTUALQTY>
                <ISMSTFROMSYNC>No</ISMSTFROMSYNC>
                <ISDELETED>No</ISDELETED>
                <ISSECURITYONWHENENTERED>No</ISSECURITYONWHENENTERED>
                <ASORIGINAL>No</ASORIGINAL>
                <AUDITED>No</AUDITED>
                <ISCOMMONPARTY>No</ISCOMMONPARTY>
                <FORJOBCOSTING>No</FORJOBCOSTING>
                <ISOPTIONAL>No</ISOPTIONAL>
                <USEFOREXCISE>No</USEFOREXCISE>
                <ISFORJOBWORKIN>No</ISFORJOBWORKIN>
                <ALLOWCONSUMPTION>No</ALLOWCONSUMPTION>
                <USEFORINTEREST>No</USEFORINTEREST>
                <USEFORGAINLOSS>No</USEFORGAINLOSS>
                <USEFORGODOWNTRANSFER>No</USEFORGODOWNTRANSFER>
                <USEFORCOMPOUND>No</USEFORCOMPOUND>
                <USEFORSERVICETAX>No</USEFORSERVICETAX>
                <ISEXCISEVOUCHER>No</ISEXCISEVOUCHER>
                <EXCISETAXOVERRIDE>No</EXCISETAXOVERRIDE>
                <USEFORTAXUNITTRANSFER>No</USEFORTAXUNITTRANSFER>
                <IGNOREPOSVALIDATION>No</IGNOREPOSVALIDATION>
                <EXCISEOPENING>No</EXCISEOPENING>
                <USEFORFINALPRODUCTION>No</USEFORFINALPRODUCTION>
                <ISTDSOVERRIDDEN>No</ISTDSOVERRIDDEN>
                <ISTCSOVERRIDDEN>No</ISTCSOVERRIDDEN>
                <ISTDSTCSCASHVCH>No</ISTDSTCSCASHVCH>
                <INCLUDEADVPYMTVCH>No</INCLUDEADVPYMTVCH>
                <ISSUBWORKSCONTRACT>No</ISSUBWORKSCONTRACT>
                <ISVATOVERRIDDEN>No</ISVATOVERRIDDEN>
                <IGNOREORIGVCHDATE>No</IGNOREORIGVCHDATE>
                <ISVATPAIDATCUSTOMS>No</ISVATPAIDATCUSTOMS>
                <ISDECLAREDTOCUSTOMS>No</ISDECLAREDTOCUSTOMS>
                <ISSERVICETAXOVERRIDDEN>No</ISSERVICETAXOVERRIDDEN>
                <ISISDVOUCHER>No</ISISDVOUCHER>
                <ISEXCISEOVERRIDDEN>No</ISEXCISEOVERRIDDEN>
                <ISEXCISESUPPLYVCH>No</ISEXCISESUPPLYVCH>
                <ISGSTOVERRIDDEN>No</ISGSTOVERRIDDEN>
                <GSTNOTEXPORTED>No</GSTNOTEXPORTED>
                <IGNOREGSTINVALIDATION>No</IGNOREGSTINVALIDATION>
                <ISVATPRINCIPALACCOUNT>No</ISVATPRINCIPALACCOUNT>
                <VCHSTATUSISVCHNUMUSED>No</VCHSTATUSISVCHNUMUSED>${ledgerEntriesXml}
            </VOUCHER>
        </TALLYMESSAGE>`;
    }

    /**
     * Build stock item XML structure
     * @param {Object} stockData - Stock item information
     * @param {string} stockData.name - Stock item name
     * @param {string} stockData.parent - Parent group
     * @param {string} stockData.baseUnits - Base units
     * @param {Object} stockData.openingBalance - Opening balance details
     * @returns {string} Stock item XML
     */
    static buildStockItemXml(stockData) {
        const { name, parent, baseUnits, openingBalance, alias } = stockData;
        
        let openingBalanceXml = '';
        if (openingBalance) {
            openingBalanceXml = `
                <OPENINGBALANCE>${openingBalance.quantity || 0}</OPENINGBALANCE>
                <OPENINGRATE>${openingBalance.rate || 0}</OPENINGRATE>
                <OPENINGVALUE>${openingBalance.value || 0}</OPENINGVALUE>`;
        }

        return `<TALLYMESSAGE xmlns:UDF="TallyUDF">
            <STOCKITEM NAME="${this.escapeXml(name)}" RESERVEDNAME="">
                <OLDAUDITENTRYIDS.LIST TYPE="Number">
                    <OLDAUDITENTRYIDS>-1</OLDAUDITENTRYIDS>
                </OLDAUDITENTRYIDS.LIST>
                <GUID></GUID>
                <PARENT>${this.escapeXml(parent)}</PARENT>
                <ALIAS>${this.escapeXml(alias || '')}</ALIAS>
                <BASEUNITS>${this.escapeXml(baseUnits)}</BASEUNITS>
                <ADDITIONALUNITS/>
                <VAT.VATCLASSIFICATIONNAME/>
                <VAT.VATASSESSABLEVALUE/>
                <GST.APPLICABLE/>
                <GST.HSNCODE/>
                <GST.TAXABILITY/>
                <GST.GSTTYPEOFSUPPLY/>
                <ISCOSTCENTRESON>No</ISCOSTCENTRESON>
                <ISENTRYTAXAPPLICABLE>No</ISENTRYTAXAPPLICABLE>
                <ISCOSTTRACKINGON>No</ISCOSTTRACKINGON>
                <ISUPDATINGTARGETID>No</ISUPDATINGTARGETID>
                <ASORIGINAL>Yes</ASORIGINAL>
                <IGNOREPHYSICALDIFFERENCE>No</IGNOREPHYSICALDIFFERENCE>
                <IGNORENEGATIVESTOCK>No</IGNORENEGATIVESTOCK>
                <TREATSALESASMANUFACTURED>No</TREATSALESASMANUFACTURED>
                <TREATPURCHASESASCONSUMED>No</TREATPURCHASESASCONSUMED>
                <TREATRECEIPTSASREVENUE>No</TREATRECEIPTSASREVENUE>
                <HASMFGDATE>No</HASMFGDATE>
                <ALLOWUSEOFEXPIREDITEMS>No</ALLOWUSEOFEXPIREDITEMS>
                <IGNOREBATCHES>No</IGNOREBATCHES>
                <IGNOREGODOWNS>No</IGNOREGODOWNS>
                <CALCONMRP>No</CALCONMRP>
                <EXCLUDEJRNLFORVALUATION>No</EXCLUDEJRNLFORVALUATION>
                <ISMAINTAINEDINNATIONALCURRENCY>No</ISMAINTAINEDINNATIONALCURRENCY>
                <AUDITED>No</AUDITED>
                <FORPURCHASETAX>No</FORPURCHASETAX>
                <FORSERVICETAX>No</FORSERVICETAX>
                <FORVAT>No</FORVAT>
                <FORROYALTY>No</FORROYALTY>
                <FOREXCISE>No</FOREXCISE>
                <FORTDS>No</FORTDS>
                <FORTCS>No</FORTCS>
                <FORPURCHASETAX>No</FORPURCHASETAX>
                <FORSERVICETAX>No</FORSERVICETAX>
                <FORVAT>No</FORVAT>
                <FORROYALTY>No</FORROYALTY>
                <FOREXCISE>No</FOREXCISE>
                <FORTDS>No</FORTDS>
                <FORTCS>No</FORTCS>${openingBalanceXml}
            </STOCKITEM>
        </TALLYMESSAGE>`;
    }

    /**
     * Build company XML structure
     * @param {Object} companyData - Company information
     * @returns {string} Company XML
     */
    static buildCompanyXml(companyData) {
        const { name, mailingName, address, state, country, pincode } = companyData;

        return `<TALLYMESSAGE xmlns:UDF="TallyUDF">
            <COMPANY NAME="${this.escapeXml(name)}" RESERVEDNAME="">
                <REMOTECMPINFO.LIST>
                </REMOTECMPINFO.LIST>
                <MAILINGNAME>${this.escapeXml(mailingName || name)}</MAILINGNAME>
                <ADDRESS>${this.escapeXml(address || '')}</ADDRESS>
                <STATE>${this.escapeXml(state || '')}</STATE>
                <COUNTRY>${this.escapeXml(country || '')}</COUNTRY>
                <PINCODE>${this.escapeXml(pincode || '')}</PINCODE>
                <CURRENCYSYMBOL>Rs.</CURRENCYSYMBOL>
                <FORMALNAME>${this.escapeXml(name)}</FORMALNAME>
                <BOOKSBEGINFROM>01-Apr-2023</BOOKSBEGINFROM>
                <ACCOUNTINGBASIS>Accrual</ACCOUNTINGBASIS>
                <USEFORCOMPANY>Yes</USEFORCOMPANY>
                <MULTITASKSUPPORT>Yes</MULTITASKSUPPORT>
                <ENABLEADVTAX>No</ENABLEADVTAX>
                <SEPARATELYVIEWEDADVTAX>No</SEPARATELYVIEWEDADVTAX>
                <USEFOREXCISE>No</USEFOREXCISE>
                <EXCISEREGN/>
                <EXCISEREGIONALAREA/>
                <EXCISERANGE/>
                <EXCISEDIVISION/>
                <EXCISECOMMISSIONERATE/>
                <USEFORSERVICETAX>No</USEFORSERVICETAX>
                <USEFORPURCHASETAX>No</USEFORPURCHASETAX>
                <USETRACKINGNUMBER>No</USETRACKINGNUMBER>
                <USEFORPAYROLL>No</USEFORPAYROLL>
                <USEFORESI>No</USEFORESI>
                <USEFORPF>No</USEFORPF>
                <USEFORTDS>No</USEFORTDS>
                <USEFORTCS>No</USEFORTCS>
                <USEFORVAT>No</USEFORVAT>
                <USEFORBILLWISERES>No</USEFORBILLWISERES>
                <USEFORCOST>No</USEFORCOST>
                <USEFORBILLWISE>No</USEFORBILLWISE>
                <USEFORGST>No</USEFORGST>
                <ENABLEGSTCOMPLIANCE>No</ENABLEGSTCOMPLIANCE>
                <GSTNUMBER></GSTNUMBER>
                <GSTREGISTRATIONTYPE></GSTREGISTRATIONTYPE>
                <VATAPPLICABLE>No</VATAPPLICABLE>
            </COMPANY>
        </TALLYMESSAGE>`;
    }

    /**
     * Escape XML special characters
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    static escapeXml(text) {
        if (typeof text !== 'string') {
            return text;
        }
        
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    /**
     * Format date for Tally XML (DD-MMM-YYYY format)
     * @param {string|Date} date - Date to format
     * @returns {string} Formatted date
     */
    static formatDate(date) {
        const dateObj = new Date(date);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        const day = dateObj.getDate().toString().padStart(2, '0');
        const month = months[dateObj.getMonth()];
        const year = dateObj.getFullYear();
        
        return `${day}-${month}-${year}`;
    }

    /**
     * Build collection request XML for fetching multiple records
     * @param {string} collection - Collection name (e.g., 'Ledger', 'Voucher', 'Stock Item')
     * @param {Object} filters - Filters to apply
     * @returns {string} Collection request XML
     */
    static buildCollectionRequest(collection, filters = {}) {
        let filterXml = '';
        if (Object.keys(filters).length > 0) {
            filterXml = Object.entries(filters)
                .map(([key, value]) => `                <${key}>${this.escapeXml(value)}</${key}>`)
                .join('\\n');
        }

        const bodyContent = `<EXPORTDATA>
            <REQUESTDESC>
                <REPORTNAME>List of ${collection}</REPORTNAME>
                <STATICVARIABLES>
                    <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
${filterXml}
                </STATICVARIABLES>
            </REQUESTDESC>
        </EXPORTDATA>`;

        return this.buildEnvelope('Export Data', bodyContent);
    }

    /**
     * Build minimal Group create XML
     * @param {{name:string,parent:string}} groupData
     */
    static buildGroupXml(groupData) {
        const { name, parent } = groupData;
        return `<TALLYMESSAGE xmlns:UDF="TallyUDF">
            <GROUP NAME="${this.escapeXml(name)}" ACTION="Create">
                <NAME.LIST>
                    <NAME>${this.escapeXml(name)}</NAME>
                </NAME.LIST>
                <PARENT>${this.escapeXml(parent)}</PARENT>
            </GROUP>
        </TALLYMESSAGE>`;
    }

    /**
     * Build a TDL-based collection export request (robust across editions)
     * @param {string} collectionName - Friendly ID for the collection (e.g., 'Group List')
     * @param {string} type - Tally object type (e.g., 'Group', 'Ledger')
     * @param {string[]} fetchFields - Fields to fetch (e.g., ['NAME','PARENT'])
     * @returns {string} XML envelope ready to send
     */
    static buildTDLCollectionRequest(collectionName, type, fetchFields = []) {
        const id = this.escapeXml(collectionName);
        const collType = this.escapeXml(type);
        const fetchLine = fetchFields.length > 0 ? `<FETCH>${fetchFields.join(',')}</FETCH>` : '';

        // Match user-provided working example structure
        return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
    <HEADER>
        <VERSION>1</VERSION>
        <TALLYREQUEST>Export Data</TALLYREQUEST>
        <TYPE>Collection</TYPE>
        <ID>${id}</ID>
    </HEADER>
    <BODY>
        <DESC>
            <TDL>
                <TDLMESSAGE>
                    <COLLECTION NAME="${id}" ISINITIALIZE="Yes">
                        <TYPE>${collType}</TYPE>
                        ${fetchLine}
                    </COLLECTION>
                </TDLMESSAGE>
            </TDL>
        </DESC>
    </BODY>
</ENVELOPE>`;
    }
}

export default XmlBuilder;
