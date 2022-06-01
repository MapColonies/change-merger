import { XMLBuilder, XmlBuilderOptionsOptional } from 'fast-xml-parser';
import { OsmXmlChange } from '../models/types';

const options: XmlBuilderOptionsOptional = {
  attributeNamePrefix: '',
  textNodeName: '#text',
  ignoreAttributes: false,
  cdataPropName: '__cdata', //default is 'false'
};

const parser = new XMLBuilder(options);

export const changeToXml = (change: { osmChange: OsmXmlChange }): string => {
  return parser.build(change) as string;
};
