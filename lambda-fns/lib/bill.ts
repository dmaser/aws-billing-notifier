import { Amount, BillData, Category, Detail, USAGE_QTY_PRECISION } from './bill-util-types';

const ZERO = new Amount(0);

export class Bill {

    private _rows: string[][];
    private _initialized = false;
    private _billData: BillData;

    private invoiceId: number;
    private recordType: number;
    private productCode: number;
    private usageType: number;
    private itemDescription: number;
    private usageQuantity: number;
    private taxAmount: number;
    private costBeforeTax: number;
    private totalCost: number;

    private otherBillData: BillData[] = [];

    constructor(rows: string[][]) {
        this._rows = rows;
        const headings: string[] = this._rows.shift() || [];
        console.log(`headings: ${headings.join(', ')}`);
        this.invoiceId = headings.indexOf('InvoiceID');
        this.recordType = headings.indexOf('RecordType');
        this.productCode = headings.indexOf('ProductCode');
        // this.productName = headings.indexOf('ProductName');
        this.usageType = headings.indexOf('UsageType');
        // this.operation = headings.indexOf('Operation');
        this.itemDescription = headings.indexOf('ItemDescription');
        this.usageQuantity = headings.indexOf('UsageQuantity');
        this.taxAmount = headings.indexOf('TaxAmount');
        this.costBeforeTax = headings.indexOf('CostBeforeTax');
        this.totalCost = headings.indexOf('TotalCost');
    }

    public build() {
        const invoiceIds = Array.from(new Set(this._rows.map(r => r[this.invoiceId])));
        console.log(`Found ${invoiceIds.length} invoice IDs: ${invoiceIds.join(', ')}`);

        let invoicedRowCount = 0;
        invoiceIds.filter(id => id !== 'Estimated' && id.trim().length > 0).forEach(id => {
            const invoicedRows = this._rows.filter(r => r[this.invoiceId] === id);
            invoicedRowCount += invoicedRows.length;
            this.addOtherBillData(invoicedRows);
        });

        const estimatedRows = this._rows.filter(r => r[this.invoiceId] === 'Estimated');
        const itemsByProductCode = estimatedRows.filter(r => r[this.productCode] != '');
        console.log(`Total rows: ${this._rows.length},  Estimated rows: ${estimatedRows.length}, Rows with ProductCode: ${itemsByProductCode.length}, Invoiced rows: ${invoicedRowCount}`);

        const estimatedProductCodeTotals = this.makeProductCodeTotalMap(itemsByProductCode);
        // console.log('map: ', map);

        this._billData = this.buildBillData(estimatedRows, estimatedProductCodeTotals);
        this._billData.totalBeforeTax = new Amount((estimatedRows.find(r => r[this.recordType] === 'InvoiceTotal') || [])[this.costBeforeTax]);
        this._billData.tax = new Amount((estimatedRows.find(r => r[this.recordType] === 'InvoiceTotal') || [])[this.taxAmount]);
        this._billData.total = new Amount((estimatedRows.find(r => r[this.recordType] === 'InvoiceTotal') || [])[this.totalCost]);
        this._initialized = true;
        return this._billData;
    };

    private makeProductCodeTotalMap(items: string[][]): Map<string, Amount> {
        const productCodeTotalsMap: Map<string, Amount> = new Map();
        items.forEach(i => {
            const cur: Amount = productCodeTotalsMap.get(i[this.productCode]) || ZERO;
            productCodeTotalsMap.set(i[this.productCode], new Amount(+i[this.costBeforeTax] + cur.val));
        });
        return productCodeTotalsMap;
    }

    private buildCategory(name: string, amount: Amount): Category {
        const productCodeRows = this._rows.filter(r => r[this.productCode] === name);
        const usageTypes: string[] = productCodeRows.filter(r => +r[this.costBeforeTax] > 0).map(r => r[this.usageType]);
        let details: Detail[] = [];
        usageTypes.forEach(type => {
            const rowsOfUsageType: string[][] = productCodeRows.filter(r => r[this.usageType] === type);
            if (rowsOfUsageType?.length) {
                const description = rowsOfUsageType[0][this.itemDescription];
                details.push({
                    usageType: type,
                    usageQty: new Amount(rowsOfUsageType.reduce((prev, cur) => prev + +cur[this.usageQuantity], 0) || 0, USAGE_QTY_PRECISION, ''),
                    amount: new Amount(rowsOfUsageType.reduce((prev, cur) => prev + +cur[this.costBeforeTax], 0) || 0),
                    description
                });
            } else {
                console.warn(`Found 0 rows for usageType ${type}, but should've found more?`);
            }
        });
        details.sort((a, b) => b.amount.val - a.amount.val);
        return { name, amount, details };
    }

    private buildBillData(rows: string[][], productCodeTotalsMap: Map<string, Amount>): BillData {
        let billData: BillData = { categories: [], tax: ZERO, total: ZERO, totalBeforeTax: ZERO };
        for (const name of productCodeTotalsMap.keys()) {
            const amount = productCodeTotalsMap.get(name) || ZERO;
            if (amount.val > 0) {
                const cat = this.buildCategory(name, amount);
                billData.categories.push(cat);
            }
        }
        billData.categories.sort((a, b) => b.amount.val - a.amount.val);
        return billData;
    }

    private addOtherBillData(rows: string[][]) {
        const itemRows = rows.filter(r => r[this.productCode] != '');
        const totalsMap = this.makeProductCodeTotalMap(itemRows);
        const otherBill = this.buildBillData(rows, totalsMap);
        otherBill.totalBeforeTax = new Amount((rows.find(r => r[this.recordType] === 'InvoiceTotal') || [])[this.costBeforeTax]);
        otherBill.tax = new Amount((rows.find(r => r[this.recordType] === 'InvoiceTotal') || [])[this.taxAmount]);
        otherBill.total = new Amount((rows.find(r => r[this.recordType] === 'InvoiceTotal') || [])[this.totalCost]);
        this.otherBillData.push(otherBill);
    }

    public paid(): BillData[] {
        if (!this._initialized) throw new Error('BillData is not initialized');
        return this.otherBillData;
    }

    public diff(prevBill: BillData | null): BillData {
        if (!prevBill) return { categories: [], totalBeforeTax: new Amount(0), tax: new Amount(0), total: new Amount(0) };
        if (!this._initialized) throw new Error('BillData is not initialized');
        let prevMap = this.makeMap(prevBill.categories);
        let curMap = this.makeMap(this._billData.categories);
        const catNames = new Set([...prevMap.keys(), ...curMap.keys()]);
        const categories: Category[] = [];
        let categoryTotal = 0;
        catNames.forEach(catName => {
            const curCat = curMap.get(catName);
            const prevCat = prevMap.get(catName);
            const catValDiff = (curCat?.amount.val || 0) - (prevCat?.amount.val || 0);
            const curDetails = curCat?.details || [];
            const prevDetails = prevCat?.details || [];
            const detailDiff = this.diffDetails(prevDetails, curDetails);
            if (catValDiff > 0 || detailDiff.length) {
                categories.push({
                    name: catName,
                    amount: new Amount(catValDiff),
                    details: detailDiff
                });
                categoryTotal += catValDiff;
            }
        })
        const taxDiff = (this._billData.tax.val - prevBill.tax.val) || 0;
        console.log(`taxDiff: ${taxDiff} [${this._billData.tax.val} - ${prevBill.tax.val}]`);
        let diffs: BillData = {
            categories: categories.sort((a, b) => b.amount.val - a.amount.val),
            totalBeforeTax: new Amount(categoryTotal),
            tax: new Amount(taxDiff),
            total: new Amount(categoryTotal + taxDiff)
        };
        console.log('diffs: ', JSON.stringify(diffs));
        return diffs;
    }

    private makeMap(categories: Category[]): Map<string, Category> {
        const map: Map<string, Category> = new Map();
        categories.forEach(c => {
            map.set(c.name, c);
        });
        return map;
    }

    private diffDetails(prevDetails: Detail[], curDetails: Detail[]): Detail[] {
        let details: Detail[] = [];
        const usageTypes: Set<string> = new Set([...prevDetails.map(p => p.usageType), ...curDetails.map(c => c.usageType)]);
        usageTypes.forEach(usageType => {
            const pDetail = prevDetails.find(p => p.usageType === usageType);
            const cDetail = curDetails.find(c => c.usageType === usageType);
            if (pDetail || cDetail) {
                const usageType = pDetail?.usageType || cDetail?.usageType || 'error';
                const usageQty = (cDetail?.usageQty.toJSON() || 0) - (pDetail?.usageQty.toJSON() || 0);
                const amount = (cDetail?.amount.val || 0) - (pDetail?.amount.val || 0);
                // console.log(`usageQty diff: ${usageQty}, amount diff: ${amount}`);
                if (usageQty > 0 || amount > 0) {
                    details.push({
                        usageType,
                        usageQty: new Amount(usageQty, USAGE_QTY_PRECISION, ''),
                        amount: new Amount(amount)
                    });
                }
            }
        });
        details.sort((a, b) => b.amount.val - a.amount.val);
        console.log('diffDetails - prevDetails: ', JSON.stringify(prevDetails));
        console.log('diffDetails - curDetails: ', JSON.stringify(curDetails));
        console.log('diffDetails - diff: ', JSON.stringify(details));
        return details;
    }
}
