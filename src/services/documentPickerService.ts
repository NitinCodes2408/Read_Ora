import * as DocumentPicker from 'expo-document-picker';
import { PickedDocument } from '@/types';
import { detectBookFormat } from '@/utils/fileUtils';

export interface DocumentPickerResponse {
  canceled: boolean;
  file?: PickedDocument;
  error?: string;
}

/**
 * Supported MIME types for document selection
 */
const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  '.pdf',
  'application/epub+zip',
  '.epub',
  'text/plain',
  '.txt',
  'application/octet-stream',
  'application/zip',
  '*/*',
];

/**
 * Open system document picker restricted to PDF, EPUB, and TXT
 */
export async function pickBookDocument(): Promise<DocumentPickerResponse> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: SUPPORTED_MIME_TYPES,
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled) {
      return { canceled: true };
    }

    const asset = result.assets?.[0];
    if (!asset || !asset.uri) {
      return {
        canceled: false,
        error: 'No file was returned from the document picker.',
      };
    }

    const rawFile = (asset as any).file;
    let filename = asset.name || '';
    if (!filename && rawFile && rawFile.name) {
      filename = rawFile.name;
    }
    if (!filename && asset.uri) {
      const parts = asset.uri.split('/');
      filename = parts[parts.length - 1] || '';
    }

    try {
      filename = decodeURIComponent(filename);
    } catch {
      // ignore decoding error
    }

    let size = asset.size ?? 0;
    if ((!size || size <= 0) && rawFile && typeof rawFile.size === 'number') {
      size = rawFile.size;
    }

    const format = detectBookFormat(filename, asset.mimeType);

    if (!format) {
      return {
        canceled: false,
        error: `"${filename || 'The selected file'}" is not a supported file format. ReadOra supports PDF (.pdf), EPUB (.epub), and Plain Text (.txt) files.`,
      };
    }

    // Ensure filename has proper extension for display and parsing
    const ext = `.${format.toLowerCase()}`;
    if (!filename.toLowerCase().endsWith(ext)) {
      filename = `${filename}${ext}`;
    }

    return {
      canceled: false,
      file: {
        name: filename,
        uri: asset.uri,
        size,
        mimeType: asset.mimeType,
        rawFile,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown document picker error';
    return {
      canceled: false,
      error: `Failed to open document picker: ${message}`,
    };
  }
}
