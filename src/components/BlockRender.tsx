'use client'

import { BlockObjectResponse } from '@notionhq/client/build/src/api-endpoints'
import { createContext } from 'react'

import Renderer from './Renderer'

export type BlockOptionsContextType = {
  headingStyle?: 'hash' | 'borderLeft'
  showAnchorRight?: boolean // useful when headingStyle === 'borderLeft'
  disableAnchorHeading?: boolean // used in BlockHeading (when headingStyle === 'hash')
  siteDomain?: string // used in BlockText to recognize external links (eg. math2it.com -> alike @mention)
  blockCodeCopyText?: string // used in BlockCode to customize copy text
  blockCodeCopiedText?: string // used in BlockCode to customize copied text
}

const defaultBlockOptionContext: BlockOptionsContextType = {
  headingStyle: 'hash',
  showAnchorRight: false,
  disableAnchorHeading: false,
  siteDomain: 'dinhanhthi.com'
}

export type BlockRenderProps = {
  block: BlockObjectResponse
  level: number
  isInsideList?: boolean
  isInsideColumn?: boolean
  blockOptionsContext?: BlockOptionsContextType
}

export const BlockOptionContext = createContext<BlockOptionsContextType>(defaultBlockOptionContext)

export default function BlockRender(props: BlockRenderProps) {
  return (
    <BlockOptionContext.Provider value={props.blockOptionsContext}>
      <Renderer
        block={props.block}
        level={props.level}
        isInsideList={props.isInsideList}
        isInsideColumn={props.isInsideColumn}
      />
    </BlockOptionContext.Provider>
  )
}
