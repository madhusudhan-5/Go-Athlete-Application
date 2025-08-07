import {
    View,
    Text,
    TextInput,
    Image,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
    TouchableWithoutFeedback,
    TouchableOpacity,
    Keyboard,
    Switch,
    Pressable,

} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import LoginLogo from '../../assets/images/login-image.png';// Make sure alias is resolved in tsconfig.json
import { Ionicons } from '@expo/vector-icons';



export default function LoginScreen() {
    const [checked, setChecked] = useState(false);
    const toggleSwitch = () => setChecked(previousState => !previousState);
    const router = useRouter();
    return (
        <SafeAreaProvider>
            <SafeAreaView>
                <KeyboardAvoidingView
                    className="flex flex-col justify-center h-full"
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <ScrollView
                            contentContainerStyle={{ flexGrow: 1 }}
                            keyboardShouldPersistTaps="handled"
                        >
                            <View className="flex-col justify-evenly  h-full  items-center px-4 ">
                                <View className='items-center justify-center '>

                                    <Image
                                        source={LoginLogo}
                                        className="w-[300px] h-[250px] ml-[80px]"
                                        resizeMode="contain"
                                    />

                                    <View className="flex-col mb-8">
                                        <Text className="text-[32px] font-bold text-center">
                                            Welcome Back
                                        </Text>
                                        <Text className="text-[16px] text-center text-gray-600">
                                            Sign in to access your account
                                        </Text>
                                    </View>
                                </View>

                                <View className="w-full items-center">

                                    <View className="flex-row items-center bg-[#C4C4C4] rounded-lg mb-4 px-4 w-[90%] h-[50px]">
                                        <TextInput
                                            placeholder="Email"
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            style={{ flex: 1, paddingVertical: 0 }}
                                        />
                                        <Ionicons name="mail-outline" size={22} color="gray" />
                                    </View>

                                    <View className="flex-row items-center bg-[#C4C4C4] rounded-lg mb-4 px-4 w-[90%] h-[50px]">
                                        <TextInput
                                            placeholder="Password"
                                            secureTextEntry
                                            style={{ flex: 1, paddingVertical: 0 }}
                                        />
                                        <Ionicons name="lock-closed-outline" size={22} color="gray" />
                                    </View>

                                    <View className='flex-row justify-between items-center w-full px-4 '>
                                        <View className='flex-row items-center '>
                                            <Switch
                                                trackColor={{ false: '#767577', true: '#81b0ff' }}
                                                thumbColor={checked ? '#f5dd4b' : '#f4f3f4'}
                                                ios_backgroundColor="#3e3e3e"
                                                onValueChange={toggleSwitch}
                                                value={checked}
                                            />
                                            <Text className=' text-gray-600'>
                                                Remember me
                                            </Text>
                                        </View>
                                        <Text className=' text-gray-600'>
                                            Forgot Password?
                                        </Text>
                                    </View>

                                </View>
                                <View className='flex-col items-center justify-center w-full px-4  gap-[20px]'>
                                    <TouchableOpacity
                                        onPress={() => router.replace('/dashboard')}
                                        className="bg-blue-500 w-[300px] h-[50px] items-center justify-center p-[10px] rounded-lg mt-4"
                                    >
                                        <Text className="text-white font-semibold text-base">
                                            Login
                                        </Text>
                                    </TouchableOpacity>

                                    <View className='flex-row justify-center items-center gap-2  '>
                                        <Text className="text-gray-600  text-center">
                                            New Member? {' '}
                                        </Text>
                                        <Pressable
                                            onPress={() => router.replace('/auth/signup')}
                                        >
                                            <Text className="text-blue-500 font-semibold">
                                                Register
                                            </Text>
                                        </Pressable>
                                    </View>
                                </View>
                            </View>
                        </ScrollView>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </SafeAreaView>

        </SafeAreaProvider>
    );
}
