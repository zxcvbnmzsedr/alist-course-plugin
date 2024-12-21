export interface AlistFile {
  name: string
  path: string
  is_dir: boolean
  modified: string
  size: number
  sign?: string
  thumb?: string
  type: number
  download_url?: string
  children?: AlistFile[]
}

export interface TreeNode {
  level: number
  data: AlistFile
  parent?: TreeNode
  childNodes?: TreeNode[]
  label?: string
}
