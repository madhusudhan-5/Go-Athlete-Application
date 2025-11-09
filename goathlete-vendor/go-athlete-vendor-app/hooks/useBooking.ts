import { useState } from 'react';
import { useApi } from '../services/api.ts';
import type { Booking } from '../services/api.ts';

export interface BookingData {
  serviceId: number;
  date: string;
  timeSlot: string;
  numberOfPeople: number;
  paymentMethod: 'ONLINE' | 'WALLET' | 'OFFLINE';
}

export function useBooking() {
  const { api } = useApi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBooking = async (data: BookingData): Promise<Booking> => {
    setLoading(true);
    setError(null);
    try {
      // Handle payment first
      if (data.paymentMethod === 'ONLINE') {
        await api.post('/payments/initiate/', {
          amount: data.numberOfPeople * 100, // Replace with actual price calculation
          serviceId: data.serviceId,
        });
      }

      // Create booking
      const booking = await api.post('/vendor/bookings/', {
        service: data.serviceId,
        date: data.date,
        time_slot: data.timeSlot,
        number_of_people: data.numberOfPeople,
        payment_method: data.paymentMethod,
      });

      setLoading(false);
      return booking.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking');
      setLoading(false);
      throw err;
    }
  };

  const getBookings = async (status?: string): Promise<Booking[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/vendor/bookings/' + (status ? `?status=${status}` : ''));
      setLoading(false);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
      setLoading(false);
      throw err;
    }
  };

  const confirmBooking = async (bookingId: number): Promise<Booking> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post(`/vendor/bookings/${bookingId}/confirm/`);
      setLoading(false);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm booking');
      setLoading(false);
      throw err;
    }
  };

  const cancelBooking = async (bookingId: number, reason: string): Promise<Booking> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post(`/vendor/bookings/${bookingId}/cancel/`, { reason });
      setLoading(false);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel booking');
      setLoading(false);
      throw err;
    }
  };

  return {
    createBooking,
    getBookings,
    confirmBooking,
    cancelBooking,
    loading,
    error,
  };
}

export default useBooking;
