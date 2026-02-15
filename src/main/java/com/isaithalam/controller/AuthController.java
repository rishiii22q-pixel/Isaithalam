package com.isaithalam.controller;

import com.isaithalam.dto.LoginRequest;
import com.isaithalam.dto.OtpVerifyRequest;
import com.isaithalam.model.User;
import com.isaithalam.service.OtpService;
import com.isaithalam.service.UserService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Map;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final OtpService otpService;
    private final UserService userService;
    private final ObjectMapper objectMapper;

    public AuthController(OtpService otpService, UserService userService, ObjectMapper objectMapper) {
        this.otpService = otpService;
        this.userService = userService;
        this.objectMapper = objectMapper;
    }

    // ---- Phone OTP Login ----

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody LoginRequest request) {
        String phone = request.getPhone();
        if (phone == null || phone.trim().length() < 10) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Invalid phone number"));
        }

        String otp = otpService.generateOtp(phone.trim());
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "OTP sent successfully",
                "demo_otp", otp // Shows OTP to user since we can't send real SMS without Twilio
        ));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody OtpVerifyRequest request, HttpSession session) {
        if (request.getPhone() == null || request.getOtp() == null) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Phone and OTP are required"));
        }

        if (otpService.verifyOtp(request.getPhone(), request.getOtp())) {
            User user = userService.findOrCreateByPhone(request.getPhone(), request.getName());
            session.setAttribute("userId", user.getId());
            session.setAttribute("userName", user.getName());
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "user", Map.of(
                            "id", user.getId(),
                            "name", user.getName(),
                            "phone", user.getPhone() != null ? user.getPhone() : "",
                            "provider", "PHONE",
                            "avatar", user.getAvatarUrl() != null ? user.getAvatarUrl() : "")));
        }

        return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Invalid or expired OTP. Please try again."));
    }

    // ---- Google OAuth Login ----
    // Verifies the Google ID token by calling Google's tokeninfo endpoint

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> request, HttpSession session) {
        String idToken = request.get("idToken");

        if (idToken == null || idToken.isEmpty()) {
            // Fallback: accept direct email/name for backward compatibility
            String email = request.get("email");
            String name = request.get("name");
            if (email != null && !email.isEmpty()) {
                User user = userService.findOrCreateByEmail(email, name != null ? name : "User");
                session.setAttribute("userId", user.getId());
                session.setAttribute("userName", user.getName());
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "user", Map.of(
                                "id", user.getId(),
                                "name", user.getName(),
                                "email", user.getEmail() != null ? user.getEmail() : "",
                                "provider", "GOOGLE",
                                "avatar", user.getAvatarUrl() != null ? user.getAvatarUrl() : "")));
            }
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Google ID token is required"));
        }

        try {
            // Verify the ID token with Google's tokeninfo endpoint
            URL url = new URL("https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(5000);

            int responseCode = conn.getResponseCode();
            if (responseCode == 200) {
                InputStream is = conn.getInputStream();
                JsonNode tokenInfo = objectMapper.readTree(is);
                is.close();

                String email = tokenInfo.has("email") ? tokenInfo.get("email").asText() : null;
                String name = tokenInfo.has("name") ? tokenInfo.get("name").asText() : null;
                String picture = tokenInfo.has("picture") ? tokenInfo.get("picture").asText() : null;
                boolean emailVerified = tokenInfo.has("email_verified")
                        && "true".equals(tokenInfo.get("email_verified").asText());

                if (email == null || !emailVerified) {
                    return ResponseEntity.badRequest().body(Map.of(
                            "success", false,
                            "message", "Google account email not verified"));
                }

                // Create or find user
                User user = userService.findOrCreateByEmail(email, name != null ? name : "User");

                // Update avatar if available
                if (picture != null && (user.getAvatarUrl() == null || user.getAvatarUrl().isEmpty())) {
                    user.setAvatarUrl(picture);
                    userService.save(user);
                }

                session.setAttribute("userId", user.getId());
                session.setAttribute("userName", user.getName());

                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "user", Map.of(
                                "id", user.getId(),
                                "name", user.getName(),
                                "email", user.getEmail() != null ? user.getEmail() : "",
                                "provider", "GOOGLE",
                                "avatar", user.getAvatarUrl() != null ? user.getAvatarUrl() : "")));
            } else {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Invalid Google token. Please sign in again."));
            }
        } catch (Exception e) {
            System.err.println("Google token verification error: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Google sign-in verification failed. Please try again."));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId != null) {
            User user = userService.findById(userId);
            if (user != null) {
                return ResponseEntity.ok(Map.of(
                        "loggedIn", true,
                        "user", Map.of(
                                "id", user.getId(),
                                "name", user.getName(),
                                "avatar", user.getAvatarUrl() != null ? user.getAvatarUrl() : "")));
            }
        }
        return ResponseEntity.ok(Map.of("loggedIn", false));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok(Map.of("success", true));
    }
}
