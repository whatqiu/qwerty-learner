import { TypingContext, TypingStateActionType } from '../../store'
import ShareButton from '../ShareButton'
import ConclusionBar from './ConclusionBar'
import RemarkRing from './RemarkRing'
import WordChip from './WordChip'
import styles from './index.module.css'
import Tooltip from '@/components/Tooltip'
import { currentChapterAtom, currentDictInfoAtom, infoPanelStateAtom, randomConfigAtom } from '@/store'
import { InfoPanelType } from '@/typings'
import { WordWithIndex } from '@/typings'
import { recordOpenInfoPanelAction } from '@/utils'
import { Transition } from '@headlessui/react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { useCallback, useContext, useMemo } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import IconCoffee from '~icons/mdi/coffee'
import IconXiaoHongShu from '~icons/my-icons/xiaohongshu'
import IconGithub from '~icons/simple-icons/github'
import IconWechat from '~icons/simple-icons/wechat'
import IconX from '~icons/tabler/x'

const ResultScreen = () => {
  // eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
  const { state, dispatch } = useContext(TypingContext)!

  const currentDictInfo = useAtomValue(currentDictInfoAtom)
  const [currentChapter, setCurrentChapter] = useAtom(currentChapterAtom)
  const setInfoPanelState = useSetAtom(infoPanelStateAtom)
  const randomConfig = useAtomValue(randomConfigAtom)

  const wrongWords = useMemo(() => {
    const wordList = state.chapterData.wrongWordIndexes.map((index) => state.chapterData.words.find((word) => word.index === index))

    return wordList.filter((word) => word !== undefined) as WordWithIndex[]
  }, [state.chapterData.wrongWordIndexes, state.chapterData.words])

  const isLastChapter = useMemo(() => {
    return currentChapter >= currentDictInfo.chapterCount - 1
  }, [currentChapter, currentDictInfo])

  const correctRate = useMemo(() => {
    const chapterLength = state.chapterData.words.length
    const correctCount = chapterLength - state.chapterData.wrongWordIndexes.length
    return Math.floor((correctCount / chapterLength) * 100)
  }, [state.chapterData.words.length, state.chapterData.wrongWordIndexes])

  const mistakeLevel = useMemo(() => {
    if (correctRate >= 85) {
      return 0
    } else if (correctRate >= 70) {
      return 1
    } else {
      return 2
    }
  }, [correctRate])

  const timeString = useMemo(() => {
    const seconds = state.timerData.time
    const minutes = Math.floor(seconds / 60)
    const minuteString = minutes < 10 ? '0' + minutes : minutes + ''
    const restSeconds = seconds % 60
    const secondString = restSeconds < 10 ? '0' + restSeconds : restSeconds + ''
    return `${minuteString}:${secondString}`
  }, [state.timerData.time])

  const repeatButtonHandler = useCallback(() => {
    dispatch({ type: TypingStateActionType.REPEAT_CHAPTER, shouldShuffle: randomConfig.isOpen })
  }, [dispatch, randomConfig.isOpen])

  const dictationButtonHandler = useCallback(() => {
    dispatch({ type: TypingStateActionType.DICTATION_CHAPTER, shouldShuffle: randomConfig.isOpen })
  }, [dispatch, randomConfig.isOpen])

  const nextButtonHandler = useCallback(() => {
    if (!isLastChapter) {
      setCurrentChapter((old) => old + 1)
      dispatch({ type: TypingStateActionType.NEXT_CHAPTER })
    }
  }, [dispatch, isLastChapter, setCurrentChapter])

  const exitButtonHandler = useCallback(() => {
    dispatch({ type: TypingStateActionType.REPEAT_CHAPTER, shouldShuffle: false })
  }, [dispatch])
  useHotkeys(
    'enter',
    () => {
      nextButtonHandler()
    },
    { preventDefault: true },
  )

  useHotkeys(
    'space',
    () => {
      repeatButtonHandler()
    },
    { preventDefault: true },
  )

  useHotkeys(
    'shift+enter',
    () => {
      dictationButtonHandler()
    },
    { preventDefault: true },
  )

  const handleOpenInfoPanel = useCallback(
    (modalType: InfoPanelType) => {
      recordOpenInfoPanelAction(modalType, 'resultScreen')
      setInfoPanelState((state) => ({ ...state, [modalType]: true }))
    },
    [setInfoPanelState],
  )

  return (
    <div className="fixed inset-0 z-10 overflow-y-auto">
      <div className="absolute inset-0 bg-gray-300 opacity-80 dark:bg-gray-600"></div>
      <Transition
        show={true}
        enter="ease-in duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-out duration-100"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="flex h-screen items-center justify-center">
          <div className="card fixed flex w-[90vw] max-w-6xl flex-col overflow-hidden rounded-3xl bg-white pb-14 pl-10 pr-5 pt-10 shadow-lg dark:bg-gray-800 md:w-4/5 lg:w-3/5">
            <div className="text-center font-sans text-xl font-normal text-gray-900 dark:text-gray-400 md:text-2xl">
              {`${currentDictInfo.name} 第 ${currentChapter + 1} 章`}
            </div>
            <button className="absolute right-7 top-5" onClick={exitButtonHandler}>
              <IconX className="text-gray-400" />
            </button>
            <div className="mt-10 flex flex-row gap-2 overflow-hidden">
              <div className="flex flex-shrink-0 flex-grow-0 flex-col gap-3 px-4 sm:px-1 md:px-2 lg:px-4">
                <RemarkRing remark={`${state.timerData.accuracy}%`} caption="正确率" percentage={state.timerData.accuracy} />
                <RemarkRing remark={timeString} caption="章节耗时" />
                <RemarkRing remark={state.timerData.wpm + ''} caption="WPM" />
              </div>
              <div className="z-10 ml-6 flex-1 overflow-visible rounded-xl bg-indigo-50 dark:bg-gray-700">
                <div className="customized-scrollbar z-20 ml-8 mr-1 flex h-80 flex-row flex-wrap content-start gap-4 overflow-y-auto overflow-x-hidden pr-7 pt-9">
                  {wrongWords.map((word, index) => (
                    <WordChip key={`${index}-${word.name}`} word={word} />
                  ))}
                </div>
                <div className="align-center flex w-full flex-row justify-start rounded-b-xl bg-indigo-200 px-4 dark:bg-indigo-400">
                  <ConclusionBar mistakeLevel={mistakeLevel} mistakeCount={state.chapterData.wrongWordIndexes.length} />
                </div>
              </div>
              <div className="ml-2 flex flex-col items-center justify-end gap-3.5 text-xl">
                <ShareButton />

                <IconXiaoHongShu
                  fontSize={15}
                  className="cursor-pointer text-gray-500 hover:text-red-500 focus:outline-none"
                  onClick={(e) => {
                    handleOpenInfoPanel('redBook')
                    e.currentTarget.blur()
                  }}
                />

                <button
                  onClick={(e) => {
                    handleOpenInfoPanel('donate')
                    e.currentTarget.blur()
                  }}
                  className="cursor-pointer"
                  type="button"
                  title="捐赠我们的项目"
                >
                  <IconCoffee fontSize={17} className={`text-gray-500 hover:text-amber-500  focus:outline-none ${styles.imgShake}`} />
                </button>

                <button
                  onClick={(e) => {
                    handleOpenInfoPanel('community')
                    e.currentTarget.blur()
                  }}
                  className="cursor-pointer text-gray-500 dark:text-gray-400"
                  type="button"
                  title="加入我们的社区"
                >
                  <IconWechat fontSize={16} className="text-gray-500 hover:text-green-500 focus:outline-none" />
                </button>

                <a href="https://github.com/Kaiyiwing/qwerty-learner" target="_blank" rel="noreferrer" className="leading-[0px]">
                  <IconGithub fontSize={16} className="text-gray-500 hover:text-green-800 focus:outline-none" />
                </a>
              </div>
            </div>
            <div className="mt-10 flex w-full justify-center gap-5 px-5 text-xl">
              <Tooltip content="快捷键：shift + enter">
                <button
                  className="btn-primary h-12 border-2 border-solid border-gray-300 bg-white text-base text-gray-700 dark:border-gray-700 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-700"
                  type="button"
                  onClick={dictationButtonHandler}
                  title="默写本章节"
                >
                  默写本章节
                </button>
              </Tooltip>
              <Tooltip content="快捷键：space">
                <button
                  className="btn-primary h-12 border-2 border-solid border-gray-300 bg-white text-base text-gray-700 dark:border-gray-700 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-700"
                  type="button"
                  onClick={repeatButtonHandler}
                  title="重复本章节"
                >
                  重复本章节
                </button>
              </Tooltip>
              {!isLastChapter && (
                <Tooltip content="快捷键：enter">
                  <button
                    className={`btn-primary { isLastChapter ? 'cursor-not-allowed opacity-50' : ''} h-12 text-base font-bold `}
                    type="button"
                    onClick={nextButtonHandler}
                    title="下一章节"
                  >
                    下一章节
                  </button>
                </Tooltip>
              )}
            </div>
          </div>
        </div>
      </Transition>
    </div>
  )
}

export default ResultScreen
