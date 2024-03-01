import {useState, useEffect} from 'react';
import update from 'immutability-helper';
import {BOMMainFormat, UploadBOMInterfaceNew} from './BOMUpload';
import { ExcelSheet } from './Upload';
import { ComparisonMainInterface } from './ComparisonMainInterface';
//import { TableHeader } from './Tables';


type TestBOMState = {
    sheets: ExcelSheet[];
    //headers: TableHeader[];
}

const test_headers = [
    {accessor: 'Ho', label: 'HI'}
]

export function TestBOMComparisonPage(){
    //headers: test_headers
    const [state, setState] = useState<TestBOMState>({sheets: []});
    function handleSelect(){
        console.log('select');
    }
    function a(){

    }
    return (
        <div>
            <ComparisonMainInterface/>
            {/*<DisplayTable headers={state.headers}/>*/}
        </div>
    )
}



export default TestBOMComparisonPage;