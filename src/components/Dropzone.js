import React, {useCallback} from 'react';

import {useDropzone} from 'react-dropzone';
import XLSX from 'xlsx';
//import XLSX from 'xlsx-style';

import { BsFileEarmarkArrowDown } from "react-icons/bs";

import './../css/dropzone.css';

export function ExcelDropzone(props) {
  const dropFunction = props.onDrop;
  const onDrop = useCallback((acceptedFiles) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader();

      reader.onabort = () => console.log('file reading was aborted');
      reader.onerror = () => console.log('file reading has failed');
      reader.onload = () => {
      // Do whatever you want with the file contents
        const binaryStr = reader.result;
        const workbook = XLSX.read(binaryStr, {type:'binary', cellStyles:true, cellFormula:true});
        if(dropFunction) dropFunction(workbook, file);
      }
      reader.readAsBinaryString(file);
    });
    
  }, [dropFunction])
  const {getRootProps, getInputProps} = useDropzone({onDrop});

  return (
    <div {...getRootProps()} className={props.class}>
      <input {...getInputProps()} />
      {props.children}
    </div>
  );
}
