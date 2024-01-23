import {useState, useEffect, useRef} from 'react';
import { getPLMRequest, getPLMRequestAsync, postPLMRequest } from '../scripts/APICall';
import Button from 'react-bootstrap/Button';
import { ChooseButtonList } from './ButtonList';
import {SuggestionSearcher} from './Searcher';
import {HeaderArrayTable} from './Tables';
import { TextControl } from './Forms';
import {PageInterface} from './Pagination';
import { usePaging } from '../hooks/Paging';

import { normalHeaders } from '../BOMComparison/components/UploadTable';

const tableHeaders = [
    {label: 'MPN', accessor: 'mpn'},
    {label: 'MFR', accessor: 'mfr'},
    ...normalHeaders
];

export function MoveXBOMFinder(props){
    const [displayText, setDisplayText] = useState('');

    const [searchBomName, setSearchBomName] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [searchCustomer, setSearchCustomer] = useState('');
    const [requestingCustomer, setRequestingCustomer] = useState('');
    const [customerRecommends, setCustomerRecommends] = useState([]);
    const [bomList, setBomList] = useState([]); 
    const [chosenBomData, setChosenBomData] = useState([]);
    const chosenBomNumber = useRef(null);

    const [selectedBomIndex, setSelectedBomIndex] = useState();
    useEffect(() => {
        //collectMoveXBomData();
    }, [selectedCustomer])
    function collectMoveXBomData(){
        setBomList([]);
        setSelectedBomIndex(0);
        setDisplayText('Searching for BOMs');
        console.log('collecting data');
        //if(selectedCustomer){
            const customerName = selectedCustomer ? selectedCustomer['Customer name'] : null;
            getPLMRequest('movex', {boms:'', customer: customerName, name:searchBomName, limit:20}, (res) => {
                setDisplayText('BOMs found');
                console.log(res);
                if('data' in res){
                    if('boms' in res.data){
                        console.log(res.data)
                        setBomList(res.data.boms);
                        if(res.data.boms.length > 0){
                            //setChosen(res.data.boms[0]['Customer name']);
                            handleClickBom(0, res.data.boms);
                        }
                    }
                }
            }, (res) => {
                setDisplayText('Search error');
                console.log(res);
            });
        /*}else{
            getPLMRequest('movex', {customer: ''},(res) => {
                //console.log(res);
                if('data' in res){
                    if('boms' in res.data){
                        console.log(res.data)
                        setBomList(res.data.boms);
                        if(res.data.boms.length > 0){
                            //setChosen(res.data.boms[0]['Customer name'])
                        }
                    }
                }
            }, (res) => {
                console.log(res);
            });
        }*/
    }
    function handleSearch(st){
        setDisplayText('Searching customer: '+st);
        if(st !== searchCustomer){
            setRequestingCustomer(st);
            getPLMRequest('movex', {customers: st},
            (res)=> {
                setDisplayText('Complete search for '+st);
                setSearchCustomer(st);
                if('data' in res){
                    if(res.data.searchTerm === st){
                        setCustomerRecommends(res.data.customers);
                        setRequestingCustomer(null);
                    }
                }
            }, 
            (res) => {
                console.log(res.data);
                setDisplayText('Search error for '+st);
            });
        }
    }
    function handleSelectCustomer(cust, index){
        //console.log(cust);
        const customer = customerRecommends[index];
        setSelectedCustomer(customer);
    }
    function handleUnselectCustomer(){
        setSelectedCustomer(null);
    }
    function handleChangeChosen(c){
        console.log(c);
    }
    const headers = [
        {label: 'Product Number', accessor: 'Product number'},
        {label: 'Customer Name', accessor: 'Customer name'}
    ];
    
    async function handleClickBom(i, rows=null){
        const bomNumber = rows ? rows[i]['Product number'] : pageRows[i]['Product number'];
        chosenBomNumber.current = bomNumber;
        setDisplayText('Loading BOM: '+bomNumber);
        const bom = []; // loopy boy TO DO
        const lim = 50; let offset = 0;
        //const res = await getPLMRequestAsync('movex', {bom_materials: bomNumber, limit: lim, offset:offset})
        //console.log(res);
        let returnEmpty = false;
        while(!returnEmpty){
            const res = await getPLMRequestAsync('movex', {bom_materials: bomNumber, limit: lim, offset:offset});
            if(res.data){
                if(res.data.bom.length == 0){
                    returnEmpty = true;
                }
                bom.push(...res.data.bom);
                offset += lim;
            }else{
                returnEmpty = true;
            }
        }
        //console.log(bom);
        setDisplayText('Finished Loading BOM: '+bomNumber)
        setChosenBomData(bom);
        /* //non async PLM request
        getPLMRequest('movex', {bom_materials: bomNumber, }, (res) => {
            setDisplayText('Loaded BOM: '+bomNumber);
            console.log(res);
            if('data' in res){
                if('bom' in res.data){
                    const newData = res.data.bom.map((line) => {
                        return line;
                    })
                    setChosenBomData(res.data.bom);
                }
            }
        }, (res) => {
            setDisplayText('Error loading BOM: '+bomNumber);
            console.log(res);
        });
        */
        setSelectedBomIndex(i);
    }

    

    function handleChangeSearchBom(st){
        console.log(st);
        setSearchBomName(st);
    }

    const [pageSize, setPageSize] = useState(5);
    const [pageNumber, numPages, handlePageChange] = usePaging(bomList.length, pageSize);
    const displayWidth = 3;
    const pageRows = bomList.slice(pageNumber*pageSize, +(pageNumber*pageSize) + +pageSize);
    function handleChangePageSize(s){
        setPageSize(s);
        handlePageSwitch(0);
    }
    function handlePageSwitch(pn){
        handlePageChange(pn);
        setSelectedBomIndex(null);
    }
    function handleSelectBOM(){

        //BOM formatted for comparison
        if(chosenBomData){
            const cleanData = cleanMoveXBOM(chosenBomData);
            props.onChooseBOM(cleanData, chosenBomNumber.current);
        }else{
            //no data chosen
            setDisplayText('No BOM Chosen');
        }

    }
    function cleanMoveXBOM(data){
        /*
        {label: 'IPN', accessor: 'Component number', },
    {label: 'Manufacturer Part Number', accessor: 'Manufacturer Part Number'},
    {label: 'Manufacturer', accessor: 'TEXT'},
    {label: 'Quantity', accessor: 'Quantity'},
    {label: 'Designator', accessor: 'Circuit Reference'}*/
        function getTranslate(target, from){
            return {
                target: target,
                from: from
            }
        }
        //missing alias, description and footprint
        const translateData = [
            getTranslate('Manufacturer Part Number', 'mpn'),
            getTranslate('TEXT', 'mfr'),
            getTranslate('Component number', 'ipn'),
            getTranslate('Circuit Reference', 'designator'),
            getTranslate('Quantity', 'quantity'),
            getTranslate('Alias number', 'alias/cpn')
        ];
        //console.log(data);
        const newData = data.map((dt) => {
            const obj = {};
            for(const translate of translateData){
                obj[translate.from] = dt[translate.target]
            }
            return obj;
        });
        return newData;
    }
    return (
        <>
        <div className='Hori' style={{justifyContent:'center'}}>
        <div>
            Search BOM: <TextControl onChange={handleChangeSearchBom}/>
        </div>
        <div>
        Search Customer: 
        {selectedCustomer ? 
        <Button onClick={handleUnselectCustomer}>{selectedCustomer['Customer name']}</Button> : 
        <SuggestionSearcher recommends={customerRecommends.map((customer) => customer['Customer name'])} 
        onSearch={handleSearch} 
        onClickSuggestion={handleSelectCustomer}/>
        }
        </div>
        </div>
        <div>
        <Button onClick={collectMoveXBomData}>Search BOMs</Button>
        <Button onClick={handleSelectBOM}>Select BOM</Button>
        {displayText}
        </div>
        <div>
        {/*<Button onClick={collectMoveXBomData}>Find MoveXBoms</Button>*/}
        {/*<ChooseButtonList items={bomList.map((bom) => bom['Customer name'])} chosen={chosen} 
        changeChosen={handleChangeChosen}/>*/}
        <HeaderArrayTable headers={headers} data={pageRows} onClick={handleClickBom}
        highlightedRow={selectedBomIndex}/>
        <div className='PageInterface'>
        <PageInterface current={pageNumber} max={numPages} 
        displayWidth={displayWidth} onPageClick={handlePageSwitch} 
        pageSize={pageSize} onChangePageSize={handleChangePageSize}/>
        </div>
        </div>
        <MXBomViewer data={chosenBomData}/>
        </>
    )
}

const MXBOMViewerHeaders = [
    {label: 'IPN', accessor: 'Component number', },
    {label: 'Manufacturer Part Number', accessor: 'Manufacturer Part Number'},
    {label: 'Manufacturer', accessor: 'TEXT'},
    {label: 'Quantity', accessor: 'Quantity'},
    {label: 'Designator', accessor: 'Circuit Reference'},
    {label: 'Alias/CPN', accessor: 'Alias number'}
];

function MXBomViewer(props){
    return (
        <HeaderArrayTable headers={MXBOMViewerHeaders} data={props.data}/>
    )
}