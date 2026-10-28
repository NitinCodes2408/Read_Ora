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
  'application/epub+zip',
  'text/plain',
  // Some Android file managers report EPUB as application/octet-stream or application/zip
  'application/octet-stream',
  'application/zip',
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

    const filename = asset.name || 'Untitled';
    const format = detectBookFormat(filename, asset.mimeType);

    if (!format) {
      return {
        canceled: false,
        error: `"${filename}" is not a supported file format. ReadOra supports PDF (.pdf), EPUB (.epub), and Plain Text (.txt) files.`,
      };
    }

    return {
      canceled: false,
      file: {
        name: filename,
        uri: asset.uri,
        size: asset.size ?? 0,
        mimeType: asset.mimeType,
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
