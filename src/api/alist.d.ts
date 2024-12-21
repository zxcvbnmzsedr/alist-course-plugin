export interface FileInfoResponse {
  code: number
  data: {
    raw_url: string
    [key: string]: any
  }
}

export function getFileInfo(path: string): Promise<FileInfoResponse>
export function putFile(path: string, formData: FormData): Promise<any>
