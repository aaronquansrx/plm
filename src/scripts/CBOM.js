import { reverseStringMap } from "../scripts/General";

const alpha = Array.from(Array(26)).map((e, i) => i + 65);
const alphabet = alpha.map((x) => String.fromCharCode(x));
const alphaValue = alphabet.reduce((obj, letter, i) => {
    obj[letter] = i + 1;
    return obj;
}, {});

function replaceStringIndex(str, i, r){
    return str.substring(0,i) + r + str.substring(i+1);
}

function letterValue(letter){
    let i = letter.length - 1;
    let multi = 1;
    let total = 0;
    while(i >= 0){
        total += alphaValue[letter.charAt(i)] * multi;
        multi *= 26;
        i--;
    }
    return total;
}

function letterExcelNumberIncrement(letter="A"){
    let i = letter.length - 1;
    while(i >= 0 && letter[i] === "Z"){
        letter = replaceStringIndex(letter, i, "A");//letter.substring(0,i) + "A" + letter.substring(i+1);
        i--;
    }
    if(i === -1){
        letter = "A"+letter;
    }else{
        letter = replaceStringIndex(letter, i, String.fromCharCode(letter.charCodeAt(i)+1));
        //letter = letter.substring(0,i) + String.fromCharCode(letter.charCodeAt(i)+1) + letter.substring(i+1);
    }
    return letter;
}

export const lookupCriteria = [
    'CPN', 'SRX PN', 'Descriptions', 
    'Approved MFR', 'Approved MPN'
];

export const cbomHeaders = {
    'Quoted Supplier': 'Quoted Supplier',
    'LT': 'LT (wks)',
    'SPQ': 'SPQ',
    'Quoted MPN': 'Quoted MPN',
    'Quoted MFR': 'Quoted MFR',
    'Currency Exchange Rate': 'Currency Exchange Rate',
    'Currency': 'Raw Quoted Currency',
    'MOQ': 'MOQ',
    'Price': 'Raw Quoted Price',
    'Quoted Price': 'Quoted Price (USD)',
    'Extended Price': 'Extended Price (USD)',
    'RoHS': 'RoHS (Y/N)',
    'Reach': 'REACH (Y/N)',
    'Conflict Minerals': 'Conflict Minerals (Y/N)',
    'Type': 'Type (Std, non-Std, Customized)',
    'Customer Pricing': 'Customer Pricing (Y/N)',
    'Issue': 'Issue (Y/N)',
    'NRE': 'NRE Charges',
    'Tooling Lead Time': 'Tooling Lead Time',
    'Comments': 'Comments'
}

const cbomRev = reverseStringMap(cbomHeaders);

const masterFileHeaders = {
    'Quoted Supplier': 'Quoted Supplier',
    'LT': 'LT (calendar week)',
    'SPQ': 'SPQ',
    'Quoted MPN': 'Quoted MPN',
    'Quoted MFR': 'Quoted MFR',
    'Currency': 'Currency',
    'MOQ': 'MOQ',
    'Price': 'Price/pce',
    'RoHS': '(RoHS)',
    'Reach': 'Reach (Y/N)',
    'Conflict Minerals': 'Conflict Minerals (Y/N)',
    'Type': 'Type (Std, non-Std, Customized)',
    'Customer Pricing': 'Customer Pricing (Y/N)',
    'Issue': 'Issue (Y/N)',
    'NRE': 'NRE cost',
    'Tooling Lead Time': 'Tooling Lead time (Week)',
    'STS': 'STS',
    'QUOTA': 'QUOTA'
}

const masterFileRev = reverseStringMap(masterFileHeaders);

function decodeRef(sheet){
    const dims = sheet['!ref'].split(':');
    const letterX = dims[1].match('^[A-Z]*')[0];
    const maxX = letterValue(letterX);
    const maxY = parseInt(dims[1].match('[0-9]*$')[0]);
    return [letterX, maxX, maxY];
}

export function parseCBOM(sheet){
    const [letterX, maxX, maxY] = decodeRef(sheet);
    //const cbomfile = Array(maxY).fill().map(() => Array(maxX).fill(null));
    const cbomObjs = [];
    let titles = {};
    //let lt = 'A';
    let i = 0;
    for(let y=0; y<=maxY; y++){
        const cOutside = sheet['A'+y.toString()];
        if(cOutside){
            if('s' in cOutside && cOutside.s.patternType === 'solid'){
                let l = 'A';
                while(l !== letterX){
                    const cell = sheet[l+y.toString()];
                    if('v' in cell){
                        const trimmedCell = cell.v.trim();
                        if(trimmedCell in cbomRev){
                            titles[l] = cbomRev[trimmedCell];
                        }else if(lookupCriteria.includes(trimmedCell)){
                            titles[l] = trimmedCell;
                            //console.log(trimmedCell);
                        }
                        /*else if(trimmedCell.split(' ')[0] === '(RoHS)'){
                            titles[lt] = cbomRev['(RoHS)'];
                        }*/
                        //titles[lt] = cell.v;
                    }
                    l = letterExcelNumberIncrement(l);
                }
                i = y;
                break;
            }
        }
        //lt = letterExcelNumberIncrement(lt);
    }
    for(let y=i+1; y<=maxY; y++){
        let l = 'A';
        const cbo = {};
        while(l !== letterX){
            const x = letterValue(l);
            const cell = l+y.toString();
            const cellVal = sheet[cell];
            if(cellVal){
                //if('v' in cellVal){
                    /*
                    const c = {
                        value: cellVal.v,
                        style: 's' in cellVal ? cellVal.s : null
                    }
                    cbomfile[y-1][x-1] = c;
                    */
                    if(l in titles){
                        cbo[titles[l]] = 'v' in cellVal ? cellVal.v : '';
                    }
                //}
            }
            l = letterExcelNumberIncrement(l);
        }
        cbomObjs.push(cbo);
    }
    return {titles: titles, objs: cbomObjs, linesStart: i};
}

export function parseMasterFile(sheet){
    const [letterX, maxX, maxY] = decodeRef(sheet);
    //const masterFile = Array(maxY).fill().map(() => Array(maxX).fill(null));
    const masterFileObjs = [];
    let titles = {};
    let lt = 'A';
    while(lt !== letterX){
        const cell = sheet[lt+'1'];
        if(cell){
            if('s' in cell && cell.s.patternType === 'solid'){
                if('v' in cell){
                    const trimmedCell = cell.v.trim();
                    if(trimmedCell in masterFileRev){
                        titles[lt] = masterFileRev[trimmedCell];
                    }else if(lookupCriteria.includes(trimmedCell)){
                        titles[lt] = trimmedCell;
                    }else if(trimmedCell.split(' ')[0] === '(RoHS)'){
                        titles[lt] = masterFileRev['(RoHS)'];
                    }
                    //titles[lt] = cell.v;
                }
            }
        }
        lt = letterExcelNumberIncrement(lt);
    }
    for(let y=2; y<=maxY; y++){
        let l = 'A';
        const mfo = {};
        while(l !== letterX){
            const x = letterValue(l);
            const cell = l+y.toString();
            const cellVal = sheet[cell];
            if(cellVal){
                //if('v' in cellVal){
                    /*
                    const c = {
                        value: cellVal.v,
                        style: 's' in cellVal ? cellVal.s : null
                    }
                    masterFile[y-1][x-1] = c;
                    */
                    if(l in titles){
                        mfo[titles[l]] = 'v' in cellVal ? cellVal.v : '';
                    }
                //}
            }
            l = letterExcelNumberIncrement(l);
        }
        masterFileObjs.push(mfo);
    }
    return {titles: titles, objs: masterFileObjs};
}

export function filterMasterFile(mf){
    const uniqueCPNs = mf.reduce((s, line) => {
        s.add(line.CPN);
        return s;
    }, new Set());
    //console.log(uniqueCPNs);
    const quotedLines = mf.reduce((arr, line) => {
        if('STS' in line){
            if(line.STS === 'QUOTED'){
                arr.push(line);
            }
        }
        return arr;
    }, []);
    const chosenQuotes = quotedLines.reduce((arr, line) => {
        if('QUOTA' in line){
            if(line.QUOTA === 1){
                arr.push(line);
            }
        }
        return arr;
    }, []);
    //console.log(quotedLines);
    //console.log(chosenQuotes);
    return chosenQuotes;
}

export function parseCurrencyExchange(sheet){
    const [letterX, maxX, maxY] = decodeRef(sheet);
    const rates = {};
    //assuming B3:C13 for currency
    for(let y=3; y<=maxY; y++){
        const curr = sheet['B'+y.toString()];
        const val = sheet['C'+y.toString()];
        rates[curr.v] = val.v;
    }
    return rates;
}