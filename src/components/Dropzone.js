import React, {useCallback} from 'react';
import {useDropzone} from 'react-dropzone';
import XLSX from 'xlsx';

export function MyDropzone(props) {
  const dropFunction = props.onDrop;
  const onDrop = useCallback((acceptedFiles) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader();

      reader.onabort = () => console.log('file reading was aborted');
      reader.onerror = () => console.log('file reading has failed');
      reader.onload = () => {
      // Do whatever you want with the file contents
        const binaryStr = reader.result;
        const workbook = XLSX.read(binaryStr, {type:'binary'});
        dropFunction(workbook, file);
      }
      console.log(file);
      reader.readAsBinaryString(file);
    })
    
  }, [dropFunction])
  const {getRootProps, getInputProps} = useDropzone({onDrop});

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      <p>Drag 'n' drop some files here, or click to select files</p>
    </div>
  );
}
