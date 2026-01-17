/**
 * Compresses a string using gzip and encodes it to Base64
 * @param data - The string to compress
 * @returns Base64 encoded compressed string
 */
export const compressData = async (data: string): Promise<string> => {
  const stream = new Blob([data]).stream();
  const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
  const compressedBlob = await new Response(compressedStream).blob();
  const buffer = await compressedBlob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

/**
 * Decompresses a Base64 encoded gzip string
 * @param base64 - The Base64 encoded compressed string
 * @returns Decompressed string
 */
export const decompressData = async (base64: string): Promise<string> => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes]);
  const stream = blob.stream();
  const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));
  const decompressedBlob = await new Response(decompressedStream).blob();
  return await decompressedBlob.text();
};
