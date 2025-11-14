import { useEffect, useRef } from 'react';
import { Animated, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../styles/theme';

interface AnimatedHeaderOptions {
  startFadeAt?: number;  // Scroll position to start fading in
  endFadeAt?: number;    // Scroll position to be fully opaque
  backgroundColor?: string; // Header background color
}

interface UseAnimatedHeaderReturn {
  handleScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

export function useAnimatedHeader(options: AnimatedHeaderOptions = {}): UseAnimatedHeaderReturn {
  const {
    startFadeAt = 20,
    endFadeAt = 100,
    backgroundColor = theme.colors.surface,
  } = options;

  const navigation = useNavigation();
  const headerOpacity = useRef(new Animated.Value(0)).current;

  // Set up header with animated background
  useEffect(() => {
    navigation.setOptions({
      headerTransparent: true,
      headerStyle: {
        backgroundColor: 'transparent',
      },
      headerBackground: () => (
        <Animated.View
          style={{
            flex: 1,
            backgroundColor,
            opacity: headerOpacity,
          }}
        />
      ),
    });
  }, [navigation, headerOpacity, backgroundColor]);

  // Scroll handler
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;

    // Calculate opacity based on scroll position
    const fadeRange = endFadeAt - startFadeAt;
    const opacity = Math.min(Math.max((offsetY - startFadeAt) / fadeRange, 0), 1);

    Animated.timing(headerOpacity, {
      toValue: opacity,
      duration: 0,
      useNativeDriver: true,
    }).start();
  };

  return { handleScroll };
}
