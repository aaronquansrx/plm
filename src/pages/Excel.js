import React, {useState} from 'react';

import {MyDropzone} from './../components/Dropzone';
import {
    parseMasterFile, parseCBOM, 
    parseCurrencyExchange, lookupCriteria,
    filterMasterFile
} from './../scripts/CBOM';

import { reverseStringMap } from "../scripts/General";

import Button from 'react-bootstrap/Button';

import XLSX from 'xlsx';

function Excel(props){
    const [workbook, setWorkbook] = useState(null);
    const [fileName, setFileName] = useState(null);
    function handleDrop(wb, file){
        console.log(file);
        setWorkbook(wb);
        setFileName(file.name);
    }
    function handleExport(){
        const masterfile = workbook.Sheets['Master File'];
        const cb = workbook.Sheets['CBOM'];

        const cbom = parseCBOM(cb);
        console.log(cbom);
        //const cbf = 
        //console.log(cbom);
        //console.log(masterfile);
        const mf = parseMasterFile(masterfile);
        const filteredMasterFile = filterMasterFile(mf.objs);
        console.log(mf);
        //const fil = filterMasterFile(mf.objs);
        //const matches = cBomToMasterLookup(cbom.objs[1], filteredMasterFile);
        //console.log(cbom.objs[1]);
        //console.log(matches);

        const currency = workbook.Sheets['Currency Exchange'];
        const currEx = parseCurrencyExchange(currency);
        //console.log(ex);

        const newWorkbook = {...workbook};
        const filledCBom = getFilledCBom(cbom.objs, filteredMasterFile);
        const cbomTitlesRev = reverseStringMap(cbom.titles);
        //console.log(cbomTitlesRev);
        const cbomSheet = fillCBom(newWorkbook.Sheets['CBOM'], filledCBom, cbomTitlesRev, currEx, cbom.linesStart);
        newWorkbook.Sheets['CBOM'] = cbomSheet;
        //console.log(cbomSheet);
        XLSX.writeFile(newWorkbook, 'test.xlsx');
    }
    
    return(
        <div>
        <MyDropzone class='DropFiles' onDrop={handleDrop}/>
        <div>
            {fileName}
            <Button onClick={handleExport} disabled={workbook==null}>Export</Button>
        </div>
        </div>
    );
}

function excelCell(value, pattern=null){
    const pat = pattern ? pattern : {patternType: 'none'};
    return {
        t: 's', v: value, r: '<t>'+value+'</t>',
        h: value, s: pat, w: value, z: 'General'
    };
}
function fillCBom(sheet, cbom, cbomTitlesRev, currEx, startLine){
    //console.log(cbomTitlesRev);
    cbom.forEach((line, i) => {
        const ln = startLine + i + 1;
        Object.entries(cbomTitlesRev).forEach(([k,v]) => {
            if(k in line){
                const letter = v;
                const cellCoord = letter+ln.toString();
                //console.log(cellCoord);
                sheet[cellCoord] = excelCell([line[k]]);
            }
        });
    });
    return sheet;
}
function getFilledCBom(cbom, fmf){
    const filledCBom = [...cbom].map((cLine) => {
        const matches = cBomToMasterLookup(cLine, fmf);
        //console.log(matches);
        if(matches.length > 0){
            const match = matches[0];
            //console.log(match);
            Object.assign(cLine, match);
            //console.log(cLine);
        }
        return cLine;
    });
    return filledCBom;
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
function masterToCBomLookup(masterLine, cbom){

}


export default Excel;