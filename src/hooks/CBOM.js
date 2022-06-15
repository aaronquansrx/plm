
import { reverseStringMap } from "../scripts/General";

const lookupCriteria = [
    'CPN', 'SRX PN', 'Descriptions', 
    'Approved MFR', 'Approved MPN'
];
const cbomSubmission = {
    'Quoted Supplier': 'Quoted Supplier',
    'LT': 'LT (wks)',
    'SPQ': 'SPQ',
    'Quoted MPN': 'Quoted MPN',
    'Quoted MFR': 'Quoted MFR',
    'Currency Exchange Rate': 'Currency Exchange Rate',
    'Currency': 'Raw Quoted Currency',
    'MOQ': 'MOQ',
    'Price': 'Raw Quoted Price',
    'Quoted Price': 'Quoted Price (USD)',
    'Extended Price': 'Extended Price (USD)',
    'RoHS': 'RoHS (Y/N)',
    'Reach': 'REACH (Y/N)',
    'Conflict Minerals': 'Conflict Minerals (Y/N)',
    'Type': 'Type (Std, non-Std, Customized)',
    'Customer Pricing': 'Customer Pricing (Y/N)',
    'Issue': 'Issue (Y/N)',
    'NRE': 'NRE Charges',
    'Tooling Lead Time': 'Tooling Lead Time',
    'Comments': 'Comments'
}

const cbomRev = reverseStringMap(cbomSubmission);

const masterFile = {
    'Quoted Supplier': 'Quoted Supplier',
    'LT': 'LT (calendar week)',
    'SPQ': 'SPQ',
    'Quoted MPN': 'Quoted MPN',
    'Quoted MFR': 'Quoted MFR',
    'Currency': 'Currency',
    'MOQ': 'MOQ',
    'Price': ' Price/pce ',
    'RoHS': '(RoHS) ↵(Y/N)',
    'Reach': 'Reach (Y/N)',
    'Conflict Minerals': 'Conflict Minerals (Y/N)',
    'Type': 'Type (Std, non-Std, Customized)',
    'Customer Pricing': 'Customer Pricing (Y/N)',
    'Issue': 'Issue (Y/N)',
    'NRE': 'NRE Charges',
    'Tooling Lead Time': 'Tooling Lead Time',
}