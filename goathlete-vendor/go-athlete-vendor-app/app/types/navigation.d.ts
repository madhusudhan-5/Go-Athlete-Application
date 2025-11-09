declare global {
  namespace ReactNavigation {
    interface RootParamList {
      '/': undefined;
      '/_sitemap': undefined;
      '/auth/Authswitch': undefined;
      '/auth/forgetpassword': undefined;
      '/auth/login': undefined;
      '/auth/otp-verification': undefined;
      '/auth/signup': undefined;
      '/booking/PaymentScreen': {
        serviceId: string;
        date: string;
        startTime: string;
        endTime: string;
      };
      '/booking/SelectService': undefined;
      '/booking/SlotPicker': {
        serviceId: string;
      };
      '/booking/Success': {
        serviceId: string;
        bookingDate: string;
        timeSlot: string;
      };
      '/dashboard': undefined;
      '/dashboard/profile': undefined;
      '/dashboard/settings': undefined;
      '/onboarding/OnboardingScreen': undefined;
      '/splash/SplashScreen': undefined;
    }
  }
}

export {};