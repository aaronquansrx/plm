import React, {useEffect, useMemo, useRef, useState} from 'react';
import { ExcelSheet, UploadExcelInterface } from "./Upload";
import { Header, TableHeader } from '../table/types';
import { DataTable, DataTableBody, DataTableSingleCheckboxBody } from './Tables';
import { Table, Dropdown, Button, Nav } from 'react-bootstrap';

import update from 'immutability-helper';
import { ObjectFunctions } from '../scripts/general';
import { ObjectDropdown } from './Selectors';

export interface BOMUploadFormat {
  ipn: string,
  alias_cpn: string,
  //designator: string,
  //description: string,
  //quantity: string,
  //footprint: string,
  [key: string]: string
}
const initial_bom_headers:Header[] = [
  {label: 'Alias/CPN', accessor: 'alias_cpn'},
  {label: 'IPN', accessor: 'ipn'},
  {label: 'Designator', accessor: 'designator'},
  {label: 'Description', accessor: 'description'},
  {label: 'Quantity', accessor: 'quantity'},
  {label: 'Footprint', accessor: 'footprint'},
  {label: 'MPN1', accessor: 'mpn1'},
  {label: 'MFR1', accessor: 'mfr1'}
];

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


export const main_bom_format_headers:TableHeader<BOMMainFormat>[] = [
  TableHeader.create('IPN', 'ipn'),
  TableHeader.create('Alias/CPN', 'alias_cpn'),
  TableHeader.create('MPN', 'mpn'),
  TableHeader.create('MFR', 'mfr'),
  TableHeader.create('Designator', 'designator'),
  TableHeader.create('Description', 'description'),
  TableHeader.create('Quantity', 'quantity')
];

function convert_bom_upload_to_main_format(upload_object: BOMUploadFormat[]): BOMMainFormat[]{

  const main:BOMMainFormat[] = [];
  for(const row of upload_object){
    const main_object:BOMMainFormat = {alias_cpn: row.alias_cpn, ipn: row.ipn, mpn: [], mfr: []};
    const keys = main_bom_format_headers.map((header) => header.accessor);
    //const keys = ['designator', 'description', 'quantity', 'footprint', 'alias_cpn', 'ipn'];
    ObjectFunctions.add_keys_to(keys, row, main_object);

    const mpns_keys = Object.keys(row).filter((key) => key.startsWith('mpn'));
    const mfrs_keys = Object.keys(row).filter((key) => key.startsWith('mfr'));
    for(const mpn of mpns_keys){
      if(row[mpn] != '') main_object.mpn.push(row[mpn]);
    }
    for(const mfr of mfrs_keys){
      if(row[mfr] != '') main_object.mfr.push(row[mfr]);
    }
    
    main.push(main_object);
  }
  return main;
}

function convert_upload_headers_to_main_headers(upload_headers: Header[]): Header[]{
  let has_mpn = false; let has_mfr = false;
  const main_headers = upload_headers.reduce((arr:Header[], header) => {
    if(header.accessor.startsWith('mpn')){
      has_mpn = true;
    }else if(header.accessor.startsWith('mfr')){
      has_mfr = true;
    }else{
      arr.push(header);
    }
    return arr;
  }, []);
  if(has_mpn) main_headers.push(TableHeader.create('MPN', 'mpn'));
  if(has_mfr) main_headers.push(TableHeader.create('MFR', 'mfr'));
  return main_headers;
}

type UploadBOMInterfaceProps = {
  title?:string;

  onFinishUpload:(file_name: string, main_format: BOMMainFormat[], 
    upload_format:BOMUploadFormat[], main_format_headers: Header[]) => void;
}

const stringHeaderAliases:Map<string, Set<string>> = new Map();
stringHeaderAliases.set('footprint', new Set(['current footprint']));
stringHeaderAliases.set('mpn', new Set(['mfg']));

export function UploadBOMInterfaceNew(props:UploadBOMInterfaceProps){
  const [rawExcelSheets, setRawExcelSheets] = useState<ExcelSheet[]>([]);
  const [uploadFileName, setUploadFileName] = useState<string>("");
  const [headers, setHeaders] = useState(initial_bom_headers);
  const mpn_mfr_count = useRef(1); // keep track of this var
  /*const mpn_mfr_count = useMemo(() => {
    const last = headers.slice(-1)[0]; // assumes last is mfr1
    const num = parseInt(last.accessor.slice(-1));
    return num;
  }, [headers]);*/
  function handleDrop(sheets:ExcelSheet[], file_name?:string){
    if(file_name) setUploadFileName(file_name);
    setRawExcelSheets(sheets);
  }

  //parses a cell string into a header
  //used to auto complete header finding in table when selecting header row
  function stringAsHeader(s:string): Header | undefined{
    const lower_string = s.toLowerCase();
    for(const header of initial_bom_headers){
      if(lower_string == header.label.toLowerCase() || lower_string == header.accessor.toLowerCase()){
        return header;
      }
    }

    // matching rule (only for testing!!) 
    if(s.includes("PartNumber UTC")){
      return TableHeader.create('Alias/CPN', 'alias_cpn')
    }


    //special regex rule
    const manufacturer_regex_rules = ["^MFG *([0-9])+$"];
    for(const manu_regex_rule of manufacturer_regex_rules){
      const manufacturer_regex = new RegExp(manu_regex_rule);
      const search_manufacturer_regex = manufacturer_regex.exec(s);
      if(search_manufacturer_regex){
        const manu_id_str = search_manufacturer_regex[1];
        const manu_id = parseInt(manu_id_str);
        if(manu_id == mpn_mfr_count.current){
          mpn_mfr_count.current += 1;
        }
        //console.log({label: 'MFR'+manu_id_str, accessor: 'mfr'+manu_id_str});
        return {label: 'MFR'+manu_id_str, accessor: 'mfr'+manu_id_str};
      }
    }
    const part_regex_rules = ["^MFG *([0-9]+) *PN$"];
    for(const part_regex_rule of part_regex_rules){
      const part_regex = new RegExp(part_regex_rule);
      const search_part_regex = part_regex.exec(s);
      if(search_part_regex){
        const part_id_str = search_part_regex[1];
        const part_id = parseInt(part_id_str);
        if(part_id == mpn_mfr_count.current){
          mpn_mfr_count.current += 1;
        }
        //console.log({label: 'MPN'+part_id_str, accessor: 'mpn'+part_id_str});
        return {label: 'MPN'+part_id_str, accessor: 'mpn'+part_id_str};
      }
    }

    return undefined;
  }
  function updateMPNMFRHeaders(){
    const last = headers.slice(-1)[0]; // assumes last is mfr1
    const last_num = parseInt(last.accessor.slice(-1));
    const new_headers:Header[] = [];
    for(let i = last_num+1; i < mpn_mfr_count.current+1; i++){
      new_headers.push({label: 'MPN'+i.toString(), accessor: 'mpn'+i.toString()}, {label: 'MFR'+i.toString(), accessor: 'mfr'+i.toString()});
    }
    setHeaders(update(headers, {
      $push: new_headers
    }));
  }
  function handleConfirm(upload_format:BOMUploadFormat[], upload_headers:Header[]){
    //convert to main format
    const main_format = convert_bom_upload_to_main_format(upload_format);
    const main_format_headers = convert_upload_headers_to_main_headers(upload_headers);
    props.onFinishUpload(uploadFileName, main_format, upload_format, main_format_headers);
  }
  function pushNewHeader(num:number){
    const next_num_str = (num).toString();
    const new_headers = [{label: 'MPN'+next_num_str, accessor: 'mpn'+next_num_str}, {label: 'MFR'+next_num_str, accessor: 'mfr'+next_num_str}];
    setHeaders(update(headers, {
      $push: new_headers
    }));
    mpn_mfr_count.current += 1;
  }
  function handleSelectHeader(header:Header, _column:number){
    if(header.accessor.startsWith("mpn") || header.accessor.startsWith("mfr")){
      const num = parseInt(header.accessor.slice(-1));
      if(num == mpn_mfr_count.current){
        pushNewHeader(num+1);
      }
    }
  }
  return <>
    <div>{props.title}</div>
    <UploadExcelInterface onDrop={handleDrop}/>
    <UploadTable /*onSelectSheet={handleSelectSheet}*/ sheets={rawExcelSheets} headers={headers}
    stringAsHeader={stringAsHeader} onConfirm={handleConfirm} onSelectHeader={handleSelectHeader}
    updateMPNMFRHeaders={updateMPNMFRHeaders}
    />
  </>
}


type UploadTableProps = {
  //onSelectSheet:() => void;
  onSelectHeader:(header:Header, column:number) => void
  sheets: ExcelSheet[];
  headers: Header[];
  stringAsHeader:(s:string) => Header | undefined;
  onConfirm: (object:BOMUploadFormat[], headers:Header[]) => void;
  updateMPNMFRHeaders:() => void;
}

type UpdateTableState = {
  sheet_id: number | undefined;
  selected_headers: (Header | undefined)[]; // undefined means throw away data
  selected_row_number: number | undefined;
}

const remove_header = {label:'_', accessor:'_remove'};

export function UploadTable(props:UploadTableProps){
  const [tableState, setTableState] = useState<UpdateTableState>({
    sheet_id: undefined, selected_headers: [], selected_row_number: undefined
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
      sheet_id: props.sheets.length > 0 ? 0 : undefined, selected_headers: new_selected_headers, 
      selected_row_number: undefined
    });
  }, [props.sheets]);
  function handleConfirm(){
    const table_data = [];
    if(tableState.sheet_id !== undefined){
      const full_upload_sheet = props.sheets[tableState.sheet_id].array; // without cutting top rows
      const upload_sheet = tableState.selected_row_number !== undefined ? full_upload_sheet.slice(tableState.selected_row_number+1) : full_upload_sheet;
      for(const row of upload_sheet){
        const table_object:BOMUploadFormat = {ipn: '', alias_cpn: ''};
        for(let i = 0; i < row.length; i++){
          const header = tableState.selected_headers[i];
          if(header !== undefined){
            table_object[header.accessor] = row[i];
          }
        }
        table_data.push(table_object);
      }
      const header_list = tableState.selected_headers.reduce((arr:Header[], header) =>  {
        if(header !== undefined){
          arr.push(header);
        }
        return arr;
      }, []);
      props.onConfirm(table_data, header_list);
    }
  }
  function handleChangeSheet(id:number){
    setTableState(update(tableState, {
      sheet_id: {$set: id}
    }));
  }
  function handleCheckboxToggle(row:number|undefined){
    const update_table_state: any = {selected_row_number: {$set: row}};
    if(row !== undefined && tableState.sheet_id != undefined){
      const selected_row = props.sheets[tableState.sheet_id].array[row];
      //const added_headers: any = {};
      const new_selected_headers:(Header | undefined)[] = props.sheets[0].array[0].map(() => undefined);
      for(let i = 0; i<selected_row.length; ++i){
        const cell_str = selected_row[i];
        const h = props.stringAsHeader(cell_str);
        if(h != undefined){
          //added_headers[i] = {$set: h};
          new_selected_headers[i] = h;
        }
      }
      props.updateMPNMFRHeaders();
      console.log(new_selected_headers);
      update_table_state.selected_headers = {$set: new_selected_headers};
      /*const new_table_state = update(tableState, {
        selected_headers: added_headers
      });
      setTableState(new_table_state);*/
    }
    const new_table_state = update(tableState, update_table_state);
    setTableState(new_table_state);
    
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
      const new_selected_headers = props.selected_headers.map((header) => {
        if(header === undefined){
          return remove_header;
        }
        return header;
      })
      console.log(new_selected_headers);
      setSelectedHeaders(new_selected_headers);
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