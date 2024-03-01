import React, {useCallback, useState} from 'react';
//import { ExcelDropzone } from "../../components/Dropzone"
import {DropEvent, FileRejection, useDropzone} from 'react-dropzone';
import XLSX from 'xlsx';
import { excelSheetToArray } from '../../scripts/ExcelHelpers';

export type ExcelSheet = {
  name:string, array: string[][]
}

type UploadExcelInterfaceProps = {
  onDrop: (sheets: ExcelSheet[], file_name?: string) => void;
}

export function UploadExcelInterface(props:UploadExcelInterfaceProps){
    function handleFileDrop(workbook: XLSX.WorkBook, file_name: string){
        const sheet_names = workbook.SheetNames;
        const sheets = sheet_names.map((sheet_name:string) => {
            const sheet_array = excelSheetToArray(workbook.Sheets[sheet_name]);
            return {name: sheet_name, array: sheet_array};
        });
        console.log(sheets); // to remove
        props.onDrop(sheets, file_name);
    }
    
    return (
      <>
        <ExcelDropzone class='DropFilesSmall' onDrop={handleFileDrop}>
          <p>Upload</p>
        </ExcelDropzone>
      </>
    );
}

type ExcelDropzoneProps= {
    onDrop: (workbook: XLSX.WorkBook, file_name: string) => void;
    onError?: () => void;
    class: string;
    children: JSX.Element;
};

//test this
export function ExcelDropzone(props:ExcelDropzoneProps) {
  function handleDrop(f:File, binary_str: string | ArrayBuffer | null){
    //if(f.type)
    //console.log(f.type);
    const workbook = XLSX.read(binary_str, {type:'binary', cellStyles:true, cellFormula:true});
    //console.log(workbook);
    props.onDrop(workbook, f.name);
  }

  return (
    <FileDropzone onDrop={handleDrop} class={props.class} children={props.children}/>
  );
}

type FileDropzoneProps = {
  onDrop: ((file: File, binary_str: string | ArrayBuffer | null) => void);
  class: string;
  children: React.ReactNode;
};

  export function FileDropzone(props:FileDropzoneProps) {
    //const dropFunction = props.onDrop;
    const handleDrop = useCallback(<T extends File>(accepted_files: T[], file_rejections: FileRejection[], event: DropEvent) => {
      accepted_files.forEach((file:File) => {
        const reader = new FileReader();
  
        reader.onabort = () => console.log('file reading was aborted');
        reader.onerror = () => console.log('file reading has failed');
        reader.onload = () => {
          const binary_str = reader.result;
          props.onDrop(file, binary_str);
        }
        reader.readAsBinaryString(file);
      });
      
    }, [props.onDrop])
    const {getRootProps, getInputProps} = useDropzone({onDrop: handleDrop});
  
    return (
      <div {...getRootProps()} className={props.class}>
        <input {...getInputProps()} />
        {props.children}
      </div>
    );
  }