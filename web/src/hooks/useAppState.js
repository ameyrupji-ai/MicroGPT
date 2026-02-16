import { useReducer, useCallback } from 'react';
import { CHAPTERS } from '../data/chapters';

const initialState = {
  chapterIdx: 0,
  stepIdx: 0,
  tocOpen: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'NEXT_STEP': {
      const chapter = CHAPTERS[state.chapterIdx];
      if (state.stepIdx < chapter.steps.length - 1) {
        return { ...state, stepIdx: state.stepIdx + 1 };
      }
      if (state.chapterIdx < CHAPTERS.length - 1) {
        return { ...state, chapterIdx: state.chapterIdx + 1, stepIdx: 0 };
      }
      return state;
    }
    case 'PREV_STEP': {
      if (state.stepIdx > 0) {
        return { ...state, stepIdx: state.stepIdx - 1 };
      }
      if (state.chapterIdx > 0) {
        const prevChapter = CHAPTERS[state.chapterIdx - 1];
        return { ...state, chapterIdx: state.chapterIdx - 1, stepIdx: prevChapter.steps.length - 1 };
      }
      return state;
    }
    case 'SKIP_CHAPTER': {
      if (state.chapterIdx < CHAPTERS.length - 1) {
        return { ...state, chapterIdx: state.chapterIdx + 1, stepIdx: 0 };
      }
      return state;
    }
    case 'PREV_CHAPTER': {
      if (state.chapterIdx > 0) {
        return { ...state, chapterIdx: state.chapterIdx - 1, stepIdx: 0 };
      }
      return state;
    }
    case 'GOTO_CHAPTER': {
      return { ...state, chapterIdx: action.idx, stepIdx: 0, tocOpen: false };
    }
    case 'TOGGLE_TOC': {
      return { ...state, tocOpen: !state.tocOpen };
    }
    case 'CLOSE_TOC': {
      return { ...state, tocOpen: false };
    }
    default:
      return state;
  }
}

export function useAppState() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const currentChapter = CHAPTERS[state.chapterIdx];
  const currentStep = currentChapter.steps[state.stepIdx];
  const isFirstOverall = state.chapterIdx === 0 && state.stepIdx === 0;
  const isLastOverall = state.chapterIdx === CHAPTERS.length - 1 &&
    state.stepIdx === currentChapter.steps.length - 1;

  return {
    state,
    dispatch,
    currentChapter,
    currentStep,
    isFirstOverall,
    isLastOverall,
    totalChapters: CHAPTERS.length,
  };
}
