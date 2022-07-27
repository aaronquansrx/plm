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
    'Comments': 'Comments',
    'Usage Per': 'Usage Per'
}

const cbomExtraHeaders = [
    'S/N', 'Level', 
    'Commodity', 'CPN', 'UOM', 'Designator', 'Drawing', 'Supplier Name',
    'Batch 1', 'EAU', 'Comment', 'Vix Unit Price (USD)', 'Open Market (USD)',
    'Min (USD)', 'Quota', 'Uni/Mul'
];

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

export function parseCBOM(sheet, extraHeaders=false){
    const [letterX, _, maxY] = decodeRef(sheet);
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
                        }else if(extraHeaders && cbomExtraHeaders.includes(trimmedCell)){
                            titles[l] = trimmedCell;
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
            //const x = letterValue(l);
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
    const [letterX, _, maxY] = decodeRef(sheet);
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
    console.log(titles);
    for(let y=2; y<=maxY; y++){
        let l = 'A';
        const mfo = {};
        while(l !== letterX){
            //const x = letterValue(l);
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
                        let c = cellVal;
                        if(titles[l] === 'MOQ'){
                            //const c = cellVal;
                            c.v = Math.round(c.v);
                            //console.log(c);
                        }
                        mfo[titles[l]] = 'v' in c ? c.v : '';
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
    /*const uniqueCPNs = mf.reduce((s, line) => {
        s.add(line.CPN);
        return s;
    }, new Set());*/
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
    const [_, _m, maxY] = decodeRef(sheet);
    const rates = {};
    //assuming B3:C13 for currency
    for(let y=3; y<=maxY; y++){
        const curr = sheet['B'+y.toString()];
        const val = sheet['C'+y.toString()];
        rates[curr.v] = val.v;
    }
    return rates;
}

function excelCell(value, pattern=null, z='General'){
    const pat = pattern ? pattern : {patternType: 'none'};
    return {
        t: 's', v: value, r: '<t>'+value+'</t>',
        h: value, s: pat, w: value, z: z
    };
}
export function fillCBom(sheet, cbom, cbomTitlesRev, currEx, startLine){
    cbom.forEach((line, i) => {
        sheet = fillLine(sheet, line, startLine + i + 1, cbomTitlesRev, currEx);
        /*
        const ln = startLine + i + 1;
        const strLn = ln.toString();
        Object.entries(cbomTitlesRev).forEach(([k,v]) => {
            if(k in line){
                const letter = v;
                const cellCoord = letter+strLn;
                //console.log(cellCoord);
                if(k == 'Reach'){
                    if(line[k] = ''){
                        sheet[cellCoord] = '0';
                    }else{
                        sheet[cellCoord] = excelCell([line[k]]);
                    }
                }else{
                    sheet[cellCoord] = excelCell([line[k]]);
                }
            }
        });
        const exRateCell = cbomTitlesRev['Currency Exchange Rate']+strLn;
        const exchangeRate = currEx[line['Currency']];
        //console.log(line['Currency']);
        //console.log(exchangeRate);
        if(exchangeRate){
            sheet[exRateCell] = excelCell(exchangeRate);
            const quotedCell = cbomTitlesRev['Quoted Price']+strLn;
            const quotedPrice = line['Price']/exchangeRate;
            sheet[quotedCell] = excelCell(quotedPrice);
            const extendedCell = cbomTitlesRev['Extended Price']+strLn;
            sheet[extendedCell] = excelCell(quotedPrice*line['Usage Per']);
        }*/
    });
    return sheet;
}

export function trimCBom(sheet, cbom, cbomTitlesRev, currEx, startLine){
    const nLines = startLine+cbom.length;
    console.log(nLines);
    let newSheet = Object.entries(sheet).reduce((obj, [k,v]) => {
        if(k === '!ref'){
            obj[k] = v;
            console.log(v);
        }else{
            const lineNum = parseInt(k.match('[0-9]*$'));
            if(lineNum <= startLine){
                obj[k] = v;
            }
            //obj[k] = v;
        }
        return obj;
    }, {});
    cbom.forEach((line, i) => {
        newSheet = fillLine(newSheet, line, startLine + i + 1, cbomTitlesRev, currEx);
    });
    return newSheet;
}

function fillLine(sheet, line, ln, cbomTitlesRev, currEx){
    //const ln = startLine + i + 1;
    const strLn = ln.toString();
    Object.entries(cbomTitlesRev).forEach(([k,v]) => {
        if(k in line){
            const letter = v;
            const cellCoord = letter+strLn;
            //console.log(k);
            if(k === 'Reach'){
                if(line[k] === ''){
                    sheet[cellCoord] = '0';
                }else{
                    sheet[cellCoord] = excelCell(line[k]);
                }
            }else{
                if(k === 'Price'){
                    if(line[k] !== ''){
                        sheet[cellCoord] = excelCell(line[k].toFixed(4));
                    }else{
                        sheet[cellCoord] = excelCell(line[k]);
                    }
                }else{
                    sheet[cellCoord] = excelCell(line[k]);
                }
            }
        }
    });
    const exRateCell = cbomTitlesRev['Currency Exchange Rate']+strLn;
    const exchangeRate = currEx[line['Currency']];
    if(exchangeRate){
        sheet[exRateCell] = excelCell(exchangeRate.toFixed(4));
        const quotedCell = cbomTitlesRev['Quoted Price']+strLn;
        const quotedPrice = line['Price']/exchangeRate;
        sheet[quotedCell] = excelCell(quotedPrice.toFixed(4));
        const extendedCell = cbomTitlesRev['Extended Price']+strLn;
        sheet[extendedCell] = excelCell((quotedPrice*line['Usage Per']).toFixed(4));
    }
    return sheet;
}

export function getFilledCBom(cbom, fmf){
    const filledCBom = [...cbom].map((cLine) => {
        const matches = cBomToMasterLookup(cLine, fmf);
        if(matches.length > 0){
            const match = matches[0];
            Object.assign(cLine, match);
        }
        return cLine;
    });
    return filledCBom;
}
export function getTrimmedCBom(cbom, fmf){
    const trimmedCBom = [...cbom].reduce((arr, cLine) => {
        const matches = cBomToMasterLookup(cLine, fmf);
        if(matches.length > 0){
            const match = matches[0];
            Object.assign(cLine, match);
            arr.push(cLine);
        }
        return arr;
    }, []);
    return trimmedCBom;
}
function cBomToMasterLookup(cbomLine, masterFile){
    let matches = [...masterFile];
    lookupCriteria.forEach((lc) => {
        //console.log(matches);
        matches = matches.reduce((arr, line) => {
            if(line[lc] === cbomLine[lc]){
                arr.push(line);
            }
            return arr;
        }, []);
    });
    return matches;
}