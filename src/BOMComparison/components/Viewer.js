import {useState, useEffect, useRef} from 'react';
import { Button, Table } from 'react-bootstrap';
import { LabeledCheckbox } from '../../components/Forms';

//two bom types data - normal or upload
export function BOMCompViewer(props){
    //const [indexes, setIndexes] = useState(props.data.map(() => 0));
    const [singleLineView, setSingleLineView] = useState(false);
    useEffect(() => {

    }, [props.data]);
    function handleBack(){
        if(props.onChangePageState) props.onChangePageState(0);
    }
    function handleChange(item, i){

    }
    function handleChangeSingleView(){
        setSingleLineView(!singleLineView);
    }
    const data = singleLineView ? props.data.normal : props.data.upload;
    return(
        <>
        <div className='FlexNormal Hori'>
        <Button onClick={handleBack}>Back</Button>
        <LabeledCheckbox label={'Single Line MPNs'} checked={singleLineView} onChange={handleChangeSingleView}/>
        </div>
        <div className='FlexNormal Overflow'>
        <Table >
            <thead className='TableHeading'>
                <tr>
                {props.headers.map((h, i) => 
                <th key={i}>{h.label}</th>
                )}
                </tr>
            </thead>
            <tbody>
                {data.map((row, i) => 
                    {
                    return(
                    <tr key={i}>
                        {props.headers.map((header, j) => {
                            let content = row[header.accessor];
                            if(!singleLineView){
                                if(header.accessor === 'mpn'){
                                    content = row[header.accessor].join(',');
                                }else if(header.accessor === 'mfr'){
                                    content = row[header.accessor].join(',');
                                }
                                else{
                                    content = row[header.accessor];
                                }
                            }
                            return(
                                <td key={j}>{content}</td>
                            );
                        })}
                    </tr>
                    )
                    }
                )}
            </tbody>
        </Table>
        </div>
        </>
    );
}
