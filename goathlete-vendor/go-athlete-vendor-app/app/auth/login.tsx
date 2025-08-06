import {
    View,
    Text,
    TextInput,
    Image,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    Switch,

} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import LoginLogo from '../../assets/images/login-image.png';// Make sure alias is resolved in tsconfig.json


export default function LoginScreen() {
    const [checked, setChecked] = useState(false);
    const toggleSwitch = () => setChecked(previousState => !previousState);
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
                            <View className="flex-col justify-evenly bg-blue-200 h-full  items-center px-4 ">
                                <Image
                                    source={LoginLogo}
                                    className="w-[300px] h-[250px]"
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

                                <View className="w-full items-center">
                                    <TextInput
                                        placeholder="Email"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        style={{
                                            width: '90%',
                                            height: 50,
                                            backgroundColor: '#f0f0f0',
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
                                            backgroundColor: '#f0f0f0',
                                            borderColor: 'gray',
                                            borderRadius: 10,
                                            paddingHorizontal: 16,
                                            marginBottom: 16,
                                            paddingVertical: 18,
                                        }}
                                        placeholder="Password"
                                        secureTextEntry
                                    />
                                    <View className='flex-row items-center justify-between w-full '>
                                        <Text>
                                            <Switch
                                                trackColor={{ false: '#767577', true: '#81b0ff' }}
                                                thumbColor={checked ? '#f5dd4b' : '#f4f3f4'}
                                                ios_backgroundColor="#3e3e3e"
                                                onValueChange={toggleSwitch}
                                                value={checked}
                                            />
                                            <Text className='mb-[20px] text-gray-600'>
                                                Remember me
                                            </Text>
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
