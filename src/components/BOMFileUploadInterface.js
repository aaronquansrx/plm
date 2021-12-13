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
    function handleDrop(workbook, file){
        console.log(workbook);
        setFile(file);
        //Get first worksheet
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        //Convert worksheet to array of arrays
        const data = XLSX.utils.sheet_to_json(ws, {header:1});
        setUploadedSheet(data);
        props.onBOMUpload(data); //send straight to main bom
        //props.onBOMUpload(data, 1);
        
    }
    function handleConfirm(){
        props.onBOMUpload(uploadedSheet);
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
        </div>
    );
}

export default BOMFileUploadInterface;