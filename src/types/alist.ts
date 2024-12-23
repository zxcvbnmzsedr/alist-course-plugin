import type {quality} from "artplayer/types/quality";

export interface AlistFile {
  name: string
  path: string
  is_dir: boolean
  modified: string
  size: number
  sign?: string
  thumb?: string
  type: number
  download_url: string
  quantity?: Array<quality>
  children?: AlistFile[]
}

export interface TreeNode {
  level: number
  data: AlistFile
  parent?: TreeNode
  childNodes?: TreeNode[]
  label?: string
}
