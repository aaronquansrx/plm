import {useState, useEffect, useRef} from 'react';
import { normalHeaders, UploadBOMInterface } from '../BOMComparison/components/UploadTable';
import { BOMCompViewer } from '../BOMComparison/components/Viewer';
import { Button, Table } from 'react-bootstrap';

import {SimplePopover, HoverOverlay} from '../components/Tooltips';
import { setIntersection, setSubtraction } from '../scripts/Set';



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
            if('designator' in line && 'quantity' in line){
                line.quanitity_designator_match = parseInt(line.quantity) === line.designator.split(',').length;
            }
            return line;
        });


        //console.log(fileName);
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
    const [compOutput, setCompOutput] = useState(null);
    const [bomView, setBomView] = useState(0); // 0 side-side comp, 1 compview
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
        const bom2Map = {};
        const bom2Mpns = new Set();
        const foundMpns = new Set(); // mpns from bom1 found in bom2
        const missingBom2 = []; // lines missing from bom2
        const bomDifferences = {};
        bom2.normal.forEach((line, i) => {
            bom2Map[line.mpn] = line;
            bom2Mpns.add(line.mpn);
            
            if(!(line.mpn in bom1Map)){
                missingBom2.push(line);
            }else{
                //compare lines
                foundMpns.add(line.mpn);
                const l = bom1Map[line.mpn];
                const differences = {};
                tableHeaders.forEach(header => {
                    if(header.accessor === 'designator'){
                        const d1 = l['designator'].split(',').map(str => str.trim());
                        const des1Set = new Set(d1);
                        const d2 = line['designator'].split(',').map(str => str.trim());
                        const des2Set = new Set(d2);
                        const additions = setSubtraction(des2Set, des1Set);
                        const subtractions = setSubtraction(des1Set, des2Set);
                        //console.log(additions);
                        if(additions.size > 0 || subtractions.size > 0){
                            differences[header.accessor] = {
                                bom1: l[header.accessor], bom2: line[header.accessor], 
                                additions: additions, subtractions: subtractions};
                            }
                    }
                    else if(l[header.accessor] !== line[header.accessor]){
                        differences[header.accessor] = {bom1: l[header.accessor], bom2: line[header.accessor]};
                    }
                });
                if(Object.keys(differences).length !== 0){
                    bomDifferences[line.mpn] = {
                        id: i,
                        differences: differences,
                        line1: l,
                        line2: line
                    };
                }
            }
        });
        const missingBom1Mpns = new Set([...bom1Mpns].filter(x => !foundMpns.has(x)));
        const missingBom1 = [...missingBom1Mpns].map((mpn) => bom1Map[mpn]);
        const intersectingMpns = setIntersection(bom1Mpns, bom2Mpns);
        const combinedBoms = [...intersectingMpns].reduce((arr, mpn) => {
            arr.push({bom1: bom1Map[mpn], bom2: bom2Map[mpn]})
            return arr;
        }, []);
        const out = {
            diffLines: bomDifferences,
            missingFromBom1: missingBom1,
            missingFromBom2: missingBom2,
            combinedBom: combinedBoms
        };
        setCompOutput(out);
        //create comp output

        return out;
    }
    function handleChangeView(){
        const newBomView = bomView === 1 ? 0 : bomView+1;
        setBomView(newBomView);
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
        <div className='FlexNormal'>
            <Button disabled={props.bom1.upload.length <= 0 && props.bom2.upload.length <= 0}
             onClick={compBom}>Compare</Button>
            <Button onClick={handleChangeView}>{bomView === 0 && 'Side by Side View'}{bomView === 1 && 'Comparisons View'}</Button>
        </div>
        <div className='FlexNormal Overflow'>
            {bomView === 0 && <SideBySideComparisonTable headers={tableHeaders} comparison={compOutput}/>}
            {bomView === 1 && <ComparisonTable headers={tableHeaders} comparison={compOutput}/>}
        </div>
        </>
    );
}
function SideBySideComparisonTable(props){
    console.log(props.comparison);
    return(
        <Table>
            <thead className='TableHeading'>
                <tr>
                    <th colSpan={props.headers.length+1}>BOM 1</th>
                    <th colSpan={props.headers.length+1}>BOM 2</th>
                </tr>
                <tr>
                    {props.headers.map((h, i) => {
                        if(h.label === 'Designator'){
                            return <th key={i} colSpan={2}>{h.label}</th>
                            //return <th key={i}>{h.label}</th>
                        }
                        return <th key={i}>{h.label}</th>
                    }
                    )}
                    {props.headers.map((h, i) => {
                        if(h.label === 'Designator'){
                            return <th key={i} colSpan={2}>{h.label}</th>
                            //return <th key={i}>{h.label}</th>
                        }
                        return <th key={i}>{h.label}</th>
                    }
                    )}
                </tr>
            </thead>
            <tbody>
                {props.comparison && props.comparison.combinedBom.map((line, i) => {
                    const bom1Line = line.bom1;
                    const bom2Line = line.bom2;
                    const hasDiff = bom1Line.mpn in props.comparison.diffLines;
                    return <tr key={i}>
                        {props.headers.map((h, j) => {
                            let style = {};
                            if(hasDiff){
                                const diffs = props.comparison.diffLines[bom1Line.mpn].differences;
                                if(h.accessor in diffs){
                                    style = {backgroundColor: '#9FBAF3'};
                                }
                            }
                            if(h.label === 'Designator'){
                                if(hasDiff && h.accessor in props.comparison.diffLines[bom2Line.mpn].differences){
                                    const diffs = props.comparison.diffLines[bom2Line.mpn].differences;
                                    
                                    const addString = [...diffs[h.accessor].additions].join(', ');
                                    const subString = [...diffs[h.accessor].subtractions].join(', ');
                                    const body = <div>
                                            {diffs[h.accessor].additions.size > 0 && <span style={{color: '#9FF3BA'}}>Additions: {addString}</span>}
                                            {diffs[h.accessor].subtractions.size > 0 && <span style={{color: '#F3AFAA'}}>Subtractions: {subString}</span>}
                                    </div>
                                    return <>
                                        <td key={'d1'+j} colSpan={1} style={style}>{bom1Line[h.accessor]}</td>
                                        <td key={'d2'+j} colSpan={1} style={style}>{body}</td>
                                    </>
                                }
                                return <td key={j} colSpan={2} style={style}>{bom1Line[h.accessor]}</td>
                            }
                            return <td key={j} colSpan={1} style={style}>{bom1Line[h.accessor]}</td>
                        })}
                        {props.headers.map((h, j) => {
                            let style = {};
                            if(hasDiff){
                                const diffs = props.comparison.diffLines[bom2Line.mpn].differences;
                                if(h.accessor in diffs){
                                    style = {backgroundColor: '#9FBAF3'};
                                }
                            }
                            if(h.label === 'Designator'){
                                if(hasDiff  && h.accessor in props.comparison.diffLines[bom2Line.mpn].differences){
                                    const diffs = props.comparison.diffLines[bom2Line.mpn].differences;
                                    const addString = [...diffs[h.accessor].additions].join(', ');
                                    const subString = [...diffs[h.accessor].subtractions].join(', ');
                                    const body = <div>
                                            {diffs[h.accessor].additions.size > 0 && <span style={{color: '#9FF3BA'}}>Additions: {addString}</span>}
                                            {diffs[h.accessor].subtractions.size > 0 && <span style={{color: '#F3AFAA'}}>Subtractions: {subString}</span>}
                                    </div>
                                    return <>
                                    <td key={'d1'+j+props.headers.length} colSpan={1} style={style}>{bom2Line[h.accessor]}</td>
                                    <td key={'d2'+j+props.headers.length} colSpan={1} style={style}>{body}</td>
                                    </>
                                }

                                return <td key={j} colSpan={2} style={style}>{bom1Line[h.accessor]}</td>
                            }
                            return <td key={j+props.headers.length} colSpan={1} style={style}>{bom2Line[h.accessor]}</td>
                        })}
                    </tr>
                })}
            </tbody>
        </Table>
    )
}

function ComparisonTable(props){
    //console.log(props.comparison);
    return(
        <Table>
            <thead className='TableHeading'>
                <tr>
                {props.headers.map((h, i) => {
                        if(h.label === 'Designator'){
                            return <th key={i} colSpan={2}>{h.label}</th>
                        }
                        return <th key={i}>{h.label}</th>
                    }
                )}
                </tr>
            </thead>
            <tbody>
                {props.comparison && 
                <>
                {Object.entries(props.comparison.diffLines).map(([mpn, out], i) => {
                    return(
                    <tr key={i}>
                        {props.headers.map((header, j) => {

                            if(header.accessor in out.differences){
                                if(header.accessor === 'designator'){
                                    //console.log(out.differences);
                                    const addString = [...out.differences[header.accessor].additions].join(', ');
                                    const subString = [...out.differences[header.accessor].subtractions].join(', ');
                                    const body = <div>
                                        {out.differences[header.accessor].additions.size > 0 && <span style={{color: '#9FF3BA'}}>Additions: {addString}</span>}
                                        {out.differences[header.accessor].subtractions.size > 0 && <span style={{color: '#F3AFAA'}}>Subtractions: {subString}</span>}
                                    </div>

                                    return (
                                        <>
                                        <td style={{backgroundColor: '#9FBAF3'}}>
                                            <SimplePopover trigger={['hover', 'focus']} popoverBody={body} placement='auto'>
                                                <div>{out.line1[header.accessor]}</div>
                                            </SimplePopover>
                                        </td>
                                        <td style={{backgroundColor: '#9FBAF3'}}>
                                            <SimplePopover trigger={['hover', 'focus']} popoverBody={body} placement='auto'>
                                                <div>{out.line2[header.accessor]}</div>
                                            </SimplePopover>
                                        </td>
                                        </>
                                    );
                                }
                                return (
                                    <td key={j} style={{backgroundColor: '#9FBAF3'}}>
                                        <SimplePopover trigger={['hover', 'focus']} placement='auto' 
                                        popoverBody={out.line1[header.accessor]}>
                                            <div>{out.line2[header.accessor]}</div>
                                        </SimplePopover>
                                    </td>
                                )
                            }
                            if(header.accessor === 'designator'){
                                return (<>
                                    <td>{out.line1[header.accessor]}</td>
                                    <td>{out.line2[header.accessor]}</td>
                                    </>
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