import {useState, useEffect, useRef} from 'react';
import update from 'immutability-helper';

import Button from 'react-bootstrap/Button';

import { excelSheetToArray } from '../../scripts/ExcelHelpers';
import { ExcelDropzone } from '../../components/Dropzone';
import { TabbedSheetTable } from '../../components/Tables';
import { DropdownHeaderTable } from '../../Quoting/components/UploadTable';


export const normalHeaders = [
    {label: 'Alias/CPN', accessor: 'alias/cpn'},
    {label: 'IPN', accessor: 'ipn'},
    {label: 'Designator', accessor: 'designator'},
    {label: 'Description', accessor: 'description'},
    {label: 'Quantity', accessor: 'quantity'},
    {label: 'Footprint', accessor: 'footprint'},
]

export function UploadBOMInterface(props){
    const [fileName, setFileName] = useState('');
    const [sheets, setSheets] = useState(null);
    const [sheetValues, setSheetValues] = useState([]);
    const [sheetId, setSheetId] = useState(null);
    const [obj, setObj] = useState([{mpn: [], mfr: []}]);
    const firstRender = useRef(true);
    const changeSheets = useRef(false);
    useEffect(() => {
        if(!firstRender.current && changeSheets.current){
            if(sheets === null) {
                setSheetValues([]);
            }else{
                setSheetValues(nullSheetValues());
                setSheetId(0);
            }
            changeSheets.current = false;
        }
        firstRender.current = false;
    }, [sheets]);
    function nullSheetValues(){
        if(sheets === null) return [];
        return sheets.map((sheet) => {
            return sheet.array.map((r) => r.map(() => null));
        });
    }
    function handleFileDrop(wb, file){
        setFileName(file);
        const sheetNames = wb.SheetNames;
        const sheets = sheetNames.map((sn) => {
            const sheetArray = excelSheetToArray(wb.Sheets[sn]);
            return {name: sn, array: sheetArray};
        });
        setSheets(sheets);
        changeSheets.current = true;
    }
    function handleSubmit(o, activeHeaders){
        props.onSubmit(o, fileName.name, activeHeaders);
        setObj(o);
    }
    return(
        <>
        <div className='FlexNormal'>
        <ExcelDropzone class='DropFilesSmall' onDrop={handleFileDrop}>
            <p>Upload</p>
        </ExcelDropzone>
        </div>
        <UploadTable sheets={sheets} sheetId={sheetId} onSubmit={handleSubmit}/>       
        </>
    );
}



const headers = [
    {label: '_remove', accessor: '_remove'},
    ...normalHeaders,
    {accessor: 'mpn0', label: 'MPN1'},
    {accessor: 'mfr0', label: 'MFR1'}
];

function UploadTable(props){
    const [sheetId, setSheetId] = useState(null);
    const [selectedRow, setSelectedRow] = useState(null);
    const [dropdownHeaders, setDropdownHeaders] = useState([]);
    const [errorMessage, setErrorMessage] = useState(null);
    const [tableHeaders, setTableHeaders] = useState(headers);
    const [mpnCount, setMpnCount] = useState(0);
    const [labelHeaders, setLabelHeaders] = useState(tableHeaders.map((h) => h.label));

    useEffect(() => {
        if(props.sheets && props.sheets.length > 0){
            setSheetId(0);
        }
    }, [props.sheets]);
    useEffect(() => {
        if(props.sheets && props.sheets.length > sheetId && props.sheets[sheetId].array.length > 0){
            setDropdownHeaders(props.sheets[sheetId].array[0].map(() => '_remove'));
        }
    }, [sheetId]);
    useEffect(() => {
        setLabelHeaders(tableHeaders.map((h) => h.label));
    }, [tableHeaders])
    function handleChangeSheet(i){
        setSheetId(i);
        setErrorMessage(null);
    }
    function handleSheetRowSelect(rowIndex){
        setErrorMessage(null);
        if(selectedRow && selectedRow.row === rowIndex && selectedRow.sheetId === sheetId){
            setSelectedRow(null);
        }else{
            const activeSheet = props.sheets[sheetId].array;
            const sheetRow = activeSheet[rowIndex];
            const headerSet = new Set(headers.map(h => h.label));
            const headerFound = new Set();
            let mpnC = 0;
            let mfrC = 0;
            const mpnMatches = ['mpn', 'manufacturer part number', 'manufacturer pn',
             'recommended part', 'alternate part'];
            const mfrMatches = ['mfr', 'manufacturer', 'recommended mf', 'alternate mf'];

            const mfgRegexManu = new RegExp("^MFG *[0-9]*$"); // regex for manufacturer starting mfg
            const headersFound = sheetRow.map((str) => {
                const matches = headerSet.has(str);
                const lower = str.toLowerCase();
                if(matches){
                    if(str === 'MPN1'){
                        mpnC++;
                    }
                    if(str === 'MFR1'){
                        mfrC++;
                    }
                    if(headerFound.has(str)){
                        return '_remove';
                    }
                    headerFound.add(str);
                    return str;
                }
                let mpnFound = false;
                mpnMatches.forEach((val) => {
                    if(lower.startsWith(val)){
                        mpnC++;
                        mpnFound = true;
                        return;
                    }
                });

                if(mpnFound){
                    return 'MPN'+mpnC;
                }
                let mfrFound = false;
                mfrMatches.forEach((val) => {
                    if(lower.startsWith(val)){
                        mfrC++;
                        mfrFound = true;
                        return;
                    }
                });
                if(mfrFound){
                    return 'MFR'+mfrC;
                }
                
                if(lower.startsWith('mfg') && lower.endsWith('pn')){
                    mpnC++;
                    return 'MPN'+mpnC;
                }
                else if(mfgRegexManu.test(str)){
                    mfrC++;
                    return 'MFR'+mfrC;
                }
                return '_remove';
            });
            const max = Math.max(mfrC, mpnC);
            const newHeaders = [];
            for(let i = mpnCount; i<max; i++){
                newHeaders.push({accessor: 'mpn'+(i+1).toString(), label: 'MPN'+(i+2).toString()});
                newHeaders.push({accessor: 'mfr'+(i+1).toString(), label: 'MFR'+(i+2).toString()});
            }
            setMpnCount(max);
            setTableHeaders(tableHeaders.concat(newHeaders));
            setDropdownHeaders(headersFound);
            setSelectedRow({sheetId: sheetId, row: rowIndex});
        }
    }
    function handleColumnChange(i, item, itemNo){
        setErrorMessage(null);
        const headerIndex = dropdownHeaders.findIndex((h) => h === item);
        const updateObj = {
            [i]: {$set: item}
        };
        if(headerIndex !== -1){
            updateObj[headerIndex] = {$set: '_remove'};
        }
        setDropdownHeaders(update(dropdownHeaders, updateObj));
        const newHeaders = [];
        if(tableHeaders[itemNo].accessor.startsWith('mpn')){
            const i = parseInt(tableHeaders[itemNo].accessor.substring(3));

            if(i === mpnCount){
                newHeaders.push({accessor: 'mpn'+(i+1).toString(), label: 'MPN'+(i+2).toString()});
                newHeaders.push({accessor: 'mfr'+(i+1).toString(), label: 'MFR'+(i+2).toString()});
                setTableHeaders(tableHeaders.concat(newHeaders));
                setMpnCount(i+1);
            }
        }else if(tableHeaders[itemNo].accessor.startsWith('mfr')){
            const i = parseInt(tableHeaders[itemNo].accessor.substring(3));
            if(i === mpnCount){
                newHeaders.push({accessor: 'mpn'+(i+1).toString(), label: 'MPN'+(i+2).toString()});
                newHeaders.push({accessor: 'mfr'+(i+1).toString(), label: 'MFR'+(i+2).toString()});
                setTableHeaders(tableHeaders.concat(newHeaders));
                setMpnCount(i+1);
            }
        }
    }
    function handleSubmit(){
        const headerMap = tableHeaders.reduce((mp, h) => {
            mp[h.label] = h;
            return mp;
        }, {});
        const activeSheet = props.sheets[selectedRow ? selectedRow.sheetId : sheetId].array;
        const startRow = selectedRow ? selectedRow.row+1 : 0;
        const activeHeaders = [];
        const headerIndexes = dropdownHeaders.reduce((arr, h, i) => {
            if(h !== '_remove'){
                arr.push({...headerMap[h], index: i});
                activeHeaders.push(h);
            }
            return arr;
        }, []);

        const objs = [];
        for(let r=startRow; r < activeSheet.length; r++){
            const obj = headerIndexes.reduce((o, h) => {
                let cellValue = activeSheet[r][h.index];
                if(h.accessor.startsWith('mpn')){
                    if(cellValue !== ''){
                        if('mpn' in o){
                            o.mpn.push(cellValue);
                        }
                    }
                }else if(h.accessor.startsWith('mfr')){
                    if(cellValue !== ''){
                        if('mfr' in o){
                            o.mfr.push(cellValue);
                        }
                    }
                }
                o[h.accessor] = cellValue;
                return o;
            }, {mpn: [], mfr: []});
            objs.push(obj);
        }
        props.onSubmit(objs, activeHeaders);
    }

    return(
        <>
        <div className='FlexNormal'>
        <Button onClick={handleSubmit}>Submit</Button>
        <div style={{color: 'red'}}>{errorMessage}</div>
        </div>
        <TabbedSheetTable sheets={props.sheets} sheetId={sheetId}
        onChangeSheet={handleChangeSheet}
        tableClass={'FlexNormal Overflow'} tabsClass={'FlexNormal'}
        table={(props) => 
        <DropdownHeaderTable {...props} 
        columnOptions={labelHeaders} 
        columnAttributes={dropdownHeaders}
        onRowSelect={handleSheetRowSelect}
        onColumnChange={handleColumnChange}
        selectedRow={selectedRow ? selectedRow.row : null}/>}/>
        </>
    );
}