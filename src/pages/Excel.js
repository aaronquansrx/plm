import React, {useState} from 'react';

import {MyDropzone} from './../components/Dropzone';

import { HotTable } from '@handsontable/react';
import XLSX from 'xlsx';

import './../css/main.css';

const settings = {
    licenseKey: 'non-commercial-and-evaluation',
    //... other options
}

function Excel(props){
    
    const [workbook, setWorkbook] = useState(null);
    const [fileName, setFileName] = useState(null);
    function handleDrop(wb, file){
        console.log(file);
        setWorkbook(wb);
        console.log(wb);
        setFileName(file.name);
        const cbom = wb.Sheets['CBOM'];
        const aoa = XLSX.utils.sheet_to_json(cbom, {header: 1});
        console.log(aoa);
        setData(aoa);
    }
    /*
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
        console.log(newWorkbook);
        XLSX.writeFile(newWorkbook, 'test.xlsx');
    }
    */
    const [data, setData] = useState([]);
    /*
    const data = [
        ['', 'Tesla', 'Mercedes', 'Toyota', 'Volvo'],
        ['2019', 10, 11, 12, 13],
        ['2020', 20, 11, 14, 13],
        ['2021', 30, 15, 12, 13]
    ];
    */
    return(
        <div>
        <MyDropzone class='DropFiles' onDrop={handleDrop} styles={true}/>
        <div>
        <HotTable data={data} colHeaders={true} rowHeaders={true} settings={settings} height={600} width={800}/>
        </div>
        </div>
    );
}

/*
function excelCell(value, pattern=null){
    const pat = pattern ? pattern : {patternType: 'none'};
    return {
        t: 's', v: value, r: '<t>'+value+'</t>',
        h: value, s: pat, w: value, z: 'General'
    };
}
function fillCBom(sheet, cbom, cbomTitlesRev, currEx, startLine){
    console.log(currEx);
    cbom.forEach((line, i) => {
        const ln = startLine + i + 1;
        const strLn = ln.toString();
        Object.entries(cbomTitlesRev).forEach(([k,v]) => {
            if(k in line){
                const letter = v;
                const cellCoord = letter+strLn;
                //console.log(cellCoord);
                if(k == 'Reach'){
                    if(line[k] = ''){
                        sheet[cellCoord] = '';
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
        }
    });
    return sheet;
}
function getFilledCBom(cbom, fmf){
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
*/


export default Excel;