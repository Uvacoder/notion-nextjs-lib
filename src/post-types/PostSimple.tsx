import cn from 'classnames'
import Link from 'next/link'
import { HiOutlineDocumentText } from 'react-icons/hi'

import Date from '../components/Date'
import { Post } from '../interface'

export type PostSimpleOpts = {
  hideDate?: boolean
  fontClassName?: string
  customIcon?: React.ReactNode
  updatedOnLabel?: string
}

type PostSimpleProps = {
  post: Post
  options?: PostSimpleOpts
}

export default function PostSimple(props: PostSimpleProps) {
  const { post, options } = props
  return (
    <div className="group py-2 hover:bg-gray-50">
      <Link className={cn(options?.fontClassName, 'flex items-center gap-3')} href={post.uri || '/'}>
        <div className='text-xl'>
          {!!options?.customIcon && options.customIcon}
          {!options?.customIcon && <HiOutlineDocumentText />}
        </div>
        <h3 className="flex-1">{post.title}</h3>
        {(post.createdDate || post.date) && (
          <div className="flex gap-2">
            {post.date && (
              <div
                className={cn(
                  `bg-slate-200 text-slate-800 px-3 py-0.5 text-[0.8rem] items-start rounded-md
                      whitespace-nowrap`
                )}
              >
                {options?.updatedOnLabel || 'updated on'}{' '}
                <Date dateString={post.date} format="MMM DD, YYYY" />
              </div>
            )}
            {post.createdDate && <Date className='text-[0.9rem] text-slate-800' dateString={post.createdDate} format="MMM DD, YYYY" />}
          </div>
        )}
      </Link>
    </div>
  )
}