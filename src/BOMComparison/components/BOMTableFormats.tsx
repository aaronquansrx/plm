import React, { useMemo } from "react";

import { Table } from "react-bootstrap";
import { TableHeader } from "../table/types";
import { BOMMainFormat } from "./BOMUpload";
import { DisplayRecordTableHeader } from "./Tables";
import { BOMComparisonObject } from "../scripts/Comparison";
import { render } from "@testing-library/react";



export type BOMMainFormatTableProps = {
  comparison_object?: BOMComparisonObject;
  headers: TableHeader<BOMMainFormat>[];
}

export function BOMMainFormatTable(props:BOMMainFormatTableProps){
  const main_format = useMemo(() => {
    return props.comparison_object ? props.comparison_object.main_format : [];
  }, [props.comparison_object]);
  return(
    <>
    <Table>
    <DisplayRecordTableHeader headers={props.headers}/>
    <BOMMainFormatTableBody headers={props.headers} data={main_format}/>
    </Table>
    </>
  );
}

type BOMMainFormatTableBodyProps = {
  headers: TableHeader<BOMMainFormat>[];
  data: BOMMainFormat[];
}

function BOMMainFormatTableBody(props:BOMMainFormatTableBodyProps){
  function renderCellString(row: BOMMainFormat, header: TableHeader<BOMMainFormat>):string{
    if(header.accessor == 'mpn' || header.accessor == 'mfr'){
      return row[header.accessor].join(' ');
    }
    else if(header.accessor in row){
      return row[header.accessor]!;
    }
    return 'unavailable';
  }
  return(
    <tbody>
      {props.data.map((row, j) => 
        <tr key={j}>
          {props.headers.map((header, i) => 
          <td key={i}>
            {renderCellString(row, header)}
          </td>  
          )}
        </tr>
      )}
    </tbody>
  );
}