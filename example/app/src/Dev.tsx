import React, { useCallback, useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { createContactListMockData } from './utilities/createMockData';

const data = createContactListMockData(150);

var supportsPassive = false;
try {
  var opts = Object.defineProperty({}, 'passive', {
    get: function () {
      supportsPassive = true;
    },
  });
  window.addEventListener('testPassive', null, opts);
  window.removeEventListener('testPassive', null, opts);
} catch (e) {}

const useScrollHandler = () => {
  const ref = useRef(null);

  const handleOnScroll = useCallback(e => {
    // console.log('handleOnScroll');
    e.preventDefault();
    e.stopPropagation();
    return false;
  }, []);

  const handleOnBeginDragging = useCallback(e => {
    // console.log('handleOnBeginDragging', e);
  }, []);

  const handleOnEndDragging = useCallback(() => {
    // console.log('handleOnEndDragging');
  }, []);

  useEffect(() => {
    ref.current.addEventListener('scroll', handleOnScroll, { passive: false });
    ref.current.addEventListener('touchmove', handleOnScroll, {
      passive: false,
    });
    ref.current.addEventListener(
      'touchstart',
      handleOnBeginDragging,
      supportsPassive ? { passive: true } : false
    );
    ref.current.addEventListener(
      'touchend',
      handleOnEndDragging,
      supportsPassive ? { passive: true } : false
    );

    return () => {
      ref.current.removeEventListener('scroll', handleOnScroll);
      ref.current.removeEventListener('touchmove', handleOnScroll);
      ref.current.removeEventListener('touchstart', handleOnBeginDragging);
      ref.current.removeEventListener('touchend', handleOnEndDragging);
    };
  }, [handleOnScroll, handleOnBeginDragging, handleOnEndDragging]);
  return { ref };
};

export const Dev = () => {
  const { ref } = useScrollHandler();
  return (
    <ScrollView ref={ref} style={styles.container}>
      {data.map(item => (
        <View key={item.name}>
          <Text>{item.name}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    maxHeight: 500,
  },
});
