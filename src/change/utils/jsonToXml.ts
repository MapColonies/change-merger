import { XMLBuilder, XmlBuilderOptions } from 'fast-xml-parser';

const options: XmlBuilderOptions = {
  attributeNamePrefix: '',
  textNodeName: '#text',
  ignoreAttributes: false,
  cdataPropName: '__cdata', //default is 'false',
  suppressBooleanAttributes: false,
};

const parser = new XMLBuilder(options);

export const convertToXml = (obj: unknown): string => {
  return parser.build(obj) as string;
};
