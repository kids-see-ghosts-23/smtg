declare module "pdf-parse" {
    interface PDFInfo {
        PDFFormatVersion: string;
        IsAcroFormPresent: boolean;
        IsXFAPresent: boolean;
        [key: string]: any;
    }

    interface PDFMetadata {
        _metadata: any;
        [key: string]: any;
    }

    interface PDFData {
        numpages: number;
        numrender: number;
        info: PDFInfo;
        metadata: PDFMetadata | null;
        text: string;
        version: string;
    }

    function PDFParser(dataBuffer: Buffer, options?: any): Promise<PDFData>;

    export = PDFParser;
}
