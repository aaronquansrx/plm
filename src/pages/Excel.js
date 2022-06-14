import React, {useState} from 'react';

import {MyDropzone} from './../components/Dropzone';
import XLSX from 'xlsx';

function Excel(props){
    function handleDrop(workbook, file){
        console.log(workbook);
        const masterfile = workbook.Sheets['Master File'];
        const cb = workbook.Sheets['CBOM'];

        const cbom = parseCBOM(cb);
        console.log(cbom);
        //const cbf = 
        //console.log(cbom);
        const mf = parseMasterFile(masterfile);
        console.log(mf);
        const fil = filterMasterFile(mf);

        const currency = workbook.Sheets['Currency Exchange'];
        const ex = parseExchange(currency);
        console.log(ex);


    }
    return(
        <div>
        <MyDropzone class='DropFiles' onDrop={handleDrop}/>
        {/*<ShadedTable data={mf}/>*/}
        </div>
    );
}
//'(RoHS) ↵(Y/N)'
function filterMasterFile(mf){
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
    console.log(quotedLines);
    //console.log(chosenQuotes);
    return chosenQuotes;
}

function parseExchange(sheet){
    const dims = sheet['!ref'].split(':');
    const letterX = dims[1].match('^[A-Z]*')[0];
    const maxX = letterValue(letterX);
    const maxY = parseInt(dims[1].match('[0-9]*$')[0]);
    const rates = {};
    //assuming B3:C13 for currency
    for(let y=3; y<=maxY; y++){
        const curr = sheet['B'+y.toString()];
        const val = sheet['C'+y.toString()];
        rates[curr.v] = val.v;
    }
    return rates;
}

function ShadedTable(){
    return(
        <></>
    )
}

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

function parseSheet(sheet){
    const dims = sheet['!ref'].split(':');
    const letterX = dims[1].match('^[A-Z]*')[0];
    const maxX = letterValue(letterX);
    const maxY = parseInt(dims[1].match('[0-9]*$')[0]);

    const cbom = Array(maxY).fill().map(() => Array(maxX).fill(null));
    let titles = null;
    for(let y=1; y<=maxY; y++){
        let l = 'A';
        while(l !== letterX){
            const x = letterValue(l);
            const cell = l+y.toString();
            //console.log(cb[cell]);
            const cellVal = sheet[cell];
            if(cellVal){
                if('v' in cellVal){
                    const c = {
                        value: cellVal.v,
                        style: 's' in cellVal ? cellVal.s : null
                    }
                    cbom[y-1][x-1] = c;
                }
            }
            l = letterExcelNumberIncrement(l);
        }
    }
    return cbom;
}

function parseMasterFile(sheet){
    const dims = sheet['!ref'].split(':');
    const letterX = dims[1].match('^[A-Z]*')[0];
    const maxX = letterValue(letterX);
    const maxY = parseInt(dims[1].match('[0-9]*$')[0]);
    const masterFile = Array(maxY).fill().map(() => Array(maxX).fill(null));
    const masterFileObjs = [];
    let titles = {};
    let lt = 'A';
    while(lt !== letterX){
        const cell = sheet[lt+'1'];
        if(cell){
            if('s' in cell && cell.s.patternType === 'solid'){
                if('v' in cell){
                    titles[lt] = cell.v;
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
                if('v' in cellVal){
                    const c = {
                        value: cellVal.v,
                        style: 's' in cellVal ? cellVal.s : null
                    }
                    masterFile[y-1][x-1] = c;
                    if(l in titles){
                        mfo[titles[l]] = cellVal.v;
                    }
                }
            }
            l = letterExcelNumberIncrement(l);
        }
        masterFileObjs.push(mfo);
    }
    //console.log(titles);
    return masterFileObjs;
}

function parseCBOM(sheet){
    const dims = sheet['!ref'].split(':');
    const letterX = dims[1].match('^[A-Z]*')[0];
    const maxX = letterValue(letterX);
    const maxY = parseInt(dims[1].match('[0-9]*$')[0]);

    const cbom = Array(maxY).fill().map(() => Array(maxX).fill(null));
    const cbomObjs = [];
    let titles = {};
    let titlesSubmission = {};
    let i = 0;
    for(let y=0; y<=maxY; y++){
        let l = 'A';
        const cell = sheet[l+y.toString()];
        if(cell){
            if('s' in cell && cell.s.patternType === 'solid'){
                while(l !== letterX){
                    const c = sheet[l+y.toString()];
                    if(c && 's' in c && c.s.patternType === 'solid'){
                        titles[l] = c.v;
                    }
                    l = letterExcelNumberIncrement(l);
                }
                i = y;
                break;
            }
        }
    }
    console.log(titles);
    //console.log(i);
    for(let y=i+1; y<=maxY; y++){
        let l = 'A';
        const cbo = {};
        while(l !== letterX){
            const x = letterValue(l);
            const cell = sheet[l+y.toString()];
            //const cellVal = sheet[cell];
            if(cell){
                if('v' in cell){
                    const c = {
                        value: cell.v,
                        style: 's' in cell ? cell.s : null
                    }
                    cbom[y-1][x-1] = c;
                    if(l in titles){
                        cbo[titles[l]] = cell.v;
                    }
                }
            }
            l = letterExcelNumberIncrement(l);
        }
        cbomObjs.push(cbo);
    }
    return cbomObjs;
}
export default Excel;