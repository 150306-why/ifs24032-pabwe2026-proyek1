import { defineStore } from 'pinia';
import * as bookingApi from '@/api/bookings';

export const useBookingStore = defineStore('bookings', {
  state: () => ({ list: [], current: null }),
  actions: {
    async create(scheduleId, passengers) {
      this.current = await bookingApi.createBooking({ schedule_id: scheduleId, passengers });
      return this.current;
    },
    async loadList() {
      this.list = await bookingApi.fetchBookings();
    },
    async load(code) {
      this.current = await bookingApi.fetchBooking(code);
      return this.current;
    },
    async pay(code) {
      this.current = await bookingApi.payBooking(code);
      return this.current;
    },
    async cancel(code) {
      this.current = await bookingApi.cancelBooking(code);
      return this.current;
    },
  },
});
