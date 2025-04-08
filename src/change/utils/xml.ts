import { XMLBuilder, XmlBuilderOptions, XMLParser } from 'fast-xml-parser';

const options: XmlBuilderOptions = {
  attributeNamePrefix: '',
  textNodeName: '#text',
  ignoreAttributes: false,
  cdataPropName: '__cdata', //default is 'false',
  suppressBooleanAttributes: false,
};

const builder = new XMLBuilder(options);

const parser = new XMLParser(options);

export const convertToXml = (obj: unknown): string => {
  return builder.build(obj) as string;
};

export const convertFromXml = <R = unknown>(content: string): R => {
  return parser.parse(content) as R;
};
