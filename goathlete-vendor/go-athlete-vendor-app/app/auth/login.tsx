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
                                    <TextInput
                                        placeholder="Email"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        style={{
                                            width: '90%',
                                            height: 50,
                                            backgroundColor: '#C4C4C4',
                                            borderColor: 'gray',
                                            borderRadius: 10,
                                            paddingHorizontal: 16,
                                            marginBottom: 16,
                                            paddingVertical: 18,
                                        }}
                                    />

                                    <TextInput
                                        style={{
                                            width: '90%',
                                            height: 50,
                                            backgroundColor: '#C4C4C4',
                                            borderColor: 'gray',
                                            borderRadius: 10,
                                            paddingHorizontal: 16,
                                            marginBottom: 16,
                                            paddingVertical: 18,
                                        }}
                                        placeholder="Password"
                                        secureTextEntry
                                    />

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
                                <View>
                                    <TouchableOpacity>
                                        <View className="bg-blue-500 w-[300px] h-[50px] items-center justify-center p-[10px]  rounded-lg mt-4">
                                            <Text className="text-white text-lg font-semibold">
                                                Login
                                            </Text>
                                        </View>
                                    </TouchableOpacity>

                                    <View>
                                        <Text className="text-gray-600 mt-4 text-center">
                                            New Member?{' '}
                                            <Pressable
                                                onPress={() => router.replace('/auth/signup')}
                                            >
                                                <Text className="text-blue-500 font-semibold">
                                                    Register
                                                </Text>
                                            </Pressable>
                                        </Text>
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
