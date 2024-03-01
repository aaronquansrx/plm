import React, {useEffect, useMemo, useState} from 'react';
import { ExcelSheet, UploadExcelInterface } from "./Upload";
import { Header } from '../table/types';
import { DataTable, DataTableBody, DataTableSingleCheckboxBody } from './Tables';
import { Table, Dropdown, Button, Nav } from 'react-bootstrap';

import update from 'immutability-helper';
import { ObjectFunctions } from '../scripts/general';

function convert_bom_upload_to_main_format(upload_object: BOMUploadFormat[]): BOMMainFormat[]{

  const main:BOMMainFormat[] = [];
  for(const row of upload_object){
    const main_object:BOMMainFormat = {alias_cpn: row.alias_cpn, ipn: row.ipn, mpn: [], mfr: []};
    const keys = ['designator', 'description', 'quantity', 'footprint'];
    ObjectFunctions.add_keys_to(keys, row, main_object);

    const mpns_keys = Object.keys(row).filter((key) => key.startsWith('mpn'));
    const mfrs_keys = Object.keys(row).filter((key) => key.startsWith('mfr'));
    //test for mpns and mfr
    for(const mpn of mpns_keys){
      main_object.mpn.push(mpn);
    }
    for(const mfr of mfrs_keys){
      main_object.mfr.push(mfr);
    }
    
    main.push(main_object);
  }
  return main;
}

export type BOMMainFormat = {
  ipn: string,
  alias_cpn: string,
  designator?: string,
  description?: string,
  quantity?: string,
  footprint?: string,
  mpn: string[],
  mfr: string[],
}

export interface BOMUploadFormat {
  ipn: string,
  alias_cpn: string,
  //designator: string,
  //description: string,
  //quantity: string,
  //footprint: string,
  [key: string]: string
}

const BOMHeadersInitial:Header[] = [
  {label: 'Alias/CPN', accessor: 'alias/cpn'},
  {label: 'IPN', accessor: 'ipn'},
  {label: 'Designator', accessor: 'designator'},
  {label: 'Description', accessor: 'description'},
  {label: 'Quantity', accessor: 'quantity'},
  {label: 'Footprint', accessor: 'footprint'},
  {label: 'MPN1', accessor: 'mpn1'},
  {label: 'MFR1', accessor: 'mfr1'}
];


type UploadBOMInterfaceProps = {
  title?:string;
  //onChangeView:()
  //onSelectSheet:() => void;
  onFinishUpload:(file_name: string, main_format: BOMMainFormat[], upload_format:BOMUploadFormat[]) => void;
}
export function UploadBOMInterfaceNew(props:UploadBOMInterfaceProps){
  const [rawExcelSheets, setRawExcelSheets] = useState<ExcelSheet[]>([]);
  const [uploadFileName, setUploadFileName] = useState<string>("");
  const [headers, setHeaders] = useState(BOMHeadersInitial);
  const mpn_mfr_count = useMemo(() => {
    const last = headers.slice(-1)[0]; // assumes last is mfr1
    const num = parseInt(last.accessor.slice(-1));
    return num;
  }, [headers]);
  function handleDrop(sheets:ExcelSheet[], file_name?:string){
    if(file_name) setUploadFileName(file_name);
    setRawExcelSheets(sheets);
  }
  function stringAsHeader(s:string): Header | undefined{
    for(const header of BOMHeadersInitial){
      if(s == header.label || s == header.accessor){
        return header;
      }
    }
    return undefined;
  }
  function handleConfirm(upload_format:BOMUploadFormat[]){
    //convert to main format
    const main_format = convert_bom_upload_to_main_format(upload_format);
    props.onFinishUpload(uploadFileName, main_format, upload_format);
  }
  function handleSelectHeader(header:Header, column:number){
    if(header.accessor.startsWith("mpn") || header.accessor.startsWith("mfr")){
      const num = parseInt(header.accessor.slice(-1));
      if(num == mpn_mfr_count){
        const next_num_str = (num+1).toString();
        const new_headers = [{label: 'MPN'+next_num_str, accessor: 'mpn'+next_num_str}, {label: 'MFR'+next_num_str, accessor: 'mfr'+next_num_str}];
        setHeaders(update(headers, {
          $push: new_headers
        }));
      }
    }
  }
  return <>
    <div>{props.title}</div>
    <UploadExcelInterface onDrop={handleDrop}/>
    <UploadTable /*onSelectSheet={handleSelectSheet}*/ sheets={rawExcelSheets} headers={headers}
    stringAsHeader={stringAsHeader} onConfirm={handleConfirm} onSelectHeader={handleSelectHeader}
    />
  </>
}


type UploadTableProps = {
  //onSelectSheet:() => void;
  onSelectHeader:(header:Header, column:number) => void
  sheets: ExcelSheet[];
  headers: Header[];
  stringAsHeader:(s:string) => Header | undefined;
  onConfirm: (object:BOMUploadFormat[]) => void;
}

type UpdateTableState = {
  sheet_id: number | undefined;
  selected_headers: (Header | undefined)[]; // undefined means throw away data
}

const remove_header = {label:'_', accessor:'_remove'};

export function UploadTable(props:UploadTableProps){
  const [tableState, setTableState] = useState<UpdateTableState>({
    sheet_id: undefined, selected_headers: []
  });
  const header_accessor_map = useMemo(() => {
    const header_map = new Map<string, number>();
    for(let i = 0; i < tableState.selected_headers.length; i++){
      const header = tableState.selected_headers[i];
      if(header !== undefined) header_map.set(header.accessor, i);
    }
    return header_map;
  }, [tableState.selected_headers]);
  useEffect(() => {
    const new_selected_headers = props.sheets.length > 0 ? props.sheets[0].array[0].map(() => undefined) : [];
    setTableState({
      sheet_id: props.sheets.length > 0 ? 0 : undefined, selected_headers: new_selected_headers
    });
  }, [props.sheets]);
  function handleConfirm(){
    const table_data = [];
    if(tableState.sheet_id !== undefined){
      for(const row of props.sheets[tableState.sheet_id].array){
        const table_object:BOMUploadFormat = {ipn: '', alias_cpn: ''};
        for(let i = 0; i < row.length; i++){
          const header = tableState.selected_headers[i];
          if(header !== undefined){
            table_object[header.accessor] = row[i];
          }
        }
        table_data.push(table_object);
      }
      props.onConfirm(table_data);
    }
  }
  function handleChangeSheet(id:number){
    setTableState(update(tableState, {
      sheet_id: {$set: id}
    }));
  }
  function handleCheckboxToggle(row:number|undefined){
    if(row !== undefined && tableState.sheet_id != undefined){
      const selected_row = props.sheets[tableState.sheet_id].array[row];
      const added_headers: any = {};
      for(let i = 0; i<selected_row.length; ++i){
        const cell_str = selected_row[i];
        const h = props.stringAsHeader(cell_str);
        if(h != undefined){
          added_headers[i] = {$set: h};
        }
      }
      const new_table_state = update(tableState, {
        selected_headers: added_headers
      });
      setTableState(new_table_state);
    }
  }
  function handleHeaderChange(header:Header, column:number){
    let header_set:any = {};
    if(header.accessor != '_remove' && header_accessor_map.has(header.accessor)){
      const column_remove = header_accessor_map.get(header.accessor);
      if(column_remove !== undefined) header_set[column_remove] = {$set: remove_header};
    }
    const to_set = header.accessor != '_remove' ? header : undefined;
    header_set[column] = {$set: to_set};
    setTableState(update(tableState, {
      selected_headers: 
        header_set
    }));
    props.onSelectHeader(header, column);
  }
  return(
    <>
      <Button disabled={props.sheets.length == 0} onClick={handleConfirm}>Confirm</Button>
      <TabbedSheetTableNew sheets={props.sheets} sheet_id={tableState.sheet_id !== undefined ? tableState.sheet_id : 0} 
      onChangeSheet={handleChangeSheet} 
      table={( data: string[][], index: number) => 
        <DropdownHeaderCheckboxTable data={data} headers={props.headers} onCheckboxToggle={handleCheckboxToggle}
        onChangeHeader={handleHeaderChange} selected_headers={tableState.selected_headers}/>
      }/>
    </>
  )
}

type TabbedSheetTableProps = {
  sheet_id: number;
  sheets: ExcelSheet[];
  onChangeSheet: (index:number) => void;
  table: (data: string[][], index:number) => JSX.Element;
  tabsClass?: string;
  tableClass?: string;
}

export function TabbedSheetTableNew(props:TabbedSheetTableProps){
  const active_sheet = useMemo(() => {
    if(props.sheets === null) return [];
    return props.sheets.length > 0 ? props.sheets[props.sheet_id].array : [];
  }, [props.sheet_id, props.sheets]);
  function handleSheetChange(i:number){
    return function(){
      if(props.onChangeSheet) props.onChangeSheet(i);
    }
  }
  return(
    <>
    <div className={props.tabsClass}>
    {<Nav variant="tabs" activeKey={props.sheet_id}>
      {props.sheets && props.sheets.map((sheet, i) => 
        <Nav.Item key={i} onClick={handleSheetChange(i)}>
          <Nav.Link id={i === props.sheet_id ? 'Grey' : ''}>{sheet.name}</Nav.Link>
        </Nav.Item>
      )}
    </Nav>}
    </div>
    <div className={props.tableClass}>
      {props.table(active_sheet, props.sheet_id)}
    </div>
    </>
  );
}

//look to split up components
type DropdownHeaderCheckboxTableProps = {
  selected_headers?: (Header | undefined)[];
  headers: Header[];
  data: string[][];
  onCheckboxToggle:(id:number|undefined) => void;
  onChangeHeader:(item:Header, column: number) => void;
}

export function DropdownHeaderCheckboxTable(props:DropdownHeaderCheckboxTableProps){
  const [selectedHeaders, setSelectedHeaders] = useState<(Header|undefined)[]>(props.data.length > 0 ? props.data[0].map(() => undefined) : []);
  const dropdown_headers = useMemo<Header[]>(() => {
    return [remove_header, ...props.headers]
  }, [props.headers]);
  useEffect(() => {
    if(props.data.length > 0){
      setSelectedHeaders(props.data[0].map(() => undefined));
    }
  }, [props.data]);
  useEffect(() => {
    if(props.selected_headers){
      setSelectedHeaders(props.selected_headers);
    }
  }, [props.selected_headers]);
  function handleChange(col:number){
    return function(item:Header, item_no:number){
      setSelectedHeaders(update(selectedHeaders, {
        [col]: {$set: item}
      }));
      props.onChangeHeader(item, col);
    }
  }
  return(
    <Table>
      <thead className='TableHeading'>
        <tr>
          <td></td>
          {props.data.length > 0 && props.data[0].map((_, i) => 
            <td key={i}>
              <ObjectDropdown selected={selectedHeaders[i]} items={dropdown_headers} item_key={"label"} onChange={handleChange(i)}/>
            </td>
          )}
        </tr>
      </thead>
      <DataTableSingleCheckboxBody {...props} />
    </Table>
  )
}

type ObjectDropdownProps<T> = {
  selected?: T
  items: T[];
  item_key: keyof T;
  onChange: (item:T, item_no:number) => void;
}

export function ObjectDropdown<T>(props: ObjectDropdownProps<T>){
  const [selected, setSelected] = useState<T | undefined>(props.items.length > 0 ? props.items[0] : undefined);
  useEffect(() => {
    if(props.selected !== undefined){
      setSelected(props.selected);
    }
  }, [props.selected])
  function handleChange(item:T, item_no:number){
    setSelected(item);
    if(props.onChange) props.onChange(item, item_no);
  }
  return(
    <>
    <Dropdown>
      <Dropdown.Toggle variant="success" id="dropdown-basic">
        {selected && selected[props.item_key]}
      </Dropdown.Toggle>
      <Dropdown.Menu style={{maxHeight: '300px', overflow: 'auto'}}>
        {props.items.map((item, i) => 
          <Dropdown.Item key={i} onClick={() => handleChange(item, i)}>{item[props.item_key]}</Dropdown.Item>
        )}
      </Dropdown.Menu>
    </Dropdown>
    </>
  );
}