import {useState, useEffect, useRef} from 'react';
import { normalHeaders, UploadBOMInterface } from '../BOMComparison/components/UploadTable';
import { BOMCompViewer } from '../BOMComparison/components/Viewer';
import { Button, Table } from 'react-bootstrap';

import {SimplePopover, HoverOverlay} from '../components/Tooltips';



const tableHeaders = [
    {label: 'MPN', accessor: 'mpn'},
    {label: 'MFR', accessor: 'mfr'},
    ...normalHeaders
];

function BOMComparison(props){
    const [bom1, setBom1] = useState({upload: [], normal: [], filename: null});
    const [bom2, setBom2] = useState({upload: [], normal: [], filename: null});
    const uploadFor = useRef(1); //
    const [pageState, setPageState] = useState(0);
    useEffect(() => {
    }, []);
    function handleChangePageState(i){
        setPageState(i);
    }
    function handleUpload(obj, fileName){

        const uploadBom = obj.map((line) => {
            //check quantity and designator match
            line.quanitity_designator_match = parseInt(line.quantity) === line.designator.split(',').length;

            return line;
        });


        console.log(fileName);
        handleChangePageState(0);
        const normalBom = lineSeperateBom(uploadBom);
        if(uploadFor.current === 1){
            setBom1({upload: uploadBom, normal: normalBom, filename: fileName});
        }else if(uploadFor.current === 2){
            setBom2({upload: uploadBom, normal: normalBom, filename: fileName});
        }
    }
    function lineSeperateBom(bom){
        const newBOM = [];

        bom.forEach((line) => {
            line.mpn.forEach((mpn, i) => {
                let obj = {...line};
                delete obj.mpn;
                delete obj.mfr;
                obj.mpn = mpn;
                if(i < line.mfr.length){
                    obj.mfr = line.mfr[i];
                }else{
                    obj.mfr = undefined;
                }
                newBOM.push(obj);
            });
        });
        return newBOM;
    }
    function handleUploadBOM1Interface(){
        uploadFor.current = 1;
        handleChangePageState(1);
    }
    function handleUploadBOM2Interface(){
        uploadFor.current = 2;
        handleChangePageState(1);
    }
    function render(){
        switch(pageState){
            case 0:
                return <BOMCompMain uploadBOM1={handleUploadBOM1Interface} 
                uploadBOM2={handleUploadBOM2Interface} bom1={bom1} bom2={bom2} 
                onChangePageState={handleChangePageState} headers={tableHeaders}/>
            case 1:
                return <>
                    <Button onClick={() => handleChangePageState(0)}>Back</Button>
                    <UploadBOMInterface onSubmit={handleUpload}/>
                </>
            case 2:
                return <BOMCompViewer data={bom1} headers={tableHeaders} onChangePageState={handleChangePageState}/>
            case 3:
                return <BOMCompViewer data={bom2} headers={tableHeaders} onChangePageState={handleChangePageState}/>
        }
    }
    return(
        <>
        {render()}
        </>
    );
}

function BOMCompMain(props){
    const [compOutput, setCompOutput] = useState(null)
    function viewBom1(){
        if(props.onChangePageState) props.onChangePageState(2);
    }
    function viewBom2(){
        if(props.onChangePageState) props.onChangePageState(3);
    }
    function compBom(){
        //console.log(tableHeaders);
        const bom1 = props.bom1;
        const bom2 = props.bom2;
        const bom1Map = {}; // maps line with mpn key
        const bom1Mpns = new Set();
        bom1.normal.forEach(line => {
            bom1Map[line.mpn] = line;
            bom1Mpns.add(line.mpn);
        });
        const foundMpns = new Set(); // mpns from bom1 found in bom2
        const missingBom2 = []; // lines missing from bom2
        const bomDifferences = {};
        bom2.normal.forEach((line, i) => {
            if(!(line.mpn in bom1Map)){
                missingBom2.push(line);
            }else{
                //compare lines
                foundMpns.add(line.mpn);
                const l = bom1Map[line.mpn];
                const differences = {};
                tableHeaders.forEach(header => {
                    if(l[header.accessor] !== line[header.accessor]){
                        //console.log(l[header.accessor]);
                        //console.log(line[header.accessor]);
                        differences[header.accessor] = {bom1: l[header.accessor], bom2: line[header.accessor]};
                    }
                });
                if(Object.keys(differences).length !== 0){
                    bomDifferences[line.mpn] = {
                        differences: differences,
                        line1: l,
                        line2: line
                    };
                }
            }
        });
        //console.log(missingBom2);
        const missingBom1Mpns = new Set([...bom1Mpns].filter(x => !foundMpns.has(x)));
        const missingBom1 = [...missingBom1Mpns].map((mpn) => bom1Map[mpn]);
        //console.log(missingBom1);
        const out = {
            diffLines: bomDifferences,
            missingFromBom1: missingBom1,
            missingFromBom2: missingBom2
        };
        setCompOutput(out);
        //create comp output

        return out;
    }
    return(
        <>
        <div className='FlexNormal Hori'>
        <div>
            <h4>BOM 1</h4>
            {props.bom1.filename && <div>{props.bom1.filename}</div>}
            <Button onClick={props.uploadBOM1}>Upload</Button>
            <Button disabled={props.bom1.upload.length <= 0} onClick={viewBom1}>View</Button>
        </div>
        <div>
            <h4>BOM 2</h4>
            {props.bom2.filename && <div>{props.bom2.filename}</div>}
            <Button onClick={props.uploadBOM2}>Upload</Button>
            <Button disabled={props.bom2.upload.length <= 0} onClick={viewBom2}>View</Button>
        </div>
        </div>
        <div>
            <Button disabled={props.bom1.upload.length <= 0 && props.bom2.upload.length <= 0}
             onClick={compBom}>Compare</Button>

             <ComparisonTable headers={tableHeaders} comparison={compOutput}/>
        </div>
        </>
    );
}

function ComparisonTable(props){
    return(
        <Table>
            <thead className='TableHeading'>
                <tr>
                {props.headers.map((h, i) => 
                    <th key={i}>{h.label}</th>
                )}
                </tr>
            </thead>
            <tbody>
                {props.comparison && 
                <>
                {Object.entries(props.comparison.diffLines).map(([mpn, out], i) => {
                    //console.log(out);
                    return(
                        <tr key={i}>
                            {props.headers.map((header, j) => {
                                if(header.accessor in out.differences){
                                    return (
                                        <td key={j} style={{backgroundColor: '#9FBAF3'}}>
                                            <SimplePopover trigger={['hover', 'focus']} placement='auto' 
                                            popoverBody={out.line1[header.accessor]}>
                                                <div>{out.line2[header.accessor]}</div>
                                            </SimplePopover>
                                        </td>
                                    )
                                }
                                return (
                                    <td key={j}>{out.line1[header.accessor]}</td>
                                )
                            })}
                        </tr>
                    );
                })}
                {props.comparison.missingFromBom2.map((line, i) => {
                    return(
                    <tr key={i} style={{backgroundColor: '#9FF3BA'}}>
                        {props.headers.map((header, j) => {
                            return (
                                <td key={j}>{line[header.accessor]}</td>
                            )
                        })}
                    </tr>
                    )
                })}
                {props.comparison.missingFromBom1.map((line, i) => {
                    return(
                    <tr key={i} style={{backgroundColor: '#F3AFAA'}}>
                        {props.headers.map((header, j) => {
                            return (
                                <td key={j}>{line[header.accessor]}</td>
                            )
                        })}
                    </tr>
                    )
                })}
                </>
                }
            </tbody>
        </Table>
    )
}

export default BOMComparison;