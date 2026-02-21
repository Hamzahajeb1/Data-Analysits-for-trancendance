import { Parser } from 'json2csv';
import { Builder as XMLBuilder } from 'xml2js';
import * as fs from 'fs';
import * as path from 'path';

export interface ExportData {
  matches?: any[];
  userStats?: any[];
  userActivity?: any[];
  userProfile?: any;
}

export const exportToJSON = (data: ExportData): string => {
  return JSON.stringify(data, null, 2);
};

export const exportToCSV = (
  data: ExportData,
  dataType: 'matches' | 'userStats' | 'userActivity'
): string => {
  const dataArray = data[dataType] || [];
  if (dataArray.length === 0) {
    return 'No data to export';
  }
  try {
    const parser = new Parser();
    return parser.parse(dataArray);
  } catch (error) {
    console.error('Error converting to CSV:', error);
    throw error;
  }
};

export const exportToXML = (data: ExportData): string => {
  const builder = new XMLBuilder();
  const xmlData = {
    export: {
      timestamp: new Date().toISOString(),
      data: data,
    },
  };
  return builder.buildObject(xmlData);
};

export const saveExportToFile = (
  content: string,
  format: 'json' | 'csv' | 'xml',
  fileName: string
): string => {
  const extension = format === 'csv' ? 'csv' : format === 'xml' ? 'xml' : 'json';
  const filePath = path.join(
    process.cwd(),
    'exports',
    `${fileName}-${Date.now()}.${extension}`
  );

  // Create exports directory if it doesn't exist
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
};

export const parseImportFile = async (
  filePath: string,
  format: 'json' | 'csv' | 'xml'
): Promise<any> => {
  const content = fs.readFileSync(filePath, 'utf-8');

  if (format === 'json') {
    return JSON.parse(content);
  } else if (format === 'csv') {
    // For CSV, we'd typically use csv-parser
    // This is a simplified version
    const lines = content.split('\n');
    const headers = lines[0].split(',');
    const result = [];
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '') continue;
      const values = lines[i].split(',');
      const obj: any = {};
      headers.forEach((header: string, index: number) => {
        obj[header.trim()] = values[index]?.trim();
      });
      result.push(obj);
    }
    return result;
  } else if (format === 'xml') {
    const xml2js = require('xml2js');
    const parser = new xml2js.Parser();
    return parser.parseStringPromise(content);
  }

  throw new Error('Unsupported file format');
};
