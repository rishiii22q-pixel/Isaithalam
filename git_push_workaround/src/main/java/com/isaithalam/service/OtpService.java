package com.isaithalam.service;

import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {
    private final Map<String, OtpEntry> otpStore = new ConcurrentHashMap<>();
    private final Random random = new Random();

    // OTP expires after 5 minutes
    private static final long OTP_EXPIRY_MS = 5 * 60 * 1000;

    private static class OtpEntry {
        final String otp;
        final long createdAt;
        int attempts;

        OtpEntry(String otp) {
            this.otp = otp;
            this.createdAt = System.currentTimeMillis();
            this.attempts = 0;
        }

        boolean isExpired() {
            return System.currentTimeMillis() - createdAt > OTP_EXPIRY_MS;
        }
    }

    public String generateOtp(String phone) {
        String otp = String.format("%06d", random.nextInt(999999));
        otpStore.put(phone, new OtpEntry(otp));
        // In production, send via Twilio/SMS gateway
        System.out.println("========================================");
        System.out.println("  OTP for " + phone + ": " + otp);
        System.out.println("========================================");
        return otp;
    }

    public boolean verifyOtp(String phone, String otp) {
        if (otp == null || otp.length() != 6 || phone == null) {
            return false;
        }

        OtpEntry entry = otpStore.get(phone);
        if (entry == null) {
            return false; // No OTP was generated for this phone
        }

        // Check if expired
        if (entry.isExpired()) {
            otpStore.remove(phone);
            return false;
        }

        // Max 3 attempts
        entry.attempts++;
        if (entry.attempts > 3) {
            otpStore.remove(phone);
            return false;
        }

        // Strict match only
        if (entry.otp.equals(otp)) {
            otpStore.remove(phone); // One-time use
            return true;
        }

        return false;
    }
}
