import {useState, useEffect, useRef} from 'react';
import { getPLMRequest, postPLMRequest } from '../scripts/APICall';
import Button from 'react-bootstrap/Button';
import { ChooseButtonList } from './ButtonList';
import {SuggestionSearcher} from './Searcher';
import {HeaderArrayTable} from './Tables';
export function MoveXBOMFinder(){
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [searchCustomer, setSearchCustomer] = useState('');
    const [requestingCustomer, setRequestingCustomer] = useState('');
    const [customerRecommends, setCustomerRecommends] = useState([]);
    const [bomList, setBomList] = useState([]); 
    const [chosenBomData, setChosenBomData] = useState([]);
    useEffect(() => {
        collectMoveXBomData();
    }, [selectedCustomer])
    function collectMoveXBomData(){
        if(selectedCustomer){
            getPLMRequest('movex', {boms: selectedCustomer['Customer name']}, (res) => {
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
        }else{
            getPLMRequest('movex', {boms: ''},(res) => {
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
        }
    }
    function handleSearch(st){
        if(st !== searchCustomer){
            setRequestingCustomer(st);
            getPLMRequest('movex', {customers: st},
            (res)=> {
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
    function handleClickBom(i){
        const bomNumber = bomList[i]['Product number'];
        getPLMRequest('movex', {bom_materials: bomNumber}, (res) => {
            if('data' in res){
                if('bom' in res.data){
                    const newData = res.data.bom.map((line) => {
                        return line;
                    })
                    setChosenBomData(res.data.bom);
                }
            }
        }, (res) => {
            console.log(res);
        });
    }
    return (
        <>
        <div className='Hori' style={{justifyContent:'center'}}>
        Search Customer: <SuggestionSearcher recommends={customerRecommends.map((customer) => customer['Customer name'])} 
        onSearch={handleSearch} 
        onClickSuggestion={handleSelectCustomer}/>
        </div>
        <div>
        {selectedCustomer && <Button onClick={handleUnselectCustomer}>{selectedCustomer['Customer name']}</Button>}
        {/*<Button onClick={collectMoveXBomData}>Find MoveXBoms</Button>*/}
        {/*<ChooseButtonList items={bomList.map((bom) => bom['Customer name'])} chosen={chosen} 
        changeChosen={handleChangeChosen}/>*/}
        <HeaderArrayTable headers={headers} data={bomList} onClick={handleClickBom}/>
        </div>
        <MXBomViewer data={chosenBomData}/>
        </>
    )
}

function MXBomViewer(props){
    const headers = [
        {label: 'IPN', accessor: 'Component number'},
        {label: 'Manufacturer Part Number', accessor: 'Manufacturer Part Number'},
        {label: 'Manufacturer', accessor: 'TEXT'},
        {label: 'Quantity', accessor: 'Quantity'},
        {label: 'Designator', accessor: 'Circuit Reference'}
    ];
    return (
        <HeaderArrayTable headers={headers} data={props.data}/>
    )
}