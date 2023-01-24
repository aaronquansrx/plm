import XLSX from 'xlsx';

export const alpha = Array.from(Array(26)).map((e, i) => i + 65);
export const alphabet = alpha.map((x) => String.fromCharCode(x));
export const alphaValue = alphabet.reduce((obj, letter, i) => {
    obj[letter] = i + 1;
    return obj;
}, {});

function replaceStringIndex(str, i, r){
    return str.substring(0,i) + r + str.substring(i+1);
}

export function letterValue(letter){
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

function decodeRef(sheet){
    const dims = sheet['!ref'].split(':');
    const letterX = dims[1].match('^[A-Z]*')[0];
    const maxX = letterValue(letterX);
    const maxY = parseInt(dims[1].match('[0-9]*$')[0]);
    return [letterX, maxX, maxY];
}

export function excelSheetToArray(sheet){
    const colRange = XLSX.utils.decode_range(sheet['!ref']).e.c+1;
    const data = XLSX.utils.sheet_to_json(sheet, {header: 1});
    const sheetData = data.reduce((arr,l) => {
        const line = [];
        let rowHasValue = false;
        for(let i=0; i<colRange; i++){
            const v = l[i] ? l[i].toString() : '';
            if(l[i]) rowHasValue = true;
            line.push(v);
        }
        if(line.length > 0 && rowHasValue) arr.push(line);
        return arr;
    }, []);
    return sheetData;
}

export class WorkbookHandler{
    constructor(wb){
        this.workbook = wb;
    }
    hasSheet(sname){
        return this.workbook.SheetNames.includes(sname);
    }
    getSheet(sname){
        if(this.hasSheet(sname)){
            return this.workbook.Sheets[sname];
        }
        return null;
    }
}

export class ExcelSheetParser{
    constructor(sheet){
        console.log(sheet);
        this.sheet = excelSheetToArray(sheet);
        this.ncolumns = XLSX.utils.decode_range(sheet['!ref']).e.c+1;
        this.nrows = this.sheet.length;
    }
    //headerY specifies the row of headers
    toObjectArray(headerRowNum, validHeaders=null){
        const headers = this.sheet[headerRowNum];
        const hs = this.realHeaders(headerRowNum, validHeaders);
        console.log(hs);
        const objArray = [];
        for(let i=headerRowNum+1; i<this.nrows; i++){
            const row = {};
            let rowHasValue = false;
            for(let j=0; j<this.ncolumns; j++){
                if(hs[j] !== null){
                    row[hs[j]] = this.sheet[i][j];
                    if(this.sheet[i][j]) rowHasValue = true;
                }
            }
            if(rowHasValue) objArray.push(row);
        }
        return objArray;
    }
    realHeaders(headerRowNum, validHeaders=null){
        const validHSet = validHeaders ? new Set(validHeaders) : null;
        const strings = new Map();
        const headers = this.sheet[headerRowNum];
        const evalHeaders = headers.map((h) => {
            if(strings.has(h)){
                const n = strings.get(h)+1;
                strings.set(h, n);
                return h+n.toString();
            }else{
                if(validHSet !== null){
                    if(validHSet.has(h)){
                        strings.set(h, 1);
                    }else{
                        return null;
                    }
                }else{
                    strings.set(h, 1);
                }
            }
            return h;
        });
        return evalHeaders; // any null headers are not included in valid headers
    }
}