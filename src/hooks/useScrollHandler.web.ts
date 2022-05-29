import { useEffect, useCallback, useRef } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import { useBottomSheetInternal } from './useBottomSheetInternal';
import { ANIMATION_STATE, SCROLLABLE_STATE, SHEET_STATE } from '../constants';
import type { Scrollable } from '../types';

var supportsPassive = false;
try {
  var opts = Object.defineProperty({}, 'passive', {
    get: function () {
      supportsPassive = true;
    },
  });
  // @ts-ignore
  window.addEventListener('testPassive', null, opts);
  // @ts-ignore
  window.removeEventListener('testPassive', null, opts);
} catch (e) {}

export type ScrollEventContextType = {
  initialContentOffsetY: number;
  shouldLockInitialPosition: boolean;
};

export const useScrollHandler = () => {
  // refs
  const scrollableRef = useRef<Scrollable>();
  const scrollContext = useRef<ScrollEventContextType>({
    initialContentOffsetY: 0,
    shouldLockInitialPosition: false,
  });

  // variables
  const scrollableContentOffsetY = useSharedValue<number>(0);

  // hooks
  const {
    animatedSheetState,
    animatedScrollableState,
    animatedAnimationState,
    animatedScrollableContentOffsetY,
  } = useBottomSheetInternal();

  //region callbacks
  const handleOnTouchMove = useCallback(
    e => {
      if (animatedScrollableState.value === SCROLLABLE_STATE.LOCKED) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      return true;
    },
    [animatedScrollableState]
  );
  const handleOnScroll = useCallback(
    e => {
      /**
       * if sheet position is extended or fill parent, then we reset
       * `shouldLockInitialPosition` value to false.
       */
      if (
        animatedSheetState.value === SHEET_STATE.EXTENDED ||
        animatedSheetState.value === SHEET_STATE.FILL_PARENT
      ) {
        scrollContext.current.shouldLockInitialPosition = false;
      }

      if (animatedScrollableState.value === SCROLLABLE_STATE.LOCKED) {
        const lockPosition = scrollContext.current.shouldLockInitialPosition
          ? scrollContext.current.initialContentOffsetY ?? 0
          : 0;
        scrollableContentOffsetY.value = lockPosition;
        // @ts-ignore
        scrollableRef.current.scroll({
          top: 0,
          left: 0,
          behavior: 'instant',
        });
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      return true;
    },
    [
      animatedScrollableState.value,
      animatedSheetState.value,
      scrollableContentOffsetY,
    ]
  );
  const handleOnBeginDrag = useCallback(() => {
    // @ts-ignore
    const scrollTop = scrollableRef.current?.scrollTop ?? 0;

    scrollableContentOffsetY.value = scrollTop;
    animatedScrollableContentOffsetY.value = scrollTop;
    scrollContext.current.initialContentOffsetY = scrollTop;

    /**
     * if sheet position not extended or fill parent and the scrollable position
     * not at the top, then we should lock the initial scrollable position.
     */
    if (
      animatedSheetState.value !== SHEET_STATE.EXTENDED &&
      animatedSheetState.value !== SHEET_STATE.FILL_PARENT &&
      scrollTop > 0
    ) {
      scrollContext.current.shouldLockInitialPosition = true;
    } else {
      scrollContext.current.shouldLockInitialPosition = false;
    }
  }, [
    scrollableContentOffsetY,
    animatedScrollableContentOffsetY,
    animatedSheetState,
  ]);
  const handleOnEndDrag = useCallback(() => {
    // @ts-ignore
    const scrollTop = scrollableRef.current?.scrollTop ?? 0;

    if (animatedScrollableState.value === SCROLLABLE_STATE.LOCKED) {
      const lockPosition = scrollContext.current.shouldLockInitialPosition
        ? scrollContext.current.initialContentOffsetY ?? 0
        : 0;
      // @ts-ignore
      scrollableRef.current.scroll({
        top: 0,
        left: 0,
        behavior: 'instant',
      });
      scrollableContentOffsetY.value = lockPosition;
      return;
    }
    if (animatedAnimationState.value !== ANIMATION_STATE.RUNNING) {
      scrollableContentOffsetY.value = scrollTop;
      animatedScrollableContentOffsetY.value = scrollTop;
    }
  }, [
    animatedAnimationState,
    animatedScrollableContentOffsetY,
    animatedScrollableState,
    scrollableContentOffsetY,
  ]);
  //endregion

  // callbacks
  useEffect(() => {
    const element = scrollableRef.current;
    // @ts-ignore
    element.addEventListener('scroll', handleOnScroll, {
      passive: false,
    });
    // @ts-ignore
    element.addEventListener('touchmove', handleOnTouchMove, {
      passive: false,
    });
    // @ts-ignore
    element.addEventListener(
      'touchstart',
      handleOnBeginDrag,
      supportsPassive ? { passive: true } : false
    );
    // @ts-ignore
    element.addEventListener(
      'touchend',
      handleOnEndDrag,
      supportsPassive ? { passive: true } : false
    );

    return () => {
      // @ts-ignore
      element.removeEventListener('scroll', handleOnScroll);
      // @ts-ignore
      element.removeEventListener('touchmove', handleOnTouchMove);
      // @ts-ignore
      element.removeEventListener('touchstart', handleOnBeginDrag);
      //@ts-ignore
      element.removeEventListener('touchend', handleOnEndDrag);
    };
  }, [handleOnScroll, handleOnBeginDrag, handleOnEndDrag, handleOnTouchMove]);
  // useEffect(() => {
  //   const preventSafariOverscroll = e => {
  //     if (scrollableRef.current && scrollableRef.current.scrollTop < 0) {
  //       requestAnimationFrame(() => {
  //         scrollableRef.current.style.overflow = 'hidden';
  //         scrollableRef.current.scrollTop = 0;
  //         scrollableRef.current.style.removeProperty('overflow');
  //       });
  //       e.preventDefault();
  //     }
  //   };

  //   scrollableRef.current.addEventListener('scroll', handleOnScroll);
  //   // scrollableRef.current.addEventListener('touchmove', handleOnScroll);
  //   scrollableRef.current.addEventListener(
  //     'touchstart',
  //     preventSafariOverscroll
  //   );

  //   return () => {
  //     scrollableRef.current.removeEventListener('scroll', handleOnScroll);
  //     // scrollableRef.current.removeEventListener('touchmove', handleOnScroll);
  //     scrollableRef.current.removeEventListener(
  //       'touchstart',
  //       preventSafariOverscroll
  //     );
  //   };
  // }, [handleOnScroll]);

  return {
    scrollableRef,
    scrollableContentOffsetY,
  };
};
