import { J2xOptions, j2xParser } from 'fast-xml-parser';
import { encode } from 'html-entities';
import { OsmXmlChange } from '../models/types';

const options: Partial<J2xOptions> = {
  attributeNamePrefix: '',
  textNodeName: '#text',
  ignoreAttributes: false,
  cdataTagName: '__cdata', //default is 'false'
  cdataPositionChar: '\\c',
  attrValueProcessor: (value) => encode(value),
};

const parser = new j2xParser(options);

export const changeToXml = (change: { osmChange: OsmXmlChange }): string => {
  return parser.parse(change) as string;
};
