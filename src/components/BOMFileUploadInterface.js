import React, {useState} from 'react';

import update from 'immutability-helper';
import XLSX from 'xlsx';

import {MyDropzone} from './Dropzone';
import {ExcelDisplayTable, CheckLinesExcelTable, CheckboxRowCustomColumnTable} from './Tables';

const columnOptions = ["_remove", "Custom", "Manufacturer Part Number", "Manufacturer", "Quantity"];

function BOMFileUploadInterface(props){
    const [file, setFile] = useState(null); 
    const [workbook, setWorkbook] = useState(null);
    const [uploadedSheet, setUploadedSheet] = useState([]);
    const [editedSheet, setEditedSheet] = useState([]);
    const [formattedSheet, setFormattedSheet] = useState([]); // Will be sent to BOMInterface (easier to manipulate columns)
    const [uploadState, setUploadState] = useState(0); // 0: upload file, 1: editing, 2: confirmation




    const [editTableState, setEditTableState] = useState({checkedRows: [], columnAttributes: []});

    //const [line]
    //const [checkedLines, setCheckedLines] = useState(null); //Array of lines that will be included in the finished BOM

    function handleDrop(workbook, file){
        console.log(workbook);
        setFile(file);
        //Get first worksheet
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        //Convert worksheet to array of arrays
        const data = XLSX.utils.sheet_to_json(ws, {header:1});
        setUploadedSheet(data);
        setEditedSheet(data);

        const columnAttrs = data.length > 0 ? Array(data[0].length).fill(columnOptions[0]) : [];
        setEditTableState({
            checkedRows: Array(data.length).fill(false),
            columnAttributes: columnAttrs
        });
        //setUploadState(1);
        //setCheckedLines([...Array(data.length)].map(() => true));
        //console.log([...Array(data.length)].map(() => true));
    }
    function handleEditCheckBox(i){
        setEditTableState(update(editTableState, {
            checkedRows: {[i]: 
                {$set: !editTableState['checkedRows'][i]}
            }
        }));
    }
    function handleEditAttributeChange(i, value){
        setEditTableState(update(editTableState, {
            columnAttributes: {[i]: 
                {$set: value}
            }
        }));
    }
    function handleConfirm(){
        switch(uploadState){
            case 0:
                break;
            case 1: // editBOM based on the editTableState
                console.log(editTableState);
                const editedRowsBOM = [];
                for(var i=0; i<uploadedSheet.length; i++){
                    if(!editTableState['checkedRows'][i]) editedRowsBOM.push(uploadedSheet[i]);
                }
                const editedBOM = [];
                editedRowsBOM.forEach((line) => {
                    const BOMLine = {"_unnamed": []};
                    console.log(line);
                    for(var i=0; i<line.length; i++){
                        const attribute = editTableState['columnAttributes'][i];
                        if(attribute != columnOptions[0]){
                            BOMLine[attribute] = line[i];
                        }else{
                            BOMLine["_unnamed"].push(line[i]);
                        }
                    }
                    editedBOM.push(BOMLine);

                    //display order
                    //list of obj (bom data)
                });
                editedRowsBOM.unshift(editTableState['columnAttributes']);
                //todo map column field to index
                setEditedSheet(editedRowsBOM);
                setFormattedSheet(editedBOM);
                console.log(editedBOM);
                break;
            case 2:
                props.onBOMUpload(formattedSheet,  editTableState['columnAttributes']);
                break;
            default:
                console.log("Unknown BOMUpload state");
                break;
        }
        setUploadState(uploadState+1);
    }
    function renderInterfaceState(){
        switch(uploadState){
            case 0:
                return <div>
                    <MyDropzone onDrop={handleDrop}></MyDropzone>
                    {file && <span>{file.name}</span>}
                </div>;
            case 1:
                return <div>
                Remove Selected Lines
                <LineColumnSelectExcelTable sheet={uploadedSheet} 
                checkedRows={editTableState["checkedRows"]} onCheckBox={handleEditCheckBox} 
                columnAttributes={editTableState["columnAttributes"]} onAttributeChange={handleEditAttributeChange}/>
                </div>;
            case 2:
                return <ExcelDisplayTable sheet={editedSheet}></ExcelDisplayTable>;
            default:
                return "Unknown interface state";
        }
    }
    function handleBack(){
        setUploadState(uploadState-1);
    }

    return (
        <>
        {renderInterfaceState()}
        {/*}
        {uploadState === 0 && 
        <div>
        <MyDropzone onDrop={handleDrop}></MyDropzone>
        {file && <span>{file.name}</span>}
        </div>
        }
        {uploadState === 1 &&
        <div>
        Remove Selected Lines
        <LineColumnSelectExcelTable sheet={uploadedSheet} 
        checkedRows={editTableState["checkedRows"]} onCheckBox={handleEditCheckBox} 
        columnAttributes={editTableState["columnAttributes"]} onAttributeChange={handleEditAttributeChange}/>
        </div>
        }
        {
        uploadState === 2 &&
        <>
        <ExcelDisplayTable sheet={editedSheet}></ExcelDisplayTable>

        </>
        */}
        {uploadState !== 0 && <button onClick={handleBack}>Back</button>}
        <button onClick={handleConfirm}>Confirm</button>
        
        </>
    );
}

function LineColumnSelectExcelTable(props){
    /*
    const [checkedRows, setCheckedRows] = useState(Array(props.sheet.length).fill(false));
    const colAttrs = props.sheet.length > 0 ? Array(props.sheet[0].length).fill("") : [];
    const [columnAttributes, setColumnAttributes] = useState(colAttrs);
    */
    /*
    function handleCheckBox(i){
        setCheckedRows(update(checkedRows, {[i]: {$set: !checkedRows[i]}}));
    }
    function handleAttributeChange(i, value){
        setColumnAttributes(update(columnAttributes, {[i]: {$set: value}}));
    }
    function handleConfirmLines(){
        console.log(checkedRows);
        console.log(columnAttributes);
    }
    */
    return(
        <>
        <CheckboxRowCustomColumnTable sheet={props.sheet} 
        checkedRows={props.checkedRows} onCheckBox={props.onCheckBox}
        columnAttributes={props.columnAttributes} columnOptions={columnOptions}
        onColumnChange={props.onAttributeChange}/>
        {/* <button onClick={handleConfirmLines}>Confirm</button> */}
        </>
    );
}

export default BOMFileUploadInterface;