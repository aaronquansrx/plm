import {useState, useEffect, useRef} from 'react';
import { normalHeaders, UploadBOMInterface } from '../BOMComparison/components/UploadTable';
import { BOMCompViewer } from '../BOMComparison/components/Viewer';
import { Button, Table } from 'react-bootstrap';

import {SimplePopover, HoverOverlay} from '../components/Tooltips';
import { setIntersection, setSubtraction } from '../scripts/Set';

import {getPLMRequest, postPLMRequest} from '../scripts/APICall';
import {MoveXBOMFinder} from '../components/MoveXBoms';


const tableHeaders = [
    {label: 'MPN', accessor: 'mpn'},
    {label: 'MFR', accessor: 'mfr'},
    ...normalHeaders
];


function getKey(line, hasIPN){
    if(!hasIPN){
        return line.mpn+'||'+line.mfr;
    }
    return line.mpn+'||'+line.ipn;
}
//console.log(tableHeaders);

function BOMComparison(props){
    const [bom1, setBom1] = useState({upload: [], normal: [], filename: null, headers: []});
    const [bom2, setBom2] = useState({upload: [], normal: [], filename: null, headers: []});
    const uploadFor = useRef(1); //
    const [pageState, setPageState] = useState(0);
    useEffect(() => {
    }, []);
    function handleChangePageState(i){
        setPageState(i);
    }
    function handleUpload(obj, fileName, activeHeaders){

        const uploadBom = obj.map((line) => {
            //check quantity and designator match
            if('designator' in line && 'quantity' in line){
                line.quanitity_designator_match = parseInt(line.quantity) === line.designator.split(',').length;
            }
            return line;
        });

        handleChangePageState(0);
        const normalBom = lineSeperateBom(uploadBom);
        if(uploadFor.current === 1){
            setBom1({upload: uploadBom, normal: normalBom, filename: fileName, headers: activeHeaders});
        }else if(uploadFor.current === 2){
            setBom2({upload: uploadBom, normal: normalBom, filename: fileName, headers: activeHeaders});
        }
    }
    function lineSeperateBom(bom){
        //use IPN as a key
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
    function ipnKeyFormat(bom){
        const ipnMap = {}; // has mpn map inside
        for(const line of bom){
            const ipn = line.ipn;
            const mpn = line.mpn;
            const mfr = line.mfr;
            const des = line.designator;
            //const 
            const quantity = line.quantity;
            const newObj = {
                ipn: ipn,
                mpn: new Set(mpn),
                mfr: new Set(mfr),
                designator: new Set(des),
                quantity: new Set(parseInt(quantity))
            }
            if(ipn in ipnMap){
                if(mpn in ipnMap[ipn]){

                }else{
                    //new mpn
                }
            }else{
                ipnMap[ipn] = {mpn: [newObj]};
                //new mpn
            }
        }

    }
    function handleUploadBOM1Interface(){
        uploadFor.current = 1;
        handleChangePageState(1);
    }
    function handleUploadBOM2Interface(){
        uploadFor.current = 2;
        handleChangePageState(1);
    }
    function handleChooseBOM1Interface(){
        uploadFor.current = 1;
        handleChangePageState(4);
    }
    function handleChooseBOM2Interface(){
        uploadFor.current = 2;
        handleChangePageState(4);
    }
    function setUploadFor(bomNum){
        uploadFor.current = bomNum;
    }
    function formatNormalToUploadBOM(bom){
        const ipnMap = {};
        /* const translateData = [
            getTranslate('Manufacturer Part Number', 'mpn'),
            getTranslate('TEXT', 'mfr'),
            getTranslate('Component number', 'ipn'),
            getTranslate('Circuit Reference', 'designator'),
            getTranslate('Quantity', 'quantity'),
        ];*/
        const normalBom = [];
        for(const line of bom){
            const ipn = line.ipn;
            const mpn = line.mpn;
            const mfr = line.mfr;
            const des = line.designator;
            const quantity = line.quantity;
            const newObj = {
                ipn: ipn,
                mpn: new Set(mpn),
                mfr: new Set(mfr),
                designator: new Set(des),
                quantity: new Set(parseInt(quantity))
            }
            normalBom.push(newObj);
        }
        return normalBom;
    }
    function handleChooseBOM(bomData, bomName){
        console.log(bomData);
        //todo for upload view and headers
        //group mpn and mfr into array for matching 
        
        if(uploadFor.current === 1){
            setBom1({upload: [], normal: bomData, filename: bomName, headers: []});
        }else if(uploadFor.current === 2){
            setBom2({upload: [], normal: bomData, filename: bomName,  headers: [/*todo*/]});
        }
        handleChangePageState(0);
    }
    function render(){
        switch(pageState){
            case 0:
                return <BOMCompMain uploadBOM1={handleUploadBOM1Interface} 
                uploadBOM2={handleUploadBOM2Interface} bom1={bom1} bom2={bom2} 
                findBOM1={handleChooseBOM1Interface} findBOM2={handleChooseBOM2Interface}
                onChangePageState={handleChangePageState} headers={tableHeaders} setUploadFor={setUploadFor}/>
            case 1:
                return <>
                    <Button onClick={() => handleChangePageState(0)}>Back</Button>
                    <UploadBOMInterface onSubmit={handleUpload}/>
                </>
            case 2:
                return <BOMCompViewer data={bom1} headers={tableHeaders} onChangePageState={handleChangePageState}/>
            case 3:
                return <BOMCompViewer data={bom2} headers={tableHeaders} onChangePageState={handleChangePageState}/>

            case 4:
                return <>
                    <Button onClick={() => handleChangePageState(0)}>Back</Button>
                    <MoveXBOMFinder onChooseBOM={handleChooseBOM} />
                </>
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
        const bom1Map = {}; // maps line with mpn||ipn key
        const bom1Keys = new Set();
        const hasIPN = props.bom1.headers.includes('ipn') && props.bom2.headers.includes('ipn');
        bom1.normal.forEach(line => {
            const key = getKey(line, hasIPN);
            bom1Map[key] = line;
            bom1Keys.add(key);
        });
        const bom2Map = {};
        const bom2Keys = new Set();
        const foundKeys = new Set(); // mpns from bom1 found in bom2
        const missingBom2 = []; // lines missing from bom2
        const bomDifferences = {};
        bom2.normal.forEach((line, i) => {
            const key = getKey(line, hasIPN);
            bom2Map[key] = line;
            bom2Keys.add(key);
            
            if(!(key in bom1Map)){
                missingBom2.push(line);
            }else{
                //compare lines
                foundKeys.add(key);
                const l = bom1Map[key];
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
                                additions: additions, subtractions: subtractions
                            };
                        }
                    }
                    else{
                        if(l[header.accessor] && line[header.accessor]){
                            const lowerBOM1Field = l[header.accessor].toLowerCase();
                            const lowerBOM2Field = line[header.accessor].toLowerCase();
                            if(lowerBOM1Field !== lowerBOM2Field){
                                differences[header.accessor] = {bom1: l[header.accessor], bom2: line[header.accessor]};
                            }
                        }else if(l[header.accessor] !== line[header.accessor]){
                            differences[header.accessor] = {bom1: l[header.accessor], bom2: line[header.accessor]};
                        }
                    }
                });
                if(Object.keys(differences).length !== 0){
                    bomDifferences[key] = {
                        id: i,
                        differences: differences,
                        line1: l,
                        line2: line
                    };
                }
            }
        });
        const missingBom1Mpns = new Set([...bom1Keys].filter(x => !foundKeys.has(x)));
        const missingBom1 = [...missingBom1Mpns].map((mpn) => bom1Map[mpn]);
        const intersectingMpns = setIntersection(bom1Keys, bom2Keys);
        const combinedBoms = [...intersectingMpns].reduce((arr, mpn) => {
            arr.push({bom1: bom1Map[mpn], bom2: bom2Map[mpn]})
            return arr;
        }, []);
        const hasDifferences = Object.keys(bomDifferences).length + missingBom1.length + missingBom2.length > 0;
        const out = {
            diffLines: bomDifferences,
            missingFromBom1: missingBom1,
            missingFromBom2: missingBom2,
            combinedBom: combinedBoms,
            hasIPNKey: hasIPN,
            hasDifferences: hasDifferences,
            nDifferences: Object.keys(bomDifferences).length + missingBom1.length + missingBom2.length
        };
        
        setCompOutput(out);
        //create comp output

        return out;
    }
    function handleChangeView(){
        const newBomView = bomView === 1 ? 0 : bomView+1;
        setBomView(newBomView);
    }
    function handleGoToBomFinder(bomNum){
        return function(){
            props.setUploadFor(bomNum);
            props.onChangePageState(4);
        }
        //props.
    }
    function handleExcelExport(){
        //todo
    }
    function hasBOM(bom){
        return bom.normal.length > 0 || bom.upload.length > 0;
    }
    return(
        <>
        <div className='FlexNormal Hori'>
        <div>
            <h4>BOM Old</h4>
            {props.bom1.filename && <div>{props.bom1.filename}</div>}
            <Button onClick={props.uploadBOM1}>Upload</Button>
            <Button onClick={handleGoToBomFinder(1)}>Find BOM</Button>
            <Button disabled={!hasBOM(props.bom1)} onClick={viewBom1}>View</Button>
        </div>
        <div>
            <h4>BOM New</h4>
            {props.bom2.filename && <div>{props.bom2.filename}</div>}
            <Button onClick={props.uploadBOM2}>Upload</Button>
            <Button onClick={handleGoToBomFinder(2)}>Find BOM</Button>
            <Button disabled={!hasBOM(props.bom2)} onClick={viewBom2}>View</Button>
        </div>
        </div>
        <div className='FlexNormal'>
            <Button disabled={!hasBOM(props.bom1) && !hasBOM(props.bom2)}
             onClick={compBom}>Compare</Button>
            <Button onClick={handleChangeView}>{bomView === 0 && 'Side by Side View'}{bomView === 1 && 'Comparisons View'}</Button>
            <Button onClick={handleExcelExport}>Export Comparison</Button>
            <CompAnalysis comparison={compOutput}/>
        </div>
        <div className='FlexNormal Overflow'>
            {bomView === 0 && <SideBySideComparison2Table headers={tableHeaders} comparison={compOutput}/>}
            {bomView === 1 && <ComparisonTable headers={tableHeaders} comparison={compOutput}/>}
        </div>
        </>
    );
}

function CompAnalysis(props){
    return (
        <>
        {props.comparison &&

            props.comparison.hasDifferences ? 
            props.comparison.nDifferences + ' Unmatched lines' : '100% Matched'
            
        }
        </>
    );
}

const diffColour = '#d5eef2';
const addColour = '#1d4a1a';
const subColour = '#4a1b1a';
function SideBySideComparisonTable(props){
    return(
        <Table>
            <thead className='TableHeading'>
                <tr>
                    <th colSpan={props.headers.length+1}>BOM Old</th>
                    <th colSpan={props.headers.length+1}>BOM New</th>
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
                    const key = getKey(bom1Line, props.comparison.hasIPNKey);
                    const hasDiff = key in props.comparison.diffLines;
                    return <tr key={i}>
                        {props.headers.map((h, j) => {
                            let style = {};
                            if(hasDiff){
                                const diffs = props.comparison.diffLines[key].differences;
                                if(h.accessor in diffs){
                                    style = {backgroundColor: diffColour};
                                }
                            }
                            if(h.label === 'Designator'){
                                if(hasDiff && h.accessor in props.comparison.diffLines[key].differences){
                                    const diffs = props.comparison.diffLines[key].differences;
                                    
                                    const addString = [...diffs[h.accessor].additions].join(', ');
                                    const subString = [...diffs[h.accessor].subtractions].join(', ');
                                    const body = <div>
                                            {diffs[h.accessor].additions.size > 0 && <span style={{color: addColour}}>Additions: {addString}</span>}
                                            {diffs[h.accessor].subtractions.size > 0 && <span style={{color: subColour}}>Subtractions: {subString}</span>}
                                    </div>
                                    return <>
                                        <td key={'d1'+j} colSpan={1} style={style}>{bom1Line[h.accessor]}</td>
                                        <td key={'d2'+j} colSpan={1} style={style}>{body}</td>
                                    </>;
                                }
                                return <td key={j} colSpan={2} style={style}>{bom1Line[h.accessor]}</td>;
                            }
                            return <td key={j} colSpan={1} style={style}>{bom1Line[h.accessor]}</td>;
                        })}
                        {props.headers.map((h, j) => {
                            let style = {};
                            if(hasDiff){
                                const diffs = props.comparison.diffLines[key].differences;
                                if(h.accessor in diffs){
                                    style = {backgroundColor: diffColour};
                                }
                            }
                            if(h.label === 'Designator'){
                                if(hasDiff  && h.accessor in props.comparison.diffLines[key].differences){
                                    const diffs = props.comparison.diffLines[key].differences;
                                    const addString = [...diffs[h.accessor].additions].join(', ');
                                    const subString = [...diffs[h.accessor].subtractions].join(', ');
                                    const body = <div>
                                            {diffs[h.accessor].additions.size > 0 && <span style={{...style, color: addColour}}>Additions: {addString}</span>}
                                            {diffs[h.accessor].subtractions.size > 0 && <span style={{...style, color: subColour}}>Subtractions: {subString}</span>}
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

function SideBySideComparison2Table(props){
    const style = {width: '50%', overflow: 'auto'};
    const border = {borderRight: 'black 2px solid'}
    return(
        <>
        <div style={{display: 'flex', flexDirection: 'row'}}>
        <div style={{...style, ...border}}>
        <Table>
            <thead className='TableHeading'>
                <tr>
                    <th colSpan={props.headers.length+1}>BOM Old</th>
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
                </tr>
            </thead>
            <tbody>
                {props.comparison && props.comparison.combinedBom.map((line, i) => {
                    const bom1Line = line.bom1;
                    //const bom2Line = line.bom2;
                    const key = getKey(bom1Line, props.comparison.hasIPNKey);
                    const hasDiff = key in props.comparison.diffLines;
                    return <tr key={i}>
                        {props.headers.map((h, j) => {
                            let style = {overflow: 'hidden'};
                            if(hasDiff){
                                const diffs = props.comparison.diffLines[key].differences;
                                if(h.accessor in diffs){
                                    style = {backgroundColor: diffColour};
                                }
                            }
                            if(h.label === 'Designator'){
                                if(hasDiff && h.accessor in props.comparison.diffLines[key].differences){
                                    const diffs = props.comparison.diffLines[key].differences;
                                    
                                    const addString = [...diffs[h.accessor].additions].join(', ');
                                    const subString = [...diffs[h.accessor].subtractions].join(', ');
                                    const body = <div style={{...style}}>
                                            {diffs[h.accessor].additions.size > 0 && <span style={{color: addColour}}>Additions: {addString}</span>}
                                            {diffs[h.accessor].subtractions.size > 0 && <span style={{color: subColour}}>Subtractions: {subString}</span>}
                                    </div>
                                    return <>
                                        <td key={'d1'+j} colSpan={1} style={style}>{bom1Line[h.accessor]}</td>
                                        <td key={'d2'+j} colSpan={1} style={style}>{body}</td>
                                    </>;
                                }
                                return <td key={j} colSpan={2} style={style}>{bom1Line[h.accessor]}</td>;
                            }
                            return <td key={j} colSpan={1} style={style}>{bom1Line[h.accessor]}</td>;
                        })}
                    </tr>
                })}
            </tbody>
        </Table>
        </div>
        <div style={style}>
        <Table>
        <thead className='TableHeading'>
            <tr>
                <th colSpan={props.headers.length+1}>BOM New</th>
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
            </tr>
        </thead>
        <tbody>
            {props.comparison && props.comparison.combinedBom.map((line, i) => {
                //const bom1Line = line.bom1;
                const bom2Line = line.bom2;
                const key = getKey(bom2Line, props.comparison.hasIPNKey);
                const hasDiff = key in props.comparison.diffLines;
                return <tr key={i}>
                    {props.headers.map((h, j) => {
                        let style = {overflow: 'hidden'};
                        if(hasDiff){
                            const diffs = props.comparison.diffLines[key].differences;
                            if(h.accessor in diffs){
                                style = {backgroundColor: diffColour};
                            }
                        }
                        if(h.label === 'Designator'){
                            if(hasDiff  && h.accessor in props.comparison.diffLines[key].differences){
                                const diffs = props.comparison.diffLines[key].differences;
                                const addString = [...diffs[h.accessor].additions].join(', ');
                                const subString = [...diffs[h.accessor].subtractions].join(', ');
                                const body = <div style={{...style}}>
                                        {diffs[h.accessor].additions.size > 0 && <span style={{color: addColour}}>Additions: {addString}</span>}
                                        {diffs[h.accessor].subtractions.size > 0 && <span style={{color: subColour}}>Subtractions: {subString}</span>}
                                </div>
                                return <>
                                <td key={'d1'+j+props.headers.length} colSpan={1} style={style}>{bom2Line[h.accessor]}</td>
                                <td key={'d2'+j+props.headers.length} colSpan={1} style={style}>{body}</td>
                                </>
                            }

                            return <td key={j} colSpan={2} style={style}>{bom2Line[h.accessor]}</td>
                        }
                        return <td key={j+props.headers.length} colSpan={1} style={style}>{bom2Line[h.accessor]}</td>
                    })}
                </tr>
            })}
        </tbody>
    </Table>
    </div>
    </div>
    </>
    )
}

function ComparisonTable(props){
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
                                        {out.differences[header.accessor].additions.size > 0 && <span style={{color: addColour}}>Additions: {addString}</span>}
                                        {out.differences[header.accessor].subtractions.size > 0 && <span style={{color: subColour}}>Subtractions: {subString}</span>}
                                    </div>

                                    return (
                                        <>
                                        <td key={j+'add'} style={{backgroundColor: diffColour}}>
                                            <SimplePopover trigger={['hover', 'focus']} popoverBody={body} placement='auto'>
                                                <div>{out.line1[header.accessor]}</div>
                                            </SimplePopover>
                                        </td>
                                        <td key={j+'sub'} style={{backgroundColor: diffColour}}>
                                            <SimplePopover trigger={['hover', 'focus']} popoverBody={body} placement='auto'>
                                                <div>{out.line2[header.accessor]}</div>
                                            </SimplePopover>
                                        </td>
                                        </>
                                    );
                                }
                                return (
                                    <td key={j} style={{backgroundColor: diffColour}}>
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
                    <tr key={i} style={{backgroundColor: '#cae6cc'}}>
                        {props.headers.map((header, j) => {
                            if(header.accessor === 'designator'){
                                return <td key={j} colSpan={2}>{line[header.accessor]}</td>
                            }
                            return (
                                <td key={j}>{line[header.accessor]}</td>
                            )
                        })}
                    </tr>
                    )
                })}
                {props.comparison.missingFromBom1.map((line, i) => {
                    return(
                    <tr key={i} style={{backgroundColor: '#e6caca'}}>
                        {props.headers.map((header, j) => {
                            if(header.accessor === 'designator'){
                                return <td key={j} colSpan={2}>{line[header.accessor]}</td>
                            }
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