import React, {useState} from 'react';

import {MyDropzone} from './../components/Dropzone';
import {parseMasterFile, parseCBOM, parseCurrencyExchange, lookupCriteria} from './../scripts/CBOM';

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
        //console.log(masterfile);
        const mf = parseMasterFile(masterfile);
        console.log(mf);
        const fil = filterMasterFile(mf.objs);

        const matches = cBomToMasterLookup(cbom.objs[5], mf.objs);
        console.log(cbom.objs[5]);
        console.log(matches);

        const currency = workbook.Sheets['Currency Exchange'];
        const ex = parseCurrencyExchange(currency);
        console.log(ex);


    }
    return(
        <div>
        <MyDropzone class='DropFiles' onDrop={handleDrop}/>
        {/*<ShadedTable data={mf}/>*/}
        </div>
    );
}

function cBomToMasterLookup(cbomLine, masterFile){
    let matches = [...masterFile];
    /*
    matches = matches.reduce((arr, line) => {
        if(line['Approved MPN'] === cbomLine['Approved MPN']){
            arr.push(line);
        }
        return arr;
    }, []);
    */
    lookupCriteria.forEach((lc) => {
        console.log(matches);
        matches = matches.reduce((arr, line) => {
            if(line[lc] === cbomLine[lc]){
                arr.push(line);
            }
            return arr;
        }, []);
    });
    
    return matches;
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


const alpha = Array.from(Array(26)).map((e, i) => i + 65);
const alphabet = alpha.map((x) => String.fromCharCode(x));
const alphaValue = alphabet.reduce((obj, letter, i) => {
    obj[letter] = i + 1;
    return obj;
}, {});

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
export default Excel;