import { View, Animated, Dimensions } from 'react-native';
const { width } = Dimensions.get('window');

export default function DotIndicator({ data, scrollX }: { data: any[]; scrollX: Animated.Value }) {
  return (
    <View className="flex-row">
      {data.map((_, i) => {
        const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [8, 16, 8],
          extrapolate: 'clamp',
        });
        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.4, 1, 0.4],
          extrapolate: 'clamp',
        });
        return (
          <Animated.View
            key={i}
            className="h-2 rounded-full bg-black "
            style={{ width: dotWidth, opacity }}
          />
        );
      })}
    </View>
  );
}