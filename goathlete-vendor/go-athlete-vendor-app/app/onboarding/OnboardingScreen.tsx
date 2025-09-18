import { View, Text, Image, FlatList, Dimensions, TouchableOpacity, Animated } from 'react-native';
import { useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { slides } from './data';
import DotIndicator from '@/components/DotIndicator';

export default function OnboardingScreen() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;
    const router = useRouter();

    const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: any[] }) => {
        if (viewableItems.length > 0) setCurrentIndex(viewableItems[0].index);
    }).current;

    const flatListRef = useRef<FlatList<any>>(null);

    const goNext = () => {
        if (currentIndex === slides.length - 1) {
            // Navigate to profile setup for new users or dashboard for existing users
            router.replace('/dashboard');
        } else {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
        }
    };
    const { width, height } = Dimensions.get('window');
    const renderItem = ({ item }: { item: any }) => (
        <View
            style={{ width, height: height * 0.7 }}
            className="w-full px-[30px] pt-[30px] pb-[10px]"
        >

            <View className="flex-1 justify-center items-center">
                <Image
                    source={{ uri: item.image }}
                    className="w-[250px] h-[250px]"
                    resizeMode="contain"
                />
            </View>

            <View className="pt-4 gap-[6px] w-[70%] ">
                <Text className="text-[36px] font-bold  text-gray-900">{item.title}</Text>
                <Text className="text-gray-600">{item.description}</Text>
            </View>
        </View>
    );

    return (
        <View className=" w-full ">
            <View className='w-full h-[85%]  '>
                <FlatList
                    ref={flatListRef}
                    data={slides}
                    renderItem={renderItem}
                    horizontal
                    pagingEnabled
                    keyExtractor={(_, index) => index.toString()}
                    showsHorizontalScrollIndicator={false}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                        { useNativeDriver: false }
                    )}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
                />
            </View>
            <View className='flex h-[15%] flex-row justify-between   p-[20px]  '>
                <DotIndicator data={slides} scrollX={scrollX} />
                <TouchableOpacity
                    className="bg-black  rounded-full  w-[70px] h-[70px] flex justify-center items-center"
                    onPress={goNext}
                >
                    <Text className="text-white font-semibold text-[20px]">
                        {currentIndex === slides.length - 1 ? '>' : '>'}
                        
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}