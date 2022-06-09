import React, {useState} from 'react';

import {MyDropzone} from './../components/Dropzone';
import XLSX from 'xlsx';

function Excel(props){
    function handleDrop(workbook, file){
        console.log(workbook);
        const ws = workbook.Sheets['Master File'];
        const cb = workbook.Sheets['CBOM'];
        //console.log(ws);
        /*
        const data = XLSX.utils.sheet_to_json(ws);
        const d2 = XLSX.utils.sheet_to_json(cb, {raw:false, header:false});
        console.log(data);
        console.log(d2);
        */
        console.log(cb['A3']);
        console.log(cb['C3']);
        console.log(cb['V3']);
        const dims = cb['!ref'].split(':');
        //console.log(dims);
        const letterX = dims[1].match('^[A-Z]*')[0];
        console.log(letterX);
        const maxX = letterValue(letterX);
        const maxY = parseInt(dims[1].match('[0-9]*$')[0]);

        const cbom = Array(maxY).fill().map(() => Array(maxX).fill(null));
        for(let y=1; y<=maxY; y++){
            let l = 'A';
            while(l !== letterX){
                const x = letterValue(l);
                const cell = l+y.toString();
                //console.log(cb[cell]);
                const cellVal = cb[cell];
                cbom[y-1][x-1] = cb[cell];
                //console.log(y-1+' '+x);
                l = letterExcelNumberIncrement(l);
            }
        }
        //console.log(letterValue('BS'));
        console.log(cbom);
        
    }
    return(
        <div>
        <MyDropzone class='DropFiles' onDrop={handleDrop}/>
        </div>
    );
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
export default Excel;