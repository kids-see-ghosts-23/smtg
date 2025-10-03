declare module "pdf-parse" {
    interface PDFInfo {
        PDFFormatVersion: string;
        IsAcroFormPresent: boolean;
        IsXFAPresent: boolean;
        [key: string]: string | boolean | number | undefined;
    }

    interface PDFMetadata {
        _metadata: Record<string, unknown>;
        [key: string]:
            | Record<string, unknown>
            | string
            | number
            | boolean
            | null
            | undefined;
    }

    interface PDFData {
        numpages: number;
        numrender: number;
        info: PDFInfo;
        metadata: PDFMetadata | null;
        text: string;
        version: string;
    }

    interface PDFParserOptions {
        max?: number;
        version?: string;
        [key: string]: unknown;
    }

    function PDFParser(
        dataBuffer: Buffer,
        options?: PDFParserOptions
    ): Promise<PDFData>;

    export = PDFParser;
}
