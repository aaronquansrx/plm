import {useState, useEffect} from 'react';

import XLSX from 'xlsx';

import { reverseStringMap, trimObjects } from "./../scripts/General";
import {
    parseMasterFile, parseCBOM,
    parseCurrencyExchange,
    filterMasterFile, getFilledCBom,
    fillCBom, getTrimmedCBom, trimCBom, lookupCriteria
} from './../scripts/CBOM';

export function useImportCBom(){
    const [workbook, setWorkbook] = useState(null);
    const [fileName, setFileName] = useState(null);
    function handleDrop(wb, file){
        setWorkbook(wb);
        setFileName(file.name);
    }
    return [workbook, fileName, handleDrop];
}

export function useExportCBom(workbook){
    function exportCBom(trimLines, exportName){
        //parse workbook
        const masterfile = workbook.Sheets['Master File'];
        const cb = workbook.Sheets['CBOM'];
        const cbom = parseCBOM(cb, trimLines);
        const mf = parseMasterFile(masterfile);
        const filteredMasterFile = filterMasterFile(mf.objs);
        const currency = workbook.Sheets['Currency Exchange'];
        const currEx = parseCurrencyExchange(currency);

        //write to new workbook
        const newWorkbook = {...workbook};
        const cbomTitlesRev = reverseStringMap(cbom.titles);
        if(trimLines){
            const trimmedCBom = getTrimmedCBom(cbom.objs, filteredMasterFile);
            const cbomSheet = trimCBom(newWorkbook.Sheets['CBOM'], trimmedCBom, cbomTitlesRev, currEx, cbom.linesStart);
            newWorkbook.Sheets['CBOM'] = cbomSheet;
        }else{
            const filledCBom = getFilledCBom(cbom.objs, filteredMasterFile);
            const cbomSheet = fillCBom(newWorkbook.Sheets['CBOM'], filledCBom, cbomTitlesRev, currEx, cbom.linesStart);
            newWorkbook.Sheets['CBOM'] = cbomSheet;
        }
        const exName = exportName === '' ? 'CBom' : exportName;
        XLSX.writeFile(newWorkbook, exName+'.xlsx');
    }
    return [exportCBom];
}

export function useCBomFunctions(workbook){
    const [lookupData, setLookupData] = useState([]);
    function lookup(){
        const masterfile = workbook.Sheets['Master File'];
        const mf = parseMasterFile(masterfile);
        //const filteredMasterFile = filterMasterFile(mf.objs);
        //console.log(filteredMasterFile);
        const tr = trimObjects(mf.objs, lookupCriteria);
        console.log(tr);
        setLookupData(tr);
    }
    return [lookup, lookupData];
}