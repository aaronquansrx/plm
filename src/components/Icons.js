
import { 
    BsFileEarmarkArrowDown, 
    BsFileEarmarkArrowDownFill, 
    BsFileEarmarkDiff,
    BsFileEarmarkDiffFill,
    BsFileSpreadsheet,
    BsFileSpreadsheetFill,

    BsFileEarmarkExcel

} from "react-icons/bs";

import { MdRefresh } from "react-icons/md";

import './../css/icon.css';

export function UploadIcon(props){
    const size = props.size;
    const icon = props.selected ? 
    <BsFileEarmarkArrowDownFill size={size}/> : 
    <BsFileEarmarkArrowDown size={size}/>;
    return (
        <div className='Icon' onClick={props.onClick}>
        <span>{icon}</span>
        <span>Upload</span>
        </div>
    );
}

export function EditIcon(props){
    const size = props.size;
    const icon = props.selected ? 
    <BsFileEarmarkDiffFill size={size}/> : 
    <BsFileEarmarkDiff size={size}/>;
    return (
        <div className='Icon' onClick={props.onClick}>
        <span>{icon}</span>
        <span>Edit</span>
        </div>
    );
}

export function SheetIcon(props){
    const size = props.size;
    const icon = props.selected ? 
    <BsFileSpreadsheetFill size={size}/> : 
    <BsFileSpreadsheet size={size}/>;
    return (
        <div className='Icon' onClick={props.onClick}>
        <span>{icon}</span>
        <span>BOMTool</span>
        </div>
    );
}

export function RefreshIcon(props){
    const size = props.size;
    return (
        <div className='Icon' onClick={props.onClick}>
        <span><MdRefresh size={size}/></span>
        </div>
    );
}

export function ExportExcelIcon(props){
    const size = props.size;
    return (
        <div className='Icon' onClick={props.onClick}>
        <span><BsFileEarmarkExcel size={size}/></span>
        <span>Export</span>
        </div>
    );
}