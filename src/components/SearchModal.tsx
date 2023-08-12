'use client'

import { Dialog, Transition } from '@headlessui/react'
import { SearchResult } from '@src/interface'
import cn from 'classnames'
import parse from 'html-react-parser'
import { debounce, get } from 'lodash'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChangeEvent, Fragment, useCallback, useLayoutEffect, useRef, useState } from 'react'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import { BsArrowReturnLeft } from 'react-icons/bs'
import { FiSearch } from 'react-icons/fi'
import { IoBookOutline, IoCloseCircle, IoDocumentTextOutline } from 'react-icons/io5'
import useSWR from 'swr'

type SearchModalProps = {
  url: string
  isOpen: boolean
  closeModal: () => void
  slugPrefix?: string
  className?: string
}

export default function SearchModal(props: SearchModalProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [queryToSearch, setQueryToSearch] = useState(query)
  const [selected, setSelected] = useState(-1)
  const router = useRouter()

  const {
    data: fullData,
    error,
    isLoading
  } = useSWR<SearchResult[]>([props.url, { query: queryToSearch }], ([url, params]: any) =>
    fetcher(url, params)
  )
  const data = fullData ? fullData.filter(rs => rs.isPublished) : fullData

  if (error) console.log('🐞 Error in search modal: ', error)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debounceSearch = useCallback(
    debounce(value => triggerSearch(value), 1000),
    [queryToSearch]
  )

  function handleOnchangeInput(e: ChangeEvent<HTMLInputElement>) {
    const { value } = e.target
    setQuery(value)
    debounceSearch(value)
  }

  // Auto scroll the search container when navigating with arrow keys
  useLayoutEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current
      const selectedItem = container.children[selected] as HTMLElement
      const view = checkIsInView(selectedItem, container)
      if (view === 'above') {
        container.scrollTo({
          top: selectedItem.offsetTop - container.offsetTop,
          behavior: 'smooth'
        })
      } else if (view === 'below') {
        container.scrollTo({
          top: selectedItem.offsetTop + selectedItem.offsetHeight - container.offsetHeight,
          behavior: 'smooth'
        })
      }
    }
  }, [selected])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      // navigate to the selected result
      if (data?.length && selected >= 0 && selected < data?.length) {
        const uri = props.slugPrefix
          ? `${props.slugPrefix}/${data[selected].slug}/`
          : `${data[selected].slug}/`
        e.preventDefault()
        props.closeModal()
        router.push(uri)
      } else {
        // trigger search
        triggerSearch(inputRef.current?.value || '')
        debounceSearch.cancel()
      }
    }

    // navigate between the results
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected(prev => (!data || prev < data.length - 1 ? prev + 1 : prev))
      // if before the arrow down, the selected item is the last item, set the selected to the first item
      if (data?.length && data?.length > 0 && selected === data?.length - 1) {
        setSelected(0)
      }
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected(prev => (prev > 0 ? prev - 1 : prev))
      // if before the arrow up, the selected item is the first item, set the selected to the last item
      if (data?.length && data?.length > 0 && selected === 0) {
        setSelected(data?.length - 1)
      }
    }
  }

  function handleMouseMoveCapture(index: number) {
    setSelected(index)
  }

  function triggerSearch(value: string) {
    setQueryToSearch(value)
    setSelected(-1)
  }

  return (
    <Transition appear={true} show={props.isOpen} as={Fragment}>
      <Dialog as="div" className={cn('relative z-50', props.className)} onClose={props.closeModal}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="bg-opacity/25 fixed inset-0 bg-black opacity-40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-start justify-center p-4 pt-20 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-300"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={cn(
                  'flex flex-col gap-0 w-full transform rounded-md divide-y',
                  'md:max-w-[80vw] lg:max-w-[70vw] xl:max-w-[60vw] 2xl:max-w-[50vw] max-h-[80vh]',
                  'bg-white text-left shadow-lg',
                  'align-middle shadow-xl transition-all text-slate-800'
                )}
              >
                {/* Search bar */}
                <div className={cn('flex items-center gap-3 p-4')}>
                  <div className={cn('grid place-items-center text-slate-500')}>
                    {(data || error || get(data, '[0].isFake')) && !isLoading && (
                      <FiSearch className="text-2xl" />
                    )}
                    {isLoading && (
                      <div className="animate-spin">
                        <AiOutlineLoading3Quarters className="text-2xl" />
                      </div>
                    )}
                  </div>
                  <input
                    ref={inputRef}
                    className={cn(
                      'peer h-full w-full text-ellipsis bg-transparent pr-2 outline-none',
                      'm2it-hide-wscb'
                    )}
                    id="search"
                    type="search"
                    placeholder="Tìm bài viết..."
                    autoComplete="off"
                    value={query}
                    onChange={e => handleOnchangeInput(e)}
                    onKeyDown={e => handleKeyDown(e)}
                  />
                  {query && (
                    <button onClick={() => setQuery('')}>
                      <IoCloseCircle className="h-5 w-5 text-slate-500" />
                    </button>
                  )}
                </div>

                {/* Search results */}
                {error && (
                  <div className="p-4 text-center text-base">
                    Có lỗi trong quá trình tải dữ liệu, vui lòng thử lại hoặc liên hệ Math2IT!
                  </div>
                )}
                {data && !data?.[0]?.isFake && query && (
                  <>
                    {data.length === 0 && (
                      <div className="p-4 text-center text-base">
                        Không tìm thấy bài viết phù hợp!
                      </div>
                    )}
                    {data.length > 0 && (
                      <div className={cn('flex flex-col divide-y overflow-hidden')}>
                        <div
                          ref={containerRef}
                          className={cn(
                            'flex flex-col divide-y divide-slate-150 overflow-auto m2it-scrollbar'
                          )}
                        >
                          {data.map((item, index) => {
                            const uri = props.slugPrefix
                              ? `/${props.slugPrefix}/${item.slug}/`
                              : `/${item.slug}/`
                            return (
                              <Link
                                onClick={props.closeModal}
                                href={uri}
                                key={item.id}
                                className={cn('flex gap-3 py-4 px-4 w-full', {
                                  'bg-gray-100': selected === index
                                })}
                                onMouseMoveCapture={() => handleMouseMoveCapture(index)}
                              >
                                <div className="mt-0.5">
                                  {!item.isBookPost && (
                                    <IoDocumentTextOutline className="text-xl opacity-80" />
                                  )}
                                  {item.isBookPost && (
                                    <IoBookOutline className="text-xl opacity-80" />
                                  )}
                                </div>
                                <div className={cn('w-full flex flex-col text-slate-900 gap-1')}>
                                  <div
                                    className={cn(
                                      'w-full text-base flex items-center justify-between'
                                    )}
                                  >
                                    <div
                                      className={cn({
                                        'pr-4 pb-1 border-b border-dashed': item.textHighlighted
                                      })}
                                    >
                                      {parse(item.titleHighlighted) || item.title}
                                    </div>
                                    <div
                                      className={cn({
                                        visible: selected === index,
                                        invisible: selected !== index
                                      })}
                                    >
                                      <BsArrowReturnLeft className="text-lg opacity-70" />
                                    </div>
                                  </div>
                                  {item.textHighlighted && (
                                    <div className="text-sm opacity-80">
                                      {parse(item.textHighlighted)}
                                    </div>
                                  )}
                                </div>
                              </Link>
                            )
                          })}
                        </div>
                        {query && (
                          <div className="p-3 pl-4 text-sm font-normal text-slate-500">
                            Tìm thấy{' '}
                            <span className="font-semibold text-slate-900">{data.length}</span> kết
                            quả.
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

const fetcher = async (url: string, params: any) => {
  if (params.query === '') return [{ isFake: true, isPublished: true }]
  const headers: { [key: string]: string } = {
    'Content-Type': 'application/json'
  }
  const res = await fetch(url, {
    headers,
    method: 'POST',
    body: JSON.stringify(params),
    mode: 'cors'
  })
  const json = await res.json()
  return json
}

function checkIsInView(selectedEl: HTMLElement, containerEl: HTMLElement) {
  const isOutBelow =
    selectedEl.offsetTop + selectedEl.offsetHeight - containerEl.scrollTop >
    containerEl.offsetHeight
  const isOutAbove = selectedEl.offsetTop < containerEl.scrollTop
  if (isOutAbove) {
    return 'above'
  } else if (isOutBelow) {
    return 'below'
  } else {
    return 'in'
  }
}