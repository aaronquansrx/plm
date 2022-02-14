import { values } from 'lodash';
import React, {useState} from 'react';

import update from 'immutability-helper';
import XLSX from 'xlsx';

import Button from 'react-bootstrap/Button';

import {MyDropzone} from './Dropzone';
import {NamedCheckBox} from './Checkbox';
import {HoverOverlay} from './Tooltips';
import { AutoColumnOptionModal } from './Modals';

import {autoFindAttributes} from './../scripts/Upload';

import './../css/main.css';
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

const autoSearchStrings = {
    mpn: ['mpn', 'manufacturing part number'],
    quantity: ['q', 'quantity']
}

function BOMFileUploadInterface(props){
    const [file, setFile] = useState(null); 
    const [uploadedSheet, setUploadedSheet] = useState([]);
    const [autoFind, setAutoFind] = useState(true);
    const [autoOptionsModal, setAutoOptionsModal] = useState(false);
    const [activatedFindAttributes, setActivatedFindAttributes] = useState(props.headers.map((head) => {
        if(head.accessor in autoSearchStrings){
            head.active = true;
        }else{
            head.active = false;
        }
        return head;
    }));
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
        if(autoFind){
            const attributes = activatedFindAttributes.reduce((arr, attr) => {
                if(attr.active){
                    const searchArr = attr.accessor in autoSearchStrings ? autoSearchStrings[attr.accessor] : [];
                    arr.push({search:searchArr, header: {
                        Header: attr.Header, accessor: attr.accessor
                    }});
                }
                return arr;
            }, []);
            const autoFound = autoFindAttributes(passData, attributes);
            console.log(autoFound);
            if(autoFound.found){
                props.onBOMUpload(autoFound.bom, {found: true, headers: autoFound.headers});
            }else{
                props.onBOMUpload(passData);
            }
        }else{
            props.onBOMUpload(passData);
        }
        //props.onBOMUpload(passData, {autofind: autoFind}); //send straight to main bom
        //props.onBOMUpload(data, 1);
        
    }

    function handleConfirm(){
        props.onBOMUpload(uploadedSheet, {autofind: autoFind});
    }
    function handleCheckboxChange(){
        setAutoFind(!autoFind);
    }
    function handleShowAutoOptions(){
        setAutoOptionsModal(true);
    }
    function handleCloseOptions(){
        setAutoOptionsModal(false);
    }
    function handleCheckChange(i){
        setActivatedFindAttributes(update(activatedFindAttributes, {
            [i]: {active: 
                {$set: !activatedFindAttributes[i].active}
            }
        }));
    }
    return (
        <div>
            <MyDropzone onDrop={handleDrop}></MyDropzone>
            {/*file &&
            <div>
                <span>{file.name}</span>
                <button onClick={handleConfirm}>Confirm</button>
            </div>*/
            }
            <div className='AutoColumnButtons'>
                <HoverOverlay tooltip='Automatically selects MPN and quantity columns from BOM'
                placement='bottom'>
                <NamedCheckBox label='Auto Columns' 
                onChange={handleCheckboxChange} checked={autoFind} value='auto'/>
                </HoverOverlay>
                <Button onClick={handleShowAutoOptions}>Options (Beta)</Button>
            </div>
            <AutoColumnOptionModal show={autoOptionsModal} hideAction={handleCloseOptions} 
            attributes={activatedFindAttributes} onCheckChange={handleCheckChange}/>
        </div>
    );
}

export default BOMFileUploadInterface;