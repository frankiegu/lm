import { Metadata, MINI_DIR, PicMetadata, PicsMetadata, PICS_DIR, PathHash, CategoryRawData } from './data-format-def'
import { Md5 } from 'ts-md5/dist/md5'

function hash (s: string): string {
    return Md5.hashStr(s) as string
}
function getPathHash (picRealPath: string): PathHash {
    // realPath: PICS_DIR/className/itemName
    return hash(picRealPath)
}
export function genMetadata (sourceFileList: FileList): Metadata {
    /**
     * webkitRelativePath: sourcesName/PICS_DIR/className/itemName
     *                     sourcesName/PICS_DIR/className/MINI_NAME/itemName
     * path: PICS_DIR/className/itemName
     * miniPath: PICS_DIR/className/mini/itemName
     */
    const fileArr = Array.from(sourceFileList)
    const result: PicsMetadata = {}
    const hashArr: PathHash[] = []
    for (const file of fileArr) {
        // @ts-ignore
        const path: string = file.webkitRelativePath
        const filename: string = file.name
        const pathSplit = path.split('/')
        if (pathSplit[1] !== PICS_DIR) {
            continue
        }
        // PICS_DIR/className/itemName
        const realPath = pathSplit.slice(1, 3).join('/') + '/' + pathSplit[pathSplit.length - 1]
        const id = getPathHash(realPath)
        if (!result[id]) {
            hashArr.push(id)
            result[id] = {} as PicMetadata
        }
        if (pathSplit[3] === MINI_DIR) {
            result[id].miniPath = pathSplit.slice(1).join('/')
        } else {
            result[id].path = realPath
            result[id].id = id
            result[id].filename = filename
        }
    }
    return {
        hash: genHashFromPicsHash(hashArr),
        data: result
    }
}

export function genHashFromSourceFileList (sourceFileList: FileList): string {
    /**
     * webkitRelativePath: sourcesName/PICS_DIR/className/itemName
     *                     sourcesName/PICS_DIR/className/MINI_NAME/itemName
     */
    const fileArr = Array.from(sourceFileList)
    const hashArr = []
    for (const file of fileArr) {
        // @ts-ignore
        const path: string = file.webkitRelativePath
        const pathSplit = path.split('/')
        if (pathSplit[1] !== PICS_DIR || pathSplit[3] === MINI_DIR) {
            continue
        }
        // PICS_DIR/className/itemName
        hashArr.push(hash(pathSplit.slice(1).join('/')))
    }
    return genHashFromPicsHash(hashArr)
}

function genHashFromPicsHash (picsHash: PathHash[]): string {
    return hash(picsHash.sort((a, b) => a > b ? 1 : -1).join(''))
}

export function getCategoryRawData (picsMetadata: PicsMetadata): CategoryRawData {
    const res: CategoryRawData = {}
    const getCategoryTitle = function (path: string): string {
        return path.split('/')[1]
    }
    const isIcon = function (filename: string): boolean {
        return /icon\.png/g.test(filename)
    }
    const isDefalut = function (filename: string): boolean {
        return /defalut\..*\.png/g.test(filename)
    }
    const getItemTitle = function (filename: string): string {
        return filename.replace('default.', '').replace('.png', '')
    }
    for (const picId in picsMetadata) {
        const picInfo = picsMetadata[picId]
        const categoryTitle = getCategoryTitle(picInfo.path)
        if (!res[categoryTitle]) {
            res[categoryTitle] = {
                info: {
                    title: categoryTitle,
                    icon: '',
                    defalutPic: ''
                },
                items: {}
            }
        }
        if (isIcon(picInfo.filename)) {
            res[categoryTitle].info.icon = picInfo.path
            continue
        }
        if (isDefalut(picInfo.filename)) {
            res[categoryTitle].info.defalutPic = picId
        }
        const itemTitle = getItemTitle(picInfo.filename)
        if (!res[categoryTitle].items[itemTitle]) {
            res[categoryTitle].items[itemTitle] = {
                title: itemTitle,
                pics: []
            }
        }
        res[categoryTitle].items[itemTitle].pics.push({
            picId: picId,
            defaultPosition: [0, 0]
        })
    }
    return res
}