import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileUp, AlertTriangle, CheckCircle2, Download, Table as TableIcon, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { 
  getBanks, 
  executeImport, 
  ParsedCategoryRow, 
  normalizeCompanyName, 
  buildBankMap, 
  normalizeBankKey 
} from '@/src/lib/supabase/companies';

interface ValidationRow extends ParsedCategoryRow {
  rowNumber: number;
  isValid: boolean;
  errors: string[];
}

function getRowValue(row: Record<string, any>, possibleKeys: string[]): string {
  for (const key of Object.keys(row)) {
    const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const target of possibleKeys) {
      if (cleanKey === target.replace(/[^a-z0-9]/g, '')) {
        const val = row[key];
        return val !== undefined && val !== null ? String(val).trim() : '';
      }
    }
  }
  return '';
}

export function CompanyImport() {
  const [banks, setBanks] = useState<any[]>([]);
  const [bankMap, setBankMap] = useState<Record<string, string>>({});
  
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ValidationRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<any>(null);
  const [globalError, setGlobalError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadBanks() {
      try {
        const data = await getBanks();
        setBanks(data);
        const bMap = buildBankMap(data);
        setBankMap(bMap);
      } catch (err) {
        console.error("Failed to load banks", err);
      }
    }
    loadBanks();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      // Validate file size (max 50MB for large 70k+ datasets)
      if (selected.size > 50 * 1024 * 1024) {
        setGlobalError('File size exceeds the maximum limit of 50MB.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      // Validate file type
      const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'];
      const extension = selected.name.split('.').pop()?.toLowerCase();
      
      if (!validTypes.includes(selected.type) && !['xlsx', 'xls', 'csv'].includes(extension || '')) {
        setGlobalError('Invalid file format. Please upload an Excel (.xlsx/.xls) or CSV file.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      setFile(selected);
      parseExcel(selected);
    }
  };

  const parseExcel = async (file: File) => {
    setIsParsing(true);
    setGlobalError('');
    setImportSummary(null);
    
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' }) as any[];

      const validated: ValidationRow[] = json.map((row, index) => {
        const bankName = getRowValue(row, ['bank', 'bank name', 'bankname', 'nbfc', 'lender', 'bank/nbfc']);
        const companyName = getRowValue(row, ['company name', 'company', 'companyname', 'company_name', 'organization', 'employer', 'company_name_list', 'companies']);
        const category = getRowValue(row, ['category', 'company category', 'cat', 'grade', 'classification']);
        const subCategory = getRowValue(row, ['sub category', 'subcategory', 'sub_category', 'sub cat']);
        const eligibilityStatus = getRowValue(row, ['eligibility status', 'eligibilitystatus', 'status', 'eligibility']);
        const remarks = getRowValue(row, ['remarks', 'remark', 'notes', 'comment', 'comments']);
        const policyVersion = getRowValue(row, ['policy version', 'policyversion', 'version']);
        const effectiveDate = getRowValue(row, ['effective date', 'effectivedate', 'date']);

        const r: ValidationRow = {
          rowNumber: index + 2, // 1 for header, 1 for 0-index
          bankName,
          companyName,
          category,
          subCategory,
          eligibilityStatus,
          remarks,
          policyVersion,
          effectiveDate,
          isValid: true,
          errors: []
        };

        if (!r.bankName) {
          r.errors.push('Bank is required');
        }

        if (!r.companyName) {
          r.errors.push('Company Name is required');
        }

        if (!r.category) {
          r.errors.push('Category is required');
        }

        r.isValid = r.errors.length === 0;
        return r;
      });

      // Check for duplicates within the file itself
      const seen = new Set<string>();
      validated.forEach(r => {
        if (r.isValid) {
          const key = `${normalizeBankKey(r.bankName)}_${normalizeCompanyName(r.companyName)}`;
          if (seen.has(key)) {
            r.isValid = false;
            r.errors.push('Duplicate entry in this file');
          } else {
            seen.add(key);
          }
        }
      });

      setParsedRows(validated);
    } catch (err: any) {
      setGlobalError('Failed to parse Excel file. Please ensure it is a valid .xlsx or .csv format.');
    } finally {
      setIsParsing(false);
    }
  };


  const handleImport = async () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) return;

    setIsImporting(true);
    setGlobalError('');

    try {
      const summary = await executeImport(validRows, bankMap);
      setImportSummary({
        total: parsedRows.length,
        valid: validRows.length,
        invalid: parsedRows.length - validRows.length,
        newCompanies: summary.newCompanies,
        apiErrors: summary.errors
      });
      setParsedRows([]);
      setFile(null);
    } catch (err: any) {
      setGlobalError(`Import failed: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setParsedRows([]);
    setImportSummary(null);
    setGlobalError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.filter(r => !r.isValid).length;

  return (
    <div className="py-12 bg-slate-50 min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Company Category Import</h1>
          <p className="text-slate-600">Bulk upload company categories via Excel.</p>
        </div>

        {globalError && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md flex items-center mb-6">
            <AlertTriangle className="h-5 w-5 mr-2" />
            {globalError}
          </div>
        )}

        {importSummary ? (
          <Card className="mb-8 shadow-sm border-primary/20">
            <CardHeader className="bg-primary/5 pb-6">
              <div className="flex items-center text-primary">
                <CheckCircle2 className="h-6 w-6 mr-2" />
                <CardTitle>Import Complete</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-50 p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-slate-900">{importSummary.total}</p>
                  <p className="text-sm font-medium text-slate-500 uppercase mt-1">Total Rows</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-green-700">{importSummary.valid}</p>
                  <p className="text-sm font-medium text-green-700 uppercase mt-1">Successfully Imported</p>
                </div>
                <div className="bg-amber-50 p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-amber-700">{importSummary.newCompanies}</p>
                  <p className="text-sm font-medium text-amber-700 uppercase mt-1">New Companies</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-red-700">{importSummary.invalid}</p>
                  <p className="text-sm font-medium text-red-700 uppercase mt-1">Skipped (Invalid)</p>
                </div>
              </div>
              {importSummary.apiErrors && importSummary.apiErrors.length > 0 && (
                <div className="bg-destructive/10 p-4 rounded-md">
                  <h4 className="font-semibold text-destructive mb-2">API Errors:</h4>
                  <ul className="list-disc pl-5 text-sm text-destructive">
                    {importSummary.apiErrors.map((e: string, i: number) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}
              <Button onClick={resetState} className="mt-6">Import Another File</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="mb-8 shadow-sm">
              <CardHeader>
                <CardTitle>Upload File</CardTitle>
                <CardDescription>Upload an Excel file (.xlsx) with the required columns.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-12 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept=".xlsx, .xls, .csv" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                  {isParsing ? (
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <Loader2 className="h-10 w-10 animate-spin mb-4 text-primary" />
                      <p className="text-lg font-medium text-slate-900">Parsing file...</p>
                    </div>
                  ) : file ? (
                    <div className="flex flex-col items-center justify-center text-primary">
                      <TableIcon className="h-10 w-10 mb-4" />
                      <p className="text-lg font-medium">{file.name}</p>
                      <p className="text-sm text-slate-500 mt-2">Click to replace</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <FileUp className="h-10 w-10 mb-4" />
                      <p className="text-lg font-medium text-slate-900">Click to select an Excel file</p>
                      <p className="text-sm mt-2">Expected columns: Bank, Company Name, Category, Sub Category, Eligibility Status, Remarks, Policy Version, Effective Date</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {parsedRows.length > 0 && (
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
                  <div>
                    <CardTitle>Data Preview</CardTitle>
                    <CardDescription className="mt-1">
                      Found {parsedRows.length} rows. 
                      <span className="text-green-600 font-medium ml-2">{validCount} valid</span>, 
                      <span className="text-red-600 font-medium ml-2">{invalidCount} invalid</span>.
                    </CardDescription>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={resetState} disabled={isImporting}>Cancel</Button>
                    <Button onClick={handleImport} disabled={isImporting || validCount === 0} className="font-bold">
                      {isImporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                      Confirm Import ({validCount})
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-slate-500 bg-slate-50 border-b">
                        <tr>
                          <th className="px-4 py-3 font-medium">Status</th>
                          <th className="px-4 py-3 font-medium">Row</th>
                          <th className="px-4 py-3 font-medium">Bank</th>
                          <th className="px-4 py-3 font-medium">Company</th>
                          <th className="px-4 py-3 font-medium">Category</th>
                          <th className="px-4 py-3 font-medium">Validation Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedRows.slice(0, 50).map((row, i) => (
                          <tr key={i} className={`border-b last:border-0 ${!row.isValid ? 'bg-red-50/50' : 'hover:bg-slate-50'}`}>
                            <td className="px-4 py-3">
                              {row.isValid ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-500">{row.rowNumber}</td>
                            <td className="px-4 py-3 font-medium text-slate-900">{row.bankName}</td>
                            <td className="px-4 py-3">{row.companyName}</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-800">
                                {row.category}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {!row.isValid && (
                                <ul className="list-disc pl-4 text-xs text-red-600">
                                  {row.errors.map((e, idx) => <li key={idx}>{e}</li>)}
                                </ul>
                              )}
                              {row.isValid && <span className="text-xs text-green-600">Ready</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsedRows.length > 50 && (
                    <div className="p-4 text-center text-sm text-slate-500 bg-slate-50 border-t">
                      Showing first 50 rows of {parsedRows.length} total rows.
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
