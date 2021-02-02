import { j2xParser } from 'fast-xml-parser';
import { OsmXmlChange } from '../models/types';

const options = {
  attributeNamePrefix: '',
  textNodeName: '#text',
  ignoreAttributes: false,
  ignoreNameSpace: false,
  allowBooleanAttributes: false,
  parseNodeValue: false,
  parseAttributeValue: false,
  trimValues: true,
  cdataTagName: '__cdata', //default is 'false'
  cdataPositionChar: '\\c',
  parseTrueNumberOnly: false,
  arrayMode: false, //"strict"
  stopNodes: ['parse-me-as-string'],
};

const parser = new j2xParser(options);

export const changeToXml = (change: { osmChange: OsmXmlChange }): string => {
  return parser.parse(change) as string;
};
