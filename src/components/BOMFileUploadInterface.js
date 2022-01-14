import { values } from 'lodash';
import React, {useState} from 'react';

import XLSX from 'xlsx';

import {MyDropzone} from './Dropzone';
//import {ExcelDisplayTable, CheckboxRowCustomColumnTable} from './Tables';

//const columnOptions = ["_remove", "Custom", "Manufacturer Part Number", "Manufacturer", "Quantity"];
/*
const tableHeaders = [
    {Header:'_remove', accessor: '_'},
    {Header:'Custom', accessor: 'custom'}, {Header:'Manufacturer Part Number', accessor: 'MPN'}, 
    {Header:'Manufacturer', accessor: 'manufacturer'}, {Header:'Quantity', accessor: 'quantity'}
];
const columnOptions = tableHeaders.map((obj) => obj.Header);

const headerToAccessor = tableHeaders.reduce(function(map, obj) {
    map[obj.Header] = obj.accessor;
    return map;
}, {});
*/

function BOMFileUploadInterface(props){
    const [file, setFile] = useState(null); 
    const [uploadedSheet, setUploadedSheet] = useState([]);
    const [autoFind, setAutoFind] = useState(true);
    function handleDrop(workbook, file){
        //console.log(workbook);
        setFile(file);
        //Get first worksheet
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        //Convert worksheet to array of arrays
        const data = XLSX.utils.sheet_to_json(ws, {header:1});
        const passData = data.map(l => {
            const line = [];
            for(let i=0; i<l.length; i++){
                const v = l[i] ? l[i] : '';
                line.push(v);
            }
            return line;
        });
        //console.log(passData);
        setUploadedSheet(passData);
        props.onBOMUpload(passData, {autofind: autoFind}); //send straight to main bom
        //props.onBOMUpload(data, 1);
        
    }
    function handleConfirm(){
        props.onBOMUpload(uploadedSheet, {autofind: autoFind});
    }
    function handleCheckboxChange(){
        setAutoFind(!autoFind);
    }

    return (
        <div>
            <MyDropzone onDrop={handleDrop}></MyDropzone>
            {file &&
            <div>
                <span>{file.name}</span>
                <button onClick={handleConfirm}>Confirm</button>
            </div>
            }
            <span>
                Auto Columns  
                <input className="form-check-input" type="checkbox" 
                checked={autoFind} onChange={handleCheckboxChange}/>
            </span>
        </div>
    );
}

export default BOMFileUploadInterface;