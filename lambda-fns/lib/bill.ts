import { Amount, BillData, BillDiffs, Category, Detail, USAGE_QTY_PRECISION } from './bill-util-types';

export class Bill {

    private _rows: string[][];
    private _initialized = false;
    private _billData: BillData;

    constructor(rows: string[][]) {
        this._rows = rows;
    }

    public build(): BillData {
        const headings: string[] = this._rows.shift() || [];
        console.log(`headings: ${headings.join(', ')}`);
        const recordType = headings.indexOf('RecordType');
        const productCode = headings.indexOf('ProductCode');
        const productName = headings.indexOf('ProductName');
        const usageType = headings.indexOf('UsageType');
        const operation = headings.indexOf('Operation');
        const itemDescription = headings.indexOf('ItemDescription');
        const usageQuantity = headings.indexOf('UsageQuantity');
        const taxAmount = headings.indexOf('TaxAmount');
        const costBeforeTax = headings.indexOf('CostBeforeTax');
        const totalCost = headings.indexOf('TotalCost');
        const items = this._rows.filter(r => r[productCode] != '');
        console.log(`got ${items.length} items from ${this._rows.length} rows`);
        const map: Map<string, number> = new Map();
        items.forEach(i => {
            // console.log(`i[productCode]: ${i[productCode]}, totalCost: ${i[totalCost]}`);
            map.set(i[productCode], +i[costBeforeTax] + (map.get(i[productCode]) || 0));
        });
        // console.log('map: ', map);
        const zero = new Amount(0);
        let billData: BillData = { categories: [], tax: zero, total: zero, totalBeforeTax: zero };
        billData.totalBeforeTax = new Amount((this._rows.find(r => r[recordType] === 'StatementTotal') || [])[costBeforeTax]);
        billData.tax = new Amount((this._rows.find(r => r[recordType] === 'StatementTotal') || [])[taxAmount]);
        billData.total = new Amount((this._rows.find(r => r[recordType] === 'StatementTotal') || [])[totalCost]);
        for (const name of map.keys()) {
            const amount = map.get(name) || 0;
            if (amount > 0) {
                const usageTypes: string[] = this._rows.filter(r => r[productCode] === name && +r[costBeforeTax] > 0).map(r => r[usageType]);
                let details: Detail[] = [];
                usageTypes.forEach(type => {
                    const rowsOfUsageType: string[][] = this._rows.filter(r => r[usageType] === type);
                    if (rowsOfUsageType?.length) {
                        const description = rowsOfUsageType[0][itemDescription];
                        details.push({
                            usageType: type,
                            usageQty: new Amount(rowsOfUsageType.reduce((prev, cur) => prev + +cur[usageQuantity], 0) || 0, USAGE_QTY_PRECISION, ''),
                            amount: new Amount(rowsOfUsageType.reduce((prev, cur) => prev + +cur[costBeforeTax], 0) || 0),
                            description
                        });
                    } else {
                        console.warn(`Found 0 rows for usageType ${type}, but should've found more?`);
                    }
                });
                const cat: Category = { name, amount: new Amount(amount), details };
                billData.categories.push(cat);
            }
        }
        this._billData = billData;
        this._initialized = true;
        return billData;
    };

    public diff(prevBill: BillData | null): BillDiffs {
        if (!prevBill) return { categories: [], total: new Amount(0) };
        if (!this._initialized) throw new Error('BillData is not initialized');
        let prevMap = this.makeMap(prevBill.categories);
        let curMap = this.makeMap(this._billData.categories);
        const catNames = new Set([...prevMap.keys(), ...curMap.keys()]);
        const categories: Category[] = [];
        let categoryTotal = 0;
        catNames.forEach(cn => {
            const curCat = curMap.get(cn);
            const prevCat = prevMap.get(cn);
            const amount = (curCat?.amount.val || 0) - (prevCat?.amount.val || 0);
            const curDetails = curCat?.details || [];
            const prevDetails = prevCat?.details || [];
            const detailDiff = this.diffDetails(prevDetails, curDetails);
            if (amount > 0 || detailDiff.length) {
                categories.push({ name: cn, amount: new Amount(amount), details: detailDiff });
                categoryTotal += amount;
            }
        })
        let diffs: BillDiffs = { categories: categories.sort((a, b) => a.name.localeCompare(b.name)), total: new Amount(categoryTotal) };
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
        console.log('diffDetails - prevDetails: ', JSON.stringify(prevDetails));
        console.log('diffDetails - curDetails: ', JSON.stringify(curDetails));
        console.log('diffDetails - diff: ', JSON.stringify(details));
        return details;
    }
}
