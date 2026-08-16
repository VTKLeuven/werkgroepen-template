// A minimal streaming ZIP writer, used to hand a whole album back as one file.
//
// Everything is stored (method 0), never deflated: the entries are already
// compressed JPEGs, so deflate would burn CPU on the VM to save almost nothing.
// Storing also means the compressed size equals the file size, which is known up
// front, so no data descriptors are needed and each local header can be written
// complete before its bytes.
//
// ZIP64 is emitted only where it is actually required. An album is capped by the
// storage quota, not by 4 GB, so local header offsets past 0xFFFFFFFF are
// reachable and must not silently wrap.

const zip64Threshold = 0xffffffff;
const maxUint16 = 0xffff;

const crcTable = (() => {
  const table = new Uint32Array(256);

  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }

  return table;
})();

/** Incremental CRC-32: feed successive chunks by passing the previous result. */
export function crc32(data: Uint8Array, previous = 0) {
  let crc = (previous ^ -1) >>> 0;

  for (let index = 0; index < data.length; index += 1) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ data[index]) & 0xff];
  }

  return (crc ^ -1) >>> 0;
}

export type ZipEntry = {
  /** Path inside the archive. Sanitized by the writer. */
  name: string;
  size: number;
  modifiedAt: Date;
  /** Called once, when the entry's turn to be written comes up. */
  read: () => Promise<Uint8Array>;
};

/**
 * MS-DOS date and time. Anything before 1980 is unrepresentable, so it clamps to
 * the epoch of the format rather than writing a negative year.
 */
export function dosDateTime(date: Date) {
  const year = date.getFullYear();

  if (!Number.isFinite(year) || year < 1980) {
    return { time: 0, date: (1 << 5) | 1 };
  }

  return {
    time:
      (date.getHours() << 11) |
      (date.getMinutes() << 5) |
      Math.floor(date.getSeconds() / 2),
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}

/**
 * Makes a name safe to write into an archive: no absolute paths, no traversal,
 * no separators or control characters that would let an entry escape the folder
 * it is extracted into.
 */
export function sanitizeEntryName(name: string, fallback: string) {
  const cleaned = name
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/^\.+/, "")
    .trim();

  return cleaned.length > 0 ? cleaned.slice(0, 200) : fallback;
}

/** Appends a counter to names that repeat, so no entry overwrites another. */
export function uniqueEntryNames(names: string[]) {
  const seen = new Map<string, number>();

  return names.map((name) => {
    const key = name.toLowerCase();
    const used = seen.get(key) ?? 0;
    seen.set(key, used + 1);

    if (used === 0) return name;

    const dot = name.lastIndexOf(".");
    const stem = dot > 0 ? name.slice(0, dot) : name;
    const extension = dot > 0 ? name.slice(dot) : "";
    return `${stem} (${used + 1})${extension}`;
  });
}

export type CentralRecord = {
  name: Buffer;
  crc: number;
  size: number;
  offset: number;
  time: number;
  date: number;
};

function localHeader(
  name: Buffer,
  crc: number,
  size: number,
  time: number,
  date: number,
) {
  const header = Buffer.alloc(30 + name.length);

  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4); // version needed: 2.0, store
  header.writeUInt16LE(0x0800, 6); // flag bit 11: the name is UTF-8
  header.writeUInt16LE(0, 8); // method: store
  header.writeUInt16LE(time, 10);
  header.writeUInt16LE(date, 12);
  header.writeUInt32LE(crc, 14);
  header.writeUInt32LE(size, 18); // compressed
  header.writeUInt32LE(size, 22); // uncompressed
  header.writeUInt16LE(name.length, 26);
  header.writeUInt16LE(0, 28); // no extra field
  name.copy(header, 30);

  return header;
}

/** Exported so the ZIP64 branch can be asserted without writing 4 GB of test data. */
export function centralHeader(record: CentralRecord) {
  // Only the offset can realistically pass 4 GB here: a single photo never does,
  // so the ZIP64 extra field carries just that one value, which is what the
  // spec requires -- masked fields only.
  const needsZip64 = record.offset > zip64Threshold;
  const extraLength = needsZip64 ? 12 : 0;
  const header = Buffer.alloc(46 + record.name.length + extraLength);

  header.writeUInt32LE(0x02014b50, 0);
  header.writeUInt16LE(0x031e, 4); // made by: UNIX, spec 3.0
  header.writeUInt16LE(needsZip64 ? 45 : 20, 6); // version needed
  header.writeUInt16LE(0x0800, 8);
  header.writeUInt16LE(0, 10); // method: store
  header.writeUInt16LE(record.time, 12);
  header.writeUInt16LE(record.date, 14);
  header.writeUInt32LE(record.crc, 16);
  header.writeUInt32LE(record.size, 20);
  header.writeUInt32LE(record.size, 24);
  header.writeUInt16LE(record.name.length, 28);
  header.writeUInt16LE(extraLength, 30);
  header.writeUInt16LE(0, 32); // comment length
  header.writeUInt16LE(0, 34); // disk number
  header.writeUInt16LE(0, 36); // internal attributes
  header.writeUInt32LE(0o644 << 16, 38); // external attributes: regular file
  header.writeUInt32LE(needsZip64 ? zip64Threshold : record.offset, 42);
  record.name.copy(header, 46);

  if (needsZip64) {
    const extra = 46 + record.name.length;
    header.writeUInt16LE(0x0001, extra); // ZIP64 extended information
    header.writeUInt16LE(8, extra + 2); // just the offset follows
    header.writeBigUInt64LE(BigInt(record.offset), extra + 4);
  }

  return header;
}

/** Exported for the same reason as centralHeader. */
export function endOfCentralDirectory(
  entryCount: number,
  directorySize: number,
  directoryOffset: number,
) {
  const needsZip64 =
    entryCount > maxUint16 ||
    directorySize > zip64Threshold ||
    directoryOffset > zip64Threshold;
  const record = Buffer.alloc(needsZip64 ? 22 + 56 + 20 : 22);
  let cursor = 0;

  if (needsZip64) {
    // ZIP64 end of central directory record.
    record.writeUInt32LE(0x06064b50, 0);
    record.writeBigUInt64LE(BigInt(44), 4); // size of the remainder of this record
    record.writeUInt16LE(0x031e, 12); // made by
    record.writeUInt16LE(45, 14); // version needed
    record.writeUInt32LE(0, 16); // disk number
    record.writeUInt32LE(0, 20); // disk with the central directory
    record.writeBigUInt64LE(BigInt(entryCount), 24);
    record.writeBigUInt64LE(BigInt(entryCount), 32);
    record.writeBigUInt64LE(BigInt(directorySize), 40);
    record.writeBigUInt64LE(BigInt(directoryOffset), 48);

    // ZIP64 end of central directory locator.
    record.writeUInt32LE(0x07064b50, 56);
    record.writeUInt32LE(0, 60);
    record.writeBigUInt64LE(BigInt(directoryOffset + directorySize), 64);
    record.writeUInt32LE(1, 72); // total number of disks

    cursor = 76;
  }

  record.writeUInt32LE(0x06054b50, cursor);
  record.writeUInt16LE(0, cursor + 4);
  record.writeUInt16LE(0, cursor + 6);
  record.writeUInt16LE(needsZip64 ? maxUint16 : entryCount, cursor + 8);
  record.writeUInt16LE(needsZip64 ? maxUint16 : entryCount, cursor + 10);
  record.writeUInt32LE(
    needsZip64 ? zip64Threshold : directorySize,
    cursor + 12,
  );
  record.writeUInt32LE(
    needsZip64 ? zip64Threshold : directoryOffset,
    cursor + 16,
  );
  record.writeUInt16LE(0, cursor + 20); // no archive comment

  return record;
}

/**
 * Yields the archive one chunk at a time. Only a single entry is held in memory,
 * so an album of any size streams out in roughly constant space.
 *
 * Entries whose bytes cannot be read are skipped rather than aborting the whole
 * download: one missing file on disk should not cost the user the other 300.
 */
export async function* zipArchive(entries: ZipEntry[]) {
  const records: CentralRecord[] = [];
  const names = uniqueEntryNames(
    entries.map((entry, index) =>
      sanitizeEntryName(entry.name, `photo-${index + 1}.jpg`),
    ),
  );
  let offset = 0;

  for (const [index, entry] of entries.entries()) {
    let body: Uint8Array;

    try {
      body = await entry.read();
    } catch {
      continue;
    }

    const name = Buffer.from(names[index], "utf8");
    const { time, date } = dosDateTime(entry.modifiedAt);
    const crc = crc32(body);
    const header = localHeader(name, crc, body.length, time, date);

    records.push({ name, crc, size: body.length, offset, time, date });
    offset += header.length + body.length;

    yield header;
    yield body;
  }

  const directoryOffset = offset;
  let directorySize = 0;

  for (const record of records) {
    const header = centralHeader(record);
    directorySize += header.length;
    yield header;
  }

  yield endOfCentralDirectory(records.length, directorySize, directoryOffset);
}
