import { promisify } from 'util';
import zlib from 'zlib';

const CHANGESET_ID_LENGTH = 9;
const CHANGESET_ID_SEGMENT_LENGTH = 3;

export const unzipAsync = promisify(zlib.unzip);

export const formatChangesetId = (changesetId: string): string => {
  // convert number to string and pad it with leading zeros to ensure it's at least 9 digits
  const paddedId = changesetId.padStart(CHANGESET_ID_LENGTH, '0');

  // extract three segments from the padded ID
  let index = 0;
  const segment1 = paddedId.slice(index, (index += CHANGESET_ID_SEGMENT_LENGTH)); // first 3 digits
  const segment2 = paddedId.slice(index, (index += CHANGESET_ID_SEGMENT_LENGTH)); // middle 3 digits
  const segment3 = paddedId.slice(index, (index += CHANGESET_ID_SEGMENT_LENGTH)); // last 3 digits

  return `${segment1}/${segment2}/${segment3}`;
};
